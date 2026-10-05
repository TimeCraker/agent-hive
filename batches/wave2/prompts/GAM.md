# 任务 GAM：games 文档审计与清理

一句话任务：通读 games monorepo（根 + `asternova/` 两级）全部 Markdown 文档，找出并处置**内容冗余**、**结构问题**、**完全过期**三类问题，可直接删除/合并/更新并本地提交。

## 背景（已核实事实，勿重新考古）

- 本仓是 `C:\Users\TimeCraker\Desktop\my_workspace\` 多仓库工作区的子仓 `games`，独立 Git 仓。⚠️ 当前有 **40 个未提交改动文件**，全部是用户现场，绝不能回退/覆盖/混入。
- 项目定位：游戏 monorepo，整合 AsterNova 矩阵。子项目权威状态（2026-10 口径）：
  - `asternova/client-godot-v2/` —— **主力客户端**（Godot）
  - `asternova/client-godot/` —— **冻结**
  - `asternova/backend/` —— Go + Gin + WS + PostgreSQL + Redis，**一期封存**（现行房主权威架构）
  - `asternova/web-client/` —— Next.js + WASM
  - `asternova/render-lab/`、`asternova/art/` —— 渲染实验 / 美术管线
- 已知线索（供你核实）：
  - 各子项目 README 的状态标注（封存/冻结/主力）与上述权威口径是否一致——不一致就是过期信息。
  - 根 `README.md`、`CLAUDE.md` 与 `asternova/AGENTS.md` 的重叠与冲突。
  - 根目录 4 个 `启动*.bat` 和截图 `*.png` **不是文档，一律不动**。
  - `.zcode/`、`.worktrees/`、`.github/` 是工具目录，不审计。

## 步骤

1. **先读工作区规则**：完整阅读 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`。
2. `git status --porcelain` 记录初始状态快照（40 个脏文件是用户现场）。
3. 盘点文档：`git ls-files '*.md'` + 目录浏览双口径，范围 = 仓根 + `asternova/`（含各子项目 README）。子项目若无独立 .md 则只看上级。
4. 逐篇通读，形成「文档清单判定表」：路径｜一句话主题｜判定（健康/冗余/结构问题/过期）｜处置（留/并/改/删）。
5. 执行处置：
   - **完全过期** → `git rm` 删除；
   - **内容冗余** → 合并进权威篇；
   - **过期信息**（状态标注失真是重点）→ 就地更正；
   - **结构问题** → `git mv` / 修链接；
   - **拿不准** → 保留，报告列「建议人工复核」。
6. 提交：每类清理一个独立 commit，Conventional Commits 中英文对照（例：`docs: 校正子项目封存状态标注 / fix subproject status labels`）。**只 `git add` 你本次动过的具体文档文件**，严禁 `git add -A` / `git add .`。
7. 写报告（见文末）。

## 红线

- **只动 Markdown 文档（*.md）**。不碰代码、场景资源、`.bat`、截图、配置、构建产物。
- **绝不 push**，只本地 commit。
- 用户 40 个未提交改动：不回退、不覆盖、不 stash、不混入。
- 不做功能开发、不装依赖、不跑 Godot/Go/Next 构建命令。
- 不确定是否过期 → 保守保留 + 报告建议，宁漏勿删。
- Windows 11 环境。

## 验收标准

1. 报告整文件写入指定路径，含五段结构。
2. `git log --oneline -10` 可见 ≥1 个 docs 类提交；若判定无可清理，报告必须给出逐篇依据。
3. `git status` 对比初始快照：除你改动的文档外，无新增也无消失的改动。

## 报告要求

完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\GAM-report.md`

模板：
```
# GAM 结果报告
## 结论一句话
## 文档清单判定表（全量文档，每篇一行：路径|主题|判定|处置）
## 已执行处置与提交（含 commit hash 与改动摘要）
## 建议人工复核
## 自评（达标|部分达标|未达标 + 原因）
```
