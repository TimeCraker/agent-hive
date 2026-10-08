# GRID2 报告 · 封面网格可读缩放 + 底部渐隐 + 页数徽

## 结论

GRID2 规格六条全部落地，`type-check` 与 `lint` 零告警通过。未 commit（按要求留待主控审查）。

## 改动文件（2 个，均为本任务目标文件）

| 文件 | 改动 |
|---|---|
| `apps/web/src/components/dashboard/resume-cover.tsx` | scale 恢复满宽、删水平居中、加 overflowing/pages 计算、条件渲染渐隐类与页数徽 |
| `apps/web/src/app/editorial.css` | `.folio-resume-cover` 背景恢复 `#fff`；新增 `.folio-cover-fade::after` 渐隐遮罩与 `.folio-cover-pages` 徽章样式 |

## 规格逐条对照

1. **scale 恢复 `width / 820`** ✅ — 删除 `Math.min(width / 820, windowH / contentH)`，宽度撑满、文字可读。
2. **窗口高度统一 A4 比例** ✅ — `windowH = (width * 297) / 210` 保留不变，整列网格整齐。
3. **底部渐隐** ✅ — `contentH * scale > windowH + 1` 时给封面根节点追加 `folio-cover-fade` 类；CSS `::after` 伪元素覆盖窗口底部 28px，`linear-gradient(to bottom, transparent, var(--secondary))`，纸面自然溶入米色衬底。+1px 容差防单页满高时闪烁。
4. **「共 N 页」徽** ✅ — `N = Math.ceil(contentH / PAGE_A4_H)`（PAGE_A4_H = 820×297/210 ≈ 1159px），`pages > 1` 才渲染；定位 `right: 8px; bottom: 8px`，`var(--font-mono)` 10px/1 + `letter-spacing: 0.04em`（对齐 FIG.01 图注徽的 mono 排版节奏），半透明白底 `rgba(255, 255, 255, 0.75)` + `1px solid var(--border)`，`z-index: 1` 保证压在渐隐层之上。
5. **删除水平居中** ✅ — page div 不再注入 `left`，CSS `.folio-cover-page` 固定 `left: 0; transform-origin: top left`。
6. **背景恢复** ✅ — `.folio-resume-cover` 的 `background` 从 `transparent` 恢复为 `#fff`。

## 行为自检（逻辑推演）

- **单页简历**：`contentH ≈ PAGE_A4_H` → `contentH * scale ≈ windowH`（差值在 +1 容差内）→ 无渐隐类；`pages = 1` → 徽不渲染。纸面完整可见。
- **多页简历**：`contentH > PAGE_A4_H` → 第一页可见 + 底部 28px 渐隐 + 右下「共 2 页」徽。
- **design 线 iframe**：高度固定单页（既有语义未动），恒为无渐隐、无徽。

## 验证说明

- `pnpm --filter @resumeaix/web type-check` — 通过（tsc 零输出）。
- `pnpm --filter @resumeaix/web lint` — 通过（eslint 零输出）。
- `git diff --check`（两目标文件）— 无空白错误。
- **未做真实页面走查**：本机 `next dev/start` 不可用（既有环境限制，见 memory「web dev 工具链坑」），单/多页行为以代码逻辑推演替代，建议主控在真机回归时抽查一张多页简历封面。
- **边界确认**：`apps/interview-helper/next-env.d.ts`、`scripts/eval-*`、eval 截图等无关 dirty 文件未触碰；folio-recent-cover、resume-list.tsx、字体文件未动。

## 执行备注

接手时工作树已有本任务约九成完成的半成品（推测上一 GRID2 会话中断遗留，报告缺失）。本会话逐条核验后补齐两处规格偏差：徽章定位 10px→**8px/8px**、底色米色实底→**半透明白底 rgba(255,255,255,0.75)**，其余保留并复核通过。
