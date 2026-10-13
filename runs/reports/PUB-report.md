# PUB 走查报告（公开页 + 工作台，Stage31 清单第 1+2 项）

**执行**：2026-10-12 14:56–15:50 · Playwright MCP 真实浏览器走查 · 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`（main）
**开工 HEAD** `dfa2472`（构建对应 `a6cc734`，BUILD_ID `N3cuT3EzFUMCRYVO4wsf4`）→ **收工** 修复 commit `9caec05` 重建后 BUILD_ID `fiIliIi1Ih466KgpySJP3`
**环境**：3100 Web 正式构建 / 3002 AI / 3003 Export / 6380 Redis 全程存活；PG 5434 僵尸进程未触碰
**测试账号**：`e2e-stage31@resumeaix.test`（E2E 专用，注册送 200 T-Coin；走查后余额仍 200，未发起任何 AI 调用）

## 逐页覆盖数量

**清单 1–9（PUB 归属）：9 通过 / 0 失败 / 0 未测**

| # | 页面 | 结果 | 一句话结论 |
| --- | --- | --- | --- |
| 1 | `/` | ✅ | 六章节滚动渲染、FAQ 手风琴、能力切换、键盘 Tab/Enter 实测通过；console 仅基线 preload 警告 |
| 2 | `/login` | ✅ | 验证码/密码双 tab；非法邮箱与错误密码负例提示明确不误跳；正确密码登录→dashboard |
| 3 | `/register` | ✅ | 服务端 `redirect('/login')`，实测 302 落地 |
| 4 | `/cases` | ✅ | 3 案例卡 + 行业筛选生效，无溢出 |
| 5 | `/cases/[slug]` | ✅ | 返回链接/Before-After/亮点/CTA 完整；CTA 未登录→/login |
| 6 | `/pricing` | ✅ | 免费叙事完整、无付费触点；FAQ 可展开 |
| 7 | `/privacy` | ✅ | 9 章节；S31-PUB-01 修复后 0 字面 `**`、23 strong |
| 8 | `/terms` | ✅ | 9 章节；修复后 0 字面 `**`、27 strong |
| 9 | 404 | ✅ | HTTP 404 + FIG.404 主题页 + 双返回入口 |

**工作台链路（handoff 第 2 项，#10 /dashboard）**：列表渲染/卡片信息（状态徽章、版式标识、V 版本号、更新日期）、空态、创建、复制语义、删除确认、最近编辑排序、登出重定向——全部实测通过（台账见下）。

## 完成的链路

1. **登录全链**：非法邮箱负例 → 错误密码负例 → 密码登录成功 → dashboard → 登出 → 未登录访问 /dashboard 重定向 `login?callbackUrl=%2Fdashboard` → 重新登录回跳 /dashboard。
2. **创建→列表→复制→删除确认**：BFF `POST /api/resumes` 落库（UI 两条创建入口均为 AI 流，按「不调 AI」红线未发起调用，改走正常业务写路径）→ 列表/统计实时出现 → 编辑器基础结构确认（四步导航/8 章节/实时预览/自动保存，只看不改）→ UI 创建副本（确认层 Esc 关闭 + 焦点归还 + 确认创建）→ 删除确认层取消（资料保留）。
3. **复制语义四项断言**（UI + API 双取比对）：内容 JSON 完全一致 ✅；pipeline design==design ✅；版式 templateId null==null ✅；岗位 targetJD 逐字一致 ✅；附加：副本 version=源+1、parentId=源 id、status 重置 DRAFT、设计稿版本链独立（不共享/不丢失）✅。
4. **视口矩阵**：390×844 覆盖首页/登录/dashboard/案例详情四页（无横向溢出，document.scrollWidth==clientWidth 全绿）；768×1024 与 1920×1080 覆盖首页+dashboard；390 折叠导航可用（工作台抽屉项 44–48px；匿名公共菜单四项）。
5. **键盘**：首页 Tab 序（跳转链接→品牌→导航链接，焦点环 solid 可见）、Enter 激活导航与手风琴、确认弹层 Escape 关闭且焦点归还触发按钮。
6. **首页专项**：六章节滚动入场（全页截图空白为动画预期，滚动后渲染正常）、FAQ 七项手风琴、能力切换按钮状态机（下一个能力→继续下滑）。

## 缺陷台账摘要

| 编号 | 严重度 | 状态 | 摘要 |
| --- | --- | --- | --- |
| S31-PUB-01 | 低 | **已修已回归** | 法务页 `**` 字面星号裸露（terms 54 处）；新增 LegalText 组件仅解析行内加粗，两页接入；回归 0 星号 + strong 23/27 + console 0 错误 |
| S31-PUB-02 | 低 | 观察，不修 | design 简历无设计稿时 /design 404 console 噪音；resume-cover.tsx:104 已优雅降级，用户可见行为无损 |
| S31-PUB-03 | 低 | 观察，不修 | 复制后「最近编辑」主卡未立即切到副本（本地乐观插入暂态，刷新自愈，服务端排序正确） |
| S31-PUB-04 | 信息 | 观察，不修 | 次级控件触控目标 36–40px（tab/顶栏），主控件均 44px 达标；达 WCAG AA，建议 design 轮统一 |

无「已修未测」悬空项；无鉴权/数据隔离/跨页状态类复杂问题需要上报主控。

## 修复 commit

- `9caec05` `fix(legal): 渲染隐私政策与条款的加粗标记 / render bold markers on legal pages`
  - 新增 `apps/web/src/components/legal/legal-text.tsx`（whitespace-pre-wrap 保底 + 仅解析 `**加粗**`）
  - `apps/web/src/app/(public)/privacy/page.tsx`、`terms/page.tsx` 接入
  - 验证：`pnpm --filter @resumeaix/web type-check` 通过 → 生产 build 通过（exit 0）→ 按 runbook 杀旧树重启 3100（新 pid 28032）→ 同条件复测两页（前后截图见下）→ status-all 五项全绿

## 截图清单（41 张，均经读图目检）

目录：`C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/PUB/`

- 首页：home-1440-01（全页）、02-mid、03-quote、04-faq、05-cap-next、06-focus（焦点环）、home-390-01、02-anon（匿名头部）、03-anon-menu（匿名折叠菜单）、home-768-01、home-1920-01、home-1920-02-usermenu
- 登录：login-1440-01、02-bademail、03-bademail-submit（错误提示条）、04-wrongpw、05-dashboard-redirect（callbackUrl 落地）、login-390-01
- 案例：cases-1440-01、02-filter（行业筛选）、case-detail-1440-01、case-detail-390-01
- 定价/法务/404：pricing-1440-01、privacy-1440-01→02-fixed、terms-1440-01→02-fixed、404-1440-01
- 工作台：dashboard-1440-01（空态）、02-withcard、03-grid、04-copydialog、05-copied、06-deletedialog、07-reloadsort（排序复验）、08-callback-return（登录回跳）、dashboard-390-01、02-menu（390 抽屉）、dashboard-768-01、dashboard-1920-01
- 编辑器（只看）：editor-1440-01

## 自评与遗留

- **口径**：本地通过、生产未测（按红线不连生产/不部署）。全部断言基于真实页面操作 + DOM/API 双取证，无静态截图或 HTTP200 冒充。
- **红线遵守**：零 AI 调用（T-Coin 全程 200）；测试资料全部【E2E】前缀并保留（2 简历 + 副本链）；删除仅验证确认行为后取消；PG 僵尸进程未触碰；独占文件（upload/editor 核心件）零修改。
- **移交 MISC**：/dashboard 行已注记 PUB 实测范围，MISC 复测即可；/dashboard/transfer（#11）未在 PUB 范围，留给 MISC。
- **遗留**：S31-PUB-02/03/04 三项观察不修（理由见台账）；登录页 title 为站点默认标题（「ResumeAIX - AI 智能简历生成平台」）而非「登录 | ResumeAIX」，属 SEO 细节，未列为缺陷，建议后续 metadata 轮统一。
