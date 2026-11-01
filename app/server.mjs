// agent-hive 太木 · 派发控制台服务（验收状态机：终态只出自验收）
// 静态页 + 状态 API + 终端日志尾读 + 派发（spawn claude 无头会话）
// 架构特性：自包含 Wave 单元 + 同目录并发避让锁（CWD Lock） + 主脑巡检 API
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const APP = path.dirname(fileURLToPath(import.meta.url));    // app/（应用代码）
const PROJECT = path.dirname(APP);                           // 仓根
const ROOT = PROJECT;                                        // 数据目录挂仓根
const PORT = Number(process.env.PORT || 17879);
const KEY_FILE = path.join(process.env.USERPROFILE, '.claude', 'zhipu.env');
// claude.exe 真身（npm claude.cmd 的最终目标），直接 spawn 绕开一切 PS 包装层
const CLAUDE_EXE = path.join(process.env.APPDATA, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe');
// 并发信号量：全局同时 running 上限（防智谱账户级 429，默认 4）
const MAX_CONCURRENT = Number(process.env.HIVE_MAX_CONCURRENT || 4);
// running 且日志无增长超过此时长 → 面板标 stale（仅提示，不改状态；处置走 /api/kill）
const STALE_AFTER_MS = Number(process.env.HIVE_STALE_MINUTES || 5) * 60 * 1000;
// 思考看门狗阈值：当前思考块超此 tokens 且近窗（8KB 尾部）零工具/文本产出 → 面板标 overthink
const OVERTHINK_TOK = Number(process.env.HIVE_OVERTHINK_TOK || 20000);
const WAVE_RE = /^[\w-]+$/;

// 进程存活探测（孤儿收档用）
function pidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return false; }
}

function readZhipuKey() {
  try {
    const line = fs.readFileSync(KEY_FILE, 'utf8').split('\n').find(l => /^\s*(export\s+)?ZHIPU_API_KEY\s*=/.test(l));
    return line ? line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '') : '';
  } catch (e) { return ''; }
}

const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage', '.turbo', '.pnpm-store', '__pycache__', '.venv']);

// ── 自包含波次路径解析（waves/<wave>/ 作为独立一等公民）──
function getWavesRoot() {
  const primary = path.join(ROOT, 'waves');
  if (fs.existsSync(primary)) return primary;
  const legacy = path.join(ROOT, 'batches');
  return fs.existsSync(legacy) ? legacy : primary;
}

function defaultWave() {
  const scanDir = getWavesRoot();
  try {
    const dirs = fs.readdirSync(scanDir, { withFileTypes: true }).filter(d => d.isDirectory() && WAVE_RE.test(d.name));
    return dirs.length > 0 ? dirs[0].name : 'template';
  } catch (e) { return 'template'; }
}

function waveDir(wave) {
  const primary = path.join(ROOT, 'waves', wave);
  if (fs.existsSync(primary)) return primary;
  const legacy = path.join(ROOT, 'batches', wave);
  return fs.existsSync(legacy) ? legacy : primary;
}

function batchPath(wave) {
  return path.join(waveDir(wave), 'batch.json');
}

function logPath(wave, code) {
  const dir = waveDir(wave);
  if (dir.includes(path.join(ROOT, 'waves'))) {
    return path.join(dir, 'logs', `${code}.ndjson`);
  }
  return path.join(ROOT, 'runs', 'logs', wave, `${code}.ndjson`);
}

function reportPath(wave, code, cwd) {
  const primary = path.join(waveDir(wave), 'reports', `${code}-report.md`);
  if (fs.existsSync(primary)) return primary;
  if (cwd) {
    const fromCwd = path.join(resolveCwd(cwd), 'waves', wave, 'reports', `${code}-report.md`);
    if (fs.existsSync(fromCwd)) {
      try {
        fs.mkdirSync(path.dirname(primary), { recursive: true });
        fs.copyFileSync(fromCwd, primary);
        fs.unlinkSync(fromCwd);
        const subRepDir = path.dirname(fromCwd);
        if (fs.existsSync(subRepDir) && fs.readdirSync(subRepDir).length === 0) fs.rmdirSync(subRepDir);
        const subWaveDir = path.dirname(subRepDir);
        if (fs.existsSync(subWaveDir) && fs.readdirSync(subWaveDir).length === 0) fs.rmdirSync(subWaveDir);
      } catch (e) { /* ignore */ }
      return primary;
    }
  }
  const legacy = path.join(ROOT, 'runs', 'reports', `${code}-report.md`);
  if (fs.existsSync(legacy)) return legacy;
  return primary;
}

