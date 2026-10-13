# DEPLOY3 · 统一部署（前置：RB2/ANCHOR 已验收提交，PERFCAL 完成，主控放行）

## 提交链核对（部署前必须）
```
生产基线 7bee441 → Codex SVG 性能 ce0fc0c → 本轮小修（RB2 runbook / ANCHOR 锚点）
```
- `git log --oneline 7bee441..HEAD` 逐提交核对：无无关改动、无他人提交丢失
- origin/master 已含全部提交（主控已推送）；三端差异记录在案

## 部署（沿用已验证两次的路径）
读 `agent-hive/runs/reports/DEPLOY2-report.md` 操作要点（bundle 修 ref 备用、先停服后构建、
static 先拷再起服、journalctl+ps 实证停服窗口）。
1. 备份先行：SQLite 一致性快照（python3 backup API + 表 count 验证）+ 当前构建双包 + BUILD_ID/SHA
   标记——回滚引用本轮新备份目录（runbook 统一引用口径）
2. `scripts/deploy-portfolio-safe.sh`（Git Bash 执行）；跨境 fetch 失败按 SKILL bundle 手法
3. 服务器验证：三端 HEAD=最终 SHA、两处 BUILD_ID 一致且≠旧值、服务新进程、六幕标记、
   资产 Content-Type、公开 API、日志零 P2021/5xx
4. 停服窗口以 journalctl+ps 实证记录
5. 披露脚本自带的审计日志副作用（预期 +1 失败登录审计）

## 红线
只操作 portfolio-web；不覆盖 .env/DB/uploads；不 force push；schema 零变更（db push no-op 核对）

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\DEPLOY3-report.md`。
证据：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-closeout-2026-10-12/deploy/`
