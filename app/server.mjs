// agent-hive 蜂巢 · 派发控制台服务（验收状态机：终态只出自验收）
// 静态页 + 状态 API + 终端日志尾读 + 派发（spawn claude 无头会话）
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, execFile } from 'child_process';
import { fileURLToPath } from 'url';

const APP = path.dirname(fileURLToPath(import.meta.url));    // app/（应用代码）
const PROJECT = path.dirname(APP);                           // 仓根（数据：batches/runs）
const ROOT = PROJECT;                                        // 兼容旧引用：数据目录挂仓根
const PORT = Number(process.env.PORT || 17879);
const KEY_FILE = path.join(process.env.USERPROFILE, '.claude', 'zhipu.env');
// claude.exe 真身（npm claude.cmd 的最终目标），直接 spawn 绕开一切 PS 包装层
const CLAUDE_EXE = path.join(process.env.APPDATA, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe');
// 并发信号量：同一波次同时 running 上限（12 路并发实测撞智谱账户级 429，安全区 4）
const MAX_CONCURRENT = Number(process.env.HIVE_MAX_CONCURRENT || 4);
// running 且日志无增长超过此时长 → 面板标 stale（仅提示，不改状态；处置走 /api/kill）
const STALE_AFTER_MS = Number(process.env.HIVE_STALE_MINUTES || 5) * 60 * 1000;

function readZhipuKey() {
  try {
    const line = fs.readFileSync(KEY_FILE, 'utf8').split('\n').find(l => /^\s*(export\s+)?ZHIPU_API_KEY\s*=/.test(l));
    return line ? line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '') : '';
  } catch (e) { return ''; }
}

const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage', '.turbo', '.pnpm-store', '__pycache__', '.venv']);

