# CPB · coding-plan-bench 文档保鲜度审计报告（Wave 8）

> 日期：2026-10-06 ｜ 审计基线：main@0eb9460 ｜ 修正提交：5d46bd7（main，未 push）
> 范围：README.md、PLAN-v2.md、results/2026-10-05-glm-5.3-matrix.md、site/design-system/MASTER.md、docs/ai-delivery/ 五件套
> 红线遵守：仅改 3 个 .md，未触碰任何代码/配置/依赖/锁文件/.git 历史

## ① 过期点清单（5 项已修，commit 5d46bd7）

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---------|------|------|------|
| 1 | README.md 技术栈表 | 前端含「Framer Motion」 | 「纯 CSS 动效；framer-motion 已移除（T-11 减重，初始 JS gzip 83.5KB，check:bundle ≤100KB 门禁）」 | package.json 无该依赖；全仓 grep framer 零命中（site/src）；globals.css:123 注释原文「入场/循环动画（替代 framer-motion 的 CSS 实现…）」；tasks T-011 Evidence「framer-motion 依赖整体移除（124KB→85.7KB gzip），6 个组件动画改纯 CSS」 |
| 2 | README.md 质量命令块 | 缺 `npm run verify`（T-011 落地的发布级验收单入口） | 补一行：verify = typecheck→lint→全部测试→build→check:bundle/check:clean 串行 | package.json scripts.verify 存在；tasks T-011 DoD「`npm run verify` 是自动验收单入口」；加命令后 `npm run test:docs` 6/6 通过（README 命令真实性门禁） |
| 3 | README.md 项目结构 | engine/ 列表缺 types.ts；server/ 括号缺 node.ts | 补 `types.ts # 共享类型契约`；server 括号补 node | `ls engine/`（10 文件含 types.ts）；`ls server/`（5 文件含 node.ts） |
| 4 | results/2026-10-05-glm-5.3-matrix.md 末段 | 「v1 实测见 [site/public/results.json](../site/public/results.json)」死链 | 改为：文件已随 v1 数据路径清理删除，`git show 0e83d57~1:site/public/results.json` 可查 | `ls site/public/results.json` → No such file；`git log --follow -- site/public/results.json`：524cb71 引入、0e83d57（T-008）删除 |
| 5 | site/design-system/MASTER.md 组件清单 + 动效规范 | v1 组件清单 StatCard/ComparisonBar/MetricToggle（layout 动画 shared layoutId）/TrendLine/DetailTable/Skeleton；缓动含「spring」 | 更新为 S01 实际 9 组件（Sidebar/SecurityBanner/TransportSelector/BenchForm/RunProgress/ResultCard/Leaderboard/GlobalLeaderboard/Methodology）；去 spring；补注「T-011 起动效为纯 CSS 实现」 | `ls site/src/components/` 实际 9 文件，v1 六组件 grep 零命中（仅 GlobalLeaderboard.tsx 内置 Skeleton 函数）；layoutId/spring 为 framer-motion 概念（见 #1 证据） |

## ② 核对无误条目（抽查可复现，全部亲眼验证）

1. **PLAN-v2 归档指向**（重点核对项）：顶部「已实施完成（superseded，决策存档）…事实源是 README.md」标注存在（d13c431 提交）；内文 Node sidecar/GitHub Pages 等历史差异已由该声明覆盖 → 不改存档正文。
2. **README 模型矩阵表**：6 行（智谱 5.3/flash/flashx、方舟 glm-5.3[1m]、千帆 glm-5.3+deepseek-v4.1-flash、DeepSeek deepseek-flash、Kimi kimi-k3，envVar 逐一）与 engine/models.ts 完全一致；「2026-10-06 依官方文档调研更新」与 models.ts 头注释一致；GLM-5.2 三渠道存量对照存在。
3. **三端架构 vs 实际目录**（重点核对项）：engine（同构）/server（Hono）/src/worker.ts（Worker 入口）/site（前端）/src-tauri（Tauri 2）全部存在；transports 三实现（browser-direct/trusted-proxy/tauri-local）与 README 结构图一致。
4. **部署拓扑**：deploy-site.yml（push main→production、PR→preview-N、显式 VITE_API_BASE、_headers 校验步骤）与 deploy-worker.yml（--var CORS_ALLOWED_ORIGINS/ALLOWED_UPSTREAMS、先 typecheck+test:security）与 README 表述一致；「项目代理仅放行智谱」与 wrangler.toml + deploy-worker.yml 一致。
5. **指标口径**：cpb-standard@1（温度 0 / max_tokens 1024 / prompt sha256）与 engine/profiles.ts 及 T-002 Evidence 一致；「12 个稳定错误码」= engine/errors.ts ERROR_CODES 恰 12 项。
6. **质量命令**：README 全部 17 条 npm run 命令存在于 package.json scripts（test:docs 门禁 6/6 通过）；typecheck 注释「engine/server/src/site/tests」与 tsconfig include 一致；e2e「默认系统 Edge」= playwright channel msedge；responsive 375/768/1024/1440、visual light/dark + reduced-motion 与 spec 文件一致。
7. **实测数字**：README L81「19.9s/89 TPS、Flash 34.7s/64 TPS、32/32、质量打平」与 results 报告逐字一致；原始 JSON（results/data/2026-10-05-model-matrix.json）存在。
8. **Windows 状态**：build-windows.yml 存在（workflow_dispatch + tauri-action）；「外部验证证据由 owner 补齐（T-012）」与 tasks T-012 `[ ]` pending 一致；release v0.1.0 真实存在（gh release list），README 下载链接有效。
9. **安全表述**：_headers（CSP/HSTS/nosniff/X-Frame-Options DENY）、server/node.ts DNS rebinding 校验、vite proxy /api→8787、wrangler.toml vars 与 README 各对应段落一致。
10. **docs/ai-delivery/ 五件套**（PRD/Spec/Tasks/Handoff/Prompt）：带 baseline_sha + 输入 blob hash 冻结的交付契约，「当前代码事实」章节描述的是基线 00e9543 时点状态，属设计使然的不可变存档 → 不适用保鲜修正（Tasks 的 checkbox/Evidence 已如实记录至 T-011 done、T-012 pending）。

## 发现但未动（红线/代码侧，待人工确认）

- `engine/models.ts` L83 注释仍引用已删除的 `site/public/results.json`（代码文件，本次红线只许改 .md；一行注释修正即可）。
- `site/src/lib/useCountUp.ts` 导出无任何调用者（疑似 T-011 清理遗留死代码；MASTER.md 动效表保留 count-up 规范描述因 hook 本体存在）。
- `npm run test:deploy-config` 本机失败（esbuild Temp Access denied）：**stash 基线对照证明改动前同样失败**，为 Tasks T-006 已记载的宿主断电环境噪音；其 6 个断言本体全 passed，失败仅在 beforeAll `npm run build`。

## ③ 自评

- 可验证陈述 100% 与实况对齐：修正 5 处、确认无误 10 组；抽查 5 条复现路径见上表证据列（models.ts diff、git log --follow、ls components、test:docs、globals.css:123）。
- 验证闭环：`git diff --check` 干净；`npm run test:docs` 6/6 通过；deploy-config 失败经基线对照排除回归；commit 5d46bd7 已按仓库规范（Conventional Commits 中英对照）落库，未 push（遵守红线）。
- 遗留风险：PLAN-v2 存档正文与实现的差异靠顶部声明覆盖（存档性质，刻意不改）；GitHub release v0.1.0 为 S01 重构前产物，README 未声明版本对应关系，属产品发布叙事而非文档错误，未处理。
