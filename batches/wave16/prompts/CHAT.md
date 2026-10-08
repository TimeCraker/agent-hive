# CHAT · Vibe 对话面板消息排版重做

## 问题（用户原话：文字布局排版太糟糕了，文字都挤在了一坨）
`apps/web/src/components/editor/vibe-chat-panel.tsx` 的 `MessageBubble`（约 132-193 行）：
AI 多段回答用 `<p className="whitespace-pre-wrap">{msg.content}</p>` 渲染——`\n` 只换行、
段落间零间距，py-2.5 内边距太小，多段长文糊成一坨。

## 改造要求（全部在此文件内完成）
1. **段落化渲染**：把 `msg.content` 按 `\n` 切分，连续非空行聚合为一个段落（空行 = 段落分隔），
   每段独立 `<p>`，段落容器 `space-y-2`；行高 `leading-[1.75]`；空白行不渲染空 `<p>`
2. **气泡呼吸感**：padding `px-4 py-2.5` → `px-4 py-3.5`；外层 `max-w-[85%]` 保留，
   用户（铜底）气泡改 `max-w-[78%]`
3. **折叠兼容**：`estimateLines` 逻辑保留但按新段落结构计数（>8 行才折叠）；
   `line-clamp-[8]` 移到段落容器上；「展开全文/收起」按钮行为不变
4. **问答层级强化**：
   - 消息列表项之间的垂直间距增大（找到消息数组渲染处，gap/space-y 调到 ~20px）
   - 助手气泡：`bg-[var(--secondary)]` → `bg-[var(--card)]`（白底在米色面板上更清晰），
     保留左侧铜色边线 `border-l-2 border-[var(--primary)]/40`
   - 角色行（YOU/RESUMEAIX · HH:MM）`font-medium`
5. 移动端/窄面板（<480px）时 max-w 放宽到 92%

## 禁止
- 不碰 editor-sheet.tsx（另一并行任务在改侧栏宽度）
- 不改消息发送/流式接收逻辑、不改 estimateLines 之外的纯逻辑
- 不 git commit、不跑 install/build

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\CHAT-report.md`。