// ── batch 读写 ──
function loadBatch(wave) {
  return JSON.parse(fs.readFileSync(batchPath(wave), 'utf8'));
}
function saveBatch(wave, batch) {
  const p = batchPath(wave);
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(batch, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, p);
}

// ── 工具 ──
function walkNewest(dir, depth, cap) {
  let newest = 0, visited = 0, touched = [];
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (visited > cap) break;
      if (SKIP.has(e.name)) continue;
      const p = path.join(dir, e.name);
      visited++;
      try {
        const st = fs.statSync(p);
        if (st.mtimeMs > newest) newest = st.mtimeMs;
        if (st.mtimeMs > Date.now() - 5 * 60 * 1000) touched.push(e.name + (e.isDirectory() ? '/' : ''));
        if (e.isDirectory() && depth > 0) {
          const sub = walkNewest(p, depth - 1, cap - visited);
          if (sub.newest > newest) newest = sub.newest;
          touched = touched.concat(sub.touched.slice(0, 3));
        }
      } catch (err) { /* perm */ }
    }
  } catch (err) { /* gone */ }
  return { newest, touched: touched.slice(0, 4) };
}

// 规范化绝对路径，保证 CWD 字符串比对 100% 可靠
function resolveCwd(cwd) {
  return path.isAbsolute(cwd) ? path.resolve(cwd) : path.resolve(path.dirname(ROOT), cwd);
}

function readCommits(gitDir, n) {
  try {
    const raw = fs.readFileSync(path.join(gitDir, 'logs', 'HEAD'), 'utf8').trim().split('\n');
    const out = [];
    for (let i = raw.length - 1; i >= 0 && out.length < n; i--) {
      const tab = raw[i].indexOf('\t');
      if (tab < 0) continue;
      const left = raw[i].slice(0, tab).split(' ');
      const msg = raw[i].slice(tab + 1).trim();
      const sha = (left[1] || '').slice(0, 7);
      const ts = Number(left[left.length - 2]) * 1000;
      if (!sha || !ts) continue;
      const low = msg.toLowerCase();
      const isOp = ['pull:', 'clone:', 'checkout:', 'reset:', 'merge:', 'fetch:', 'rebase:', 'branch:'].some(o => low.startsWith(o));
      out.push({ h: sha, ts, subject: msg.replace(/^commit(\s*\(initial\))?:\s*/i, ''), kind: isOp ? 'op' : 'commit' });
    }
    return out;
  } catch (e) { return []; }
}

