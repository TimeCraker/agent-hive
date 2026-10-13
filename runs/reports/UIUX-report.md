# UIUX 回归报告 — 原业务入口与 UI/UX（本地 3108 只读）

- **日期**：2026-10-10（本地 23:00–23:40）
- **被测对象**：`my-portfolio` @ `codex/character-motion-m1`，HEAD `8302135`（docs(home): 补充部署与完整验收交接提示词）
- **预览**：`http://localhost:3108/`（standalone `node server.js`；测试期间经历一次并行 BUILD 轮转，服务进程 26776 → 3104，见 §5 环境干扰）
- **工具**：Playwright（chromium 144 + Edge 154.0.4258.62）+ curl；截图与原始数据存 `C:\Users\TimeCraker\Desktop\my_workspace\portfolio-release-2026-10-10\uiux\`
- **范围**：总任务书 §8 全部 + §9 可自动化无障碍/响应式项；全程只读（未投票、未写数据、未登录、未 commit、未动 3108 进程）

## 1. 结论速览

| 等级 | 数量 | 摘要 |
|---|---|---|
| P1（应修复后发布） | 1 | 旧根锚点兼容跳转落点错位 2300–4100px 且 hash 被改写 |
| P2（建议修复） | 1 | 空库 FALLBACK 与 `/projects/[slug]` 详情页数据源不一致 |
| P3（轻微/记录） | 6 | 见 §4.3 |
| 通过 | 21 项主清单 | 见 §2 |
| 待真机 | — | iOS Safari / Android Chrome / 物理高刷（不冒充，任务书 §9 声明） |

**业务回归总评**：原站业务（explore / config / 文件库 / 公开 API / admin 边界 / 外链配置）功能与数据结构全部完好；唯一影响真实用户路径的是 P1（详情页「返回项目矩阵」也走旧锚点路径，受同一缺陷影响）。

## 2. 检查明细（预期 / 实际 / 证据 / 结论）

### A. 入口与业务

| # | 项 | 预期 | 实际 | 证据 | 结论 |
|---|---|---|---|---|---|
| A1 | `/explore` + `#projects` `#services` `#vote` | 200、锚点落位 | 三锚点直接访问目标区块 top=92px（导航补偿后精确落位），区块 id 齐全（intro/about/services/projects/vote/contact） | `explore.html`；测试记录 | ✅ |
| A2 | 旧根锚点 `/#projects` `/#services` `/#vote` 兼容 | 跳到 /explore 对应区域 | 跳转发生但**落点错位**：#projects→custom-dev 区（差 4134px）、#vote→rag-demo 区（差 2845px）、#contact→services 区（差 2323px），且 hash 被 scrollspy 改写；直接访问则精确 | 运行记录（两次时序复测） | ❌ P1 |
| A3 | `/config`、`/config/files`、固定/动态项目路由 | 全部 200 正常 | /config（64 交互元素、Hub+三工具）、/config/files（6 文件 1 分类 1 锁，与 API 一致）、game/interview/genesis/rag 200；/projects/resume 308→`https://resume.asterforge.top/`（外链约定）；lekao/publisher 见 P2 | `http-status-scan.txt`、`08/09/10-*.png`、`api/dynamic-slug-final.txt` | ✅（P2 备注） |
| A4 | `/home-preview` noindex | robots noindex | `noindex, nofollow`；正文 diff 为空（与 `/` 完全同构）；交互结构 identical=true | `home.html` vs `home-preview.html` diff | ✅ |
| A5 | `/lab/character-motion` 独立、控件不泄漏 | 实验功能隔离 | lab 页自带控件（「查看原海报」等）正常；首页 `[class*="lab-"/"debug-"/"scrub"]` 命中 0 | `11-lab-page.png` | ✅ |
| A6 | ResumeAIX / AsterNova 入口读实际配置 + rel | 与本地预览实际配置一致 | 渲染 href 与 `/api/public/projects` 实际值一致：ResumeAIX=`https://resume.asterforge.top/`、AsterNova=`https://asterforge.top/projects/game`；均 `target=_blank rel="noopener noreferrer"`；三外链 curl -L 全 200（只读打开，未登录未操作） | 运行记录 | ✅ |
| A7 | 原站导航/列表/配置/文件分类/公开 API 只读回归 | 数据结构正确 | `/api/public/projects`（6 links+urls map）、`/api/public/announcement`（{active:false}）、`/api/votes` GET（[]）、`/api/files`（items 结构完整）、`/api/files/categories`（分类+folders+preview）、`/api/qrcode`（{url,type}）；公开文件 thumb/preview 200，私密文件 401「需要解锁保险箱后才能下载」 | `api/public-api-readonly.txt`、`api/files-boundary.txt` | ✅ |
| A8 | 管理后台/权限边界（只读未登录） | 未登录拒绝 | `/api/admin/{health,votes,projects,config,files}` 无 token 全 401 `{"error":"Unauthorized"}`；**Bearer 明文密码 401**（安全红线符合）；robots.txt Disallow /admin /api /s；sitemap 无 /home-preview、/lab | `api/admin-boundary-robots.txt` | ✅ |

