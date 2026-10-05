// agent-console · 派发控制台服务
// 静态页 + 状态 API + 终端日志尾读 + 派发（spawn claude 无头会话）
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 17879);
const LAUNCHER = path.join(ROOT, 'launcher.ps1');
const KEY_FILE = path.join(process.env.USERPROFILE, '.claude', 'zhipu.env');

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

// ── API: status ──
function buildStatus(wave) {
  const batch = loadBatch(wave);
  const now = Date.now();
  const dispatched = Date.parse(batch.dispatchedAt);
  const tasks = batch.tasks.map(t => {
    const elapsed = Math.max(0, Math.floor((now - Date.parse(t.dispatchedAt || batch.dispatchedAt)) / 1000));
    const base = { ...t, elapsed };
    const reportPath = path.join(ROOT, 'runs', 'reports', `${t.code}-report.md`);
    try { base.reportMtime = fs.statSync(reportPath).mtimeMs; } catch (e) { base.reportMtime = null; }
    if (t.status === 'done' || t.status === 'cancelled') {
      base.state = t.status; base.lastActivityAgo = null; base.touched = []; base.logBytes = 0; base.events = [];
      return base;
    }
    const abs = resolveCwd(t.cwd);
    if (!fs.existsSync(abs)) {
      base.state = 'pending'; base.lastActivityAgo = null; base.touched = []; base.logBytes = 0; base.events = [];
      return base;
    }
    const { newest, touched } = walkNewest(abs, 3, 600);
    base.lastActivityAgo = newest ? Math.round((now - newest) / 1000) : null;
    base.touched = touched;
    let lp = logPath(wave, t.code);
    let logBytes = 0;
    try { logBytes = fs.statSync(lp).size; } catch (e) { /* none */ }
    base.logBytes = logBytes;
    base.events = [];
    if (logBytes > 0 && t.status === 'running') {
      const tail = tailLog(wave, t.code, Math.max(0, logBytes - 8192));
      base.events = tail.events.slice(-3);
    }
    if (t.status === 'running') base.state = 'running';
    else base.state = 'pending';
    return base;
  });
  const counts = { done: 0, running: 0, pending: 0, cancelled: 0 };
  tasks.forEach(t => counts[t.status]++);
  return { wave, dispatchedAt: batch.dispatchedAt, title: batch.title, now, counts, total: tasks.length, tasks };
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
        if (c.type === 'text' && c.text) events.push({ k: 'say', s: c.text.slice(0, 400) });
        else if (c.type === 'tool_use') {
          const i = c.input || {};
          const hint = i.file_path || i.command || i.description || i.pattern || i.url || '';
          events.push({ k: 'tool', s: `${c.name} ${String(hint).slice(0, 160)}` });
        }
      }
      if (j.type === 'result') events.push({ k: 'result', s: String(j.result || j.subtype || '').slice(0, 300) });
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

// ── API: dispatch ──
function dispatch(wave, code) {
  const batch = loadBatch(wave);
  const t = batch.tasks.find(x => x.code === code);
  if (!t) return { ok: false, error: 'task not found' };
  if (t.status !== 'pending') return { ok: false, error: `task status is ${t.status}, not pending` };
  t.status = 'running';
  t.dispatchedAt = new Date().toISOString();
  saveBatch(wave, batch);
  const cwdAbs = resolveCwd(t.cwd);
  fs.mkdirSync(path.dirname(logPath(wave, code)), { recursive: true });
  const child = spawn('powershell.exe', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', LAUNCHER,
    '-Code', code, '-Cwd', cwdAbs, '-ModelProfile', t.model,
    '-PromptFile', path.join(ROOT, 'batches', wave, t.promptFile),
    '-LogPath', logPath(wave, code),
  ], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  return { ok: true, pid: child.pid };
}

// ── 静态 ──
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json' };
function serveStatic(res, rel) {
  const p = path.join(ROOT, 'public', rel);
  if (!p.startsWith(path.join(ROOT, 'public'))) { res.writeHead(403); res.end(); return; }
  try {
    const data = fs.readFileSync(p);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('not found'); }
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(buildStatus(u.searchParams.get('wave') || 'wave1')));
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
        const { wave, code } = JSON.parse(body || '{}');
        out = dispatch(wave || 'wave1', code);
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

server.listen(PORT, '127.0.0.1', () => console.log(`agent-console: http://127.0.0.1:${PORT} (wave1)`));