// ── API: status ──
function buildStatus(wave) {
  const batch = loadBatch(wave);
  const now = Date.now();
  const tasks = batch.tasks.map(t => {
    const elapsed = Math.max(0, Math.floor((now - Date.parse(t.dispatchedAt || batch.dispatchedAt)) / 1000));
    const base = { ...t, elapsed };
    const live = t.status === 'running' || t.status === 'pending' || t.status === 'queued';
    if (!live) {
      base.lastActivityAgo = null; base.touched = []; base.logBytes = 0; base.events = [];
      return base;
    }
    const abs = resolveCwd(t.cwd);
    if (!fs.existsSync(abs)) {
      base.lastActivityAgo = null; base.touched = []; base.logBytes = 0; base.events = [];
      return base;
    }
    const commits = readCommits(path.join(abs, '.git'), 5);
    const { newest, touched } = walkNewest(abs, 3, 600);
    const lastCommit = commits.find(c => c.kind === 'commit') || null;
    base.lastActivityAgo = newest ? Math.round((now - newest) / 1000) : null;
    base.touched = touched;
    base.commit = lastCommit ? { subject: lastCommit.subject, ts: lastCommit.ts } : null;
    let lp = logPath(wave, t.code);
    let logBytes = 0, logMtime = 0;
    try { const st = fs.statSync(lp); logBytes = st.size; logMtime = st.mtimeMs; } catch (e) { /* none */ }
    base.logBytes = logBytes;
    base.events = [];
    if (t.status !== 'running') return base;   // pending / queued：未起进程
    if (logBytes > 0) {
      const tail = tailLog(wave, t.code, Math.max(0, logBytes - 8192));
      base.events = tail.events
        .filter(e => e.k !== 'usage' && (e.s || e.k === 'result'))
        .slice(-3);
      base.stale = (now - logMtime) > STALE_AFTER_MS;
      if (tail.thinkTok && tail.thinkTok > OVERTHINK_TOK) {
        const hasRecentAction = tail.events.some(e => e.k === 'tool' || e.k === 'text');
        if (!hasRecentAction) { base.overthink = true; base.thinkTok = tail.thinkTok; }
      }
      if (!t.sessionId && tail.sid) {
        const b2 = loadBatch(wave);
        const bt2 = b2.tasks.find(x => x.code === t.code);
        if (bt2 && bt2.status === 'running' && !bt2.sessionId) { bt2.sessionId = tail.sid; saveBatch(wave, b2); }
      }
      const res = tail.events.find(e => e.k === 'result');
      if (res) {
        const b = loadBatch(wave);
        const bt = b.tasks.find(x => x.code === t.code);
        if (bt && bt.status === 'running') {
          settleTask(bt, res, wave);
          saveBatch(wave, b);
          base.status = bt.status;
          base.failReason = bt.failReason;
        }
      } else if (base.stale && t.pid && !pidAlive(t.pid)) {
        const b = loadBatch(wave);
        const bt = b.tasks.find(x => x.code === t.code);
        if (bt && bt.status === 'running') {
          bt.settledAt = new Date().toISOString();
          if (tail.sid) bt.sessionId = tail.sid;
          bt.status = 'failed';
          bt.failReason = 'server-restart-orphaned: 进程死亡且日志停更（服务重启连带杀会话，exit 回调丢失）';
          saveBatch(wave, b);
          base.status = bt.status;
          base.failReason = bt.failReason;
        }
      }
    } else {
      if (t.pid && !pidAlive(t.pid)) {
        const b = loadBatch(wave);
        const bt = b.tasks.find(x => x.code === t.code);
        if (bt && bt.status === 'running') {
          bt.settledAt = new Date().toISOString();
          bt.status = 'failed';
          bt.failReason = 'instant-death: 进程启动后立即退出，未写出任何日志';
          saveBatch(wave, b);
          base.status = bt.status;
          base.failReason = bt.failReason;
        }
      }
    }
    return base;
  });
  const counts = {};
  for (const t of tasks) counts[t.status] = (counts[t.status] || 0) + 1;
  const repos = {};
  for (const t of tasks) {
    if (!repos[t.cwd]) {
      const abs = resolveCwd(t.cwd);
      repos[t.cwd] = fs.existsSync(abs) ? readCommits(path.join(abs, '.git'), 5) : [];
    }
  }
  return { wave, dispatchedAt: batch.dispatchedAt, title: batch.title, now, counts, total: tasks.length, tasks, maxConcurrent: MAX_CONCURRENT, repos };
}

