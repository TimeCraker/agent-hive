# DEPCB 结果报告

> 任务：coding-plan-bench Pages 重部署（远端 main `ec0f774`，glm-5.3 矩阵世代）→ https://coding-plan-bench.pages.dev
> 执行时间：2026-10-05 23:38 – 23:45 (+08) · 环境：Windows 11 / Git Bash / node v24.16.0

## 结论一句话

**FAILED——Cloudflare 凭据缺失，部署未执行**：本地 wrangler 未认证（无 OAuth、无 `CLOUDFLARE_API_TOKEN`），CI 通道 GitHub Secrets 也未配置（`gh secret list` 为空，CI 部署 workflow 三连败）；构建本身一次通过，凭据到位后 10 分钟内可完成重部署。全程零凭据落盘、零盲重试、未触碰本地 `coding-plan-bench` 工作树。

## 部署过程

| 步骤 | 结果 | 证据 |
|---|---|---|
| 1. clone 到系统临时目录 | ✅ | `git clone --depth 1` → `%TEMP%\cpb-deploy`；HEAD = `ec0f774`（`ec0f7740adbfd1305a0db9f068ddc538277a6285`，2026-10-05 16:11:51 +0800，branch main）与任务指定一致 |
| 2. 确认部署通道 | ✅ | 仓 README「部署」章节：`VITE_API_BASE=https://coding-plan-bench-api.timecraker-ace.workers.dev/api npm run build` → `npx wrangler pages deploy site/dist --project-name=coding-plan-bench --branch=main`；产物目录 `site/dist`（vite root=site/outDir=dist）。`wrangler.toml` 是 Worker API 配置（`coding-plan-bench-api`），与 Pages 无关 |
| 3. 认证预检 | ❌ | `npx wrangler whoami` → `You are not authenticated. Please run "wrangler login".` |
| 4a. 安装+构建 | ✅ | `npm install`（125 包，9s）；`npm run build`（tsc -b && vite build，9.44s）产出 `index-CbJFVYl0.js`（355.42 kB）/ `index-1xDnpevp.css`（26.80 kB）/ `bench-m2Npb2Rk.js`（3.41 kB）——hash 均不同于线上旧产物 |
| 4b. 部署 | ❌ | 部署命令执行一次（未重试），报错退出（exit 1）：`In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work.` |
| 5. 线上核验 | 未生效 | 见下节（部署未发生，线上仍为 2026-08-05 世代，按现状取证） |
| 6. 清理 | ✅ | `rm -rf %TEMP%\cpb-deploy`，复查目录不存在（`CLEANED`） |

### 凭据缺失的完整证据链（为什么线上停在 2026-08-05）

