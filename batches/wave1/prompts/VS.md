# 任务 VS：video-script-workflow 版本控制收编

你在 `C:\Users\TimeCraker\Desktop\my_workspace\video-script-workflow` 目录工作（当前目录）。该目录是一个纯 Markdown/工具的视频剧本创作工作区，**从未有过版本控制**，工作区规则里挂着「待 git 化」的账，你来清掉它。

## 已知事实
- 目录内容：`视频生成器/`、`阅读器/`、`characters/`、`stories/`、`agent.md`（创作指引，先读它了解结构）
- 约 23 个文件、22.1MB（动手前自己复核：哪些是媒体大文件）
- 工作区根目录不是 git 仓库；GitHub 账号 TimeCraker 已登录（gh 可用）

## 步骤
1. 读 agent.md，盘点目录结构，列出 >1MB 的二进制文件清单
2. `git init`（默认分支 master 或 main 均可，与 GitHub 创建时保持一致）
3. 写 `.gitignore`：OS 垃圾、临时产物；对 >5MB 的媒体文件逐一判断——创作素材源文件入库，可再生成的构建/导出产物 ignore（在报告里写明每个大文件的去留决策）
4. 首次提交（Conventional Commits 中英对照，例：`chore(init): video-script-workflow 纳入版本控制 / initial import under version control`）
5. `gh repo create TimeCraker/video-script-workflow --private --source . --push` 建私有仓并推送（创作内容默认私有）

## 红线
- 不改任何内容文件本身（只加版本管理）
- gh/GitHub 网络失败重试一次，仍失败如实记录
- 完不成或被阻塞：如实写报告，不虚报

## 验收标准
- 远端仓库存在且 push 成功
- 报告含：文件清单决策表（入库/忽略+理由）、提交哈希、远端 URL

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\AGENT-BOARD-2026-10\reports\VS-report.md`
模板：# VS 结果报告 / ## 做了什么 / ## 提交与推送（哈希） / ## 验证证据 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