// ── API: logs 尾读（字节偏移增量）──
function tailLog(wave, code, since) {
  const lp = logPath(wave, code);
  if (!fs.existsSync(lp)) return { bytes: 0, events: [], exists: false };
  const size = fs.statSync(lp).size;
  const from = Math.min(since, size);
  const len = size - from;
  const buf = Buffer.alloc(len);
  const fd = fs.openSync(lp, 'r');
  fs.readSync(fd, buf, 0, len, from);
  fs.closeSync(fd);
  const text = buf.toString('utf8');
  const lines = text.split('\n').filter(Boolean);
  const events = [];
  let sid = null;
  let thinkTok = 0;
  const complete = text.endsWith('\n') ? lines : lines.slice(0, -1);
  for (const line of complete) {
    try {
      const j = JSON.parse(line);
      if (j.session_id) sid = j.session_id;
      if (j.type === 'system' && j.subtype === 'thinking_tokens' && j.estimated_tokens != null) {
        thinkTok = j.estimated_tokens;
        events.push({ k: 'think', tok: j.estimated_tokens });
      } else if (j.type === 'assistant') {
        thinkTok = 0;
        const txt = (j.message?.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
        if (txt) events.push({ k: 'text', s: txt.slice(0, 1200) });
        for (const c of j.message?.content || []) {
          if (c.type === 'tool_use') events.push({ k: 'tool', name: c.name, input: c.input });
        }
      } else if (j.type === 'user') {
        for (const c of j.message?.content || []) {
          if (c.type === 'tool_result') events.push({ k: 'result_tool', tool_use_id: c.tool_use_id, is_error: c.is_error, content: String(c.content || '').slice(0, 600) });
        }
      } else if (j.type === 'result') {
        events.push({ k: 'result', s: String(j.result || j.subtype || '').slice(0, 500), err: j.is_error === true });
      }
    } catch (e) { /* 半行 */ }
  }
  let consumed;
  if (text.endsWith('\n')) consumed = size;
  else {
    const idx = text.lastIndexOf('\n');
    consumed = idx >= 0 ? from + idx + 1 : from;
  }
  return { bytes: consumed, events, exists: true, sid, thinkTok };
}

// ── 会话收档：依据 result 事件把 running 落定为 reported / failed ──
function settleTask(bt, res, wave) {
  bt.settledAt = new Date().toISOString();
  if (res) {
    if (res.sid) bt.sessionId = res.sid;
    if (res.turns != null) bt.turns = res.turns;
    if (res.cost != null) bt.costUsd = res.cost;
    if (res.outTok != null) bt.outTok = res.outTok;
  }
  const repFile = wave ? reportPath(wave, bt.code, bt.cwd) : path.join(ROOT, 'runs', 'reports', `${bt.code}-report.md`);
  const hasReport = fs.existsSync(repFile);
  if (!res) { bt.status = 'failed'; bt.failReason = 'no-result-event'; return; }
  if (res.err) { bt.status = 'failed'; bt.failReason = String(res.s || 'error').slice(0, 200); return; }
  if (!hasReport) { bt.status = 'failed'; bt.failReason = 'no-report'; return; }
  bt.status = 'reported';   // 待验收：绿色终态（accepted）只能由 /api/accept 产生
}

// 从 ndjson 尾部捞最近一条 result 事件
function lastResultEvent(wave, code) {
  try {
    const lp = logPath(wave, code);
    const size = fs.statSync(lp).size;
    const len = Math.min(size, 65536);
    const buf = Buffer.alloc(len);
    const fd = fs.openSync(lp, 'r');
    fs.readSync(fd, buf, 0, len, size - len);
    fs.closeSync(fd);
    const lines = buf.toString('utf8').split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const j = JSON.parse(lines[i]);
        if (j.type === 'result') {
          return { k: 'result', s: String(j.result || j.subtype || '').slice(0, 300), err: j.is_error === true, sid: j.session_id || null, turns: j.num_turns ?? null, cost: j.total_cost_usd ?? null, outTok: j.usage?.output_tokens ?? null };
        }
      } catch (e) { /* 半行 */ }
    }
    return null;
  } catch (e) { return null; }
}

// ── 队列调度补位：全局并发信号量 + 同仓库避让锁（CWD Lock）双重守卫 ──
function advanceQueue(wave) {
  try {
    const b = loadBatch(wave);
    const runningTasks = b.tasks.filter(x => x.status === 'running');
    if (runningTasks.length >= MAX_CONCURRENT) return;

    // 收集当前正在跑的所有任务的绝对 cwd
    const runningCwds = new Set(runningTasks.map(x => resolveCwd(x.cwd)));

    // 优先补位：处于 queued 状态，且目标 cwd 与当前正在跑的任务无冲突
    const next = b.tasks.find(x => x.status === 'queued' && !runningCwds.has(resolveCwd(x.cwd)));
    if (next) dispatch(wave, next.code);
  } catch (e) { /* 忽略 */ }
}

