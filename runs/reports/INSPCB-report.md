# INSPCB 结果报告

- 任务：coding-plan-bench 线上站只读巡检（https://coding-plan-bench.pages.dev）
- 时间：2026-10-05 · 方法：curl 计时 / GitHub 远端 API（只读）/ Playwright 只读走查
- 红线遵守：未进本地仓（仓信息全部来自 GitHub 远端 API）、未发测速请求（仅 `GET /api/health`）、未提交任何表单（仅导航 + 站内 tab 切换）

## 结论一句话

线上站可用性、功能形态、外链全部健康（0 死链、console 零错误、Workers 健康检查通过），唯一实质问题是 **P2：线上版落后远端 main 一个世代——远端 HEAD `ec0f774`（2026-10-05「glm-5.3 多模型对比矩阵」）未部署，线上仍是 2026-08-05 世代构建（无 glm-5.3、无矩阵 UI）**。

## 可用性

| 项 | 结果 |
|---|---|
| HTTPS 首页 | ✅ 200，HTML 636B（压缩传输 369B） |
| 首页 TTFB（4 次采样，经本机代理） | 2.14s / 2.76s / 1.56s / 1.12s（中位 ≈1.8s；DNS 5.9ms、TCP 6.3ms，TLS 握手占大头） |
| JS bundle `index-CrwXWtwV.js` | ✅ 200 · application/javascript · 353,538B |
| CSS bundle `index-BSAjIVF_.css` | ✅ 200 · 26,665B |
| favicon.svg | ✅ 200 · 300B |
| 预置数据 `/leaderboards.json` | ✅ 200 · 9,612B 合法 JSON |
| Workers `GET /api/health` | ✅ 200 · `{"ok":true}` · TTFB 2.34s |

注：本机出口走代理（remote_ip 198.18.x fake-IP 段），绝对延迟值偏保守，仅作相对参考；未发现任何 4xx/5xx（Workers 根路径 404 见 P3-c，属预期）。

## 功能形态走查

- **渲染形态**：Vite 构建的纯 SPA 壳（hash 资产 + 空 `#root`），无 SSG/预渲染；主框架内容全部由客户端渲染，Playwright 实测渲染完整：
  - 侧边栏：测速台 / 能力榜导航、深色模式、GitHub 外链。
  - 测速台：协议切换（Anthropic/OpenAI）、模型名 / 模型 ID / Endpoint / API Key / 取样次数（1/3/5）表单齐全；速度榜单含 3 条示例（智谱 GLM Coding Plan `glm-5.2` 3.92s、百度千帆 7.76s 等）。
  - **安全默认正确**：表单为空时「开始测速」按钮禁用。
  - 能力榜：综合智能 / Agent 能力 / 性价比 / 订阅制四榜渲染完整（Claude Opus 5 61 分居首…），数据标注「更新于 2026-08-05」。
- **预置数据**：`/leaderboards.json` 结构为 `meta / intelligence / agent / value / plans` 五节，内容为 GLM-5.2 世代模型矩阵；**全文无 `glm-5.3`**。
- **网络行为干净**：页面加载仅请求静态资源 + `leaderboards.json`，无任何意外外呼；console 0 error / 0 warning。
- **Workers 代理**：`GET /api/health` 返回 `{"ok":true}`；`POST /api/bench`（真实测速端点）按红线未触碰。Workers 路由事实来自远端仓 `server/index.ts`（`/api/health` GET、`/api/bench` POST、`/api/*` CORS）。

## 性能

- **PSI 双端失败**：mobile / desktop 匿名免费接口均返回 `Quota exceeded ... 'Queries per day'`（共享匿名项目 583797351490 每日配额耗尽）；mobile 重试 1 次确认是确定性配额错误，非瞬态 → 按预案降级为 curl 计时 + bundle 体积清单。
- **降级数据（curl，经本机代理）**：见「可用性」计时表。
- **Bundle 体积清单**（原始 → 压缩传输）：

| 资源 | 原始 | 压缩传输 | 压缩比 |
|---|---|---|---|
| index-CrwXWtwV.js | 353,538B | 113,719B | ~32% |
| index-BSAjIVF_.css | 26,665B | 6,251B | ~23% |
| leaderboards.json | 9,612B | 3,056B | ~32% |
| 首页 HTML | 636B | 369B | — |