### B. 联系与交互

| # | 项 | 预期 | 实际 | 证据 | 结论 |
|---|---|---|---|---|---|
| B1 | 邮箱地址 + mailto | 正确 | 页面 `timecraker@foxmail.com`，`mailto:timecraker@foxmail.com`，DOM 唯一邮箱 | `05-home-contact.png` | ✅ |
| B2 | 复制成功反馈（本地 http） | toast 有反馈 | 点击「复制邮箱」→ 按钮「邮箱已复制」+ `role=status`「已复制，可以粘贴到你常用的邮箱。」 | `06-copy-toast-default.png` | ✅（提示常驻见 P3-6） |
| B3 | 拒绝剪贴板权限回退 | 失败反馈、无成功误导 | 注入 writeText reject（NotAllowedError 模拟）：按钮保持「复制邮箱」、提示「复制未成功，可以选择上方地址或点击邮件链接。」（`ContactScene.tsx:17-19` catch 路径生效） | `07-copy-deny-fallback.png` | ✅ |
| B4 | GitHub 链接 | 正确账号 | `https://github.com/TimeCraker` + noopener noreferrer，curl -L 200 | 运行记录 | ✅ |

### C. 目录与无障碍

| # | 项 | 预期 | 实际 | 证据 | 结论 |
|---|---|---|---|---|---|
| C1 | 目录键盘全流程 | 打开/圈禁/Esc/遮罩/滚动恢复 | Enter 打开（焦点自动落关闭按钮）；Tab 12 次全部在面板项+关闭按钮内循环，**未逃逸到背景交互元素**（背景 nav/章节链接未出现于轨迹）；Shift+Tab 反向正常；Esc 关闭且焦点返回「目录」触发按钮；遮罩点击关闭（桌面 click 40,40 / 移动端 touchscreen.tap 遮罩区）；关闭后 scrollY 保持（2400→3000 连续）；背景点击未触发背景链接跳转 | `02/03/04/16-*.png` | ✅（P3-3/P3-7 备注） |
| C2 | 焦点样式/名称/alt/标题层级 | 可达性达标 | focus outline `solid 1.6px rgb(173,98,75)`（键盘 Tab 实测同值）；无名交互元素 0；图片 7 张 alt 全覆盖（3 空 alt 装饰 + 4 描述）；标题层级 h1×1（TIMECRAKER）+ h2 语义结构；`<html lang="zh-CN">` | 运行记录 | ✅ |
| C3 | 触屏区域 + 固定底栏遮挡 | ≥44px、不遮挡 | 390×844 DPR2 hasTouch：章节导航 44×44、回到顶部 88×44、入口 154/144×44、邮箱 342×65、复制 52×44、GitHub 59×44、目录按钮 70×44；联系幕处 fixed 元素 0 个（无固定底栏）；CDP touchStart/Move/End 原生滚动生效（scrollY→2795） | `14/15/16-*.png` | ✅ |
| C4 | `prefers-reduced-motion` | 真实禁用动效 | emulateMedia reduce：matchMedia 命中；可见 canvas 0（JS 演出未挂载，静态海报兜底可见）；运行中 CSS 动画元素 0；样式表含 15 条 prefers-reduced-motion 规则 | `17-reduced-motion.png` | ✅ |

### §9 可自动化项

| 项 | 实际 | 结论 |
|---|---|---|
| 多宽度横向溢出（320/360/390/430/768/850/**899/900**/1366/1920） | 十档 `scrollWidth ≤ clientWidth`，含 899/900 模式边界，全部零溢出 | ✅ |
| 移动端轻量素材 | 390 宽加载 reading-v1 全系 + works-v1 三个小 webp（共约 2.0MB），**未加载桌面 home-v1 大图** | ✅ |
| Edge 引擎 | msedge 154：/、/explore、/config、/projects/game 全 200、目录开/Esc 关、0 page error | ✅（`edge-smoke-result.json`） |
| 目录跳转正确性 | 目录点「AsterNova」→ `#chapter-game` top=88px、面板自动关闭 | ✅ |
| iOS Safari / Android Chrome / 物理高刷 | 无真机 | ⏳ 待真机确认（不冒充） |

## 3. 缺陷清单

### P1 — 旧根锚点兼容跳转落点错位 + 目标 hash 丢失

- **现象**：`/#projects` → `/explore#projects` 后停在 custom-dev 区（目标差 4134px）；`/#vote` → 差 2845px；`/#contact` → 差 2323px；最终 URL hash 被改写为途经区块（#custom-dev / #rag-demo / #services）。1.8s 与 4s 两次时序复现一致。
- **对照**：直接访问 `/explore#projects|services|vote` 落点全部精确（top=92px）、hash 稳定 → 兼容层独有。
- **根因推断**：`ArtDirectedPreview.tsx:128` `location.replace('/explore#…')` 后，浏览器在 explore 页图片布局稳定**前**执行锚点滚动（懒加载撑高布局后无校正）；explore scrollspy 随后按可视区改写 hash，目标锚点丢失。
- **影响面**：不止外部旧链接——`/projects/[slug]` 详情页「返回项目矩阵」(`page.tsx:131` href=`/#projects`) 与「咨询类似方案」(href=`/#contact`) 均走此路径，真实用户高频入口受影响。
- **证据**：两次复测数据（4134/2845/2323px 偏差 + finalHash 对比）；直接访问对照数据。

