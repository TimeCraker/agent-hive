# CPB 结果报告

## 结论一句话

11 篇 Markdown 全量通读并逐项核实链接/地址/scripts 真实性：删除 2 篇被完全取代的文档（PLAN.md v1、根目录 design-system 副本）、就地更正 1 篇失真状态（PLAN-v2 标注已实施存档），其余 8 篇健康保留，2 个本地 commit，工作区与初始快照一致。

## 文档清单判定表（全量文档，每篇一行：路径|主题|判定|处置）

| 路径 | 主题 | 判定 | 处置 |
|---|---|---|---|
| `PLAN.md`（335 行） | v1 计划：静态 GitHub Pages + results.json 三家固定对比站 | 完全过期——架构未实施即被 PLAN-v2 三端架构取代；PRD AUD-022 已登记「PLAN/PLAN-v2/README 互相冲突」 | 已删除（git 历史即归档，无独有档案价值；其核心决策 CORS/Key 安全在 v2 与 README 均有体现） |
| `PLAN-v2.md`（214 行） | v2 实施计划：同构引擎 + Hono + Tauri 三端架构（现行架构蓝图） | 过期信息——头部仍写「待用户确认后开干」，实际已实施上线；「GitHub Pages 部署」等细节与最终实现（Cloudflare Pages）有出入 | 已更正：头部标注「已实施完成（superseded，决策存档）」，指向 README 为事实源，声明已知偏差；正文保留历史原貌（流量策略/安全模型/动效规范仍有参考价值） |
| `README.md`（196 行） | 项目使用文档（三端架构/命令/部署，事实源） | 健康——逐项核实全部通过：在线地址、Worker 地址 `coding-plan-bench-api.timecraker-ace.workers.dev`（与 deploy-cloudflare.yml 的 VITE_API_BASE 一致）、「Build Windows App」workflow 名、scripts（dev/build/server/bench:matrix/tauri 均存在于 package.json）、8787/5173 端口、vite proxy、Tauri 产物名、`results/` 与 `engine/models.ts` 等所有引用路径均真实存在 | 留（唯一存疑项见「建议人工复核」第 1 条） |
| `design-system/coding-plan-bench/MASTER.md`（188 行） | ui-ux-pro-max skill `--persist` 原始输出：通用「Hero + Features + CTA」landing page 模板 | 内容冗余 + 方向冲突——与 `site/` 版「dashboard 非 landing page」定位冲突（正是 PRD AUD-015 冲突根源之一）；全仓无任何链接/代码依赖它 | 已删除（保留 `site/` 项目定制版为单一事实源，与 T-009「合并设计系统为一个事实源」方向一致） |
| `site/design-system/MASTER.md`（82 行） | 项目定制设计系统：dashboard 定位、色板、动效铁律、组件清单 | 健康——与实际实现（亮色、Inter/JetBrains Mono、slate 色板）一致 | 留 |
| `docs/ai-delivery/prd/trusted-benchmark.prd.md`（315 行） | S01「可信测速」PRD：22 项审计问题 + FR/NFR/AC 体系 | 健康——待执行的规划包；其 AUD-022/T-010 正是本次清理佐证 | 留，未改动（blob 被 prompt 冻结，见下） |
| `docs/ai-delivery/stages/S01-trusted-benchmark.spec.md`（365 行） | S01 Stage Spec：模块边界/实现契约/验证矩阵 | 健康——同上，与 PRD/Tasks/Handoff/Prompt 构成冻结规格包 | 留，未改动 |
| `docs/ai-delivery/tasks/S01-trusted-benchmark.tasks.md`（147 行） | S01 任务清单 T-001..T-012（全部 `[ ]` 未开始） | 健康——待执行状态真实 | 留，未改动 |
| `docs/ai-delivery/handoffs/S01-trusted-benchmark.md`（36 行） | S01 交付 Handoff（State: READY，Next: Budget implementation） | 健康——待执行状态真实 | 留，未改动 |
| `docs/ai-delivery/prompts/impl-s01-20260731-01.implementation.md`（149 行） | S01 实施提示词（Implementer 契约） | 健康——待派发状态真实 | 留，未改动 |
| `results/2026-10-05-glm-5.3-matrix.md`（68 行） | glm-5.3 vs Flash 实测报告（档案） | 档案（不审计内容）——仅核对引用：`data/2026-10-05-model-matrix.json`、`../engine/models.ts`、`../bench/prompts.ts`、`../site/public/results.json` 全部有效 | 不动 |