// ── batch 读写 ──
function batchPath(wave) { return path.join(ROOT, 'batches', wave, 'batch.json'); }
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
function resolveCwd(cwd) {
  return path.isAbsolute(cwd) ? cwd : path.join(path.dirname(ROOT), cwd);
}
function logPath(wave, code) { return path.join(ROOT, 'runs', 'logs', wave, `${code}.ndjson`); }
function readKey() {
  const line = fs.readFileSync(KEY_FILE, 'utf8').split('\n').find(l => /^\s*ZHIPU_API_KEY\s*=/.test(l));
  return line ? line.split('=')[1].trim().replace(/^["']|["']$/g, '') : '';
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
    const reportPath = path.join(ROOT, 'runs', 'reports', `${t.code}-report.md`);
    try { base.reportMtime = fs.statSync(reportPath).mtimeMs; } catch (e) { base.reportMtime = null; }
    const live = t.status === 'running' || t.status === 'pending' || t.status === 'queued';
    if (!live) {
      base.state = t.status; base.lastActivityAgo = null; base.touched = []; base.logBytes = 0; base.events = [];
      // 终态好结局（accepted / 旧 done）带最近提交（Git 动态归档区展示用）
      if (t.status === 'accepted' || t.status === 'done') {
        const gd = path.join(resolveCwd(t.cwd), '.git');
        if (fs.existsSync(gd)) base.commits = readCommits(gd, 5);
      }
      return base;
    }
    const abs = resolveCwd(t.cwd);
    const repoExists = fs.existsSync(abs);
    const gitDir = path.join(abs, '.git');
    const commits = repoExists ? readCommits(gitDir, 5) : [];
    if (!repoExists) {
      base.state = t.status; base.lastActivityAgo = null; base.touched = []; base.commits = []; base.logBytes = 0; base.events = [];
      return base;
    }
    const { newest, touched } = walkNewest(abs, 3, 600);
    const lastCommit = commits.find(c => c.kind === 'commit') || null;
    base.lastActivityAgo = newest ? Math.round((now - newest) / 1000) : null;
    base.touched = touched;
    base.commits = commits;
    base.commit = lastCommit ? { subject: lastCommit.subject, ts: lastCommit.ts } : null;
    let lp = logPath(wave, t.code);
    let logBytes = 0, logMtime = 0;
    try { const st = fs.statSync(lp); logBytes = st.size; logMtime = st.mtimeMs; } catch (e) { /* none */ }
    base.logBytes = logBytes;
    base.events = [];
    if (t.status !== 'running') { base.state = t.status; return base; }   // pending / queued：未起进程
    if (logBytes > 0) {
      const tail = tailLog(wave, t.code, Math.max(0, logBytes - 8192));
      base.events = tail.events.slice(-3);
      base.staleFor = logMtime ? Math.round((now - logMtime) / 1000) : null;
      base.stale = logMtime ? (now - logMtime > STALE_AFTER_MS) : false;   // 日志停更提示
      // 自愈：exit 回调丢失（如服务重启）时，日志出现 result 事件而 batch 仍 running → 就地收档
      const res = base.events.find(e => e.k === 'result');
      if (res) {
        const b = loadBatch(wave);
        const bt = b.tasks.find(x => x.code === t.code);
        if (bt && bt.status === 'running') { settleTask(bt, res); saveBatch(wave, b); }
        base.state = res.err ? 'failed' : 'reported';
      }
    }
    if (!base.state) base.state = 'running';
    return base;
  });
  const counts = { accepted: 0, reported: 0, failed: 0, rejected: 0, running: 0, queued: 0, pending: 0, done: 0, cancelled: 0 };
  tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
  return { wave, dispatchedAt: batch.dispatchedAt, title: batch.title, now, counts, total: tasks.length, tasks, maxConcurrent: MAX_CONCURRENT };
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
  const complete = text.endsWith('\n') ? lines : lines.slice(0, -1);
  for (const line of complete) {
    try {
      const j = JSON.parse(line);
      const msg = j.message || {};
      const content = Array.isArray(msg.content) ? msg.content : [];
      for (const c of content) {
        if (c.type === 'text' && c.text) events.push({ k: 'say', s: c.text });
        else if (c.type === 'tool_use') {
          const i = c.input || {};
          const hint = i.file_path || i.command || i.description || i.pattern || i.url || '';
          events.push({ k: 'tool', s: `${c.name} ${String(hint).slice(0, 160)}` });
        }
      }
      if (j.type === 'result') {
        const dur = j.duration_ms ? ` · 用时 ${Math.round(j.duration_ms / 1000)}s` : '';
        const cost = j.total_cost_usd ? ` · $${j.total_cost_usd.toFixed(4)}` : '';
        events.push({ k: 'result', s: `${j.is_error ? '✗ ' : '✓ '}${String(j.result || j.subtype || 'done').slice(0, 300)}${dur}${cost}`, err: j.is_error === true, sid: j.session_id || null, turns: j.num_turns ?? null, cost: j.total_cost_usd ?? null });
      }
    } catch (e) { /* 不完整行留给下一次 since */ }
  }
  // 计算完整行的累计字节：重算到最后一个完整换行为止
  let consumed = from;
  if (complete.length) {
    const idx = text.lastIndexOf('\n');
    consumed = from + idx + 1;
  } else {
    consumed = from;
  }
  return { bytes: consumed, events, exists: true };
}

// ── 会话收档：依据 result 事件把 running 落定为 reported / failed，并收获 sessionId/轮数/成本 ──
function settleTask(bt, res) {
  bt.settledAt = new Date().toISOString();
  if (res) {
    if (res.sid) bt.sessionId = res.sid;
    if (res.turns != null) bt.turns = res.turns;
    if (res.cost != null) bt.costUsd = res.cost;
  }
  const hasReport = fs.existsSync(path.join(ROOT, 'runs', 'reports', `${bt.code}-report.md`));
  if (!res) { bt.status = 'failed'; bt.failReason = 'no-result-event'; return; }
  if (res.err) { bt.status = 'failed'; bt.failReason = String(res.s || 'error').slice(0, 200); return; }
  if (!hasReport) { bt.status = 'failed'; bt.failReason = 'no-report'; return; }
  bt.status = 'reported';   // 待验收：绿色终态（accepted）只能由 /api/accept 产生
}

// 从 ndjson 尾部捞最近一条 result 事件（收档判定依据）
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
          return { k: 'result', s: String(j.result || j.subtype || '').slice(0, 300), err: j.is_error === true, sid: j.session_id || null, turns: j.num_turns ?? null, cost: j.total_cost_usd ?? null };
        }
      } catch (e) { /* 半行 */ }
    }
    return null;
  } catch (e) { return null; }
}

