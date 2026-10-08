# CPYC · 简历副本操作加确认弹层 — 报告

**日期**：2026-10-07 · **状态**：✅ 完成 · **改动**：`apps/web/src/components/dashboard/resume-list.tsx`（+71/−3，单文件）

## 实现内容

「创建副本」按钮由点击立即执行改为先开确认弹层，交互与删除/升级弹层完全同模式：

| 改动点 | 说明 |
|---|---|
| `copyTargetId` state | 新增，与 `deleteTargetId` / `upgradeTargetId` 并列 |
| `dialogOpen` / Esc 处理 | 纳入 `copyTargetId`；Esc 关层走现有 useEffect，cleanup 自动焦点归还触发按钮 |
| 卡面副本按钮 | `onClick` 改为「`openerRef.current = e.currentTarget` + `setCopyTargetId(r.id)`」（与删除按钮同款写法）；`disabled={copyingId === r.id}` 保留 |
| `confirmCopy()` | 新增 wrapper：按 `copyTargetId` 找到目标简历 → `await handleCopy(target)` → 关层。**handleCopy 内部逻辑零改动** |
| 确认弹层 JSX | 复用删除/升级弹层结构（AnimatePresence + motion.div + FIG 帽线 + reduced-motion 降级）；标题「创建副本」、正文「将以「(副本)」后缀克隆此简历与其设计稿，确认创建？」 |

## 交互细节

- **确认按钮铜色**：`bg-[var(--primary-deep)]`（`#b34a2a` 黏土橙/铜，globals.css 定义，folio 主操作同款），loading 时 `Loader2` spinner + `disabled={copyingId !== null}`（取消按钮同步禁用，防 loading 中关层导致焦点丢失）。
- **取消按钮 outline**：`border-[var(--border)] bg-[var(--background)]` + hover `bg-[var(--secondary)]`，语义对齐 `buttonVariants` 的 outline variant，写法跟随文件内 CSS 变量风格。
- **点击遮罩关闭**：`onMouseDown` + `e.target === e.currentTarget` 判定（拖拽出弹层不误关），loading 中不响应。注：这是本弹层独有——现有删除/升级弹层无遮罩关闭，按任务要求实现，未回改那两个。
- **焦点管理**：打开时 `dialogRef.focus()` 入层；Esc/取消/遮罩关闭后 `dialogOpen` 变 false → cleanup `openerRef.current?.focus()` 归还副本触发按钮（复用现有机制，未新增代码）。

## 验证

- ✅ `pnpm --filter @resumeaix/web type-check` 通过（tsc 零错误）
- ✅ `git status` 确认仅 `resume-list.tsx` 一个文件被本次任务改动；未 commit、未跑 install/build（按任务禁止）
- ⚠️ 未做浏览器实测：本机 next dev/start 不可用（既有环境限制），交互逻辑为对既有删除弹层模式的直接复用

## 边界与已知差异

- `confirmCopy` 在 handleCopy 失败时也会关层（handleCopy 不返回成败、内部 catch 已 toast 报错，且不可改）；与删除弹层「失败保持打开」略有差异，属「不改 handleCopy」约束下的最简实现。
- 弹层打开期间卡面副本按钮仍可点（复制进行中会 disabled），行为与原先一致，未额外收紧。

## 未触碰

upload/page.tsx、删除逻辑、升级逻辑、handleCopy 内部、封面渲染（ResumeCover）均零改动。
