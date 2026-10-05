# 任务 SPECGM：games web-client 下一阶段 Spec 起草

一句话任务：为 games/asternova 的 web-client 起草下一阶段的 **Stage Spec 草案**（性能二期 + 内容化），落仓标注 DRAFT 待所有者评审。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\games`，AsterNova 游戏 monorepo。`asternova/web-client/`：Next.js + WASM 官网。
- 已知现状：2026-10-05 做过移动端性能优化（拆库懒加载，Perf 39 → 55+，commit `f84da63`，wave1 旧案）；ui-polish 有 S 系列台账（S5-S13 已归档）。
- ⚠️ 本仓有 **40 条用户未提交现场**——绝不回退/覆盖/混入；你只新增自己的文档文件并只 add 它。
- 方向种子（所有者给定，可交叉组织）：
  1. **性能二期**：Perf 55+ → 目标 70+；LCP/CLS 专项；WASM 资源按需加载策略
  2. **官网内容化**：开发日志/路线图/截图画廊/版本更新页——让官网从「壳」变成玩家会回访的地方（注意：主力客户端是 client-godot-v2，官网内容化服务于社区运营，不是游戏本体功能）
- backend 一期封存、client-godot 冻结——spec **不得**给它们派活。

## 步骤

1. 读仓根 README / CLAUDE.md / asternova/AGENTS.md / web-client 现状（结构与现有页面）。
2. 依方向种子展开：目标/非目标（明确排除 backend/godot）、FR/NFR（性能指标可量化）、AC、任务分解草案（依赖序）、风险与开放问题（留给所有者决策的点单独列）。
3. 落盘 `asternova/web-client/docs/` 或仓内惯例位置的新文件（如 `next-stage-perf-content.spec.md`），**头部标注 `status: DRAFT（待所有者评审，非实施指令）`**。
4. 提交：Conventional Commits 中英对照（例：`docs(spec): web-client 性能二期与内容化草案 / draft web-client perf2 & content spec`）。只 add 你的新文件。
5. 写报告。

## 红线

- **只新增文档**；40 条用户现场零接触；不 push。
- 草案非实施授权，不顺手实现；不派活给封存的 backend 和冻结的 client-godot。
- 引用现状必须来自仓内文档与代码结构，不臆造。Windows 11 + PowerShell。

## 验收标准

1. Spec 落盘且结构完整；`git show --stat HEAD` 仅含新文件。
2. `git status` 对比初始快照：40 条用户现场原样、无其他新增。
3. 报告含要点摘要 + 所有者决策点清单。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\SPECGM-report.md`

模板：`# SPECGM 结果报告` / `## 结论一句话` / `## Spec 要点摘要` / `## 留给所有者的决策点` / `## 提交` / `## 自评`
