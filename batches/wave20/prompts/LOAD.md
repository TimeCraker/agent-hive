# LOAD · 编辑器加载页「纸张正在被书写」动画

## 现状
`apps/web/src/components/visual/page-loading.tsx`：静态纸张骨架（folio-loading-paper 内 4 个 span）
+ 文案「正在打开你的工作台…」。样式在 `apps/web/src/app/editorial.css` 的 `.folio-loading*` 段落。

## 动画编排（用户定稿方向：动态化，基于现有纸张美术升级）
项目已有 framer-motion 与 useReducedMotion（参考 vibe-chat-panel.tsx 的用法）。组件加 'use client'。

1. **① 纸张入场**（一次性）：initial `{ opacity: 0, y: 20, rotate: -2 }` → animate 到位
   `{ opacity: 1, y: 0, rotate: 0 }`，duration 0.6s ease [0.22,1,0.36,1]，阴影随透明度自然显现
2. **② 标题条书写**：copper 标题条（第一个 span）scaleX 0→1，`transform-origin: left`，0.8s
   ease-out，delay 0.4s（等纸张落定）；右端跟一个 6px 铜色光点（absolute 小圆）同步从左扫到右后淡出
3. **③ 骨架行依次书写**：其余 3 条灰线逐条 scaleX 0→1（origin left），每条 0.5s，错峰 delay
   0.15s（0.55/0.7/0.85s 起）；长短差异保留（现有 span 宽度不同）
4. **④ 呼吸循环**：书写完成后整纸 `animate={{ y: [0, -4, 0] }}` transition repeat Infinity
   duration 3s ease-in-out；骨架行透明度 [1, 0.55, 1] 同步呼吸（transition delay 与书写完成衔接）
5. **⑤ 文案省略号**：「正在打开你的工作台」后跟三个点 span，依次点亮循环（opacity 0.25→1，
   每个 0.4s 错峰，周期 1.2s 循环）
6. **reduce-motion 降级**：`useReducedMotion()` 为 true 时全部动画禁用 → 输出与现状等价的静态版本
7. **可访问性**：保留 role="status" aria-label="页面加载中"

## 实现约束
- 动画优先 framer-motion（项目已有依赖）；循环呼吸/shimmer 可用 motion animate 数组语法
- editorial.css 里 `.folio-loading*` 若有与动画冲突的静态样式可微调，不破坏其他使用处
  （先 grep `.folio-loading` 确认只有 page-loading 在用）
- 不碰其他组件、不 git commit、不跑 install/build

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\LOAD-report.md`。
