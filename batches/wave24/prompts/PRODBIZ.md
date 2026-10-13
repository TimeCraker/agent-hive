# PRODBIZ · 线上原业务/API/SEO 只读回归

## 前置：DEPLOY 已验收

## 总上下文
- 总任务书必读 §12（原业务部分）：`.../my-portfolio/docs/handovers/homepage-release-and-acceptance-agent-prompt.md`
- 目标：`https://asterforge.top`；证据目录 `C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/prodbiz/`

## 检查清单
### 公开 API 与数据（只读）
- 既有公开 API（项目列表/配置/文件分类等，以实际路由为准）：业务响应数据结构正确（不只状态码）、错误处理正常
- 数据库关键业务记录仍在：SSH 只读 `sqlite3`（readonly 模式 `file:...?mode=ro`）抽查 projects 等关键表 row count 与部署前 DEPLOY 备份记录比对；无 P2021/数据库打不开
- 上传文件仍可访问（public/uploads 抽查既有文件 200 + Content-Type 正确）
### SEO 与元数据
- `/` title/description/canonical/OG 正确且为六幕正式页；`/explore` canonical 正确；sitemap、robots 可达且规则正确；`/home-preview` noindex
### 缓存与传输
- 静态资源缓存头/压缩合理且与内容版本匹配；`/_next/image` 缓存保留（非全量 no-store）；私人/权限数据无公共缓存头
### 日志（脱敏）
- 服务器 journalctl 近期日志：无新 P2021/持续 500；历史无关错误分清不计入本次

## 红线
- 全只读；不写库不造数据不清缓存不重启服务；日志输出脱敏；不输出凭证

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PRODBIZ-report.md`。
