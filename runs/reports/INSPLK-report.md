# INSPLK 结果报告

- 目标：https://lekao.asterforge.top
- 巡检时间：2026-10-05 23:00–23:10 (UTC+8)
- 方式：纯线上只读 HTTP（curl / openssl / DoH / 无头 Chromium），未使用仓内代码，未启动本地服务，零 git 操作

## 结论一句话

站点整体健康：全站零死链、真实浏览器 0 前端报错、游客鉴权保护正确、页面 TTFB 72–230ms；仅「HTTPS 未启用 HTTP/2」一项值得修（P2），另有 www 未配置、图标缓存策略两条 P3 观察，无 P0/P1 问题。

## 可用性

| 检查项 | 结果 | 证据 |
|---|---|---|
| HTTPS 首页 | ✅ 200 | `code=200 ttfb=0.148s total=0.148s`，二次采样 `ttfb=0.090s` |
| TLS 证书 | ✅ 剩余 43 天 | Let's Encrypt `CN=lekao.asterforge.top`（issuer: YE2），有效期 2026-08-19 → 2026-11-17 |
| HTTP→HTTPS | ✅ 301 | `http://lekao.asterforge.top/` → 301 → `https://lekao.asterforge.top/` |
| 裸域解析 | ✅ | 阿里 DoH 解析 `A 111.229.200.178`（TTL 570，符合腾讯云单机拓扑） |
| www 子域 | ⚠️ NXDOMAIN | DoH 返回 `Status:3`（无记录）——域名未配置，非站点故障，见 P3-1 |
| 反代/缓存 | ✅ | `nginx/1.24.0 (Ubuntu)`；`x-nextjs-cache: HIT`（首页 ISR 预渲染命中） |
| 静态资源缓存 | ✅ | chunk 带 `public, max-age=31536000, immutable` |

测量说明：本机处于代理 TUN 环境（DNS fake-ip 198.18.x 段），全部计时含代理链路；www 结论经阿里 DoH 交叉验证，非代理误判。

## 关键路径走查（游客视角，只读）

| 步骤 | 状态 | 备注 |
|---|---|---|
| 首页 `/` | 200 | title「Lekao Agent · AI 教学工作台」，HTML 66.3KB / 压缩传输 13.0KB |
| 登录 `/login` | 200 | title「登录 · Lekao Agent」，email+password 表单齐全，无异常报错文案 |
| 注册 `/register` | 200 | 仅走查入口，未提交任何表单 |
| `/about` `/terms` `/privacy` | 200 | TTFB 179–209ms |
| `/dashboard/summary` | 307 → `/login?callbackUrl=%2Fdashboard%2Fsummary` | 游客鉴权保护正确 ✅ |
| `/dashboard/mistake` | 307 → `/login?callbackUrl=…` | 同上 ✅ |
| `/dashboard/feedback` | 307 → `/login?callbackUrl=…` | 同上 ✅ |

前端报错检测（无头 Chromium 依次打开首页 / login / about / terms / register）：

- **console 错误 0 条、警告 0 条**
- 网络面板 29 个请求全部 200：含 3 个自托管字体 `/fonts/fraunces-latin-*.woff2`（无第三方字体外链）、Next.js RSC 客户端路由 prefetch（`?_rsc=`）工作正常
- 红线遵守：未注册、未登录、未提交任何表单、未触碰签到等写接口

## 性能

**PSI（主方案）：未获取到。** 免费接口对 mobile 返回 `429`，错误体为 `Quota exceeded … 'Queries per day' … pagespeedonline.googleapis.com`（Google 共享项目日配额耗尽，非目标站问题）；按预案重试 2 次均 429，desktop 未再消耗重试。以下为降级方案数据（curl 计时 + 资源清单，压缩传输口径，经代理链路）：

- 首页 TTFB：147ms / 90ms（两次采样）；全站页面 TTFB 72–230ms（8 个页面采样）
- 首页资源清单（HTML 内引用 + 浏览器实载）：
  - JS：12 个 chunk，压缩传输合计 **248.5KB**（最大单 chunk 71.6KB）
  - CSS：1 个，14.8KB
  - 图片：5 张 `_next/image`（w=3840 源图经优化后每张压缩传输约 15KB）✅
  - 图标：favicon 25.9KB、lekao-mark.svg 0.5KB、og-image 74.3KB（不影响首屏）
  - 字体：3 个自托管 woff2
- 首页静态化良好：`x-nextjs-prerender: 1` + `x-nextjs-cache: HIT` + `s-maxage=31536000`
- ⚠️ 协议：TLS ALPN 协商仅返回 `http/1.1`，**站点未启用 HTTP/2**——首屏 20+ 资源在浏览器 HTTP/1.1 的 6 并发连接限制下有排队开销，见 P2-1

## 死链

爬取范围：首页 + 3 个关键页（/login、/about、/terms），深度 2，串行请求、间隔 ≥500ms、并发 1（低于任务上限）。

- **内链：0 死链**。三页链接集合与首页完全闭合，无新增未测 URL（dashboard 链接为预期 307 鉴权跳转，非死链）
- 静态资源 21 项全测：12 JS + 1 CSS + 5 图片 + favicon + /icon + /apple-icon + /lekao-mark.svg + /opengraph-image，全部 200
- 外链 HEAD 可达性：`https://github.com/TimeCraker` → 200；`https://asterforge.top` → 200
- `mailto:timecraker@foxmail.com` 不属 HTTP，未测

## 问题分级清单

**P0 / P1：无。**

| 编号 | 级别 | 问题 | 证据 | 建议 |
|---|---|---|---|---|
| P2-1 | P2（建议修复） | HTTPS 未启用 HTTP/2，多资源加载受 6 并发连接限制 | `openssl s_client -alpn h2,http/1.1` 仅回 `ALPN protocol: http/1.1`；响应行 `HTTP/1.1 200` | nginx 1.24 在 443 server 块加 `http2 on;`（新语法）并 reload，收益为移动端多资源并发 |
| P3-1 | P3（观察） | `www.lekao.asterforge.top` 无 DNS 记录，手输 www 打不开 | 阿里 DoH `Status:3` NXDOMAIN | 子域产品惯例可接受；如在意可加 CNAME + 301 跳裸域 |
| P3-2 | P3（观察） | favicon.ico / lekao-mark.svg / og-image 的 `Cache-Control: max-age=0(, must-revalidate)`，重复访问逐次回源校验 | 响应头实测 | 对不变资源加短中周期缓存（如 max-age=86400） |
| P3-3 | P3（观察，超出本次范围仅记录） | 未见 HSTS / CSP / X-Content-Type-Options / X-Frame-Options 安全响应头 | 首页响应头全量核对 | 已强制 HTTPS 的站点加 HSTS 收益最高，其余按需 |

## 自评

- 五个规定步骤全部完成；唯一未获取数据为 PSI 跑分（Google 免费配额日耗尽，非目标站原因），已按预案降级为 curl 计时 + 资源清单并如实标注。
- 全程生产只读：约 60 个 GET/HEAD 请求，串行礼貌间隔；未注册、未登录、未提交表单、未触发任何写接口。
- 红线偏差 1 处，已当场修复：Playwright MCP 自动在落脚仓库写了 `.playwright-mcp/` 快照目录，巡检结束已删除并确认不存在；系统临时目录中的抓取样本一并清理。
- 数据局限：① 计时含本机代理链路（fake-ip TUN），绝对值或高于直连，但同链路内部相对比较有效；② 前端报错检测覆盖 5 个游客可达页面的加载与水合阶段，登录后页面与交互态报错未覆盖（红线不允许登录）。
