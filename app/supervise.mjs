#!/usr/bin/env node
// agent-hive 主脑巡检脚本 (Master Agent Supervise Tool)
// 用法: node app/supervise.mjs [--wave <wave>] [--json]
// 功能: 一键巡检波次状态，分类待验收、异常失败、在跑任务，并输出主脑自治动作建议与升级求助提醒。
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const APP = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(APP);

const args = process.argv.slice(2);
function getArg(flag, def = '') {
  const idx = args.indexOf(flag);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
}
const isJson = args.includes('--json');
let wave = getArg('--wave');

function getWavesRoot() {
  const primary = path.join(ROOT, 'waves');
  if (fs.existsSync(primary)) return primary;
  const legacy = path.join(ROOT, 'batches');
  return fs.existsSync(legacy) ? legacy : primary;
}

if (!wave) {
  const scanDir = getWavesRoot();
  try {
    const dirs = fs.readdirSync(scanDir, { withFileTypes: true }).filter(d => d.isDirectory());
    wave = dirs.length > 0 ? dirs[0].name : 'template';
  } catch (e) { wave = 'template'; }
}

async function fetchFromHttp() {
  return new Promise((resolve, reject) => {
    const port = Number(process.env.PORT || 17879);
    const req = http.get(`http://127.0.0.1:${port}/api/supervise?wave=${encodeURIComponent(wave)}`, { timeout: 1500 }, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function readFromDisk() {
  const wavePath = path.join(getWavesRoot(), wave);
  const batchFile = path.join(wavePath, 'batch.json');
  if (!fs.existsSync(batchFile)) {
    throw new Error(`波次配置文件不存在: ${batchFile}`);
  }
  const b = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
  const counts = {};
  for (const t of b.tasks || []) counts[t.status] = (counts[t.status] || 0) + 1;
  const audit = {
    ok: true,
    wave,
    title: b.title || '',
    now: Date.now(),
    counts,
    total: (b.tasks || []).length,
    needAcceptance: [],
    blockedOrFailed: [],
    runningOrQueued: [],
    recommendations: []
  };

  for (const t of b.tasks || []) {
    const repPath = path.join(wavePath, 'reports', `${t.code}-report.md`);
    const hasReport = fs.existsSync(repPath);
    if (t.status === 'reported') {
      audit.needAcceptance.push({
        code: t.code,
        name: t.name,
        goal: t.goal,
        turns: t.turns,
        costUsd: t.costUsd,
        hasReport,
        reportPath: repPath
      });
      audit.recommendations.push({
        code: t.code,
        action: 'accept-review',
        level: 'minor',
        hint: `任务 [${t.code}] 待验收，主脑核对报告后可调用 /api/accept 确认`
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
              ? `任务 [${t.code}] 异常 (${t.failReason || t.rejectReason || '未达标'})，主脑可续派自动修复`
              : `任务 [${t.code}] 已达最大续派深度或无会话，需升级请示用户`)
      });
    } else if (t.status === 'running' || t.status === 'queued') {
      audit.runningOrQueued.push({
        code: t.code,
        name: t.name,
        status: t.status,
        cwd: t.cwd,
        queueReason: t.queueReason,
        queueDetail: t.queueDetail
      });
    }
  }
  return audit;
}

async function run() {
  let audit;
  try {
    audit = await fetchFromHttp();
  } catch (e) {
    audit = readFromDisk();
  }

  if (isJson) {
    console.log(JSON.stringify(audit, null, 2));
    return;
  }

  console.log(`\n================================================================`);
  console.log(`太木控制台 · 主脑巡检报表 (Wave: ${audit.wave})`);
  console.log(`标题: ${audit.title}`);
  console.log(`进度: 总任务 ${audit.total} | 已验收 ${audit.counts.accepted || 0} | 待验收 ${audit.counts.reported || 0} | 在办 ${((audit.counts.running || 0) + (audit.counts.queued || 0) + (audit.counts.pending || 0))} | 失败 ${audit.counts.failed || 0}`);
  console.log(`================================================================\n`);

  if (audit.needAcceptance.length > 0) {
    console.log(`【待验收任务 (需要主脑核查报告)】:`);
    for (const t of audit.needAcceptance) {
      console.log(`  - [${t.code}] ${t.name} (报告: ${t.hasReport ? '已就绪' : '缺失'})`);
      console.log(`    验收目标: ${t.goal}`);
      console.log(`    报告路径: ${t.reportPath}`);
    }
    console.log();
  }

  if (audit.blockedOrFailed.length > 0) {
    console.log(`【异常与失败任务 (自治修复 / 升级决策)】:`);
    for (const t of audit.blockedOrFailed) {
      const tag = t.isMajorBlocker ? '【重大阻碍·须请示用户】' : (t.canAutoResume ? '【常规异常·主脑可自愈】' : '【已达重试上限】');
      console.log(`  - [${t.code}] ${t.name} -> 状态: ${t.status} ${tag}`);
      console.log(`    原因: ${t.failReason || t.rejectReason || '未知'}`);
      console.log(`    续派次数: ${t.resumeCount}/3`);
    }
    console.log();
  }

  if (audit.runningOrQueued.length > 0) {
    console.log(`【在办与排队中任务】:`);
    for (const t of audit.runningOrQueued) {
      const q = t.queueDetail ? `(${t.queueDetail})` : '';
      console.log(`  - [${t.code}] ${t.name} -> ${t.status} ${q} (cwd: ${t.cwd})`);
    }
    console.log();
  }

  if (audit.recommendations.length > 0) {
    console.log(`【主脑动作建议】:`);
    for (const r of audit.recommendations) {
      const prefix = r.level === 'major' ? '🚨 [MAJOR]' : '💡 [AUTO] ';
      console.log(`  ${prefix} ${r.hint}`);
    }
    console.log();
  }
}

run().catch(err => {
  console.error('巡检出错:', err.message);
  process.exit(1);
});
