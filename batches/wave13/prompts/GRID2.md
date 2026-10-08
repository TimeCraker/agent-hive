# GRID2 · 封面网格：可读缩放 + 渐隐 + 页数徽

## 背景（接续上一轮 GRID 任务的返工）
`apps/web/src/components/dashboard/resume-cover.tsx` 当前状态（上一轮 GRID 任务改的）：
- `windowH = (width * 297) / 210`（统一 A4 窗口，保留）
- `scale = Math.min(width / 820, windowH / contentH)`（等比缩小到完全放入——**用户否了：字太小像缩略图**）
- page div 有水平居中 `left: (width - 820*scale)/2`
- `editorial.css` 里 `.folio-resume-cover` 的 background 被改成了 transparent

## 新设计（行业标准文档卡模式，全部按此实现）
1. **scale 恢复 `width / 820`**（宽度撑满、文字可读）
2. **窗口高度保持统一 A4 比例** `windowH = (width * 297) / 210`（整列整齐，不变）
3. **底部渐隐**：内容超出窗口时，封面底部叠加约 28px 线性渐隐遮罩
   （从 transparent 渐变到 `var(--secondary)` 米色，纸面自然溶入衬底）
4. **「共 N 页」小徽**：右下角（bottom: 8px; right: 8px），mono 字体 10px，
   `N = Math.ceil(contentH / PAGE_A4_H)`，**N <= 1 时整个徽不渲染**；
   样式参考卡片内已有 mono 小徽（如 FIG.01 的排版风格），半透明白底 + border
5. **删除水平居中 left 逻辑**（宽度撑满后 left=0）
6. `editorial.css` 的 `.folio-resume-cover` background 恢复 `#fff`

## 验收自检
- `pnpm --filter @resumeaix/web type-check` 与 `lint` 通过（在仓库根跑）
- 单页简历：完整可见、无渐隐、无页数徽
- 多页简历：第一页可见 + 底部渐隐 + 「共 2 页」徽

## 禁止
- 不 git commit（主控审查后统一提交）
- 不碰 folio-recent-cover、resume-list.tsx 业务逻辑、字体相关文件（FONT 任务已单独完成）
- 不碰 apps/interview-helper/、scripts/eval-* 等无关 dirty 文件

## 报告
**绝对路径** `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\GRID2-report.md`
（整文件覆盖写）：改动文件、渐隐与徽章实现、验证说明。