// 信号量补位：running 有空位且有 queued 任务时自动开下一个
function advanceQueue(wave) {
  try {
    const b = loadBatch(wave);
    if (b.tasks.filter(x => x.status === 'running').length >= MAX_CONCURRENT) return;
    const next = b.tasks.find(x => x.status === 'queued');
    if (next) dispatch(wave, next.code);
  } catch (e) { /* 忽略 */ }
}

// ── API: dispatch（fresh / resume 两模式 + 并发信号量）──
function dispatch(wave, code, opts = {}) {
  const batch = loadBatch(wave);
  const t = batch.tasks.find(x => x.code === code);
  if (!t) return { ok: false, error: 'task not found' };
  if (opts.resume) {
    // resume：后续指令派回原会话（--resume <sessionId>），依赖收档时 harvest 的 sessionId
    if (!t.sessionId) return { ok: false, error: 'no sessionId harvested for this task' };
    if (!['reported', 'failed', 'rejected'].includes(t.status)) return { ok: false, error: `cannot resume from status ${t.status}` };
    if ((t.resumeCount || 0) >= 3) return { ok: false, error: 'resume depth limit (3) reached' };
    if (!opts.prompt || !String(opts.prompt).trim()) return { ok: false, error: 'resume requires a follow-up prompt' };
  } else {
    // fresh：首次派发，或 failed 任务整档重跑（日志重写）
    if (!['pending', 'queued', 'failed'].includes(t.status)) return { ok: false, error: `task status is ${t.status}, not dispatchable` };
  }
  // 并发信号量：满员不 spawn，转 queued 排队（exit 补位自动开跑）；force 可插队（冒烟/抢修）
  const running = batch.tasks.filter(x => x.status === 'running').length;
  if (running >= MAX_CONCURRENT && !opts.force) {
    if (t.status !== 'queued') { t.status = 'queued'; saveBatch(wave, batch); }
    return { ok: true, queued: true, running };
  }
  t.status = 'running';
  t.dispatchedAt = new Date().toISOString();
  if (opts.resume) { t.resumeCount = (t.resumeCount || 0) + 1; t.followUp = String(opts.prompt).slice(0, 300); }
  else delete t.failReason;
  saveBatch(wave, batch);
  const cwdAbs = resolveCwd(t.cwd);
  fs.mkdirSync(path.dirname(logPath(wave, code)), { recursive: true });
  // 直接 spawn claude.exe（零 PS 包装层）：prompt 走 argv，stdout=ndjson 实时流，stderr=排障文件
  // model 字段即实际模型 ID（声明即执行，零映射）；后台轻任务固定走 flash
  const modelArg = t.model;
  const promptText = opts.resume ? String(opts.prompt) : fs.readFileSync(path.join(ROOT, 'batches', wave, t.promptFile), 'utf8');
  const outFd = fs.openSync(logPath(wave, code), opts.resume ? 'a' : 'w');   // resume 追加同文件，fresh 重写
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
  try { const b2 = loadBatch(wave); const t2 = b2.tasks.find(x => x.code === code); if (t2 && t2.status === 'running') { t2.pid = child.pid; saveBatch(wave, b2); } } catch (e) { /* 忽略 */ }
  // claude 退出 → 读日志 result 收档（is_error / 无报告 → failed；干净 → reported），再补位队列
  child.on('exit', () => {
    try {
      const b = loadBatch(wave);
      const bt = b.tasks.find(x => x.code === code);
      if (bt && bt.status === 'running') {
        settleTask(bt, lastResultEvent(wave, code));
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
    t.status = 'accepted'; t.acceptedAt = new Date().toISOString();
    if (note) t.acceptNote = String(note).slice(0, 300);
  } else if (verdict === 'reject') {
    if (!note || !String(note).trim()) return { ok: false, error: 'reject requires a note（打回理由将作为 resume 续派提示词）' };
    t.status = 'rejected'; t.rejectedAt = new Date().toISOString(); t.rejectNote = String(note).slice(0, 300);
  } else return { ok: false, error: 'verdict must be accept|reject' };
  saveBatch(wave, batch);
  return { ok: true, status: t.status };
}

// ── API: kill（强制结束 running 会话树；正常流程用不到，stale/挂死时的人工处置）──
function killTask(wave, code) {
  const batch = loadBatch(wave);
  const t = batch.tasks.find(x => x.code === code);
  if (!t) return { ok: false, error: 'task not found' };
  if (t.status !== 'running') return { ok: false, error: `status ${t.status}, not running` };
  if (!t.pid) return { ok: false, error: 'no pid recorded' };
  t.killedAt = new Date().toISOString();
  saveBatch(wave, batch);
  execFile('taskkill', ['/PID', String(t.pid), '/F', '/T'], () => {});   // exit 回调随后收档为 failed
  return { ok: true, pid: t.pid };
}

// ── 静态 ──
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json' };
function serveStatic(res, rel) {
  const pubRoot = path.join(APP, 'public');
  const p = path.join(pubRoot, rel);
  if (!p.startsWith(pubRoot)) { res.writeHead(403); res.end(); return; }
  try {
    const data = fs.readFileSync(p);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('not found'); }
}

// wave 名白名单：字母/数字/下划线/连字符——防错拼 URL（复制带进 markdown 符号等）打崩服务，也防路径穿越
const WAVE_RE = /^[\w-]+$/;

// ── SSE 实时推送：一条长连接替代 5s 轮询；2s 心跳走秒 elapsed，batch 变化即时推 ──
const sseClients = new Set();   // { res, wave }
function sseBroadcast(wave) {
  const data = JSON.stringify(buildStatus(wave));
  for (const c of sseClients) {
    if (c.wave !== wave) continue;
    try { c.res.write('data: ' + data + '\n\n'); } catch (e) { sseClients.delete(c); }
  }
}
fs.watchFile(path.join(ROOT, 'batches'), { interval: 1200 }, () => {
  for (const w of new Set([...sseClients].map(c => c.wave))) {
    try { sseBroadcast(w); } catch (e) { /* wave 消失等 */ }
  }
});
setInterval(() => {
  for (const w of new Set([...sseClients].map(c => c.wave))) {
    try { sseBroadcast(w); } catch (e) { /* 忽略 */ }
  }
}, 2000);

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/api/events') {
    // SSE：握手后由 ticker/watch 推送；客户端断开自动清理
    const w = u.searchParams.get('wave') || 'wave1';
    if (!WAVE_RE.test(w)) { res.writeHead(400).end(); return; }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    const client = { res, wave: w };
    sseClients.add(client);
    req.on('close', () => sseClients.delete(client));
    return;
  }
  if (u.pathname === '/api/status') {
    const w = u.searchParams.get('wave') || 'wave1';
    let payload;
    if (!WAVE_RE.test(w)) payload = JSON.stringify({ ok: false, error: 'bad wave name' });
    else { try { payload = JSON.stringify(buildStatus(w)); } catch (e) { payload = JSON.stringify({ ok: false, error: `wave not found: ${w}` }); } }
    res.writeHead(payload.includes('"ok":false') ? 400 : 200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(payload);
    return;
  }
  if (u.pathname.startsWith('/api/logs/')) {
    const code = u.pathname.split('/')[3];
    const since = Number(u.searchParams.get('since') || 0);
    const wave = u.searchParams.get('wave') || 'wave1';
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(tailLog(wave, code, since)));
    return;
  }
  if (u.pathname === '/api/dispatch' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let out;
      try {
        const { wave, code, resume, prompt, force } = JSON.parse(body || '{}');
        if (!WAVE_RE.test(wave || 'wave1')) throw new Error('bad wave name');
        out = dispatch(wave || 'wave1', code, { resume: !!resume, prompt, force: !!force });
      } catch (e) { out = { ok: false, error: String(e.message || e) }; }
      res.writeHead(out.ok ? 200 : 400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(out));
    });
    return;
  }
  if (u.pathname === '/api/accept' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let out;
      try {
        const { wave, code, verdict, note } = JSON.parse(body || '{}');
        if (!WAVE_RE.test(wave || 'wave1')) throw new Error('bad wave name');
        out = accept(wave || 'wave1', code, verdict, note);
      } catch (e) { out = { ok: false, error: String(e.message || e) }; }
      res.writeHead(out.ok ? 200 : 400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(out));
    });
    return;
  }
  if (u.pathname === '/api/kill' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let out;
      try {
        const { wave, code } = JSON.parse(body || '{}');
        if (!WAVE_RE.test(wave || 'wave1')) throw new Error('bad wave name');
        out = killTask(wave || 'wave1', code);
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

server.listen(PORT, '127.0.0.1', () => console.log(`agent-hive 蜂巢: http://127.0.0.1:${PORT} · 并发上限 ${MAX_CONCURRENT} · 终态只出自验收`));
