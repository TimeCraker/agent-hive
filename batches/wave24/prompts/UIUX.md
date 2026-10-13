# UIUX · 原业务入口与 UI/UX 回归（本地 3108，只读）

## 总上下文
- 总任务书必读：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio/docs/handovers/homepage-release-and-acceptance-agent-prompt.md`（本任务覆盖 §8 全部 + §9 可自动化无障碍项）
- 工作目录：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`；预览 `http://localhost:3108/`（PID 26776，勿动）
- 证据目录：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/uiux/`
- Playwright/Chrome 环境变量同 MOTION 任务（先验证存在）

## 检查清单（每项记 预期/实际/证据/结论）
### 入口与业务
- `/explore`、`/explore#projects`、`/explore#services`、`/explore#vote` 正常；旧根锚点 `/#projects /#services /#vote` 兼容跳转到 /explore 对应区域
- `/config`、`/config/files`、有效 `/projects/[slug]`（先从项目列表取真实 slug）及既有固定路由正常
- `/home-preview` 页面源码含 noindex；`/lab/character-motion` 实验页功能独立、控件不泄漏到正式首页
- 线上配置驱动的链接：ResumeAIX / AsterNova 入口读取**本地预览环境实际配置**的真实 URL（不假定默认值）；外链 rel 属性检查；外链只打开验证不登录不操作
- 原站导航/项目列表/配置工具/文件分类/公开 API：只读回归，检查业务响应数据结构正确性（不仅状态码）
- 管理后台/登录/权限边界：只读检查（未登录访问受保护页的跳转/提示）

### 联系与交互
- 联系邮箱地址正确、mailto href 正确；HTTPS 语境下本地为 http，仍测复制成功 toast；**拒绝剪贴板权限**的回退提示有反馈、无永久「复制成功」误导
- GitHub 链接打开正确账号

### 目录与无障碍
- 目录按钮键盘打开、Tab 焦点圈禁、Shift+Tab、Esc 返回触发按钮、遮罩点击关闭、关闭后滚动恢复；背景不可误点
- 清晰焦点样式、按钮/链接可读名称、图片 alt、语义标题层级
- 触屏点击区域足够；固定底栏不遮挡邮箱/项目入口/正文
- `prefers-reduced-motion` 真实禁用相关 CSS/JS 动效（emulateMedia 验证）

## 红线
- **全只读**：不写入/不造数据/不修改项目配置/不投票/不上传/不发邮件；测试用例需要登录态的只做未登录边界
- 不 commit、不部署、不动 3108 进程

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\UIUX-report.md`。
