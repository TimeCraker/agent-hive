# 任务 MPF：my-portfolio 文档审计与清理

一句话任务：通读 my-portfolio 仓内全部 Markdown 文档，找出并处置**内容冗余**、**结构问题**、**完全过期**三类问题，可直接删除/合并/更新并本地提交。

## 背景（已核实事实，勿重新考古）

- 本仓是 `C:\Users\TimeCraker\Desktop\my_workspace\` 多仓库工作区的子仓 `my-portfolio`，独立 Git 仓，当前工作区干净（0 脏文件）。
- 项目定位：个人主页 / 商业矩阵入口，线上 asterforge.top。
- 技术栈：Next.js + Prisma + Three.js + Tailwind；Dockerfile + standalone + nginx.conf。
- 已知线索（供你核实）：
  - `README.md` + `CLAUDE.md` + `docs/` 并存，双指引重叠度待核。
  - `hub/`（子站/矩阵入口）与 `data/`、`scripts/`、`prisma/` 的说明文档是否与现状脱节。
  - 2026-10-05 刚做过移动端性能优化（Perf 56 → 70+，字体 preload 归因，commit 995831a）——文档若还描述「性能待优化」就是过期信息。

## 步骤

1. **先读工作区规则**：完整阅读 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`。
2. `git status --porcelain` 记录初始状态快照。
3. 盘点文档：`git ls-files '*.md'` + 目录浏览双口径。
4. 逐篇通读，形成「文档清单判定表」：路径｜一句话主题｜判定（健康/冗余/结构问题/过期）｜处置（留/并/改/删）。
5. 执行处置：
   - **完全过期** → `git rm` 删除；
   - **内容冗余** → 合并进权威篇，重复篇删除或缩成指针段；
   - **过期信息** → 就地更正；
   - **结构问题** → `git mv` / 修链接；
   - **拿不准** → 保留，报告列「建议人工复核」。
6. 提交：每类清理一个独立 commit，Conventional Commits 中英文对照（例：`docs: 清理过期性能描述 / remove stale perf notes`）。只 `git add` 你动过的具体文件。
7. 写报告（见文末）。

## 红线

- **只动 Markdown 文档（*.md）**。不碰代码、配置、`.env*`、锁文件、Dockerfile/nginx.conf、构建产物。
- **绝不 push**，只本地 commit。
- 不做功能开发、不装依赖、不跑 install/build。
- 不确定是否过期 → 保守保留 + 报告建议，宁漏勿删。
- Windows 11 环境。

## 验收标准

1. 报告整文件写入指定路径，含五段结构。
2. `git log --oneline -10` 可见 ≥1 个 docs 类提交；若判定无可清理，报告必须给出逐篇依据。
3. `git status` 对比初始快照：除你改动的文档外无新增改动。

## 报告要求

完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\MPF-report.md`

模板：
```
# MPF 结果报告
## 结论一句话
## 文档清单判定表（全量文档，每篇一行：路径|主题|判定|处置）
## 已执行处置与提交（含 commit hash 与改动摘要）
## 建议人工复核
## 自评（达标|部分达标|未达标 + 原因）
```
