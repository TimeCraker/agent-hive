// agent-console 前端：状态渲染 + 筛选 + 终端抽屉（stream-json 尾读）
let WAVE = 'wave1';
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
  document.getElementById('wtitle').textContent = '／ ' + (d.title || d.wave);
  document.getElementById('disp').textContent = '已完成 ' + d.counts.done + '/' + d.total;
  document.getElementById('clock').textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });

  document.getElementById('progtext').innerHTML =
    '<b>' + d.counts.done + '/' + d.total + '</b> 已完成 · <b>' + (d.counts.running + d.counts.pending) + '</b> 在办' +
    (d.counts.cancelled ? ' · <b>' + d.counts.cancelled + '</b> 已取消' : '');
  document.getElementById('pbar').innerHTML =
    '<i class="pb-done" style="width:' + (d.counts.done / d.total * 100) + '%"></i>' +
    '<i class="pb-running" style="width:' + (d.counts.running / d.total * 100) + '%"></i>' +
    '<i class="pb-pending" style="width:' + (d.counts.pending / d.total * 100) + '%"></i>' +
    '<i class="pb-cancelled" style="width:' + (d.counts.cancelled / d.total * 100) + '%"></i>';

  const tabs = [['all', '全部', d.total], ['running', '进行中', d.counts.running], ['done', '已完成', d.counts.done], ['cancelled', '已取消', d.counts.cancelled]].filter(x => x[2] > 0);
  document.getElementById('nav').innerHTML = tabs.map(t =>
    '<button class="tab' + (FILTER === t[0] ? ' on' : '') + (t[0] === 'all' ? '' : ' tc') + '" style="--tc:var(--st-' + t[0] + ')" data-f="' + t[0] + '">' + t[1] + '<span class="n">' + t[2] + '</span></button>'
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

  const gitTasks = d.tasks.filter(t => t.commit).sort((a, b) => (b.reportMtime || 0) - (a.reportMtime || 0));
  document.getElementById('gitlist').innerHTML = gitTasks.map(t =>
    '<div class="pj"><div class="pj-head">'
    + '<span class="pj-dot" style="background:var(--st-' + (t.status === 'done' ? 'done' : 'running') + ')"></span>'
    + '<span class="pj-name">' + esc(t.name) + '</span>'
    + '<span class="pj-code">' + t.code + '</span>'
    + '<span class="pj-when">' + esc(t.commit) + '</span>'
    + '</div></div>'
  ).join('') || '<div class="empty">暂无提交</div>';
}

// ── 终端抽屉 ──
function openTerminal(code) {
  OPEN_CODE = code; LOG_OFFSET = 0; FOLLOW = true;
  const t = DATA.tasks.find(x => x.code === code);
  document.getElementById('d-code').textContent = code;
  document.getElementById('d-st').textContent = STLBL[t.status] + ' · ' + fmtDur(t.elapsed);
  document.getElementById('d-model').textContent = t.model;
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
    if (!d.exists) { document.getElementById('d-bytes').textContent = '日志未生成'; return; }
    LOG_OFFSET = d.bytes;
    const term = document.getElementById('d-term');
    const stick = FOLLOW;
    for (const e of d.events) {
      const div = document.createElement('div');
      div.className = 'ln t-' + e.k;
      div.innerHTML = '<span class="tm">' + new Date().toLocaleTimeString('zh-CN', { hour12: false }) + '</span>' + esc(e.s);
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

// ── 主循环 ──
async function refresh() {
  try {
    const r = await fetch('/api/status?wave=' + WAVE);
    DATA = await r.json();
    render(DATA);
  } catch (e) { document.getElementById('clock').textContent = '连接中断'; }
}
refresh(); setInterval(refresh, 5000);
