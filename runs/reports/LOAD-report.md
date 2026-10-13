# LOAD 报告 — 编辑器加载页「纸张正在被书写」动画

## 结论

已按定稿方向完成动态化：静态纸张骨架升级为「纸张入场 → 铜色标题条书写（笔尖光点随行）→ 三条灰线依次书写 → 整纸呼吸循环 → 文案省略号依次点亮」五段编排，reduce-motion 降级为与原静态版本等价的输出。

## 改动文件（2 个）

### 1. `apps/web/src/components/visual/page-loading.tsx`（重写，+110/-7）

- 加 `'use client'`；`useReducedMotion` 取自 `@/lib/animation`（项目惯用封装，含 localStorage 覆盖，参考 vibe-chat-panel.tsx），framer-motion `motion` 直用（web 已有依赖 ^12.38.0）。
- **① 纸张入场**：外层 motion.div `initial {opacity:0, y:20, rotate:-2} → {opacity:1, y:0, rotate:0}`，0.6s，ease `[0.22,1,0.36,1]`，阴影随 opacity 自然显现。
- **② 标题条书写**：copper 条 scaleX 0→1（origin left），0.8s ease-out，delay 0.4s；新增 6px 铜色光点 `.folio-pen-dot`（absolute 圆点 + 同色 box-shadow 光晕）`left 0%→55%`（55% = 标题条宽），与 scaleX 同 easing 同时长，笔尖始终对齐书写头，写完淡出（opacity 关键帧 [0,1,1,0]）。
- **③ 灰线依次书写**：3 条灰线 scaleX 0→1（origin left），各 0.5s ease-out，delay 0.55/0.7/0.85s；长短差异保留（末条 65% 宽类）。
- **④ 呼吸循环**：写在 `.folio-loading-paper` 本体（纸张卡片整体浮动）`y [0,-4,0]`，3s ease-in-out 无限循环，delay 1.4s（衔接末线 1.35s 写完）；灰线 opacity `[1,0.55,1]` 同 delay 同时长循环，与整纸同相同步。
- **⑤ 省略号**：「正在打开你的工作台」+ 3 个点 span 依次点亮（opacity 0.25→1→0.25，各周期 1.2s、错峰 0.4s，关键帧含点亮-保持-熄灭节奏）；点组 `aria-hidden="true"`，避免读屏念出断续句点。
- **⑥⑦ 降级与可访问性**：`useReducedMotion()` 为 true 时走静态分支——4 条线全宽呈现、纸张内联 `rotate(-3deg)`、文案带「…」，与原版视觉等价；两分支均保留 `role="status" aria-label="页面加载中"`。

### 2. `apps/web/src/app/editorial.css`（`.folio-loading*` 段，仅此组件在用，已 grep 确认）

- `.folio-loading-paper` 摘除 `transform: rotate(-3deg)`（framer 动画结束时收敛为 `transform: none`，CSS 倾斜会在入场结束时回穿造成 0°→-3° 跳变；倾斜改由组件分支内联控制）。
- 原 `.folio-loading-paper span / span:first-child / span:last-child` 结构选择器改为类选择器 `.folio-line / .folio-line--title / .folio-line--short`（新 DOM 中标题条嵌在行包裹层内，:first/:last 选择器会误伤，类化后静态/动画两分支共用同一套线样式）。
- 摘除 span 上的 `animation: folio-thinking …`（keyframes 动画 opacity，会压过 framer 的 opacity 呼吸关键帧；`@keyframes folio-thinking` 定义保留，folio-live-paper 1760 行仍在用）。
- 新增 `.folio-line-row`（标题行包裹层，relative 定位承载光点）与 `.folio-pen-dot`（6px 铜色圆点）。
- 删除随之死掉的 `@media (prefers-reduced-motion: reduce) { .folio-loading-paper span { animation: none } }` 块。

## 验证

| 项 | 命令 | 结果 |
|---|---|---|
| TS 类型 | `pnpm --filter @resumeaix/web type-check` | ✅ 0 错误（含 framer-motion transition/times 类型校验） |
| ESLint | `pnpm exec eslint src/components/visual/page-loading.tsx` | ✅ 0 问题（scoped，全量 lint 有存量 error 未跑） |
| Prettier | `prettier --check` 两改动文件 | ✅ 双双合规 |

## 未验证项 / 风险

- **真实页面动效未跑**：任务约束不跑 install/build，且本机 `next dev` 不可用（既有环境问题），未做浏览器目验。时序参数均按定稿值直写，建议部署后在 `/dashboard`、`/editor` 任一 loading 态过一眼。
- 呼吸 delay 统一取 1.4s（末线 1.35s 写完 + 衔接），若希望呼吸提前到标题条写完（1.2s）即可调 `BREATH_DELAY` 常量，单点可调。
- 未 git commit（按任务约束）。
