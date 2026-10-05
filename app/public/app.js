// agent-console 前端：状态渲染 + 筛选 + 终端抽屉（stream-json 尾读）
let WAVE = new URLSearchParams(location.search).get('wave') || 'wave1';
let FILTER = 'all';
let DATA = null;
let OPEN_CODE = null;   // 终端抽屉当前打开的任务
let LOG_OFFSET = 0;     // 增量尾读偏移
let FOLLOW = true;      // 自动跟随滚动
let POLL_TIMER = null;

const STLBL = { running: '进行中', done: '已完成', pending: '排队中', cancelled: '已取消' };
const STCLR = { running: 'var(--st-running)', done: 'var(--st-done)', pending: 'var(--st-pending)', cancelled: 'var(--st-cancelled)' };
const fmtDur = s => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + '小时' + m + '分' : m + '分' + String(Math.floor(s % 60)).padStart(2, '0') + '秒' };
const fmtAgo = s => { if (s == null) return '—'; if (s < 60) return s + '秒前'; if (s < 3600) return Math.floor(s / 60) + '分钟前'; if (s < 86400) return Math.floor(s / 3600) + '小时前'; return Math.floor(s / 86400) + '天前' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── 状态渲染 ──
function render(d) {
  document.getElementById('disp').textContent = new Date(d.dispatchedAt).toLocaleString('zh-CN', { hour12: false });
  document.getElementById('clock').textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  document.getElementById('wavelbl').textContent = 'Wave ' + String(d.wave || WAVE).replace(/^wave/i, '');

  document.getElementById('s-done').textContent = d.counts.done;
  document.getElementById('s-running').textContent = d.counts.running + d.counts.pending;
  document.getElementById('s-pending').textContent = d.counts.pending;
  document.getElementById('s-cancelled').textContent = d.counts.cancelled;
  // 完成率口径：已取消不计入分母（取消=移出范围，不是未完成）
  const base = d.counts.done + d.counts.running + d.counts.pending;
  const pct = base ? Math.round(d.counts.done / base * 100) : 100;
  document.getElementById('pbar').innerHTML =
    '<i class="pb-done" style="width:' + (d.counts.done / base * 100) + '%"></i>' +
    '<i class="pb-running" style="width:' + (d.counts.running / base * 100) + '%"></i>' +
    '<i class="pb-pending" style="width:' + (d.counts.pending / base * 100) + '%"></i>';
  document.getElementById('pct').textContent = pct + '%';

  const tabs = [['all', '全部', d.total], ['running', '进行中', d.counts.running], ['waiting', '等待中', d.counts.waiting || 0], ['done', '已完成', d.counts.done], ['cancelled', '已取消', d.counts.cancelled]];
  document.getElementById('nav').innerHTML = tabs.map(t =>
    '<button class="tab tc' + ((FILTER === 'all' && t[0] === 'all') || FILTER === t[0] ? ' on' : '') + (t[2] === 0 ? ' zero' : '') + '" style="--tc:var(--st-' + t[0] + ', #111)" data-f="' + t[0] + '">'
    + '<span class="dot"></span>' + t[1] + '<span class="n">' + t[2] + '</span></button>'
  ).join('');
  document.querySelectorAll('#nav .tab').forEach(b => b.onclick = () => { FILTER = b.dataset.f; render(DATA); });

  const showMain = t => (t.status === 'running' || t.status === 'pending') && (FILTER === 'all' || FILTER === t.status);
  const mainTasks = d.tasks.filter(showMain);
  document.getElementById('mainSec').style.display = mainTasks.length ? 'block' : 'none';
  document.getElementById('mainSub').textContent = mainTasks.length + ' 个' + (mainTasks.some(t => t.legacy) ? ' · 含 legacy 会话（无流式日志，点行看文件活动信号）' : '');
  document.getElementById('rows').innerHTML = mainTasks.map(t => {
    const ago = fmtAgo(t.lastActivityAgo);
    const el = fmtDur(t.elapsed);
    const st = STLBL[t.status];
    const c = t.commit ? '<div class="kv" style="font-family:var(--mono);font-size:11px;color:var(--ink2)">&#9251; ' + esc(t.commit) + '</div>' : '';
    const tf = t.touched && t.touched.length ? '<div class="kv">&#9998; ' + t.touched.map(esc).join(' &nbsp; ') + '</div>' : '';
    const live = (t.events && t.events.length)
      ? '<div class="rc-live"><div class="lv-title">LIVE · 最近动作</div>' + t.events.map(e =>
          '<div class="lv-line"><b>' + (e.k === 'tool' ? '⚙' : '💬') + '</b> ' + esc(e.s).slice(0, 90) + '</div>').join('') + '</div>'
      : (t.legacy ? '<div class="rc-live"><div class="lv-title">LEGACY</div><div class="lv-line">旧版派发，无流式日志</div></div>' : '');
    const side = t.status === 'running'
      ? '<div class="rc-side"><span class="enter">查看终端 →</span><div class="meta">最后活动 ' + ago + '</div><div class="meta">已运行 ' + el + '</div></div>'
      : '<div class="rc-side"><span class="meta">等待派发</span></div>';
    return '<div class="rowt clickable' + (t.legacy ? ' legacy' : '') + '" data-code="' + t.code + '">'
      + '<div class="rcol rc-code"><span class="code">' + t.code + '</span><span class="st st-' + t.status + '">' + st + '</span></div>'
      + '<div class="rcol rc-main"><span class="tname">' + esc(t.name) + '</span><span class="goal">' + esc(t.goal) + '</span>' + c + tf + '</div>'
      + live + side + '</div>';
  }).join('') || '<div class="empty">当前筛选下无在办任务</div>';
  document.querySelectorAll('#rows .rowt.clickable').forEach(r => r.onclick = () => openTerminal(r.dataset.code));

  const archTasks = d.tasks.filter(t => t.status === 'done' || t.status === 'cancelled');
  document.getElementById('archSec').style.display = archTasks.length ? 'block' : 'none';
  document.getElementById('archSub').textContent = archTasks.length + ' 条（' + d.counts.done + ' 完成 · ' + d.counts.cancelled + ' 取消）';
  document.getElementById('archBody').innerHTML = archTasks.filter(t => FILTER === 'all' || FILTER === t.status).map(t =>
    '<div class="arow"><span class="code" style="font-family:var(--mono);font-size:17px;font-weight:700">' + t.code + '</span>'
    + '<span class="tname' + (t.status === 'cancelled' ? ' strike' : '') + '" style="font-size:13.5px;font-weight:600;margin-right:auto">' + esc(t.name) + '</span>'
    + '<span class="goal" style="font-size:11.5px;color:var(--ink2);max-width:42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.goal) + '</span>'
    + (t.status === 'done' ? '<span class="chip chip-done">已完成</span>' : '<span class="chip chip-cancelled">已取消</span>') + '</div>'
  ).join('') || '<div class="empty">无匹配条目</div>';

  const gitTasks = d.tasks.filter(t => (t.commits && t.commits.length)).sort((a, b) => b.commits[0].ts - a.commits[0].ts);
  document.getElementById('gitlist').innerHTML = gitTasks.map(t => {
    const rows = t.commits.slice(0, 4).map(c =>
      '<div class="cmt' + (c.kind === 'op' ? ' op' : '') + '">'
      + '<span class="w">' + fmtAgo(Math.floor((d.now - c.ts) / 1000)) + '</span>'
      + '<span class="s">' + esc(c.subject) + '</span>'
      + '<span class="h">' + c.h + '</span></div>'
    ).join('');
    return '<div class="pj"><div class="pj-head">'
      + '<span class="pj-dot" style="background:var(--st-' + (t.status === 'done' ? 'done' : 'running') + ')"></span>'
      + '<span class="pj-name">' + esc(t.name) + '</span>'
      + '<span class="pj-code">' + t.code + '</span>'
      + '<span class="pj-when">最近提交 ' + fmtAgo(Math.floor((d.now - t.commits[0].ts) / 1000)) + '</span>'
      + '</div><div class="pj-commits">' + rows + '</div></div>';
  }).join('') || '<div class="empty">暂无提交</div>';
}

// ── 终端抽屉 ──
// ── 终端抽屉 ──
// markdown-lite：标题/表格/代码/列表分层渲染（转义后最小转换，不做完整 md）
function mdInline(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
function mdBlock(s) {
  const out = [];
  for (const ln of s.split('\n')) {
    if (/^\s*#{1,6}\s/.test(ln)) out.push('<div class="mdh">' + mdInline(esc(ln.replace(/^\s*#+\s*/, ''))) + '</div>');
    else if (/^\s*\|/.test(ln)) out.push('<div class="mdtbl">' + esc(ln) + '</div>');
    else if (/^\s*[-*]\s/.test(ln)) out.push('<div class="li">' + mdInline(esc(ln.replace(/^\s*[-*]\s/, ''))) + '</div>');
    else if (ln.trim() === '') out.push('<div class="sp"></div>');
    else out.push('<div class="tx">' + mdInline(esc(ln)) + '</div>');
  }
  return out.join('');
}
function openTerminal(code) {
  OPEN_CODE = code; LOG_OFFSET = 0; FOLLOW = true;
  const t = DATA.tasks.find(x => x.code === code);
  document.getElementById('d-code').textContent = code;
  document.getElementById('d-st').textContent = STLBL[t.status] + ' · ' + fmtDur(t.elapsed);
  document.getElementById('d-model').textContent = t.model;
  document.getElementById('d-goal').textContent = '目标：' + t.goal;
  document.getElementById('d-term').innerHTML = '';
  document.getElementById('drawer').classList.add('open');
  document.getElementById('d-follow').textContent = '● 自动跟随';
  pollLog();
  if (!POLL_TIMER) POLL_TIMER = setInterval(() => { if (OPEN_CODE) pollLog(); }, 1500);
}
function closeTerminal() {
  OPEN_CODE = null;
  document.getElementById('drawer').classList.remove('open');
  clearInterval(POLL_TIMER); POLL_TIMER = null;
}
async function pollLog() {
  if (!OPEN_CODE) return;
  try {
    const r = await fetch(`/api/logs/${OPEN_CODE}?since=${LOG_OFFSET}&wave=${WAVE}`);
    const d = await r.json();
    if (!d.exists) { document.getElementById('d-bytes').textContent = '日志未生成（claude 启动后此处实时滚动）'; return; }
    LOG_OFFSET = d.bytes;
    const term = document.getElementById('d-term');
    const stick = FOLLOW;
    for (const e of d.events) {
      const div = document.createElement('div');
      if (e.k === 'say') {
        // assistant 文本：markdown-lite 分层渲染
        div.className = 'md';
        div.innerHTML = mdBlock(e.s);
      } else {
        div.className = 'ln t-' + e.k;
        div.innerHTML = '<span class="tm">' + new Date().toLocaleTimeString('zh-CN', { hour12: false }) + '</span>' + esc(e.s);
      }
      term.appendChild(div);
    }
    if (d.events.length && stick) term.scrollTop = term.scrollHeight;
    document.getElementById('d-bytes').textContent = LOG_OFFSET + ' B 已读';
    const t = DATA.tasks.find(x => x.code === OPEN_CODE);
    if (t) document.getElementById('d-st').textContent = STLBL[t.status] + ' · ' + fmtDur(t.elapsed);
  } catch (e) { /* 网络抖动，下轮再试 */ }
}

// ── 事件绑定 ──
document.getElementById('d-close').onclick = closeTerminal;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTerminal(); });
document.getElementById('d-term').addEventListener('scroll', () => {
  const t = document.getElementById('d-term');
  const atBottom = t.scrollHeight - t.scrollTop - t.clientHeight < 40;
  FOLLOW = atBottom;
  document.getElementById('d-follow').textContent = FOLLOW ? '● 自动跟随' : '⏸ 已暂停跟随';
});
document.getElementById('git-refresh-btn').onclick = async function () {
  this.classList.add('spinning');
  this.textContent = '⟳ 刷新中…';
  await refresh();
  this.classList.remove('spinning');
  this.textContent = '⟳ 已刷新 ' + new Date().toLocaleTimeString('zh-CN', { hour12: false });
  document.getElementById('git-auto').textContent = '自动刷新 · 5 秒';
};

// ── 主循环 ──
async function refresh() {
  try {
    const r = await fetch('/api/status?wave=' + WAVE);
    DATA = await r.json();
    render(DATA);
  } catch (e) { document.getElementById('clock').textContent = '连接中断'; }
}
refresh(); setInterval(refresh, 5000);
