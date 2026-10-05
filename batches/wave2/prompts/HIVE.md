# 任务 HIVE：agent-hive 文档自审计

一句话任务：核对 agent-hive 仓三篇核心文档（README.md / AGENTS.md / docs/design.md）与代码实际的一致性，更正确凿失真。**这是正在运行派发任务的生产工具仓，改动范围从严：只许动这三篇文档本身。**

## 背景（已核实事实，勿重新考古）

- 本仓是 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive`，并行派发控制台（把任务包分发给多个 Claude Code 无头会话）。Node 原生零依赖 + vanilla JS 前端。
- ⚠️ **此刻第二波（wave2）正在本仓运行**：`batches/wave2/`、`runs/` 会被服务进程持续写入，`batch.json` 里状态会实时变化——这些都是**运行时数据，绝对不动**。
- 关键事实（2026-10-05 核实，供你核对文档用）：
  - 端口：`app/server.mjs` 默认 **17879**，README 快速上手示例用 `$env:PORT=17878` 启动——两者口径可在文档里写得更清楚（默认值 vs 示例值）。
  - wave1 batch.json 实际出现过模板之外的字段：任务级 `legacy`、`commit`、`remote`、任务级 `dispatchedAt`——AGENTS.md 的「batch.json 字段表」可补充说明这些扩展字段。
  - `app/launcher.ps1` 是 legacy（派发已内置 server.mjs 的 spawn）。
  - v1 只有 claude-code 一个 runner。

## 步骤

1. **先读工作区规则**：完整阅读 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`。
2. `git status --porcelain` 记录初始状态快照（注意：`batches/wave2/batch.json` 很可能显示为已修改——那是运行时状态，**不要提交它、不要还原它**）。
3. 通读三篇文档：`README.md`、`AGENTS.md`、`docs/design.md`；与 `app/server.mjs`、`app/public/` 的实际行为交叉核对（只读代码，不改代码）。
4. 形成判定表：路径｜一句话主题｜判定（健康/冗余/结构问题/过期）｜处置。
5. 执行处置：确凿失真就地更正（如端口口径、字段表补充）；三篇间冗余收敛要克制——AGENTS.md 是协作规则权威、README 是入口文档，定位不同不算冗余。拿不准一律保留。
6. 提交：**只 `git add README.md AGENTS.md docs/design.md 中你改过的篇目`**，严禁 `git add -A` / `git add .`（会把运行时状态混进去）。Conventional Commits 中英文对照（例：`docs: 补充 batch 扩展字段说明 / document extra batch fields`）。
7. 写报告（见文末）。

## 红线

- **只许改动这三篇文档**：`README.md`、`AGENTS.md`、`docs/design.md`。
- **绝不碰**：`app/` 任何代码、`batches/`（尤其 wave2）、`runs/`、`.gitignore`。
- **绝不 push**；不重启/杀掉任何 node 进程（服务正在被使用）。
- 若发现代码级问题（文档与代码不一致但该改的是代码）→ 只写进报告建议，不动代码。
- Windows 11 环境。

## 验收标准

1. 报告整文件写入指定路径，含五段结构。
2. 若有改动：`git show --stat HEAD` 只含三篇文档内的文件；若无可清理：报告给出逐篇依据。
3. `git status` 对比初始快照：除你改动的文档外，变化仅限 `batches/wave2/batch.json` 的运行时状态。

## 报告要求

完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\HIVE-report.md`

模板：
```
# HIVE 结果报告
## 结论一句话
## 文档判定表（三篇 + 交叉核对发现）
## 已执行处置与提交（含 commit hash）
## 建议人工复核（含代码级问题的建议）
## 自评（达标|部分达标|未达标 + 原因）
```