// ── API: dispatch（fresh / resume 两模式 + CWD 锁 + 并发信号量）──
function dispatch(wave, code, opts = {}) {
  const batch = loadBatch(wave);
  const t = batch.tasks.find(x => x.code === code);
  if (!t) return { ok: false, error: 'task not found' };

  if (opts.resume) {
    if (!t.sessionId) return { ok: false, error: 'no sessionId harvested for this task' };
    if (!['reported', 'failed', 'rejected'].includes(t.status)) return { ok: false, error: `cannot resume from status ${t.status}` };
    if ((t.resumeCount || 0) >= 3) return { ok: false, error: 'resume depth limit (3) reached' };
    if (!opts.prompt || !String(opts.prompt).trim()) return { ok: false, error: 'resume requires a follow-up prompt' };
  } else {
    if (!['pending', 'queued', 'failed'].includes(t.status)) return { ok: false, error: `task status is ${t.status}, not dispatchable` };
    const promptAbs = path.join(waveDir(wave), t.promptFile);
    if (!fs.existsSync(promptAbs)) return { ok: false, error: `prompt file missing: ${t.promptFile}` };
  }

  const targetCwd = resolveCwd(t.cwd);
  const runningTasks = batch.tasks.filter(x => x.status === 'running');

  // 1. 同仓库避让锁（CWD Mutex Lock）：同一工作目录禁止多 Agent 并发施工
  const sameCwdRunning = runningTasks.find(x => resolveCwd(x.cwd) === targetCwd && x.code !== code);
  if (sameCwdRunning && !opts.force) {
    if (t.status !== 'queued' || t.queueReason !== 'cwd-lock') {
      t.status = 'queued';
      t.queueReason = 'cwd-lock';
      t.queueDetail = `等待同目录任务 [${sameCwdRunning.code}] 释放 (${t.cwd})`;
      saveBatch(wave, batch);
    }
    return { ok: true, queued: true, reason: 'cwd-lock', running: runningTasks.length, conflictWith: sameCwdRunning.code };
  }

  // 2. 全局并发信号量：满员不 spawn，转 queued 排队
  if (runningTasks.length >= MAX_CONCURRENT && !opts.force) {
    if (t.status !== 'queued' || t.queueReason !== 'concurrency') {
      t.status = 'queued';
      t.queueReason = 'concurrency';
      t.queueDetail = `并发满员 (${runningTasks.length}/${MAX_CONCURRENT})，等待空位`;
      saveBatch(wave, batch);
    }
    return { ok: true, queued: true, reason: 'concurrency', running: runningTasks.length };
  }

  t.status = 'running';
  delete t.queueReason;
  delete t.queueDetail;
  t.dispatchedAt = new Date().toISOString();
  if (opts.resume) { t.resumeCount = (t.resumeCount || 0) + 1; t.followUp = String(opts.prompt).slice(0, 300); }
  else delete t.failReason;
  saveBatch(wave, batch);

  const cwdAbs = targetCwd;
  fs.mkdirSync(path.dirname(logPath(wave, code)), { recursive: true });
  fs.mkdirSync(path.join(waveDir(wave), 'reports'), { recursive: true });

  const modelArg = t.model;
  const promptText = opts.resume ? String(opts.prompt) : fs.readFileSync(path.join(waveDir(wave), t.promptFile), 'utf8');
  const outFd = fs.openSync(logPath(wave, code), opts.resume ? 'a' : 'w');
  const errFd = fs.openSync(logPath(wave, code) + '.launcher.err', 'a');
  const argv = ['--dangerously-skip-permissions'];
  if (opts.resume) argv.push('--resume', t.sessionId);
  argv.push('-p', promptText, '--model', modelArg, '--output-format', 'stream-json', '--verbose');
  const child = spawn(CLAUDE_EXE, argv, {
    cwd: cwdAbs,
    env: {
      ...process.env,
      ANTHROPIC_BASE_URL: 'https://open.bigmodel.cn/api/anthropic',
      ANTHROPIC_AUTH_TOKEN: readZhipuKey(),
      ANTHROPIC_SMALL_FAST_MODEL: 'glm-5.3-flash[1m]',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-5.3-flash[1m]',
      ANTHROPIC_DEFAULT_SONNET_MODEL: modelArg,
      ANTHROPIC_DEFAULT_OPUS_MODEL: modelArg,
      ANTHROPIC_DEFAULT_FABLE_MODEL: modelArg,
      CLAUDE_CODE_AUTO_COMPACT_WINDOW: '1000000',
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
      API_TIMEOUT_MS: '600000',
      CLAUDE_CODE_EFFORT_LEVEL: 'max',
      CLAUDE_CODE_MAX_CONTEXT_TOKENS: '1000000',
    },
    stdio: ['ignore', outFd, errFd],
    detached: true, windowsHide: true,
  });
  fs.closeSync(outFd);
  fs.closeSync(errFd);
  child.unref();
  try {
    const b2 = loadBatch(wave);
    const t2 = b2.tasks.find(x => x.code === code);
    if (t2 && t2.status === 'running') { t2.pid = child.pid; saveBatch(wave, b2); }
  } catch (e) { /* 忽略 */ }

  child.on('exit', () => {
    try {
      const b = loadBatch(wave);
      const bt = b.tasks.find(x => x.code === code);
      if (bt && bt.status === 'running') {
        settleTask(bt, lastResultEvent(wave, code), wave);
        saveBatch(wave, b);
      }
      advanceQueue(wave);
    } catch (e) { /* 忽略 */ }
  });
  return { ok: true, pid: child.pid };
}

