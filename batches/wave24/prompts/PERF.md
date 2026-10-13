# PERF · 性能与高刷采样（独占时段）

## 总上下文
- 总任务书必读：`.../my-portfolio/docs/handovers/homepage-release-and-acceptance-agent-prompt.md`（本任务覆盖 §10 弱网缓存 + §11 性能）
- 工作目录：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`；预览 `http://localhost:3108/`（PID 26776）
- 证据目录：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/perf/`
- **独占要求**：采样期间不跑构建/Lighthouse 之外的重负载；与 MOTION/UIUX 不并行（主控保证）

## A. 流动性采样
- `scripts/character-motion/measure-fluidity.mjs`（PREVIEW_URL 完整页面 URL；输出路径固定 → 复制为证据目录内发布专用变体再跑，不覆盖既有证据）
- 覆盖：桌面正反滚、手机 CDP 触摸（hasTouch/isMobile）、CPU 4 倍降速；每关键场景 ≥3 次，冷/暖缓存分开，记中位数与 P95/P99、长任务、超帧预算次数、输入到画面响应、资源量
- Chrome Performance trace：CPU 绘制/布局/paint/合成层；明确采样层次（rAF / GSAP ticker / WebGL draw / 物理显示各自数值，不得互相替代冒充）
- WebGL 纹理数量有界：正反跳转+模式切换多轮后不无限增长；连续滚动-停住-再切多轮查内存/监听器/ticker/DOM 泄漏

## B. Lighthouse
- 桌面+移动分别跑（本地 3108），记 FCP/LCP/CLS/TBT、资源瀑布、实际首屏图；LCP 2.5s / CLS 0.1 关注但不把分数当动画验收；无真实 INP 数据不得用 TBT 假称 INP 通过

## C. 弱网与缓存（§10）
- 普通流量 + 慢网（~1.6Mbps 下行 / 150ms 延迟，记录实际参数）+ CPU 4x
- 冷缓存（全新上下文）与暖缓存分开：首次加载、加载中快滚到后面、加载中倒滚、深链接直达后章
- 弱网先有定格图与可读内容，无白屏/长 spinner；失败注入（单张原画失败/图片优化失败/JS 分块失败/断网恢复，仅本浏览器拦截）→ 可读降级明确
- 静态资源/字体/CSS/JS 无 404；懒加载不明显顶开布局；冷/暖访问请求数与传输字节对比、图片是否重复下载（结合自然尺寸与截图）

## 诚实性要求
- 不宣称「稳定 120FPS」；60/120/144Hz 单帧预算 16.67/8.33/6.94ms，只报实测证据；物理高刷列「待真机确认」
- 不人为锁帧、不删已认可美术、不静默关动作换分；若结果差，定位瓶颈给最小修复建议（报告，不自行改码提交）

## 红线
- 不 commit、不部署、不动 3108；采样期不并行其他重任务

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PERF-report.md`（含原始数据文件在证据目录的相对路径）。
