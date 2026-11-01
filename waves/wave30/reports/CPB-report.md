# CPB 模型测速台 · 多端架构质量体检报告

## 1. 项目概况与检查时间

| 项 | 值 |
|---|---|
| 仓库 | `coding-plan-bench`（本地软件，线上 coding-plan-bench.pages.dev） |
| 体检时 HEAD | `5f03547` `chore(release): bump version 0.2.0`，main 分支，与 origin/main 同步，工作树 clean |
| 版本 | package.json 0.2.0 |
| 架构 | 同构 TS 引擎三端：Cloudflare Pages 前端（site/）+ Workers 代理（src/worker.ts）+ Tauri Windows 本地版（src-tauri/），共享 `engine/`（测量引擎）与 `server/index.ts`（Hono 代理，Worker + Node 同构） |
| 环境 | Windows 11 · Git Bash · node v24.16.0 · npm 11.13.0 |
| 检查时间 | 2026-11-01 17:08–17:11（本地） |

**环境事实**：体检起点 node_modules 缺失（typecheck 首跑报 TS2688 缺 `node`/`vite/client` 类型定义），执行 `npm ci` 装 238 包（34s）后全部质量门通过。历史已知问题「vitest 内嵌 build 的 %TEMP% esbuild EPERM」未复发（修复已落地于 `tests/config/deploy-config.test.ts` 的子进程 TMP 重定向）。

## 2. 测试执行结果

| 套件 | 命令 | 结果 | 耗时 |
|---|---|---|---|
| 全量（unit + integration + config） | `npm run test:unit`（vitest run） | **17 文件 / 182 用例，全部通过，0 失败 0 跳过** | 9.01s（wall 10.55s） |
| 其中集成子集 | `npm run test:integration` | **4 文件 / 59 用例，全部通过** | 564ms（wall 1.95s） |

构成对账：unit 11 文件 + integration 4 文件 + config 2 文件 = 17 ✓。vitest 配置强制 no-network（未 mock 的 fetch 为硬错误）、注入式 now() 保证 deterministic，测试全部本地运行、无外部副作用。

## 3. 类型检查与打包状态

| 门 | 命令 | 结果 | 耗时 |
|---|---|---|---|
| TypeScript | `npm run typecheck`（tsc --noEmit） | **通过**（零错误输出） | 8.98s |
| 干净度 | `npm run check:clean` | **PASS**（npm ci 前、build 后各跑一次，`git status --porcelain` 均为空，无未追踪/多余产物残留） | <1s |
| 构建 | `npm run build`（tsc --noEmit && vite build） | **通过**：68 modules transformed，built in 1.16s（wall 5.03s） | 5.03s |

构建产物（落 `site/dist`，已被 .gitignore 覆盖）：index.html 0.77 kB · CSS 32.24 kB（gzip 7.26 kB）· JS 两包 2.01 kB + 275.31 kB（gzip 合计约 87.7 kB）。

已知非致命警告 1 条：`site/src/lib/storage.ts` 同时被 App.tsx 动态与静态导入，Vite 提示该模块不会拆入独立 chunk——不影响正确性，属可选优化。

## 4. 三端架构资产一致性评估

**共享单源（一致性强）**：

- **engine/ 单源**：types/models/measurement/protocols/parse-sse/profiles 等一份代码，`site/src`（App、BenchForm、Leaderboard 等组件）以相对路径直接引用——Web 前端与 Tauri 前端消费同一引擎源码。
- **前端产物单源**：vite root=site/outDir=dist → `site/dist`；`src-tauri/tauri.conf.json` 的 `frontendDist` 同指 `../site/dist`——Tauri 本地软件与 Pages 线上站点打包自同一份构建产物。
- **代理逻辑单源**：`src/worker.ts`（Workers 入口）`import { createApp } from "../server/index"`，Node 本地服务（`server/node.ts`）与 Cloudflare Worker 是同一 Hono app 的两个宿主壳，边界策略（Origin 精确 allowlist、上游 host|path 白名单、非幂等不重试、no-store）单点维护。
- **配置守卫**：`tests/config/deploy-config.test.ts` 校验 `_headers` 安全头/CSP、wrangler.toml 边界 vars、deploy workflows 策略与 dist 产物完整性，共 182 用例中的 config 部分为部署资产提供回归兜底。

**发现的不一致（1 项，低危）**：

- **版本号漂移**：package.json 已于 `5f03547`（2026-10-08）bump 至 **0.2.0**，但 `src-tauri/tauri.conf.json` 与 `src-tauri/Cargo.toml` 仍为 **0.1.0**（该 commit 仅改动 package.json + package-lock.json）。影响面：仅 Tauri 本地安装包的版本标识落后于 Web 发布版；不影响线上站点、测量逻辑与安全边界。现有 deploy-config 测试不覆盖 tauri 侧版本对齐，属测试覆盖缺口（建议：发布脚本统一 bump 三处版本，或加一条对齐断言）。

## 5. 自评结论

**达标**。四项质量门（typecheck / 全量单测 / check:clean / build）全部通过且数字明确；三端架构「引擎单源 + 代理单源 + 产物单源」的同构设计成立，资产一致性良好；无未追踪产物遗留（本报告文件为任务指定产物，位于新建的 `waves/wave30/reports/`，此前 waves/ 不存在于 git 追踪中）。唯一遗留事项为 Tauri 版本号 0.1.0 → 0.2.0 的同步漂移，属低危、可在下次发布时顺手修复。
