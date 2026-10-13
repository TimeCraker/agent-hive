# DEPLOY2 · 最终候选部署（前置：FIXUX/PERFF 已提交、门禁全绿、主控放行）

## 前置确认（主控已核）
- 发布候选 SHA = 主控告知（含 R1/R2 修复 + 批准的性能优化）；origin/master 已含该 SHA

## 流程（沿用 wave24 DEPLOY 已验证的路径，读其报告吸取实操要点）
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\DEPLOY-report.md`（bundle 修 ref 手法、
先停服后构建、两件套拷贝顺序、15 项验证矩阵）

1. **备份先行**：SQLite 一致性快照（python3 backup API + 表 count 验证）+ 当前构建双包 +
   BUILD_ID/SHA 标记，全部先于停服；回滚 runbook 用**新的仓库版**
   `docs/runbooks/rollback.md`（如 RUNBOOK 任务已合并）
2. 打包 4 项安全检查；跨境 fetch 失败按 SKILL 走 git bundle 修 ref（上次成功手法）
3. 部署：stop → build → 拷 static → start → etime 断言
4. **记录真实停服窗口**：以 journalctl 时间戳为准（上次教训：不写推断值当承诺）
5. 服务器验证矩阵（15 项同上次 + 本次三项修复的服务器侧确认）
6. 失败处置：构建失败不上线，用备份恢复旧构建并验证

## 红线
只操作 portfolio-web；不覆盖 .env/DB/uploads；不 force push；schema 零变更（db push 应 no-op，核对）；
密钥只引用路径。

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\DEPLOY2-report.md`。
证据：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-followup-2026-10-11/deploy/`
