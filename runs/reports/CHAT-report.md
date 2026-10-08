# CHAT 任务报告 · Vibe 对话面板消息排版重做

**状态**：✅ 完成（type-check 通过，未 commit / 未跑 install·build，按任务卡禁令）
**目标文件**：`ResumeAIX/apps/web/src/components/editor/vibe-chat-panel.tsx`（唯一改动文件，+50/-15）

## 逐条落点

| # | 要求 | 实现 |
|---|------|------|
| 1 | 段落化渲染 | 新增纯函数 `splitParagraphs`（连续非空行聚合一段，空行=分隔，空白行不产空段）；每段独立 `<p className="whitespace-pre-wrap">`，段落容器 `space-y-2`；行高气泡级 `leading-[1.75]` |
| 2 | 气泡呼吸感 | `px-4 py-2.5` → `px-4 py-3.5`；助手 `max-w-[85%]` 保留，用户改 `max-w-[78%]` |
| 3 | 折叠兼容 | `estimateLines` 改为先段落化再逐行计（空行不再虚增行数，阈值仍 >8）；`line-clamp-[8] overflow-hidden` 移到段落容器上跨段裁剪；展开全文/收起按钮逻辑原样未动 |
| 4 | 问答层级强化 | 消息容器 `space-y-3` → `space-y-5`（20px）；助手气泡 `bg-[var(--secondary)]` → `bg-[var(--card)]`，保留 `border-l-2 border-[var(--primary)]/40` 铜色边线；YOU/RESUMEAIX 角色行加 `font-medium` |
| 5 | 窄面板放宽 | 两类气泡外层均加 `max-[479px]:max-w-[92%]`（<480px 生效，Tailwind 任意值断点） |

## 范围外的一处主动同步（已做，可回退）

`StreamingBubble`（流式占位气泡）渲染的是**同一条 AI 回答的中间态**：若只改 `MessageBubble`，会出现「流式期间米底文字挤成一坨 → 流完瞬间白底分段」的视觉跳变。故对其同步了同一套样式（白底 `bg-[var(--card)]`、`py-3.5`、`leading-[1.75]`、`space-y-2` 段落化、角色行 `font-medium`、窄面板 92%）。**未触碰任何流式接收逻辑**，仅改渲染 JSX。

`FunLoader`（瞬态 loading 条，非消息）未动。

## 验证

- `pnpm --filter @resumeaix/web type-check`（tsc --noEmit）：**PASS，零错误**
- `git status`：仅 `vibe-chat-panel.tsx` 一处新增改动；`editor-sheet.tsx` 未触碰；工作区既有改动（interview-helper/scripts/eval-*.png）原样保留
- 真机视觉验收未做（本机 next dev 不可用，见既有环境限制）；建议随并行任务（侧栏宽度）一起做一次面板整体验收

## 边界遵守

- ✅ 未碰 `editor-sheet.tsx`
- ✅ 未改消息发送/流式接收逻辑；纯逻辑仅 `estimateLines` 重写（任务卡授权）+ 新增 `splitParagraphs`（其渲染配套纯函数）
- ✅ 未 git commit、未跑 install/build
