# 任务 SEXB：sex2 AGENT.md 补阅读器工具链环节

一句话任务：给 `sex-workspace/sex2/AGENT.md` 补上 2026-09-26 起新增的阅读器工具链环节——在写作流程中加入「同步阅读器」约定。**创作内容零接触。**

## 背景（已核实事实，勿重新考古）

- `C:\Users\TimeCraker\Desktop\my_workspace\sex-workspace\` 顶层不是 Git 仓；活跃区 `sex2/` 是独立私有 Git 仓。写作指引是 `sex-workspace/sex2/AGENT.md`。
- 上一轮核对（报告 `agent-hive/runs/reports/SEXA-report.md`）发现：AGENT.md 停更于 2026-09-19，而 2026-09-26 起 `sex2/` 实际新增了：
  - `小说阅读器/`（离线阅读器，内含独立 README）
  - 根目录 `更新章节.bat`（更新入口）
  - 实际写作流程在第 8 节「写完归档」之后还存在**「同步阅读器」**环节，但 AGENT.md 没写。
- 这是**新增流程约定**（不是失真更正），用户已拍板让补。

## 步骤

1. 读工作区规则 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`；在 `sex2/` 内 `git status --porcelain` 记初始快照。
2. **只读理解工具链**：读 `小说阅读器/README.md` 与 `更新章节.bat`（及阅读器入口脚本的开头注释），弄清：更新阅读器的正确触发方式（跑 bat？手动同步哪些文件？）、有什么注意事项（缓存、索引、格式要求）。**不改工具本体一个字**。
3. 在 `AGENT.md` 合适位置（第 8 节「写完归档」之后）补一小节「同步阅读器」：何时做、怎么触发、注意什么，**沿用 AGENT.md 现有文风与格式**，篇幅克制（一个小节足够）。
4. 若第 8 节的启动检查清单需要加一行工具链提示，一并补上；其他章节不动。
5. 提交（在 `sex2/` 仓内）：Conventional Commits 中英对照（例：`docs(agent): 补阅读器同步环节 / document reader sync step`）。只 add AGENT.md。
6. 写报告（见文末）。

## 红线

- **创作内容零接触**：不阅读、不修改 `characters/`、`stories/` 等任何创作正文（目录级浏览除外）。
- 只改 `AGENT.md` 一个文件；阅读器代码、bat、工具文档一律不动。
- **绝不 push**（私有创作仓）；不执行 bat / 不启动阅读器。
- 新增内容基于工具实际行为（第 2 步读到的），不臆造流程。
- Windows 11 环境；目录名含中文，命令注意引号。

## 验收标准

1. 报告写入指定路径，含：工具链理解摘要 / AGENT.md 改动 diff 摘要。
2. `git show --stat HEAD` 仅 AGENT.md；`git status` 对比初始快照无其他改动。
3. 新增小节内容与工具实际行为一致（报告里给对照依据）。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\SEXB-report.md`

模板：`# SEXB 结果报告` / `## 结论一句话` / `## 工具链理解摘要` / `## AGENT.md 改动与提交` / `## 人工复核（若有）` / `## 自评`