### P2 — 空库 FALLBACK 与 `/projects/[slug]` 数据源不一致

- **现象**：本地预览（DB projectLink 空表）下 `/api/public/projects`、sitemap、列表回退 FALLBACK 显示 lekao/publisher（enabled），但 `/projects/lekao`、`/projects/publisher` 实际 404（`[slug]/page.tsx:30` findUnique 直查 DB，无 FALLBACK）。
- **影响**：线上 DB 有真实记录时用户无感；但 DB 抖动/空表时「列表说有、详情 404」，违反 FALLBACK 兜底铁律的一致性精神。sitemap 声称存在的 URL 返回 404 亦有 SEO 损害（本地预览实测；线上 sitemap 由同一数据源生成，若线上 DB 完整则一致）。
- **证据**：`api/public-api-readonly.txt`（FALLBACK 数据）+ `api/dynamic-slug-final.txt`（404）+ `src/lib/project-links.ts:17-84` vs `src/app/projects/[slug]/page.tsx:29-31`。

### P3 — 轻微 / 记录项

1. **目录打开时背景滚动未锁定**：打开态 wheel 滚动仍生效（2400→3000）。关闭后位置连续，核心验收点（关闭后恢复滚动）不受影响。
2. **静态⇄动态切换重置回首幕**（§7 范围，跨范围发现）：scrollY 6200（第四幕）切静态 → scrollY=0/#chapter-hero；静态 4072 切动态 → 同样回 hero。任务书 §7 要求「切换保留当前章节」，实测不符，移交 MOTION/发布负责人。
3. **explore 直达 #vote 后 hash 被标为 #contact**：落点正确（vote top=92px），scrollspy 视口占比判定取了相邻区块，仅 URL 语义漂移。
4. **私密文件缩略图 401 破图**：/config/files 页面 `<img>` 直接请求私密文件 thumb → 401 + console error（页面显示「1 个已上锁」，业务边界本身正确）。
5. **复制成功提示常驻**：`copy` state 无超时复位，「邮箱已复制」与提示文字永久停留（失败提示同样常驻；无成功/失败误导混同，仅停留时长问题）。
6. **目录 Tab 序列存在 BODY 空档**：面板末项 → 1-2 次 Tab 落 body → 绕回关闭按钮；未逃逸到背景交互元素，圈禁实质成立。
7. **analytics track 429**：高频导航（测试行为）触发限流，beacon 静默失败无用户感知，正常防护。

## 4. 通过统计

- 主清单 21 项：**19 PASS、1 FAIL（A2→P1）、1 PASS 带 P2 备注（A3）**
- §9 可自动化 4 项全 PASS；待真机 3 项如实标注
- admin 安全红线（Bearer 只认 mint token、写操作审计边界、robots 隔离）全部符合

## 5. 环境干扰记录（非发布候选缺陷）

23:05–23:15 并行 BUILD 任务清空重建 `.next`（standalone 产物轮转，服务进程 26776→3104 由 BUILD 侧重启），期间出现：public 素材/字体 500（17 个）、`/_next/static/chunks` 500、动态路由 500、公开文件 thumb 404。**构建完成后全部复测恢复 200/404-as-designed**（`api/dynamic-slug-final.txt`、thumb 200 image/webp 142B）。该时段数据已在证据中标注，不作为缺陷统计。

## 6. 证据索引（`portfolio-release-2026-10-10/uiux/`）

- 截图 18 张：`01-home-hero` … `18-edge-smoke`（TOC 开/关、复制成功/拒绝、config/files、game、lab、静态模式、目录跳转、移动端 hero/contact/toc、reduced-motion、Edge）
- `http-status-scan.txt`：13 路由状态码
- `api/`：public-api-readonly、admin-boundary-robots、files-boundary、dynamic-slug-final
- `edge-smoke.mjs` + `edge-smoke-result.json`：Edge 冒烟脚本与结果
- `*.html`：/、/home-preview、/explore、/config、/config/files、/lab、/projects/* 原始 SSR 快照

## 7. 遗留与建议

- **P1 修复建议**（发布前）：兼容跳转后在 explore 侧对初始 hash 做布局稳定后二次 `scrollIntoView` 校正（或图片加尺寸占位防位移），并保护目标 hash 不被 scrollspy 即时覆盖；详情页「返回项目矩阵/咨询类似方案」可同时改指 `/explore#projects` 与新首页联系幕，绕开兼容层。
- **P2 修复建议**：`[slug]` 页在 DB miss 时回退 FALLBACK 同源判定（与 `getPublicProjectLinks` 一致），或 sitemap 只输出 DB 实际存在的 slug。
- 待真机：iOS Safari、Android Chrome、120/144Hz 物理屏幕（任务书 §9/§11，不冒充已测）。
