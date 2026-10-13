# REGRESS2 · 线上相邻回归 + 手机性能复测（前置：DEPLOY2 已验收）

## 范围（相邻回归，不重做十三任务全量）
### A. 三项修复的线上确认
1. **R1 模式切换**：第 2/4/6 幕双向切换线上保留章节（截图+chapter dataset 断言）
2. **R2 旧锚点**：新标签首次 + **页内 hash 切换**（上轮漏测路径）+ 前进后退 ×
   projects/services/vote；抽查 #custom-dev；chapter-* 回归
3. **回滚 runbook**：仅核对线上可访问性与新报告引用（不演练回滚）
### B. 相邻回归（上轮已过的抽样确认未被本轮改动破坏）
- 手机 390/320 布局 + 零桌面纹理下载；桌面六幕导航 + 深链接抽查 ×2
- /explore /config /projects/[slug] ×1 + 公开 API 业务结构（projects/votes/files）
- 六幕定格截图 ×2 幕（对照上轮线上基准，无美术退化）
### C. 线上性能复测（PERFF 的线上版）
- **HTTPS 真实域名**冷/暖各 ≥3 轮：手机 LCP/FCP/字节/请求；Lighthouse 移动+桌面
- 与 PERFB（本地 eae5d8b 基线）和 PERFF（本地优化后）三方对比成表
- 桌面慢滚健康抽样（rAF P95 一轮即可，非完整专项）
- 记录环境与网络实况（跨境延迟如实标注）
### D. 日志与健康
- 部署后 journalctl：P2021/5xx 计数；短时观察 3 探测 × 3 轮（不建定时任务）

## 红线
全只读（不登录/不投票/不发邮件）；自动化副作用（埋点 204/下载计数/审计）如实披露；
真机项维持「未测」清单不冒充。

## 环境
PREVIEW_URL=https://asterforge.top/（注意线上冷缓存用全新上下文）；证据
`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-followup-2026-10-11/regress2/`

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\REGRESS2-report.md`：
逐项 预期/实际/证据/结论；性能三方对比表；未测真机清单。
