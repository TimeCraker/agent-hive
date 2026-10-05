# 任务 CPB：coding-plan-bench 文档审计与清理

一句话任务：通读 coding-plan-bench 仓内全部 Markdown 文档，找出并处置**内容冗余**、**结构问题**、**完全过期**三类问题，可直接删除/合并/更新并本地提交。

## 背景（已核实事实，勿重新考古）

- 本仓是 `C:\Users\TimeCraker\Desktop\my_workspace\` 多仓库工作区的子仓 `coding-plan-bench`，独立 Git 仓，当前工作区干净。
- 项目定位：模型测速台——填 endpoint + key 测 **TTFT / TPS / Total**，榜单对比。三端架构共享同一份 `engine/` 同构 TS 引擎：Cloudflare Pages 网站前端（已上线 coding-plan-bench.pages.dev）+ Cloudflare Workers 代理 + Tauri Windows 本地版（Releases 发安装包）。
- 已知线索（供你核实）：
  - **`PLAN.md` 与 `PLAN-v2.md` 并存**——若 v1 已被 v2 完全取代，v1 属于过期文档：删除或移入归档并标注 superseded（按档案价值判断）。
  - `README.md` 约 196 行，其中的链接、数据引用（如 results/ 实测数据、Workers 地址、Releases 版本号）是否失真。
  - `bench/`、`docs/`、`design-system/` 内的说明文档时效。
  - `tsconfig.tsbuildinfo` 是构建产物不是文档，**不动**，若认为不该入库只在报告里建议。

## 步骤

1. **先读工作区规则**：完整阅读 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`。
2. `git status --porcelain` 记录初始状态快照。
3. 盘点文档：`git ls-files '*.md'` + 目录浏览双口径。`results/` 的实测数据 .md 是**档案**，只核对引用不审计其内容。
4. 逐篇通读，形成「文档清单判定表」：路径｜一句话主题｜判定（健康/冗余/结构问题/过期）｜处置（留/并/改/删）。
5. 执行处置：
   - **完全过期**（如被 v2 取代的 PLAN.md v1）→ `git rm` 删除或归档标注；
   - **内容冗余** → 合并进权威篇；
   - **过期信息**（失真的链接/地址/版本号）→ 就地更正；
   - **结构问题** → `git mv` / 修链接；
   - **拿不准** → 保留，报告列「建议人工复核」。
6. 提交：每类清理一个独立 commit，Conventional Commits 中英文对照（例：`docs: 归档被 v2 取代的计划文档 / archive superseded plan`）。只 `git add` 你动过的具体文件。
7. 写报告（见文末）。

## 红线

- **只动 Markdown 文档（*.md）**。不碰代码、配置（wrangler.toml / vite / tsconfig）、`.env.example`、锁文件、`src-tauri/` 资源。
- **results/ 实测数据档案：不删不改不移动**。
- **绝不 push**，只本地 commit；也不触发任何部署。
- 不做功能开发、不装依赖、不跑测速/build。
- 不确定是否过期 → 保守保留 + 报告建议。
- Windows 11 环境。

## 验收标准

1. 报告整文件写入指定路径，含五段结构。
2. `git log --oneline -10` 可见 ≥1 个 docs 类提交；若判定无可清理，报告必须给出逐篇依据。
3. `git status` 对比初始快照：除你改动的文档外无新增改动。

## 报告要求

完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\CPB-report.md`

模板：
```
# CPB 结果报告
## 结论一句话
## 文档清单判定表（全量文档，每篇一行：路径|主题|判定|处置）
## 已执行处置与提交（含 commit hash 与改动摘要）
## 建议人工复核
## 自评（达标|部分达标|未达标 + 原因）
```
