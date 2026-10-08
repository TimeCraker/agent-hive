# SPLIT · 引导提交拆为问答交替气泡

**日期**：2026-10-07 · **仓库**：ResumeAIX · **分支**：main（未提交，按禁令保留工作区）
**目标文件**：`apps/web/src/components/editor/vibe-chat-panel.tsx`（+27 / -6 行，仅此一文件）

## 改动内容

### 1. sendToAI 重构（vibe-chat-panel.tsx:512）

签名改为：

```ts
async function sendToAI(
  text: string,
  opts?: { displayUserText?: string | null; presetMessages?: Message[] }
)
```

- **displayUserText**：`string` = 追加的 user 气泡用它替代 `text`；`null` = 不追加 user 气泡。
- **presetMessages**：显式传入完整消息数组，替换闭包里的旧 `messages`（解决「调用方刚 setMessages、闭包读不到」）。
- **null 时的 AI 上下文**：新增 `contextMessages` —— 无 user 气泡时在请求负载末尾补一条隐藏 user 消息承载 `text` 全文（`buildMsg`），**只进本次 fetch body，不进 UI、不落库**（localStorage/DB 持久化仍走 `messages` state）。
- fetch body 由 `newMessages` 改为 `contextMessages`。
- **默认调用（不传 opts）行为完全不变**：`baseMessages=messages`、`userMsg=createMessage('user', text)`、`contextMessages=newMessages`，逐字段等价于旧代码；`sendMessage()` 调用点零改动。

### 2. submitPlan 改造（vibe-chat-panel.tsx:859）

- map 内每个 Q&A pair 追加 `createMessage('assistant', q.question)` + `createMessage('user', answer)` 到 `qaMessages`；answer 沿用原有逗号转顿号与「未回答」兜底，`buildMsg` 拼法不变。
- `setMessages(prev => [...prev, ...qaMessages])` 先入列，再调
  `sendToAI(buildMsg, { displayUserText: null, presetMessages: [...messages, ...qaMessages] })`。
- 效果：提交后聊天记录渲染为「问句（assistant 纸底气泡）→ 答案（user 铜底气泡）」交替，AI 流式回答照常出现在下方；巨型单条 user 气泡消失。

### 3. QA 高亮（renderWithAnswers）对拆出气泡的影响 — 已确认无异常

- **答案气泡**：内容为「选项值/顿号串/未回答/custom:xxx」，不含全角问号 → `renderWithAnswers` 首行 `!para.includes('？')` 直接返回原文，完全不触发。
- **问句气泡**：含「？」会进入解析，但常规引导问句（如「目标岗位是什么？」）无「：」→ 整段普通渲染。极端情况问句自带「：」（如「风格偏好：保守还是创意？」）时，冒号后到段尾的片段（≤60 字）会渲染为内联答案条——与 assistant 侧任何含此结构的文本行为一致（wave18 既有设计），非新引入异常，按要求未删改。

## 验证

- `pnpm --filter @resumeaix/web type-check` → **通过，0 错误**。
- `git diff` 复核：改动仅限 sendToAI 与 submitPlan 两个函数体 + 注释；未触碰 MessageBubble / splitParagraphs / renderWithAnswers / editor-sheet.tsx；未 commit、未跑 install/build。

## 备注（不代决，仅报备）

1. **`custom:` 前缀残留（既有问题，非本次引入）**：自定义输入存的是 `custom:<文字>`，原实现就把该原串拼进 buildMsg，本次按「沿用现有处理」原样保留 → 自定义答案的 user 气泡会显示 `custom:xxx`。如需展示时剥前缀，是另一个 1 行小改，等拍板。
2. **隐藏上下文消息不持久化**：buildMsg 全文只进本次请求；后续轮次的 AI 上下文由可见的 Q&A 气泡 + AI 回复构成（信息等价，少了「请执行计划。」字面指令），属设计内取舍。
