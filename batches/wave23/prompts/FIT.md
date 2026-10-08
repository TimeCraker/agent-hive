# FIT · 预览默认自适应 + 视图按钮明显化

## 问题（用户反馈：右侧预览不完整只有一半）
`apps/web/src/components/editor/zoom-preview.tsx`：
- 默认 `useState<ZoomMode>('width')`（适宽 60%）→ 纸张高度超出视口被截半
- 「自适应完整显示」模式已存在（`'fit'`，fitScale = min(宽比, 高比, 1)）但只是个无人注意的小图标按钮
- 「适宽」按钮（folio-width-button，约 121-128 行）视觉太弱

## 改造要求
1. **默认改 `'fit'`**：`useState<ZoomMode>('fit')`——用户定稿「默认自适应高度，整页完整可见」
2. **适宽按钮明显化**：`StretchHorizontal`（lucide）图标 + 「适宽」文字的组合按钮；
   选中态（aria-pressed=true）：`bg-[var(--primary-deep)] text-white border-[var(--primary-deep)]`；
   未选中：`border-[var(--primary-deep)]/40 text-[var(--primary-text)] hover:border-full hover:bg-card`；
   统一 `rounded-lg border px-2.5 py-1.5 text-xs flex items-center gap-1.5 btn-press`
3. **自适应按钮同步升级**：`Maximize2` 图标 + 「适应」文字，样式同上（aria-pressed 由 zoom==='fit' 驱动），
   保留原 title/aria-label；原来单独的图标小按钮删除（合并进新组合按钮）
4. +/- 与百分比控件排布不动；两组之间分隔线保留
5. 行为不变：点击适宽 setZoom('width')、点适应 setZoom('fit')、+/-/数字缩放逻辑不动

## 禁止
- 不碰 guided-resume-desk.tsx / page.tsx（另一并行任务在改）
- 不 git commit、不跑 install/build

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FIT-report.md`。
