# PRODUI · 线上 HTTPS 六幕与入口回归

## 前置：DEPLOY 已验收（线上 = 发布 SHA）

## 总上下文
- 总任务书必读 §12：`.../my-portfolio/docs/handovers/homepage-release-and-acceptance-agent-prompt.md`
- 目标：`https://asterforge.top/`（真实域名，不是 localhost）
- 证据目录：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/produi/`（每幕桌面+手机截图，命名 act*-desktop.png / act*-mobile.png）
- Playwright/Chrome 环境变量同 MOTION（先验证存在）

## 检查矩阵（§12 + §7/§8/§9 的线上重跑）
- HTTP→HTTPS 跳转、域名证书、无混合内容（https 页面无 http 资源请求）
- 首页六幕完整：桌面（1920×1080 至少 + 1366/1440 抽查）+ 手机（390 为主 + 320/430 抽查，hasTouch/isMobile/CDP 触摸）；每幕截图
- 正反慢滚/快滚/转场停住/深链接×6（首次/刷新/新标签/前进后退）线上重跑
- 章节导航/目录/回到顶部/静态切换线上可用且保留章节
- /explore、/explore#projects/#services/#vote、旧根锚点兼容、/config、/config/files、/projects/[slug]、/home-preview（noindex 源码确认）、/lab/character-motion 线上可达
- ResumeAIX/AsterNova 入口读**线上配置**真实 URL；联系邮箱复制（授权+拒绝两态）；GitHub 正确账号
- Console 无错误、网络无失败请求（区分既有第三方问题）；截图与本地 3108 基准目视对照一致
- 首轮通过后短时健康观察（如 5 分钟内间隔 3 次 curl 首页与一个静态资源），记录时段与结果；不创建永久定时任务

## 红线
- 全只读（不登录不写不发邮件不投票）；不 commit；失败持续 5xx/核心素材 404 → 报告给主控决定回滚，不自行回滚

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PRODUI-report.md`（逐项 预期/实际/截图路径/结论 + 未测真机项清单）。
