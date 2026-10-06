# 任务：ResumeAIX 文档保鲜度审计（Wave 8 · RES）——只读审计 + 补丁提案

## ⚠️ 分支警示（必读）
本仓当前检出的是**功能分支 `codex/resume-platform-art-upgrade`**（另一会话的 WIP），权威分支是 **`origin/main`**。工作区有他人未提交改动。
因此本任务是**严格的只读审计**：
- **禁止**修改本仓任何文件、**禁止**任何 git commit/checkout/switch/stash
- 权威文档以 `git show origin/main:<path>` 读取（不是工作树里的文件）
- 修正以**补丁提案**形式写进报告，由主控决定是否应用到 main

## 背景与目标
多仓库工作区 C:/Users/TimeCraker/Desktop/my_workspace 下多个会话并行开发，ResumeAIX 的文档可能已落后于实际代码。核对权威分支 origin/main 上的说明性文档与该分支实际状态的一致性，产出「过期点清单 + 补丁提案」报告。工作区全景见 C:/Users/TimeCraker/Desktop/my_workspace/CLAUDE.md。

## 步骤
1. 摸清 main 实况：git -C <仓库> log origin/main --oneline -30、git ls-tree origin/main -r --name-only（目录/manifest）、git show origin/main:package.json（scripts）
2. 读取权威文档：git show origin/main:README.md、origin/main:CLAUDE.md、origin/main:AGENTS.md、docs/ 下各文件（全部经 git show）
3. 逐条核对陈述与 main 实况；汇总哪些文档哪些段落过期
4. 为每处过期写出**修正后的完整段落**（可直接应用的补丁内容），标注目标文件与位置
5. 报告写入 C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/RES-report.md（整文件覆盖）

## 重点核对
- 「功能冻结，只修 Bug 和接正式支付」定位 vs main 最近提交活动（有无 feature 类提交）
- README/CLAUDE.md 的命令表 vs origin/main:package.json scripts 实况
- docs/stages 已完结阶段是否有未标注的收尾状态

## 红线
- **零写入**：不修改本仓任何文件、不 commit、不 checkout/switch/stash/worktree、不碰工作区脏文件（他人 WIP）
- 只允许 git 只读命令（log/show/ls-tree/branch -a 等）
- 不虚构：每条结论必须有 git show 可复现的证据
- 不碰其他仓库；不修改工作区根目录的 CLAUDE.md/AGENTS.md

## 验收标准
- 全部结论基于 origin/main 实况（可复现）
- 每处过期都有可直接应用的补丁提案（目标文件/位置/完整新内容）
- 报告含「过期点清单」表：文档位置 ‖ 现状 ‖ 问题 ‖ 补丁提案

## 报告要求
写入 C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/RES-report.md：① 过期点清单+补丁提案 ② 核对无误条目 ③ 自评
