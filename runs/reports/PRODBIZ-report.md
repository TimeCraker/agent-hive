# PRODBIZ · 线上原业务/API/SEO 只读回归报告

- **目标**：https://asterforge.top（腾讯云 ubuntu@111.229.200.178，服务 portfolio-web）
- **验收对象**：六幕主页发布（服务器 HEAD `eae5d8bda023454826960a9ebe7d9c659088765e`，2026-10-11 14:02 上线）后的原业务完整性
- **前置**：DEPLOY 已验收（部署日志 `portfolio-release-2026-10-10/deploy/deploy-output-1011-attempt2.log`，5 项最终验证全过）
- **执行时间**：2026-10-11（部署后 ~18 分钟起）
- **证据目录**：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/prodbiz/`
- **模式**：全程只读。未写业务表、未造数据、未清缓存、未重启服务；SSH 查询一律 `file:...?mode=ro` readonly URI。

## 结论

**通过。** 原业务、公开 API、数据库、上传文件、SEO 元数据、缓存策略、服务器日志全部正常，与部署前状态一致，未发现本次发布引入的任何回归。

| 分类 | 项数 | 结果 |
|---|---|---|
| 公开 API 与数据 | 8 | 全过 |
| 数据库完整性 | 3 | 全过 |
| 上传文件 | 4 | 全过 |
| SEO 与元数据 | 7 | 全过 |
| 缓存与传输 | 7 | 全过 |
| 日志 | 3 | 全过（1 项部署窗口瞬态已归因） |

## 一、公开 API 与数据（只读）

实测均为线上 HTTPS 真实请求，校验响应体业务结构（非仅状态码）：

| 端点 | 状态 | 响应体核验 |
|---|---|---|
| `GET /api/public/projects` | 200 | `{links[7], urls{7}}`，slug = game/resume/interview/genesis/rag/lekao/publisher，与 DB `ProjectLink` 逐条一致 |
| `GET /api/public/announcement` | 200 | `{"active":false}` 结构正确（当前无活跃公告） |
| `GET /api/votes` | 200 | 3 条，票数 2/0/0，与 DB `VoteItem` 完全一致 |
| `GET /api/files/categories` | 200 | 7 分类，含 fileCount/privateCount/folders/preview 聚合，中文 UTF-8 正常 |
| `GET /api/qrcode` | 200 | `{"url":"","type":"wechat"}`，与 DB `SiteConfig.wechat_qrcode_url=""` 一致（既有状态） |
| `GET /api/files/<不存在>/preview` | 404 | `{"error":"Not found"}` |
| `GET /api/uploads/..%2f..%2f` 路径穿越 | 400 | nginx 拒绝，无文件内容泄漏 |
| `POST /api/admin/login`（错误密码） | 401 | `{"error":"密码错误"}` |

## 二、数据库关键业务记录（SSH 只读 sqlite3）

服务器无 sqlite3 CLI，用 python3 sqlite3 以 `mode=ro` URI 只读查询。比对基线 = 部署前备份 `/home/ubuntu/backups/portfolio-predeploy-20261011-135231/dev.db`（10-11 13:52，即 attempt2 部署 14:00 前）。

- **完整性**：LIVE 与备份双 `PRAGMA integrity_check` = `ok`
- **14 张业务表 row count 全部一致**：AdminAuditLog(310/309*)、AlertRecord 1、AnalyticsDaily 92、AnalyticsEvent 9147、AnalyticsSession 684、Announcement 1、FileCategory 7、ProjectLink 7、SiteConfig 4、ToolConfig 0、VaultFile 29、VaultFolder 4、VaultShare 6、VoteItem 3
  - \* 唯一差异 AdminAuditLog +1：新纪录为 `login success:false`，时间戳对应 DEPLOY 阶段「/api/admin/login 路由活（HTTP 401）」验证，属部署验收的正常审计副作用，非数据异常
- **seed 幂等确认**：部署脚本执行了 seed，但 ProjectLink 仍 7 条（slug 无重复）、VoteItem 票数不变、各表 count 与备份一致 → 未重复造数据
- **无 P2021、数据库可正常打开**（全部查询成功）

## 三、上传文件可访问性

生产存储在 `data/uploads`（`public/uploads` 仅开发用，由 `src/lib/upload.ts` 决定）；业务文件经 `/api/files/[id]/*` 提供：

| 请求 | 结果 |
|---|---|
| 公开 png `/preview`（3b082843… 屏幕截图） | 200 `image/png`，3,651,470 B |
| 公开 txt `/download`（44d8242f…） | 200 `text/plain; charset=utf-8`，3,735 B |
| 公开 jpg `/thumb`（4707c03e…） | 200 `image/webp` |
| 私有文件无解锁 `/preview`（github-recovery-codes.txt） | 401 `{"error":"需要解锁保险箱后才能下载"}` |

## 四、SEO 与元数据

- **`/` 为六幕正式页**：HTML 内六幕锚点 `chapter-hero/about/capabilities/resume/game/contact` 全部存在；title=`TimeCraker · AI Builder`；description 正确；canonical=`https://asterforge.top`；og:title/og:description/og:image/og:url 齐全；`robots=index, follow`；无 noindex
- **`/explore`**：canonical=`https://asterforge.top/explore`，title=`项目、服务与工具 | TimeCraker`，可索引
- **`/home-preview`**：`<meta name="robots" content="noindex, nofollow">` ✅
- **sitemap.xml**：10 URL（/、/explore、/config、7 项目页），全部可达（9×200 + `/projects/resume` 308→`https://resume.asterforge.top/`，与「AI 简历走外链」设计一致）
- **robots.txt**：`Allow: /` + `Disallow: /admin、/api、/s` + Sitemap 声明，规则正确
- **传输安全**：HTTP 301→HTTPS；SSL 校验 0（通过）；首页无 `http://` 混合内容引用

## 五、缓存与传输

| 资源 | Cache-Control | 压缩 | 判定 |
|---|---|---|---|
| `/` HTML | `public, max-age=0, s-maxage=3600, stale-while-revalidate=3600, must-revalidate` | gzip | ✅ 与 next.config 设计一致（根除部署后看旧版） |
| `/_next/static/*.js` | `public, max-age=31536000, immutable` | gzip | ✅ 版本化 1 年 |
| `/_next/static/*.css` | 同上 | gzip | ✅ |
| `/_next/image`（hero-poster 等） | `public, max-age=14400, must-revalidate` + ETag | — | ✅ 图片缓存保留（非 no-store），部署未清空图片缓存 |
| `/admin` | `no-store` | — | ✅ 敏感页无公共缓存 |
| `/api/votes` | `public, max-age=10, stale-while-revalidate=30` | — | ✅ 与代码一致 |
| `/api/admin/*` | 401 | — | ✅ 权限数据不可达 |

内容版本匹配：首页 HTML 引用的 chunk 文件名与线上实际 200 的资源一一对应（新构建 hash 生效）。

## 六、服务器日志（脱敏）

- 服务 `active`；当前进程 next-server v16.3.7，PID 914237，自 14:02:51 起稳定运行，RSS ~321MB，`✓ Ready`
- 部署以来（14:02 至检查时）83 行日志：**P2021 = 0，5xx/500 = 0**
- 4 条 `Cannot find module '.../standalone/server.js'`（14:02:26–46）：部署脚本「先停服再构建」窗口内 systemd 重试的**瞬态**错误，14:03 后为 0 条，最终进程 14:02:51 正常启动 → 归因 DEPLOY 阶段已知停机窗口（任务书 §5 已记录该脚本非零停机），不计入本次新错误

## 执行副作用披露（最小且必要）

- 1 次 `POST /api/admin/login` 错误密码探测（401），为任务书 §8 授权的「线上只读检查登录/权限边界」，服务器自动落 1 条 AdminAuditLog 失败审计记录；业务表零写入
- 全部 SSH DB 访问为 `mode=ro`，未触碰 WAL/锁

## 遗留观察（均为既有状态，非本次部署引入，不需处理）

1. `SiteConfig.wechat_qrcode_url` 为空 → `/api/qrcode` 返回空 url（部署前后一致）
2. sitemap 含 `/projects/resume`（308 跳外链）——搜索引擎可跟进 308
3. files/categories 聚合计 25，= 26 active 文件中已分类者（29 total = 26 active + 3 软删除；另有 1 active 未分类）——既有聚合口径，数据与备份一致

## 原始证据清单（prodbiz/）

`api-api_public_projects.json`、`api-api_public_announcement.json`、`api-api_votes.json`、`api-api_files_categories.json`、`api-api_qrcode.json`、`file-public-png.bin`、`file-public-txt.bin`、`file-private-resp.json`、`home.html` + `home-headers.txt`、`explore.html/.headers.txt`、`home-preview.html/.headers.txt`、`sitemap_xml.html`、`robots_txt.html`、`assets-sample.txt`、`cache-headers.txt`
