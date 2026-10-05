// agent-hive 前端：验收状态机渲染 + 筛选 + 终端抽屉 + 验收/打回/续派/结束
let WAVE = new URLSearchParams(location.search).get('wave') || 'wave1';
let FILTER = 'all';
let DATA = null;
let OPEN_CODE = null;   // 终端抽屉当前打开的任务
let LOG_OFFSET = 0;     // 增量尾读偏移
let FOLLOW = true;      // 自动跟随滚动
let POLL_TIMER = null;

const STLBL = { running: '进行中', queued: '排队中', pending: '待派发', reported: '待验收', accepted: '已验收', rejected: '已打回', failed: '失败', done: '已完成', cancelled: '已取消' };
const fmtDur = s => { s = Math.max(0, s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + '小时' + m + '分' : m + '分' + String(Math.floor(s % 60)).padStart(2, '0') + '秒' };
const fmtAgo = s => { if (s == null) return '—'; if (s < 60) return s + '秒前'; if (s < 3600) return Math.floor(s / 60) + '分钟前'; if (s < 86400) return Math.floor(s / 3600) + '小时前'; return Math.floor(s / 86400) + '天前' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isGreen = t => t.status === 'accepted' || t.status === 'done';
const isBad = t => t.status === 'failed' || t.status === 'rejected';
const isLive = t => t.status === 'running' || t.status === 'queued' || t.status === 'pending';

async function api(path, body) {
  try {
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    return await r.json();
  } catch (e) { return { ok: false, error: String(e.message || e) }; }
}

// ── 状态渲染 ──
const TABCLR = { all: '#111111', running: 'var(--st-running)', reported: 'var(--st-reported)', accepted: 'var(--st-accepted)', failed: 'var(--st-failed)', cancelled: 'var(--st-cancelled)' };
function matchTab(t) {
  return FILTER === 'all'
    || (FILTER === 'running' && isLive(t))
    || (FILTER === 'reported' && t.status === 'reported')
    || (FILTER === 'accepted' && isGreen(t))
    || (FILTER === 'failed' && isBad(t))
    || (FILTER === 'cancelled' && t.status === 'cancelled');
}
function render(d) {
  document.getElementById('disp').textContent = new Date(d.dispatchedAt).toLocaleString('zh-CN', { hour12: false });
  document.getElementById('clock').textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  document.getElementById('wavelbl').textContent = 'Wave ' + String(d.wave || WAVE).replace(/^wave/i, '');

  const c = d.counts || {};
  const green = (c.accepted || 0) + (c.done || 0);
  const reported = c.reported || 0;
  const bad = (c.failed || 0) + (c.rejected || 0);
  const running = c.running || 0;
  const wait = (c.queued || 0) + (c.pending || 0);
  const cancelled = c.cancelled || 0;
  document.getElementById('s-running').textContent = running + wait;   // 进行中 = running + queued + pending（与 Tab 口径一致）
  document.getElementById('s-reported').textContent = reported;
  document.getElementById('s-accepted').textContent = green;
  document.getElementById('s-failed').textContent = bad;
  document.getElementById('s-cancelled').textContent = cancelled;
  // 完成率口径：已验收 ÷（全部 − 已取消）；黄=待验收 蓝=进行中 红=失败 灰=排队
  const base = Math.max(1, d.total - cancelled);
  document.getElementById('pbar').innerHTML =
    '<i class="pb-accepted" style="width:' + (green / base * 100) + '%"></i>' +
    '<i class="pb-reported" style="width:' + (reported / base * 100) + '%"></i>' +
    '<i class="pb-running" style="width:' + (running / base * 100) + '%"></i>' +
    '<i class="pb-failed" style="width:' + (bad / base * 100) + '%"></i>' +
    '<i class="pb-pending" style="width:' + (wait / base * 100) + '%"></i>';
  document.getElementById('pct').textContent = Math.round(green / base * 100) + '%';

  const tabs = [['all', '全部', d.total], ['running', '进行中', running + wait], ['reported', '待验收', reported], ['accepted', '已验收', green], ['failed', '失败', bad], ['cancelled', '已取消', cancelled]];
  document.getElementById('nav').innerHTML = tabs.map(([k, lbl, n]) =>
    '<button class="tab tc' + (FILTER === k ? ' on' : '') + (n === 0 ? ' dim' : '') + '" style="--tc:' + TABCLR[k] + '" data-f="' + k + '">'
    + '<span class="dot"></span>' + lbl + '<span class="n">' + n + '</span></button>'
  ).join('');
  document.querySelectorAll('#nav .tab').forEach(b => b.onclick = () => { FILTER = b.dataset.f; render(DATA); });

  const mainTasks = d.tasks.filter(t => isLive(t) && matchTab(t));
  document.getElementById('mainSec').style.display = mainTasks.length ? 'block' : 'none';
  document.getElementById('mainSub').textContent = mainTasks.length + ' 个' + (d.maxConcurrent ? ' · 并发上限 ' + d.maxConcurrent : '') + (mainTasks.some(t => t.legacy) ? ' · 含 legacy 会话（无流式日志）' : '');
  document.getElementById('rows').innerHTML = mainTasks.map(t => {
    const ago = fmtAgo(t.lastActivityAgo);
    const el = fmtDur(t.elapsed);
    const staleF = t.stale ? '<span class="staleflag">⚠ 停更 ' + fmtDur(t.staleFor) + '</span>' : '';
    // 元信息收敛为一行：提交 · 触达文件数 · 模型（替代散落的多行 mono）
    const metaBits = [];
    if (t.commit && t.commit.subject) metaBits.push('<span class="mb">&#9251; ' + esc(String(t.commit.subject).slice(0, 40)) + '</span>');
    if (t.touched && t.touched.length) metaBits.push('<span class="mb">&#9998; ' + t.touched.length + ' 文件</span>');
    if (t.model) metaBits.push('<span class="mb">' + esc(t.model) + '</span>');
    const metaRow = metaBits.length ? '<div class="meta-row">' + metaBits.join('<span class="msep">·</span>') + '</div>' : '';
    // 实时预览列每行都渲染（列宽固定，行行对齐）；无事件时显示占位
    const last = t.events && t.events.length ? [...t.events].reverse().find(e => e.s != null) : null;
    let liveInner;
    if (last) liveInner = '<div class="lv-title">LIVE</div><div class="lv-line"><b>' + (last.k === 'tool' ? '⚙' : '💬') + '</b> ' + esc(last.s).slice(0, 80) + '</div>';
    else if (t.legacy) liveInner = '<div class="lv-title">LEGACY</div><div class="lv-line">旧版派发，无流式日志</div>';
    else liveInner = '<div class="lv-title">LIVE</div><div class="lv-line">—</div>';
    const live = '<div class="rc-live">' + liveInner + '</div>';
    const side = t.status === 'running'
      ? '<div class="rc-side"><span class="enter">查看终端 →</span><div class="meta">最后活动 ' + ago + ' · 已运行 ' + el + '</div>'
        + '<div class="meta" style="display:flex;gap:6px;margin-top:6px"><button class="act danger" data-act="kill" data-code="' + t.code + '">⏹ 强制结束</button></div></div>'
      : t.status === 'queued'
        ? '<div class="rc-side"><span class="meta">排队中 · 并发满自动补位</span></div>'
        : '<div class="rc-side"><span class="meta">等待派发</span></div>';
    return '<div class="rowt clickable' + (t.legacy ? ' legacy' : '') + '" data-code="' + t.code + '">'
      + '<div class="rcol rc-code"><span class="code">' + t.code + '</span><span class="st st-' + t.status + '">' + (STLBL[t.status] || t.status) + '</span>' + staleF + '</div>'
      + '<div class="rcol rc-main"><span class="tname">' + esc(t.name) + '</span><span class="goal">' + esc(t.goal) + '</span>' + metaRow + '</div>'
      + live + side + '</div>';
  }).join('') || '<div class="empty">当前筛选下无在办任务</div>';
  document.querySelectorAll('#rows .rowt.clickable').forEach(r => r.onclick = () => openTerminal(r.dataset.code));

  const archTasks = d.tasks.filter(t => !isLive(t));
  document.getElementById('archSec').style.display = archTasks.length ? 'block' : 'none';
  document.getElementById('archSub').textContent = archTasks.length + ' 条（已验收 ' + green + ' · 待验收 ' + reported + ' · 失败 ' + bad + ' · 取消 ' + cancelled + '）';
  document.getElementById('archBody').innerHTML = archTasks.filter(matchTab).map(t => {
    let chip = '', acts = '';
    if (t.status === 'accepted') chip = '<span class="chip chip-accepted">已验收</span>';
    else if (t.status === 'done') chip = '<span class="chip chip-done">已完成</span>';
    else if (t.status === 'reported') {
      chip = '<span class="chip chip-reported">待验收</span>';
      acts = '<button class="act good" data-act="accept" data-code="' + t.code + '">✓ 验收</button><button class="act danger" data-act="reject" data-code="' + t.code + '">✗ 打回</button>';
    } else if (t.status === 'rejected') {
      chip = '<span class="chip chip-bad">已打回</span>';
      acts = '<button class="act" data-act="resume" data-code="' + t.code + '">▶ 续派重做</button>';
    } else if (t.status === 'failed') {
      chip = '<span class="chip chip-bad" title="' + esc(t.failReason || '') + '">失败</span>';
      acts = '<button class="act" data-act="retry" data-code="' + t.code + '">↻ 重跑</button>'
        + (t.sessionId ? '<button class="act" data-act="resume" data-code="' + t.code + '">▶ 续派</button>' : '');
    } else chip = '<span class="chip chip-cancelled">已取消</span>';
    return '<div class="arow"><span class="code" style="font-family:var(--mono);font-size:17px;font-weight:700">' + t.code + '</span>'
      + '<span class="tname' + (t.status === 'cancelled' ? ' strike' : '') + '" style="font-size:13.5px;font-weight:600;margin-right:auto">' + esc(t.name) + '</span>'
      + '<span class="goal" style="font-size:11.5px;color:var(--ink2);max-width:34%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.goal) + '</span>'
      + acts + chip + '</div>';
  }).join('') || '<div class="empty">无匹配条目</div>';
  bindActs();

  // Git 动态按实际仓库去重：同 cwd 的多个任务共用一份提交历史，合并为一组（组名 = 仓库目录名）
  const repoMap = new Map();
  for (const t of d.tasks) {
    if (!t.commits || !t.commits.length) continue;
    const key = t.cwd || t.code;
    const cur = repoMap.get(key);
    if (!cur) { repoMap.set(key, { rep: t, codes: [t.code] }); continue; }
    cur.codes.push(t.code);
    if ((t.commits[0]?.ts || 0) > (cur.rep.commits[0]?.ts || 0)) cur.rep = t;
  }
  const gitTasks = [...repoMap.values()].sort((a, b) => (b.rep.commits[0]?.ts || 0) - (a.rep.commits[0]?.ts || 0));
  document.getElementById('gitlist').innerHTML = gitTasks.map(g => {
    const t = g.rep;
    const repoName = String(t.cwd || t.code).replace(/[\\/]+$/, '').split(/[\\/]/).pop() || t.code;
    const rows = t.commits.slice(0, 4).map(cm =>
      '<div class="cmt' + (cm.kind === 'op' ? ' op' : '') + '">'
      + '<span class="w">' + fmtAgo(Math.floor((d.now - cm.ts) / 1000)) + '</span>'
      + '<span class="s">' + esc(cm.subject) + '</span>'
      + '<span class="h">' + cm.h + '</span></div>'
    ).join('');
    return '<div class="pj"><div class="pj-head">'
      + '<span class="pj-dot" style="background:var(--st-' + (isGreen(t) ? 'accepted' : 'running') + ')"></span>'
      + '<span class="pj-name">' + esc(repoName) + '</span>'
      + '<span class="pj-code">' + g.codes.join(' · ') + '</span>'
      + '<span class="pj-when">最近提交 ' + fmtAgo(Math.floor((d.now - t.commits[0].ts) / 1000)) + '</span>'
      + '</div><div class="pj-commits">' + rows + '</div></div>';
  }).join('') || '<div class="empty">暂无提交</div>';
}

// ── 行内操作：验收 / 打回 / 续派 / 重跑 / 强制结束 ──
function bindActs() {
  document.querySelectorAll('[data-act]').forEach(b => b.onclick = e => { e.stopPropagation(); doAction(b.dataset.act, b.dataset.code); });
}
async function doAction(act, code) {
  if (act === 'accept') {
    if (!confirm('验收通过 ' + code + '？（绿色终态封档）')) return;
    const r = await api('/api/accept', { wave: WAVE, code, verdict: 'accept' });
    if (!r.ok) alert(r.error);
  } else if (act === 'reject') {
    const note = prompt('打回 ' + code + ' 的理由（将作为续派提示词）：');
    if (!note || !note.trim()) return;
    const r = await api('/api/accept', { wave: WAVE, code, verdict: 'reject', note });
    if (!r.ok) alert(r.error);
  } else if (act === 'resume') {
    const t = (DATA.tasks || []).find(x => x.code === code) || {};
    const p = prompt('续派指令（派回原会话 ' + String(t.sessionId || '').slice(0, 8) + '）：', t.rejectNote || '');
    if (!p || !p.trim()) return;
    const r = await api('/api/dispatch', { wave: WAVE, code, resume: true, prompt: p });
    if (!r.ok) alert(r.error); else if (r.queued) alert('并发满员，已转入排队，exit 自动补位');
  } else if (act === 'retry') {
    if (!confirm('整档重跑 ' + code + '？（全新会话，日志重写）')) return;
    const r = await api('/api/dispatch', { wave: WAVE, code });
    if (!r.ok) alert(r.error);
  } else if (act === 'kill') {
    if (!confirm('强制结束 ' + code + ' 的会话进程树？（仅挂死时使用）')) return;
    const r = await api('/api/kill', { wave: WAVE, code });
    if (!r.ok) alert(r.error);
  }
  refresh();
}

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
  OPEN_CODE = code; LOG_OFFSET = 0; FOLLOW = true; lastTool = null;
  LEDGER = { turns: 0, tools: 0 };
  const t = DATA.tasks.find(x => x.code === code);
  document.getElementById('d-code').textContent = code;
  document.getElementById('d-name').textContent = t.name;
  const stEl = document.getElementById('d-st');
  stEl.className = 'st stpill-' + t.status;
  stEl.textContent = (STLBL[t.status] || t.status) + ' · ' + fmtDur(t.elapsed);
  document.getElementById('d-model').textContent = t.model;
  document.getElementById('d-sid').textContent = t.sessionId ? 'session ' + String(t.sessionId).slice(0, 8) : '';
  document.getElementById('d-goal').textContent = '目标：' + t.goal;
  document.getElementById('d-term').innerHTML = '';
  document.getElementById('d-bytes').textContent = '';
  document.getElementById('drawer').classList.add('open');
  document.getElementById('scrim').classList.add('open');
  document.getElementById('d-follow').textContent = '● 自动跟随';
  pollLog();
  if (!POLL_TIMER) POLL_TIMER = setInterval(() => { if (OPEN_CODE) pollLog(); }, 1500);
}
function closeTerminal() {
  OPEN_CODE = null;
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('scrim').classList.remove('open');
  clearInterval(POLL_TIMER); POLL_TIMER = null;
}
async function pollLog() {
  if (!OPEN_CODE) return;
  try {
    const r = await fetch(`/api/logs/${encodeURIComponent(OPEN_CODE)}?since=${LOG_OFFSET}&wave=${encodeURIComponent(WAVE)}`);
    const d = await r.json();
    if (!d.exists) { document.getElementById('d-bytes').textContent = '日志未生成（claude 启动后此处实时滚动）'; return; }
    LOG_OFFSET = d.bytes;
    const term = document.getElementById('d-term');
    const stick = FOLLOW;
    for (const e of d.events) {
      if (e.k === 'usage') continue;   // usage 遥测不再逐事件渲染（台账在 result 收档）
      const div = document.createElement('div');
      div.classList.add('fade-in');
      if (e.k === 'say') {
        // assistant 文本：markdown-lite 分层渲染
        div.className += ' md';
        div.innerHTML = mdBlock(e.s);
        lastTool = null;   // 文本打断工具连击分组
        LEDGER.turns++;
      } else if (e.k === 'tool') {
        // 工具行 v4：紧凑单行 + 连续重复合并 ×N
        const sp = e.s.indexOf(' ');
        const tool = sp < 0 ? e.s : e.s.slice(0, sp);
        let hint = sp < 0 ? '' : e.s.slice(sp + 1);
        if (/^(Write|Edit|Read|NotebookEdit|MultiEdit)$/i.test(tool)) hint = hint.replace(/^.*[\\/]/, '');
        else if (hint.length > 72) hint = hint.slice(0, 36) + ' … ' + hint.slice(-30);
        LEDGER.tools++;
        if (lastTool && lastTool.tool === tool && lastTool.hint === hint) {
          lastTool.n++;
          lastTool.el.querySelector('.tn').textContent = '×' + lastTool.n;
          continue;
        }
        div.className += ' ln t-tool';
        div.innerHTML = '<span class="tbadge">' + esc(tool) + '</span><span class="thint">' + esc(hint) + '</span><span class="tn"></span>';
        term.appendChild(div);
        lastTool = { tool, hint, n: 1, el: div };
        continue;
      } else {
        div.className += ' ln t-' + e.k;
        div.innerHTML = '<span class="tm">' + new Date().toLocaleTimeString('zh-CN', { hour12: false }) + '</span>' + esc(e.s);
        lastTool = null;
      }
      term.appendChild(div);
    }
    if (d.events.length && stick) term.scrollTop = term.scrollHeight;
    const t = DATA.tasks.find(x => x.code === OPEN_CODE);
    if (t) {
      const stEl = document.getElementById('d-st');
      stEl.className = 'st stpill-' + t.status;
      stEl.textContent = (STLBL[t.status] || t.status) + ' · ' + fmtDur(t.elapsed);
      updateUsageFooter(t);
    }
  } catch (e) { /* 网络抖动，下轮再试 */ }
}
// 会话台账 footer（DSH 风格）——两阶段：运行中显示实时轮数/动作数（真实事件计数），收档后升级为真实 tok/成本全台账
let lastTool = null;   // 工具连击分组状态（tool+hint 相同的连续行合并 ×N）
let LEDGER = { turns: 0, tools: 0 };
const fmtTok = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n ?? 0);
function updateUsageFooter(t) {
  if (!t) return;
  const bits = [];
  if (t.turns != null) {
    // 收档台账：轮数 + 输出 tok + tok/s + 成本（真实数）
    bits.push('⟳ ' + t.turns + ' 轮');
    if (t.outTok != null) {
      bits.push(fmtTok(t.outTok) + ' tok');
      if (t.elapsed > 0) bits.push(Math.round(t.outTok / t.elapsed) + ' tok/s');
    }
    if (t.costUsd != null) bits.push('$' + t.costUsd.toFixed(2));
  } else {
    // 运行中：实时事件计数（zhipu 端点流内无 usage，tok 数收档后才有）
    if (LEDGER.turns) bits.push('⟳ ' + LEDGER.turns + ' 轮');
    if (LEDGER.tools) bits.push(LEDGER.tools + ' 动作');
  }
  document.getElementById('d-bytes').textContent = bits.join(' · ');
}

// ── 事件绑定 ──
document.getElementById('d-close').onclick = closeTerminal;
document.getElementById('scrim').onclick = closeTerminal;
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
  document.getElementById('git-auto').textContent = 'SSE 实时更新';
};

// ── 主循环：SSE 实时推送（2s 心跳走秒 + batch 变化即时推），轮询 30s 兜底 ──
async function refresh() {
  try {
    const r = await fetch('/api/status?wave=' + encodeURIComponent(WAVE));
    DATA = await r.json();
    render(DATA);
  } catch (e) { document.getElementById('clock').textContent = '连接中断'; }
}
refresh();
try {
  const es = new EventSource('/api/events?wave=' + encodeURIComponent(WAVE));
  es.onmessage = ev => { try { DATA = JSON.parse(ev.data); render(DATA); } catch (e) { /* 心跳外杂音 */ } };
  es.onerror = () => { document.getElementById('live-dot')?.classList.add('reconnecting'); };
  es.onopen = () => { document.getElementById('live-dot')?.classList.remove('reconnecting'); };
} catch (e) { setInterval(refresh, 5000); }   // EventSource 不可用时退回轮询
setInterval(refresh, 30000);                    // 慢速兜底（SSE 静默断连时保底）
