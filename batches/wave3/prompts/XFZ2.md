# 任务 XFZ2：xiaofanzhuo DEPLOY §8 验收欠账处理

一句话任务：处理 `DEPLOY.md` §8 两项未勾验收的历史欠账——考古 2026-08-28 真机复验的实际覆盖面、对 PRD 22 条 AC 做只读核对；**有确凿证据才允许勾选，证据不足只在行内加注记**。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\xiaofanzhuo`，社区小饭桌点餐服务，**已上线** https://xiaofanzhuo.asterforge.top （2026-08-23 HTTPS 验收全绿，2026-08-28 微信真机复验通过）。
- 上一轮文档审计（报告 `agent-hive/runs/reports/XFZ-report.md`）发现 §8 两项未勾：
  1. `[ ] 微信内真机走完整一笔（含扫码付款 → 私信 → 核对全流程）`
  2. `[ ] PRD 22 条 AC 生产逐条勾检`
- 已知：8-28 复验「通过」但其覆盖面没有记录到上述字面标准（E2E 26 项 ≠ 逐条 AC 勾检；复验 ≠ 完整一笔含付款私信）。审计 agent 按保守红线未代勾，留待处理——就是本任务。
- 仓内相关材料：`docs/DEPLOY.md`、`docs/CHECKLIST-DEVICE.md`、`docs/PRD`、git 历史（8-23 / 8-28 前后的提交与验收记录）。

## 步骤

1. 读工作区规则 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`；`git status --porcelain` 记初始快照。
2. **考古覆盖面**：翻 8-28 前后的 git log / commit message / CHECKLIST-DEVICE / 其他 docs，还原真机复验当天实际测了什么、没测什么，形成「已覆盖 / 未覆盖」清单。
3. **AC 只读核对**：找到 PRD 的 22 条 AC，逐条对线上站点做**只读核对**（页面可达、展示正确、API 响应正常这类能远程验证的）；无法远程验证的（如微信付款私信流程）明确标「需人工」。核对表写进报告。
4. **处置 §8 两项**：
   - 若考古 + 核对凑出确凿证据满足某项字面标准 → 勾选并在行内注明证据出处；
   - 证据不足 → **保持未勾**，在行内加注记：已覆盖部分（引证据）+ 未覆盖部分（引本任务核对表编号）。
5. 提交：Conventional Commits 中英对照（例：`docs(deploy): §8 验收项覆盖面注记 / annotate §8 acceptance coverage`）。只 add 你动过的文件。
6. 写报告（见文末）。

## 红线

- **生产系统只读**：绝不创建/提交订单、绝不写任何业务数据、绝不触发付款流程；只允许 GET 页面与公开 API。
- **不代勾无证据项**——这是本任务的核心纪律，宁欠勿假。
- DEPLOY.md 是生产权威文档，改动**仅限 §8 相关行内注记**，其他章节不动。
- 不碰代码、`.env*`、`data/`；不 push；不装依赖。
- Windows 11 环境。

## 验收标准

1. 报告写入指定路径，含：覆盖面考古结论 / AC 22 条核对表（逐条：可核✓结果 / 需人工）/ §8 处置说明。
2. `git log --oneline -3` 可见 1 个 docs 类提交；`git diff HEAD~1` 仅触及 DEPLOY.md（及可能的注记附属）。
3. `git status` 对比初始快照无越界改动。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\XFZ2-report.md`

模板：`# XFZ2 结果报告` / `## 结论一句话` / `## 8-28 复验覆盖面考古` / `## AC 22 条核对表` / `## §8 处置与提交` / `## 需人工闭环的剩余项` / `## 自评`
