# MODE · 自由编辑默认化 + 首次引导 + 进入按钮化 — 实施报告

**日期**：2026-10-08 · **仓库**：ResumeAIX（main，未提交）· **状态**：✅ 完成，type-check 通过

## 改动清单

### 1. 新增 `apps/web/src/lib/guided-seen.ts`（共享标记模块）

- `GUIDED_SEEN_KEY = 'resumeaix-guided-seen'`，key 字符串集中定义，供 page 与 guided-desk 两端共用
- `hasGuidedSeen()`：惰性读标记（try/catch，读失败按未见过处理 → 走引导）
- `markGuidedSeen()`：写 `'1'`（try/catch，隐私模式写失败不阻断模式切换）

### 2. `apps/web/src/app/(editor)/resume/[id]/page.tsx`

- **初始值**（原 114 行 `useState(!vibeRequested)`）改为惰性初始化：
  - `?vibe=1` → `false`（直达 Vibe，保持现状）
  - SSR 壳（`typeof window === 'undefined'`）→ `true`；客户端 → `!hasGuidedSeen()`（无标记=首次走引导，有标记=回访直接自由编辑）
  - 水合安全性：页面首帧被 `loading` 态（spinner）挡住，guided 不影响 SSR/水合输出，客户端惰性初值不会引发 hydration mismatch
- **写标记补齐全部 5 处 `setGuided(false)` 调用点**（`markGuidedSeen()` + `setGuided(false)`）：
  1. 顶栏「自由编辑」tab onClick（spec 指定）
  2. store 订阅（vibe 打开 / 编辑器模式切换）
  3. 顶栏「编辑」按钮 onClick
  4. `onFreeEdit` 回调（引导台入口的 page 侧）
  5. `onLayout` 回调（更新版式切到自由编辑）
- 顶栏两个 tab 的 className 一行未动，只改「自由编辑」tab 的 onClick 函数体

### 3. `apps/web/src/components/editor/guided-resume-desk.tsx`

- 「进入自由编辑 →」文字链接升级为块级 CTA 按钮（spec 指定的完整 class 列表：`--primary-deep` 铜底白字、`rounded-lg`、`btn-press`、`w-full` 撑满侧栏、`group`）
- 右侧 `ArrowRight`（lucide）`h-4 w-4`，`transition-transform group-hover:translate-x-0.5`（补 `transition-transform` 使位移有过渡而非瞬跳）
- onClick 内 `markGuidedSeen()` 后调 `onFreeEdit()`（spec 指定的 desk 侧写标记点；与 page 侧 `onFreeEdit` 定义处双写，幂等无副作用，属双保险）
- 引导流程内部逻辑零改动

### 4. `apps/web/src/app/(editor)/resume/[id]/guided.css`（+6 行，必要补丁）

- 新增 `.guided-nav button.guided-cta { padding: 10px 16px; border-bottom: 0; }`
- **原因**：`.guided-nav button`（优先级 0,1,1）高于任何单个 Tailwind 工具类（0,1,0），会强制 `padding: 12px 10px` 覆盖 `px-4 py-2.5`，并给实心铜底按钮压一条 `#5b574f` 分隔线。不解除这两条，spec 的 class 列表无法按预期渲染。padding 值与 `px-4 py-2.5` 等值声明；`min-height: 44px` 保留（触控目标友好）

## 验证

- `pnpm --filter @resumeaix/web type-check`：✅ 0 错误
- `git diff` 逐行复核：只触碰任务内 3 文件 + 新增 1 文件；`zoom-preview.tsx` / `editorial.css` 为并行任务改动，未触碰；未 commit、未跑 install/build（按禁令）

## 行为语义（验收对照）

| 场景 | 行为 |
|---|---|
| 全新用户（无标记）打开简历 | 默认进引导制作 |
| 曾进入过自由编辑（有标记） | 默认直接自由编辑 |
| `?vibe=1` 进入 | 直达 Vibe（不受标记影响，引导初始值恒 false） |
| 任一入口切到自由编辑（tab / CTA / 编辑按钮 / 更新版式 / vibe 打开） | 即写 `resumeaix-guided-seen = '1'` |
| localStorage 不可用（隐私模式） | 读失败按首次走引导，写失败静默、不阻断切换 |
| 手动点回「引导制作」tab | 正常切回引导（不删标记，刷新后仍默认自由编辑） |

## 备注 / 风险

- 语义取舍：首次即走 `?vibe=1` 的用户会在 vibe 打开时被写标记（此后不再默认进引导）——按 spec「其他 setGuided(false) 调用点一并补上」的字面要求执行
- 视觉验收（铜底白字在 `#24231f` 深墨侧栏上的实际观感、hover 变色、箭头微移）需真实页面确认，本机 next dev 不可用（见项目记忆），建议部署后随并行任务一起走查
