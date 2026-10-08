# BTN 报告 · 上传页「从零开始构建」入口按钮可点性美术

**状态：已完成，type-check 零错误**
**改动文件：仅 1 个** — `apps/web/src/app/(dashboard)/upload/page.tsx`（+9 / -4 行）
**日期：2026-10-07**

## 改动矩阵（规格逐项对照）

| # | 规格项 | 实现 | 位置 |
|---|---|---|---|
| 1 | 卡面 `bg-card` + 边框 `primary-deep/25` | ✅ `bg-card`（白卡面对 `--folio-peach` 底形成明度对比）+ `border-primary-deep/25`（twMerge 覆盖 outline 变体的 `border-border` 灰边） | Button className |
| 2 | hover 浮起 + folio 阴影 + 边框加深；active 回落 | ✅ `hover:-translate-y-0.5` + `hover:shadow-[var(--folio-shadow)]` + `hover:border-primary-deep/50`；另加 `hover:bg-card` 显式压制 outline 变体自带的 `hover:bg-muted` 灰底。active 回落由 Button 基类既有 `active:translate-y-px`（按压 +1px 下沉，特异性高于 hover 浮起）实现，无需新增类 | Button className |
| 3 | Sparkles → ArrowRight 铜色滑动 | ✅ `ArrowRight`（lucide）`text-primary-text` 铜色 + `transition-transform`（150ms 默认，落在按压反馈 100–160ms 预算内）+ `group-hover:translate-x-1`；Button 加 `group` 类 | 尾部图标 + import |
| 4 | 图标 chip hover 加深 + 圆环 | ✅ `bg-primary-deep/10` → `group-hover:bg-primary-deep/15` + `ring-1 ring-primary-deep/20` | 左侧 chip div |
| 5 | cursor-pointer + focus-visible | ✅ `cursor-pointer`（Button 基类无 cursor 声明，浏览器 button 默认 default）+ `focus-visible:ring-2 focus-visible:ring-primary-deep/40`（twMerge 压掉基类 ring-3 灰环） | Button className |
| 6 | 加载态保留 | ✅ 未动：vibeLoading 时 Loader2 旋转替换 MessageCircle；基类 `disabled:opacity-50 disabled:pointer-events-none` 保留（禁用时 hover 效果自动失效） | 原逻辑 |
| 7 | （加分项）mono eyebrow CTA | ✅ 卡内底部新增 `START FROM SCRATCH →`，`font-mono text-[10px] tracking-[0.18em] text-primary-text`，与本页既有 eyebrow 规格（「流程 / HOW IT WORKS」行）完全同款 | 文本列第三行 |

## 实现备注（验收方需知）

- **令牌零裸值**：全部走项目主题令牌（`bg-card` / `primary-deep` / `text-primary-text` / `--folio-shadow`），无新色值、无渐变、无大圆角，符合 editorial/folio 语言。
- **规格的 `border-[var(--primary-deep)]/25` 写法**落地为等价主题工具类 `border-primary-deep/25`（globals.css 已映射 `--color-primary-deep`），twMerge 分组更稳，计算值相同。
- **暗色模式**：app 未启用 dark 切换（无 next-themes / 无 dark class 注入），outline 变体的 `dark:*` 类为死代码，未加 dark 覆盖。
- **动效审计**：仅 transform 属性动画（浮起/箭头滑动），无 top/left/width/height 动画；时长均 <300ms。

## 验证

- `pnpm --filter @resumeaix/web type-check` → **tsc --noEmit 零输出零错误** ✅
- `git diff` 确认仅本文件 1 处 Button 块 + 1 行 import 变更 ✅
- 未跑 build / 页面截图（任务禁 build；建议部署后真机复核 hover 浮起与箭头滑动）

## 边界遵守

- ❌ 未动 `handleVibeStart` 逻辑（fetch/路由原样）
- ❌ 未碰 FileUpload 组件、未碰 `resume-list.tsx`（并行任务领地）
- ❌ 未 git commit、未跑 install/build
