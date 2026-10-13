# FIT · 预览默认自适应 + 视图按钮明显化 — 实施报告

**状态**：✅ 完成 · type-check 通过 · 未提交（按禁令） · 未跑 install/build

## 变更文件（2 个）

### 1. `apps/web/src/components/editor/zoom-preview.tsx`

| # | 改造点 | 实现 |
|---|--------|------|
| 1 | 默认模式 `'width'` → `'fit'` | `useState<ZoomMode>('fit')`（37 行）。首屏即整页完整可见，不再截半 |
| 2 | 适宽按钮明显化 | `StretchHorizontal`（lucide）图标 + 「适宽」文字组合按钮；`aria-pressed={zoom === 'width'}`；选中态 `border/bg-[var(--primary-deep)] text-white`，未选中 `border-[var(--primary-deep)]/40 text-[var(--primary-text)]` + hover 变实边框 + `hover:bg-card`；基底类 `btn-press flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs`（另补 `transition-colors`，与相邻 +/- 按钮一致） |
| 3 | 自适应按钮同步升级 | `Maximize2` 图标 + 「适应」文字组合按钮，样式同上；`aria-pressed={zoom === 'fit'}` 新增；保留原 `title="自适应（完整显示）"` / `aria-label="自适应完整显示"` / `onClick={handleFit}`；原纯图标小按钮已删除合并 |
| 4 | +/- 与百分比控件 | 未动 |
| 5 | 两组间分隔线 `<span className="mx-1 h-4 w-px ...">` | 保留未动 |
| 6 | 行为逻辑 | `handleFit` / `setZoom('width')` / `handleZoomIn` / `handleZoomOut` / clamp 全部未动 |

import 行同步增加 `StretchHorizontal`（`Maximize2` 原有保留）。

### 2. `apps/web/src/app/editorial.css`

删除 `.folio-width-button` 与 `.folio-width-button[aria-pressed='true']` 两条死规则（2433-2443 行，共 11 行）。该类此前仅被 zoom-preview.tsx 引用，按钮改用内联 Tailwind 组合样式后全仓零引用，已 grep 复核。

## 规格偏差说明（1 处，意图保真）

规格写 `hover:border-full`——`border-full` 非 Tailwind v4 默认 utility（border-width 仅 0/2/4/8/DEFAULT），项目内亦无 `@utility` 自定义（已 grep `border-full|@utility` 零命中）。规格意图为「hover 时边框由 40% 透明变为全色」，已用等价写法 **`hover:border-[var(--primary-deep)]`** 实现，视觉行为与规格意图一致。

## 可用性依据（写前已验证）

- `bg-[var(--primary-deep)] text-white` 选中态：项目成熟写法（vibe-chat-panel / style-picker / vibe page 等 9 处先例）。
- `hover:bg-card`：`globals.css` 的 `@theme inline` 定义了 `--color-card: var(--card)`，且 upload/page.tsx、scroll-product-demo.tsx 有同类用法。
- `--primary-deep` / `--primary-text`：editorial.css 大量使用，变量存在。

## 验证

- `pnpm --filter @resumeaix/web type-check` → **tsc --noEmit 零错误**（同时证明 `StretchHorizontal` 在已装 lucide-react 中存在，否则 import 报错）。
- `git status`：本次仅改上述 2 文件；`guided-resume-desk.tsx` / `page.tsx` 未触碰；工作区其余变更（interview-helper/next-env.d.ts、scripts/eval-*、eval-inkblue-v71~73.png）为任务开始前已存在，未动。
- `grep folio-width-button` 全仓零残留。
- 未提交、未跑 install/build（遵守任务禁令）；浏览器真机视觉验收留给主会话（本机 next dev 不可用，见项目记忆）。

## 涉及文件绝对路径

- `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX\apps\web\src\components\editor\zoom-preview.tsx`
- `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX\apps\web\src\app\editorial.css`
