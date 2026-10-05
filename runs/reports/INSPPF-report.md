# INSPPF 结果报告

巡检对象：https://asterforge.top（my-portfolio 线上站）｜巡检时间：2026-10-05 23:02–23:15（UTC+8）｜方式：只读 HTTP（约 90 个请求，全部带间隔，0 表单 / 0 登录 / 0 git 写操作）

## 结论一句话

站点整体健康：可用性、访客路径、死链三项几乎全绿（唯一异常是外部备案链接 beian.miit.gov.cn 自身 521）；但 **2026-10-05 移动端性能优化整轮未部署到线上**（证据确凿，见性能节），线上仍是优化前状态，跑一次手动部署脚本即可解决 —— 这是本次唯一 P1。

## 可用性

| 检查项 | 结果 | 数据 |
|---|---|---|
| HTTP→HTTPS | ✅ | 301 → `https://asterforge.top/`（nginx/1.24.0 Ubuntu） |
| TLS 证书 | ✅ | Let's Encrypt，`CN=asterforge.top`，有效期 2026-09-21 → **2026-12-20**（剩 76 天，正常续期窗口） |
| HSTS | ✅ | `max-age=31536000; includeSubDomains` |
| 首页 | ✅ | 200，TTFB **106ms**，ISR 缓存 HIT（`x-nextjs-cache: HIT`, prerender） |
| 首页传输 | ✅ | 未压缩 1,168,107B（1.11MB）→ 压缩传输 **236.9KB / 0.32s** |
| 安全响应头 | ✅ | CSP / X-Frame-Options: DENY / nosniff / Referrer-Policy / Permissions-Policy 齐全 |
| robots.txt / sitemap.xml | ✅ | 均 200；robots Disallow `/admin` `/api` `/s`；sitemap 9 URL |
| 404 行为 | ✅ | `/projects/nonexistent-xyz` → 真 404（无 soft-404） |
| /admin | ✅ | 200 登录页可达（robots 已排除；未尝试登录） |
| www 变体 | ⚠️ P3 | `https://www.asterforge.top` 直接 200 直出同内容（未 301 回 apex），canonical 已指向 apex，SEO 无碍 |
| 关键页响应（压缩全程） | ✅ | `/` 1.34s｜`/config` 1.35s｜`/projects/game` 1.88s｜`/projects/lekao` 1.37s｜genesis / interview / publisher / config-files 均 200 |

## 访客路径走查

- **站内 9 页全部 200**：首页、/config、/config/files、/projects/{game, interview, genesis, resume(308→200), lekao, publisher}。sitemap 9 URL 与实际路由一致。
  - `/projects/resume` 是**设计内 308** → `https://resume.asterforge.top/` → 200（ResumeAIX 实名跳转）。
- **矩阵子站 5/5 存活**：game / product / lekao / resume / interview `.asterforge.top` 全部 200。
- **/config 下载中心**：20 个安装包/压缩包（zip/exe）逐一 HEAD 全部 200。
- **外链 21 条**：19 条正常（200 或 301/302 正常跳转，如 anthropic→claude.com、aka.ms、learn.microsoft.com）；异常 2 条：
  - `https://beian.miit.gov.cn/` → **521**（HEAD 与 GET 双重复核均 521，备案官网自身故障/拦截，非本站问题，页脚链接建议保留）；
  - `https://deepseek.com/harness/` → HEAD 429（其反爬），GET 复核 301 → 存活，判定正常。
- `asterforge://install?pkg=*` 自定义协议深链 14 条：浏览器端协议无法 HTTP 验活，**N/A（如实标注）**。

## 性能（含优化生效判断）

**PSI 结果：失败（降级处理）**。mobile + desktop 各调用 PSI 免费接口并重试 1 次，共 3 次均返回 `429 RESOURCE_EXHUSTED`（Google 匿名共享配额 "Queries per day" 当日耗尽，project 583797351490）。已按预案降级为 curl 计时 + 资源清单。

### 资源清单（首访关键路径，压缩传输口径，本机中国网络实测）

| 类别 | 数量 | 体积 | 备注 |
|---|---|---|---|
| HTML | 1 | 236.9KB | 未压缩 1.11MB（RSC 数据内联，Next 正常现象但偏大） |
| CSS | 3 | 62.2KB | 全部 immutable 1 年 |
| JS | 14 | 291.3KB | 最大单 chunk 73.3KB，turbopack 构建 |
| 预载字体（next/font） | 5 | 127.9KB | Anton 12KB + **Inter latin 48.4KB** + **JBMono latin 31.3KB** + Fraunces×2 36KB |
| 预载字体（Noto Serif SC 子集） | 9 | **360.1KB** | 单个 31–55KB（A2 策略：INTRO 文案命中子集 preload，10-03 已上线） |
| LCP 图（1080w webp） | 1 | 46.2KB | `fetchPriority=high` 预载 ✅ |
| og-image / favicon | 2 | 35.6KB / 2.5KB | immutable ✅ |

字体预载合计 **~488KB**，是首访带宽第一大头（超过 JS 总量）。