// ── API: accept（验收终裁：accepted 只能由这里产生）──
function accept(wave, code, verdict, note) {
  const batch = loadBatch(wave);
  const t = batch.tasks.find(x => x.code === code);
  if (!t) return { ok: false, error: 'task not found' };
  if (!['reported', 'failed', 'rejected'].includes(t.status)) return { ok: false, error: `status ${t.status} is not verifiable` };
  if (verdict === 'accept') {
    t.status = 'accepted';
    t.acceptedAt = new Date().toISOString();
    t.acceptNote = String(note || '人工验收合格');
    delete t.failReason;
  } else if (verdict === 'reject') {
    t.status = 'rejected';
    t.rejectedAt = new Date().toISOString();
    t.rejectReason = String(note || '验收打回');
  } else {
    return { ok: false, error: 'verdict must be accept or reject' };
  }
  saveBatch(wave, batch);
  return { ok: true, status: t.status };
}

// ── API: kill（终止正在运行的会话）──
function killTask(wave, code) {
  const batch = loadBatch(wave);
  const t = batch.tasks.find(x => x.code === code);
  if (!t) return { ok: false, error: 'task not found' };
  if (t.status !== 'running') return { ok: false, error: 'task is not running' };
  const pid = t.pid;
  if (pid) {
    try {
      execFile('taskkill', ['/PID', String(pid), '/T', '/F'], () => {});
    } catch (e) { /* 容错 */ }
  }
  t.status = 'failed';
  t.settledAt = new Date().toISOString();
  t.failReason = 'killed-by-user: 用户在控制台强制终止';
  saveBatch(wave, batch);
  advanceQueue(wave);
  return { ok: true };
}

// ── 静态资源托管 ──
function serveStatic(res, relPath) {
  const file = path.join(APP, 'public', relPath);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(file).toLowerCase();
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.json': 'application/json; charset=utf-8'
  }[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(file).pipe(res);
}

// ── SSE 实时推送 ──
const sseClients = new Set();
function sseBroadcast(wave) {
  const data = JSON.stringify(buildStatus(wave));
  for (const c of sseClients) {
    if (c.wave !== wave) continue;
    try { c.res.write('data: ' + data + '\n\n'); } catch (e) { sseClients.delete(c); }
  }
}