- **本地通道**：`wrangler whoami` 未认证 + 部署命令报缺 `CLOUDFLARE_API_TOKEN`。
- **CI 通道**（`deploy-cloudflare.yml`，push main 自动触发 + 手动 workflow_dispatch）：需 GitHub Secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`，实测 `gh secret list` 返回空；workflow 注释自述「未配置时 workflow 会失败但不影响代码」。CI 运行记录三连败：
  - 2026-08-11 `ci: 前端部署统一到 Cloudflare Pages` — failure（27s）
  - 2026-08-22 `chore(license): 添加 MIT 许可证` — failure（31s）
  - 2026-10-05 `feat(matrix): glm-5.3 多模型对比矩阵`（即 `ec0f774`）— failure（29s）
- 结论：8-05 最后一次成功部署后，所有自动部署均因缺 secret 失败，与 wave6 INSPCB 巡检现象（线上 8-05 世代）完全吻合。

### 修复路径（凭据从哪里提供，你拍板；我不经手 token 值）

- **方式 B（我的建议，零本地凭据，顺带修好以后 push 自动部署）**：在 Cloudflare Dashboard 创建 API token（权限：Account:Read + Pages:Edit，可只用该 Pages 项目范围），然后 `gh secret set CLOUDFLARE_API_TOKEN -R TimeCraker/coding-plan-bench` 与 `gh secret set CLOUDFLARE_ACCOUNT_ID -R ...`，再 `gh workflow run deploy-cloudflare.yml -R TimeCraker/coding-plan-bench` 触发部署。
- **方式 A（本地直部）**：同上创建 token 后，在部署会话中以环境变量注入（`CLOUDFLARE_API_TOKEN=... npx wrangler pages deploy site/dist --project-name=coding-plan-bench --branch=main`，clone 内执行）；或交互式 `wrangler login`（浏览器 OAuth）。token 由你临时提供、当次会话用完即弃，不写任何文件。

## 线上核验（4 项）

部署未发生，以下为**部署前线上现状**（2026-10-05 23:43 实测，均带 `?ts=` 防缓存），即 4 项均未通过、与 failed 结论一致：

| # | 核验项 | 结果 | 原始输出 |
|---|---|---|---|
| 1 | 首页 bundle hash 变化（不再是 CrwXWtwV / BSAjIVF_） | ❌ 未变化 | HTML 引用 `assets/index-CrwXWtwV.js`、`assets/index-BSAjIVF_.css`（与 INSPCB 巡检一致） |
| 2 | `/leaderboards.json` 含 glm-5.3（计数 > 0） | ❌ 计数 = 0 | `grep -o "glm-5.3" \| wc -l` → `0`；`"updatedAt": "2026-08-05"` |
| 3 | 首页 HTML 出现矩阵相关入口/标记 | ❌ 未检出 | 首页为 SPA 壳，`<title>Coding Plan Bench · 模型测速台</title>`，HTML 源码不含矩阵文案 |
| 4 | Worker API 健康 | ✅ | `GET /api/health` → `{"ok":true}` |

### ⚠️ 任务书核验口径偏差（即便部署成功也需修正预期）

- **第 2 项按字面在 `ec0f774` 上不可能通过**：clone 实证 `site/public/leaderboards.json` 是**行业参考榜**（Artificial Analysis / GDPval 快照，meta 自述「行业参考数据，非本机实测」，模型名仅到 GLM-5.2 存量）。glm-5.3 矩阵实测预置数据在 `site/src/lib/storage.ts` 的 `SEED_ENTRIES`（智谱 GLM-5.3 / GLM-5.3-Flash，2026-10-05 实测中位数），**编译进 JS bundle 而非 leaderboards.json**。线上「更新于 2026-08-05」标注即来自该行业榜文件，属设计而非停更标志。建议验收口径改为「JS bundle 或渲染后 DOM 含 glm-5.3」。
- **第 3 项同理**：矩阵入口文案「模型矩阵快选」在 `BenchForm.tsx:74`，客户端渲染后才入 DOM；SPA 壳 HTML 永远不含。建议用浏览器渲染后 DOM 核验。
- 凭据到位重部署后，建议核验组合：① HTML 引用 `index-CbJFVYl0.js`（本地构建已产出此 hash）；② 下载该 bundle grep `glm-5.3` 计数 > 0；③ 浏览器打开首页，渲染 DOM 含「模型矩阵」与「GLM-5.3」。

## 自评

- **如实报 failed**：卡点唯一且明确——Cloudflare 凭据双通道皆缺（本地无 token、CI secret 空）。按红线未猜 token、部署命令仅执行一次未重试、认证信息零落盘零入报告（wrangler/gh 输出中的账户标识已过滤）。
- **前置工作全部完成且可复用**：clone 校验、通道与产物目录确认、依赖安装、生产构建一次通过、新产物 hash 已预登记，凭据注入后无需重做任何步骤（clone 已按红线清理，重跑成本仅 clone+install+build ≈ 2 分钟）。
- **超出任务的诊断产出**：① 查明线上停更根因（CI 缺 secret 三连败，含 `ec0f774` 当天失败记录）；② 发现任务书核验第 2/3 项与仓库实现不符（glm-5.3 在 bundle 不在 leaderboards.json；矩阵入口在渲染 DOM 不在 HTML），已给出修正口径。
- **红线遵守**：未进入/读取/修改本地 `coding-plan-bench` 目录（全程在 `%TEMP%\cpb-deploy` clone 内）；未发起任何真实测速请求（仅 GET 静态资源 + GET `/api/health`）；临时目录已清理。
- **遗留**：待你以方式 A 或 B 提供凭据后重跑本任务；届时按上文修正后的口径出 4 项核验。