盘点口径：`git ls-files '*.md'` 与文件系统 `find` 双口径一致（11 篇，无未跟踪 md；`bench/`、`engine/` 下无 md 文档）。

## 已执行处置与提交（含 commit hash 与改动摘要）

| Commit | 类型 | 改动 |
|---|---|---|
| `63f309d` | docs（删除被取代文档） | 删 `PLAN.md` + `design-system/coding-plan-bench/MASTER.md`，2 files，-523 行；空目录 `design-system/` 随之消失 |
| `d13c431` | docs(plan)（过期信息就地更正） | `PLAN-v2.md` 头部状态行更正：待确认→已实施（superseded 存档），指向 README 事实源并声明 Cloudflare Pages 偏差，1 file，+1/-1 |

- 均为本地 commit，**未 push、未触发部署**。
- 删除后死链检查：全仓 grep 无任何文档链接指向被删文件（唯一文本命中是 Tasks T-009 的 Files 清单，非链接且属冻结规划包）。
- `git status --porcelain` 终态为空，与初始快照（空）一致，无额外改动。
- 红线遵守：仅动 2+1 个 md；`results/` 档案零触碰；未动代码/配置/`.env.example`/锁文件/`src-tauri/`；`tsconfig.tsbuildinfo` 未动（见复核第 3 条）。

## 建议人工复核

1. **README「本地版 Key 全程在你自己电脑」声明与实现可能不符**：`src-tauri/src/lib.rs` 是空壳（无本地 HTTP 适配/无 sidecar），本地版测速实际仍走浏览器直调或 Worker 兜底（CORS 失败时 key 经 Worker）。这正是 S01 PRD AUD-008/AC-008 已登记的问题，属 T-006/T-007 代码任务范围，本次按红线未改 README 文案——建议随 S01 一并裁决。
2. **S01 规划包（docs/ai-delivery 五篇）是否仍按计划执行**：Tasks 全部未勾选、Handoff 为 READY 待实施，但规划后 git 上先走了侧边栏/能力榜/矩阵等另一条线。若 S01 仍要做，本次删根目录 MASTER.md 与 PLAN-v2 标注已替 T-009/T-010 完成部分前置；若 S01 搁置，建议另行决策（该包 blob 被 implementation prompt 冻结，本次一律未动）。
3. **`tsconfig.tsbuildinfo` 已被 git 跟踪**（84 B 增量构建缓存，非文档，按任务要求未动）：T-001 已登记「移除被跟踪的增量产物」；若 S01 不做，建议单独 `git rm --cached` + `.gitignore` 处理。
4. PLAN-v2 正文仍保留「Node sidecar」等历史细节（与 S01 冻结的「Tauri HTTP 插件」方向不同）——已用头部声明「以 README 与代码为准」覆盖，未逐条改写历史计划正文，如需逐条订正请人工裁决。

## 自评

**达标**。理由：报告含五段结构整文件写入指定路径；`git log --oneline -10` 可见 2 个 docs 提交（63f309d、d13c431）；`git status` 与初始快照一致（均为空），全部处置严格限定在 *.md 且 results/ 档案零触碰；每篇文档均有判定依据（判定表 11/11 覆盖，含核实证据）；拿不准项（README 安全声明、S01 去留、tsbuildinfo）全部保守保留/未动并列入人工复核，符合「不确定是否过期→保守保留」红线。