- 首屏总传输 ≈ **124KB**（HTML+JS+CSS+JSON+favicon），工具型单页可接受；gzip/brotli 已启用。

## 死链

- 首页渲染外链（Playwright 提取）：`github.com/TimeCraker/coding-plan-bench`、`…/releases`（下载本地版）→ 均 **200**。
- README 声称外链（取自 GitHub 远端 README，HEAD/GET 验活，顺序执行、间隔 ≥500ms）：

| 链接 | 结果 |
|---|---|
| `https://coding-plan-bench.pages.dev/` | 200 |
| `https://github.com/TimeCraker/coding-plan-bench.git` | 200 |
| `https://github.com/TimeCraker/coding-plan-bench/releases` | 200（v0.1.0 存在，2 个资产） |
| `…/releases/latest` | 302 → `tag/v0.1.0` → 200 |
| `…/actions/workflows/build-windows.yml` | 工作流文件在仓内存在 ✅ |
| `https://coding-plan-bench-api.timecraker-ace.workers.dev/api` | GET 404（预期，见 P3-c） |

- `localhost:5173` / `your-server.com` 为文档示例占位，跳过。
- **死链数：0**（深度 2 内未发现任何失效链接）。

## 问题分级清单

| 级别 | 问题 | 说明 / 建议 |
|---|---|---|
| P0 | — | 无 |
| P1 | — | 无 |
| **P2** | **线上版落后远端 main 一个世代** | 线上 bundle 中 `glm-5.3`、矩阵 UI 标记计数为 0，`leaderboards.json` 无 glm-5.3，页面数据标注「2026-08-05」；远端 HEAD `ec0f774`（2026-10-05 08:11Z）已合入「glm-5.3 多模型对比矩阵 + 首轮实测」。工作区文档声称的「内置 glm-5.3 世代矩阵直对比」与线上不符。若非刻意保留旧版，需重新构建部署 Pages。 |
| P3-a | PSI 无法测分 | 外部匿名配额耗尽，非站点问题；建议部署新版后带 key 复测一次补 CWV 基线。 |
| P3-b | JS 单 chunk 353KB 无代码分割 | 压缩后 111KB，当前可接受；S01 改造若重写前端可顺手做 manualChunks。 |
| P3-c | Workers `/api` 根路径 GET 404 | 仅 `/api/health`、`/api/bench` 有路由，属预期；但 README 以 `/api` 为基址文档，可加一个 GET `/api` 说明路由或文档标注，避免巡检/用户误判为故障。 |

### 线上版与仓内 S01 改造的已知差异（部署时对照）

三份代码现在是三个状态，部署验收时逐项对照：

1. **线上（本报告实测）** = 2026-08-05 世代：bundle `index-CrwXWtwV.js` / `index-BSAjIVF_.css`，数据「更新于 2026-08-05」，GLM-5.2 世代，无矩阵。
2. **远端 main** = `ec0f774`（2026-10-05 推送）：已含 glm-5.3 多模型对比矩阵 + 首轮实测数据。
3. **本地仓** = S01 大改造进行中（本巡检期间另一会话在工作，未读取、状态未知，可能未推送）。

S01 部署后建议核验：① bundle hash 变化（不再是 `CrwXWtwV`/`BSAjIVF_`）；② `/leaderboards.json` 含 glm-5.3；③ 首页出现矩阵入口；④ `GET /api/health` 仍 `{"ok":true}`；⑤ 复测 PSI。

## 自评

- **覆盖**：五节全部完成；验收标准（五节 + P0-P3 分级 + S01 差异提示节）满足。
- **红线**：全程未进 coding-plan-bench 本地目录（仓内信息均来自 GitHub 远端 API 只读拉取）；未发测速请求、未提交表单；重试均 ≤2；除报告外零写入（Playwright 快照临时目录已清理，pwa-hw-voice 工作树无残留）。
- **置信度声明**：线上版本落后结论基于三重字符串证据（bundle 无 `glm-5.3`、JSON 数据无、日期标注 2026-08-05），置信度高，但未做构建产物逐字节 diff；性能节数据为降级方案（代理路径 curl 计时），绝对值仅作相对参考。
