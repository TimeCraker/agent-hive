# 任务 VSW：video-script-workflow 文档审计与清理

一句话任务：核对 video-script-workflow 仓的指引文档与实际目录结构的一致性，找出并处置**内容冗余**、**结构问题**、**完全过期**三类问题，可直接更正并本地提交。

## 背景（已核实事实，勿重新考古）

- 本仓是 `C:\Users\TimeCraker\Desktop\my_workspace\` 多仓库工作区的子仓 `video-script-workflow`，独立 Git 私有仓（`TimeCraker/video-script-workflow`），当前工作区干净。2026-10-05 刚建仓首推（wave1 的 VS 任务，commit 8333c1c）。
- 项目定位：VidScript AI 动漫短剧剧本与分镜创作工坊（角色档案库 → 分镜大纲 → 分镜 → 提示词）。**纯 Markdown 创作仓 + 本地小工具**。
- 仓内结构（实际存在）：`characters/`、`stories/`、`阅读器/`、`视频生成器/`，指引文档是仓根的 `agent.md`（小写）。
- 已知线索（供你核实）：`agent.md` 描述的目录结构、工作流约定与上述实际结构是否一致；不一致即过期信息。

## 步骤

1. **先读工作区规则**：完整阅读 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`。
2. `git status --porcelain` 记录初始状态快照。
3. 盘点文档：仓根与各目录的 `*.md`。**注意：`characters/` 与 `stories/` 下的大部分 .md 是创作内容（角色档案、剧本），不是说明文档**——只审计「指引/说明」类文档（agent.md、阅读器/视频生成器内的说明文档），创作内容仅允许目录级浏览用于核对结构引用。
4. 逐篇通读指引类文档，形成判定表：路径｜一句话主题｜判定（健康/冗余/结构问题/过期）｜处置（留/并/改/删）。
5. 执行处置：过期信息就地更正；冗余合并；失效链接修复；拿不准的保留并在报告列出。
6. 提交：Conventional Commits 中英文对照（例：`docs: 校正目录结构描述 / fix directory structure description`）。只 `git add` 你动过的具体文件。
7. 写报告（见文末）。

## 红线

- **创作内容零改动**：不修改、不重写、不移动 `characters/`、`stories/` 下的任何档案与剧本正文。
- 只动指引/说明类 Markdown；不碰 `阅读器/`、`视频生成器/` 的代码与素材。
- **绝不 push**（私有创作仓），只本地 commit。
- 不确定是否过期 → 保守保留 + 报告建议。
- Windows 11 环境，目录名含中文（阅读器、视频生成器），命令注意引号。

## 验收标准

1. 报告整文件写入指定路径，含五段结构。
2. `git log --oneline -5` 可见 ≥1 个 docs 类提交；若判定无可清理，报告必须给出逐篇依据。
3. `git status` 对比初始快照：除你改动的指引文档外无新增改动。

## 报告要求

完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\VSW-report.md`

模板：
```
# VSW 结果报告
## 结论一句话
## 文档清单判定表（指引类文档，每篇一行：路径|主题|判定|处置）
## 已执行处置与提交（含 commit hash 与改动摘要）
## 建议人工复核
## 自评（达标|部分达标|未达标 + 原因）
```