const WAVES_WATCH_DIR = getWavesRoot();
if (fs.existsSync(WAVES_WATCH_DIR)) {
  fs.watchFile(WAVES_WATCH_DIR, { interval: 1200 }, () => {
    for (const w of new Set([...sseClients].map(c => c.wave))) {
      try { sseBroadcast(w); } catch (e) { /* wave 消失等 */ }
    }
  });
}
setInterval(() => {
  for (const w of new Set([...sseClients].map(c => c.wave))) {
    try { sseBroadcast(w); } catch (e) { /* 忽略 */ }
  }
}, 2000);

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');

  // 波次列表
  if (u.pathname === '/api/waves') {
    try {
      const list = [];
      const scanDir = getWavesRoot();
      if (fs.existsSync(scanDir)) {
        for (const d of fs.readdirSync(scanDir, { withFileTypes: true })) {
          if (!d.isDirectory() || !WAVE_RE.test(d.name)) continue;
          try {
            const b = JSON.parse(fs.readFileSync(path.join(scanDir, d.name, 'batch.json'), 'utf8'));
            const c = {};
            for (const t of b.tasks || []) c[t.status] = (c[t.status] || 0) + 1;
            const active = ((c.running || 0) + (c.queued || 0) + (c.pending || 0)) > 0;
            list.push({ wave: d.name, title: b.title || '', total: (b.tasks || []).length, counts: c, active });
          } catch (e) { /* 坏 batch 跳过 */ }
        }
      }
      list.sort((a, b) => (b.active - a.active) || a.wave.localeCompare(b.wave, undefined, { numeric: true }));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ waves: list }));
    } catch (e) { res.writeHead(500); res.end('{"error":"scan failed"}'); }
    return;
  }

  // SSE 实时流
  if (u.pathname === '/api/events') {
    const w = u.searchParams.get('wave') || defaultWave();
    if (!WAVE_RE.test(w)) { res.writeHead(400).end(); return; }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    const client = { res, wave: w };
    sseClients.add(client);
    req.on('close', () => sseClients.delete(client));
    return;
  }

  // 状态大盘
  if (u.pathname === '/api/status') {
    const w = u.searchParams.get('wave') || defaultWave();
    let payload;
    if (!WAVE_RE.test(w)) payload = JSON.stringify({ ok: false, error: 'bad wave name' });
    else { try { payload = JSON.stringify(buildStatus(w)); } catch (e) { payload = JSON.stringify({ ok: false, error: `wave not found: ${w}` }); } }
    res.writeHead(payload.includes('"ok":false') ? 400 : 200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(payload);
    return;
  }

  // 主脑结构化巡检端点（机器高信号报表）
  if (u.pathname === '/api/supervise') {
    const wave = u.searchParams.get('wave') || defaultWave();
    try {
      const status = buildStatus(wave);
      const audit = {
        ok: true,
        wave,
        title: status.title,
        now: status.now,
        counts: status.counts,
        total: status.total,
        needAcceptance: [],
        blockedOrFailed: [],
        runningOrQueued: [],
        recommendations: [],
      };
      for (const t of status.tasks) {
        if (t.status === 'reported') {
          const rp = reportPath(wave, t.code, t.cwd);
          audit.needAcceptance.push({
            code: t.code,
            name: t.name,
            goal: t.goal,
            turns: t.turns,
            costUsd: t.costUsd,
            outTok: t.outTok,
            hasReport: fs.existsSync(rp),
            reportPath: rp
          });
          audit.recommendations.push({
            code: t.code,
            action: 'accept-review',
            level: 'minor',
            hint: `任务 [${t.code}] (${t.name}) 待验收，主脑核对报告后可调用 /api/accept 确认`
          });
        } else if (t.status === 'failed' || t.status === 'rejected') {
          const isMajor = /architect|fatal|cannot|not feasible|blocker|重大|无法实现|不可行/i.test(t.failReason || t.rejectReason || '');
          const canAutoResume = (t.resumeCount || 0) < 3 && !!t.sessionId && !isMajor;
          audit.blockedOrFailed.push({
            code: t.code,
            name: t.name,
            status: t.status,
            failReason: t.failReason,
            rejectReason: t.rejectReason,
            resumeCount: t.resumeCount || 0,
            canAutoResume,
            isMajorBlocker: isMajor
          });
          audit.recommendations.push({
            code: t.code,
            action: isMajor ? 'escalate-to-user' : (canAutoResume ? 'auto-resume' : 'escalate-to-user'),
            level: isMajor ? 'major' : 'minor',
            hint: isMajor
              ? `任务 [${t.code}] 遭遇方案/架构阻断，须向用户请示方案`
              : (canAutoResume
                  ? `任务 [${t.code}] 异常 (${t.failReason || t.rejectReason || '退出未达标'})，主脑可调用 dispatch(resume) 自动续派`
                  : `任务 [${t.code}] 已达最大续派深度或无会话，需升级请示用户`)
          });
        } else if (t.status === 'running' || t.status === 'queued') {
          audit.runningOrQueued.push({
            code: t.code,
            name: t.name,
            status: t.status,
            elapsed: t.elapsed,
            cwd: t.cwd,
            queueReason: t.queueReason,
            queueDetail: t.queueDetail,
            stale: t.stale,
            overthink: t.overthink
          });
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(audit));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
    return;
  }

  // 单任务报告内容读取
  if (u.pathname.startsWith('/api/report/')) {
    const code = u.pathname.split('/')[3];
    const wave = u.searchParams.get('wave') || defaultWave();
    let taskCwd = null;
    try {
      const b = loadBatch(wave);
      const t = b.tasks.find(x => x.code === code);
      if (t) taskCwd = t.cwd;
    } catch (e) { /* ignore */ }
    const rp = reportPath(wave, code, taskCwd);
    if (!fs.existsSync(rp)) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'report not found', path: rp }));
      return;
    }
    try {
      const content = fs.readFileSync(rp, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, wave, code, path: rp, content }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
    return;
  }

  // 终端日志增量读取
  if (u.pathname.startsWith('/api/logs/')) {
    const code = u.pathname.split('/')[3];
    const since = Number(u.searchParams.get('since') || 0);
    const wave = u.searchParams.get('wave') || defaultWave();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(tailLog(wave, code, since)));
    return;
  }

  // 派发
  if (u.pathname === '/api/dispatch' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let out;
      try {
        let { wave, code, resume, prompt, force } = JSON.parse(body || '{}');
        wave = wave || defaultWave();
        if (!WAVE_RE.test(wave)) throw new Error('bad wave name');
        out = dispatch(wave, code, { resume: !!resume, prompt, force: !!force });
      } catch (e) { out = { ok: false, error: String(e.message || e) }; }
      res.writeHead(out.ok ? 200 : 400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(out));
    });
    return;
  }

  // 验收
  if (u.pathname === '/api/accept' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let out;
      try {
        let { wave, code, verdict, note } = JSON.parse(body || '{}');
        wave = wave || defaultWave();
        if (!WAVE_RE.test(wave)) throw new Error('bad wave name');
        out = accept(wave, code, verdict, note);
      } catch (e) { out = { ok: false, error: String(e.message || e) }; }
      res.writeHead(out.ok ? 200 : 400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(out));
    });
    return;
  }

  // 强制结束
  if (u.pathname === '/api/kill' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let out;
      try {
        let { wave, code } = JSON.parse(body || '{}');
        wave = wave || defaultWave();
        if (!WAVE_RE.test(wave)) throw new Error('bad wave name');
        out = killTask(wave, code);
      } catch (e) { out = { ok: false, error: String(e.message || e) }; }
      res.writeHead(out.ok ? 200 : 400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(out));
    });
    return;
  }

  if (u.pathname === '/' || u.pathname === '/index.html') return serveStatic(res, 'index.html');
  if (u.pathname.startsWith('/public/')) return serveStatic(res, u.pathname.slice('/public/'.length));
  return serveStatic(res, u.pathname.slice(1));
});

server.listen(PORT, '127.0.0.1', () => console.log(`agent-hive 太木控制台: http://127.0.0.1:${PORT} · 并发上限 ${MAX_CONCURRENT} · 终态只出自验收`));
