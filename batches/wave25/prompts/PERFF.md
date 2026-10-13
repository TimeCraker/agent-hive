# PERFF · 性能最小优化实施（主控已裁决范围）

## 批准清单（只做这些）
- **P1 基础**：阻断 reading-v1 三图（ai/software/hardware.webp，990KB）慢网预取——
  fetchpriority="low" / IntersectionObserver 挂载 / 收窄预取窗口，任选最稳实现
  （位置 `ReadingStory.tsx:111` 一带，`unoptimized` 直出）
- **P1 进阶（条件）**：三图去 unoptimized 走 next/image avif——**必须先出同图源画质对照**
  （优化前 webp vs avif 放大目检+像素 diff），画质可接受才上；否则只做基础版并在报告说明
- **P2**：about-poster 显式 `fetchpriority="high"`；hero-poster 的 preload 补 fetchpriority
- **P4（尝试项）**：合并双 rAF 循环（页面渲染循环+GSAP ticker）——**收益门槛**：同条件复测
  主线程利用率或长任务无可见改善（<3%）就**撤回**并说明
- **P5**：每帧写入值去重守卫（complete-motion.ts:71-72 dataset.available、gameCopy gsap.set
  按 previousClose 模式加比较）

## 明确不做
- P3（GSAP SVG transform 换轨/降频）——延后独立专项（触碰认可美术实现路径，需像素级验收）
- CJK 字体切片、desktop pose 图、HTML 瘦身（PERFB 已评估不动）

## 基线与对比口径（与 PERFB 完全一致）
- PERFB 基线：CDP 冷缓存 LCP 5548ms / FCP 1368ms / 2048KB；桌面 CPU4x 主线程 94-96%、
  ULT 857-912 次；其环境记录见 PERFB-report §1.1
- 优化后同条件复测：冷/暖各 ≥3 轮中位数+波动；LCP 目标向 2.5-3s 推进（P1+P2 叠加预期），
  未达 2.5s 如实记录剩余原因
- CLS ≤0.1 且不隐藏首屏大图；慢滚/快滚/反向/突然停住/加载中操作回归正常
- 手机零桌面纹理下载保持（网络断言）
- 899↔900 边界 20 轮（最终候选判据，Set 去重口径，PERFB §4 方法）

## 工程要求
- typecheck + lint + 动作单测 23 个 + 生产构建过
- 构建/预览：主仓当前 HEAD（含 FIXUX 9a443e6 与 RUNBOOK d6e9f32）重建 3108 做验证
  （注意先停服防 EBUSY、先拷 static 再起服）；PERFB 的隔离 worktree 口径仅它自用，你用主仓
- 不 commit（主控审查后统一提交）；不部署

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PERFF-report.md`：
逐项前/后数据表、实施 diff 摘要、P4 撤回与否及数据、avif 画质对照结论、20 轮边界判定、
剩余差距如实。证据 `C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-followup-2026-10-11/perff/`