### ✅ 10-05 性能优化生效判断：**未生效（整轮未部署）**

| 证据 | 线上实测 | 仓库 HEAD（应然） | 结论 |
|---|---|---|---|
| f62b13c preload 清单改相对路径 | `<link rel="preload" href="https://asterforge.top/fonts/noto-serif-sc/5.3.0/...">`（**绝对路径**） | `hero-font-preloads.json` 全部 `/fonts/...`（**相对路径**） | ❌ 未部署 |
| c28d74c 关闭 Inter/JBMono preload | `<head>` 仍预载 `83afe278b6a6bb3c-s.p.woff2`（部署 CSS @font-face 证实 = **Inter latin，恰好 48.4KB**，与 layout.tsx 注释"48KB 白拉"精确吻合）及 `05174236=JBMono latin 31.3KB` | `layout.tsx:33,42` 两处 `preload: false` | ❌ 未部署 |
| 部署时点推断 | 线上 build 含 10-03 A2 清单、不含 10-05 轮任何产物 | git log 中 f62b13c 是 10-05 轮**最早** commit | 线上 build 早于整轮 → 47b1c38 / bad821f / 635812f（运行时行为，外部不可验）同此推断 |

**影响**：每次首访移动端有 **79.7KB（Inter 48.4 + JBMono 31.3）无效字体预载**持续与 LCP 抢带宽；"Perf 56→70+"的收益目前只存在于本地构建。**处置**：push ≠ 部署，跑一次 `asterforge-deploy` 的手动 SSH 部署脚本（原子 7 项验证）即可整轮上线。

### 缓存策略抽查

- `/_next/static/*`、`/fonts/*`（版本化目录）、og-image：`immutable, max-age=31536000` ✅
- `/config/*.zip`：`Cache-Control: public, max-age=0` —— 每次点击重新拉取（P3，见下）。

## 死链

- **爬取范围**：种子 4 页（首页 + /config + /projects/game + /projects/lekao，覆盖静态段与 [slug] 动态段），深度 2，顺序执行间隔 0.4–0.6s（并发 1 ≤ 2 ✅）。
- **站内页面 0 死链**（9/9 页 200，1 个设计内 308）；**下载文件 0 死链**（20/20 HEAD 200）。
- **外链 21 条中 1 条异常**：beian.miit.gov.cn 521（外部依赖自身故障，不可控）；deepseek HEAD 429 经 GET 复核判活。
- 无 404、无超时、无 5xx（本站自身资源）。

## 问题分级清单

| 级别 | 问题 | 建议 |
|---|---|---|
| P0 | 无 | — |
| P1 | **10-05 移动端性能优化整轮未部署**：线上仍预载 Inter latin 48.4KB + JBMono latin 31.3KB（共 79.7KB 无效预载与 LCP 抢带宽），preload 仍是绝对路径版本 | 手动 SSH 跑部署脚本上线整轮（证据见性能节） |
| P2 | 首访预载字体总量 ~488KB（9 个 Noto 子集 360KB 为主体）：A2 用带宽换 FOIT 的策略在慢速移动网下仍是首屏最大负担 | 部署 10-05 轮后复测；若仍不达标，评估把 preload 收敛到 LCP 实际命中的更少子集（heroChars=137 命中 9 片，可再看合并空间） |
| P3 | sitemap.xml 列出 308 中转 URL `/projects/resume` | sitemap 直接列最终 URL 或移除该项 |
| P3 | `www.asterforge.top` 200 直出同内容而非 301 回 apex（canonical 已兜底，SEO 无害，仅多一次整页下载） | nginx 加 www→apex 301 |
| P3 | `/config/*.zip` `max-age=0`，每次下载重新拉取 | 文件名版本化后换 immutable（同 og-image v2 做法） |
| P3 | 页脚备案链接 beian.miit.gov.cn 当前 521（对方故障，非本站可控） | 保留不动（合规必需），巡检时偶发属正常 |
| P3 | 首页 HTML 未压缩 1.11MB 且随章节内容增长 | 观察项：RSC 内联数据是 Next 常态，暂不动 |

## 自评

- **验证闭环**：全部结论基于线上实测数据（状态码/计时/字节数/响应头/部署 CSS @font-face 比对），未采信任何单点 PASS。
- **诚实标注**：PSI 双端因 Google 匿名配额耗尽失败（重试合规 ≤2），已降级并明示；"Perf 56→70+"无法用 PSI 复验，改用两处静态证据（preload 路径形态 + Inter/JBMono 预载仍在）给出确定性部署判断；`asterforge://` 深链 14 条无法 HTTP 验活，标 N/A。
- **红线遵守**：0 表单提交、0 登录、0 git 写操作、外链仅 HEAD（个别 GET 复核一次）、站内爬取全程限速。
- **局限**：① 中国网络单点视角，未覆盖海外/多地域；② 47b1c38 / bad821f / 635812f 三个运行时优化（Link 预取关闭）外部不可直接观测，部署判断基于「单一 build 原子部署」推断，置信度高但非直接证据；③ TTFB/总耗时为本机多次实测单值，未做分布统计。
