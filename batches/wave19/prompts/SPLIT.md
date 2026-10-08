# SPLIT · 引导提交拆为问答交替气泡

## 问题（用户反馈）
`apps/web/src/components/editor/vibe-chat-panel.tsx` 的 `submitPlan()`（约 847-870 行）把引导流程的
问题+答案拼成一条大消息（`请执行计划。\n我的回答：\n{q1}: {a1}\n{q2}: {a2}...`）发送，
聊天记录里出现一条巨型用户铜底气泡，问答混在一起，非常难读。

## 目标交互（用户定稿）
提交后聊天记录显示为**交替气泡**：
- 每个问题 → **assistant 气泡**（左侧纸底，就像机器人自己发的问句）
- 每个答案 → **user 气泡**（右侧铜底）
- 之后 AI 的流式回答照常出现在下方

## 实现要求
1. **sendToAI 重构**：签名改为
   `sendToAI(text: string, opts?: { displayUserText?: string | null; presetMessages?: Message[] })`
   - `displayUserText`：替代默认追加的 user 气泡内容；传 `null` = 不追加 user 气泡（AI 仍收到 text 全文作上下文）
   - `presetMessages`：sendToAI 内部 `const newMessages = [...messages, userMsg]` 读的是闭包旧 state，
     调用方刚 setMessages 的数组不在其中——用 presetMessages 显式传入完整消息数组替换 `messages`
   - 默认调用（普通发送）行为完全不变
2. **submitPlan 改造**：
   - 先构造 Q&A 交替消息数组：
     每个 pair → `createMessage('assistant', q.question)` + `createMessage('user', answer)`
     （answer 沿用现有的逗号转顿号处理与「未回答」兜底）
   - `setMessages(prev => [...prev, ...qaMessages])`
   - 调 `sendToAI(buildMsg, { displayUserText: null, presetMessages: [...messages, ...qaMessages] })`
   - buildMsg 保持现格式（AI 上下文不变）
3. **QA 高亮（wave18 的 renderWithAnswers）对拆出的纯问句/纯答案气泡自然不触发**
   （问句含？但无「：」后片段或片段即全文——确认无异常即可，不需删除）
4. streaming/占位气泡/余额预检逻辑不变

## 禁止
- 不碰 MessageBubble 渲染、splitParagraphs、renderWithAnswers
- 不碰 editor-sheet.tsx
- 不 git commit、不跑 install/build

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\SPLIT-report.md`。
