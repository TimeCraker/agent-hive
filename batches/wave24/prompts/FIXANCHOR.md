# FIXANCHOR · 发布前缺陷修复批次（3 项：P1 锚点 + WebGL 降级 + hashchange）

## 缺陷清单（按优先级）

### 缺陷 1【高】WebGL 初始化失败降级不完整（MOTION §6.2）
- 现象：`getContext('webgl'/'webgl2')` 返回 null（无 GPU/驱动黑名单/关硬加/远程桌面）→
  `motionError` 设置但 `dataset.active` 仍 "true"（UI 矛盾显示「动态浏览」按钮），六幕 section 全 0×0，
  文档高度 900px 单屏死页，二至六幕不可达。
- 根因方向：mount 的 try/catch `setActive(false)` 后错误路径 ReadingStory 容器尺寸塌陷，
  与正常「静态阅读」布局不一致；dataset.active 与 React 状态不同步。
- 复现：`addInitScript` 让 getContext 对 webgl/webgl2 返回 null → `goto /` → scrollHeight===900。
- 修复方向：初始化失败与运行中丢失走同一 fallback 渲染路径（运行中丢失已 PASS 可对照）；
  修后验证：scrollHeight 恢复多幕、全部 #chapter-* 高度 >0、六幕可读可滚、无矛盾按钮态。
- 参考位置：`src/components/character-motion/ArtDirectedPreview.tsx`（mount try/catch 与 ReadingStory 渲染分支）、
  可能涉及 `ReadingStory.tsx` 容器尺寸。

### 缺陷 2【P1】旧根锚点跳转落点错位（UIUX A2）
- 现象：`/#projects` → /explore 落 custom-dev 区（差 4134px）、#vote 差 2845px、#contact 差 2323px；
  hash 被改写；直接访问精确。详情页「返回项目矩阵」同路径。
- 主控已定位线索（先复核）：主嫌疑 = /explore 原生锚点滚动发生在布局稳定前（上方懒加载内容后展开推走目标）；
  次嫌疑 = 六幕页 mount 时 `replaceState('#chapter-hero')`（ArtDirectedPreview.tsx:373 附近）抢在 legacy
  跳转（:111-131）前改写 hash 的竞态。/explore 自身无 scrollspy（已确认）。
- 修复方向：/explore 加锚点落定 effect（`document.fonts.ready` + 上方图片稳定后
  `scrollIntoView({behavior:'instant'})`，globals.css 已有 scroll-margin-top；落定期锁 hash）；
  `/` 侧保证 legacy 判断优先于 chapter 重置。
- 验证：`/#projects /#services /#vote /#contact` 落点 = 目标 top ±10px 且 hash 保持；直接访问回归；详情页返回路径；冷/暖缓存。

### 缺陷 3【中】动态模式同文档 hash 导航不响应（MOTION §6.1）
- 现象：动态演出模式中地址栏改 hash / 前进后退 → URL 变但 chapter 与滚动不动（静态模式正常）。
- 根因：`ArtDirectedPreview.tsx:291-293` hashchange 监听（jumpToHash）仅静态阅读挂载。
- 修复方向：动态模式也监听 hashchange，按 hash 找 chapter.progress scrollTo（navigateChapter 有等价逻辑可复用）。
- 验证：动态模式 goto /#chapter-about → chapter 跟随；goBack → 回退正确；静态模式回归。

## 通用要求
- 最小改动，不改美术、不动演出时间轴语义、不引入依赖；每项独立可回退
- 完成后：`pnpm run typecheck` + `pnpm run lint` 全过；重建 standalone 重启 3108 验证（当前预览 PID 3104，
  先查端口归属只停本项目进程；重建流程与两件套补拷见 BASE 报告 §4 与 MOTION §2.2 先例——备份 prisma/data 再动）
- 修复后重跑受影响验收：MOTION 的 6.1/6.2 复现脚本重测通过 + UIUX 的 A2 锚点矩阵通过
  （复现手法见各自报告；MOTION 的 Playwright 复现片段可直接借用）
- 不 commit（主控审查后统一提交）；不部署

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FIXANCHOR-report.md`：
逐缺陷 根因结论/改动文件与 diff 摘要/修复前复现与修复后验证输出。
