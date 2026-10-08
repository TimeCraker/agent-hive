# OPEN · 加载动画开场帧构图丰富化

## 问题（用户反馈：动画最开始那一帧太素了）
`apps/web/src/components/visual/page-loading.tsx`（wave20 已做书写动画）。当前 t=0 首帧：
纸张 opacity 0 + 全部线条 scaleX 0 → 开场画面只有米色底和一行文字，非常空。

## 目标
**第 0 帧就是完整构图**——场景元素（背景/装饰/文字）不参与入场动画、从第一帧就在；
只有纸张和线条做动画。开场像一页"排版好的稿纸台面"，而不是空白。

## 构图元素（全部 editorial 语言，铜/米/白三色）
1. **图纸网格背景**：加载区背景加 drafting 网格（参考首页 hero 的网格做法——
   检索 `drafting` 或 linear-gradient 网格；没有就用 1px 线 32px 网格的
   `background-image: linear-gradient(...) , linear-gradient(...)` 双向实现，颜色 `var(--border)`/40）
2. **纸张四角标记**：纸张外围四角加 corner marks（folio 风格 L 形角标，铜色 /40，
   参考 folio-create-card 或 folio-intake-note 的角落标记类；没有就 12px L 形 border 实现）
3. **mono 眉题**（纸张上方）：`WORKBENCH · 正在准备` 10px mono tracking 宽，静态即显
4. **品牌圆徽**：眉题同排或上方放 BrandMark（@/components/visual 里已有，vibe 面板在用）小号
5. **进度数字**：书写时间轴同步的 mono 大数字百分比（0→100，1.4s 内走完，与书写进度对齐；
   到 100 后随呼吸循环保持 100 或轻微脉动）——放纸张右下角或眉题右侧，
   `font-mono text-[11px] tabular-nums` 风格与站点 mono 徽一致

## 约束
- 现有动画阶段（入场/书写/呼吸/省略号/reduce-motion 回退）**全部保留**，只加场景层
- 新增场景元素不做入场动画（第一帧就在），进度数字除外（它本身就是动画）
- reduce-motion 分支同步补场景元素（静态、无进度动画或直接 100）
- 不碰其他组件、不 git commit、不跑 install/build

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\OPEN-report.md`。
