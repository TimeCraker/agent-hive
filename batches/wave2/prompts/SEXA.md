# 任务 SEXA：sex-workspace 指引文档核对

一句话任务：只核对 `sex-workspace` 的**指引类文档**（`sex2/AGENT.md` 及顶层说明文件）与实际目录结构的一致性，更正确凿失真。**创作内容零接触。**

## 背景（已核实事实，勿重新考古）

- `C:\Users\TimeCraker\Desktop\my_workspace\sex-workspace\` 是 18+ 创作目录。**顶层不是 Git 仓**；活跃区 `sex2/` 是独立私有 Git 仓（当前干净）。
- 仓内结构：顶层有 `_archive/`（旧存档）与 `sex2/`；`sex2/` 内有写作指引 `AGENT.md` 与创作内容。
- 任务边界（从严）：
  - **审计对象只有指引/说明类文档**：`sex-workspace/sex2/AGENT.md`，以及顶层若存在 README/说明类文件。
  - 核对内容：AGENT.md 描述的目录结构、写作流程约定、命名规范与 `sex2/` 实际是否一致；失效的路径引用更正。

## 步骤

1. **先读工作区规则**：完整阅读 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`（其中项目边界一节提及本目录）。
2. 在 `sex2/` 内 `git status --porcelain` 记录初始快照。
3. 目录级浏览（`ls` 层面）核对 AGENT.md 引用的结构是否存在；**不展开阅读创作内容文件**。
4. 通读 AGENT.md（及顶层说明文件，若有），形成判定表：路径｜主题｜判定（健康/结构问题/过期）｜处置。
5. 执行处置：确凿失真（路径失效、流程与实际不符）就地更正；拿不准保留。
6. 提交（若有改动）：在 `sex2/` 仓内，Conventional Commits 中英文对照（例：`docs: 校正目录结构引用 / fix directory references`）。只 `git add` 指引文档。
7. 写报告（见文末）。

## 红线（本任务最重要的部分）

- **创作内容零接触**：不阅读、不审计、不修改、不移动 `_archive/` 与 `sex2/` 下的任何角色档案、故事、续写正文。目录名清单仅用于核对结构引用。
- 只动指引/说明类 Markdown；顶层（非 git 区）的说明文件若需改动，直接改但**在报告中单独标注**（无版本控制，需用户知晓）。
- **绝不 push**（私有创作仓）。
- 0 改动完全合规：报告说明依据即可。
- Windows 11 环境。

## 验收标准

1. 报告整文件写入指定路径，含五段结构。
2. 若有改动：`sex2/` 内 `git log --oneline -3` 可见 docs 类提交；若无：报告给出依据。
3. `sex2/` 的 `git status` 对比初始快照：除指引文档外无任何改动。

## 报告要求

完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\SEXA-report.md`

模板：
```
# SEXA 结果报告
## 结论一句话
## 指引文档判定表（每篇一行：路径|主题|判定|处置）
## 已执行处置与提交（含 commit hash；顶层非 git 区改动单独标注）
## 建议人工复核
## 自评（达标|部分达标|未达标 + 原因）
```
