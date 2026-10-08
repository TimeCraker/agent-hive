# QA · Vibe 消息问答内容视觉区分

## 背景
`apps/web/src/components/editor/vibe-chat-panel.tsx` 的 `MessageBubble`（wave16 已段落化：
`splitParagraphs()` + 段落容器 space-y-2）。用户反馈：AI 引导消息里「问的方向」和「用户给的答案」
混在一起平铺，看不出区别。

实际输出格式（稳定模式）：答案总跟在全角冒号「：」后，例如——
「具体投哪类公司（大厂/外企/中小企业）可以打字补充，影响措辞。**：财务分析 / FP&A（经营分析·预算管理）**」
「打字告诉我真实数。**：5 年财务经验，独立负责 3 家公司全盘账务，年终手预算 800 万元…**」

## 改造要求（全部在此文件）
1. **答案片段解析**：段落含「？」时，把每个「：」后的片段（到句号/段落尾）渲染为内联答案条；
   冒号本身保留在问句侧
2. **答案条样式**：
   - 助手纸底气泡：`bg-[var(--primary-deep)]/8` 浅铜底 + `rounded-md px-1.5 py-0.5` + `font-medium text-[var(--primary-text)]`
   - 用户铜底气泡：`bg-white/15` + `rounded-md px-1.5 py-0.5` + 白字
3. **防误伤规则**：仅含「？」的段落解析；单个答案片段超过 60 字不套高亮（整段普通渲染该片段）；
   段落无「？」完全不解析
4. **解析函数**：独立纯函数（如 `renderWithAnswers(para, isUser)` 返回 React 节点数组），
   放在 splitParagraphs 附近；不改变 splitParagraphs / estimateLines / 折叠行为
5. 长度阈值 60 与问号条件写成具名常量，便于调整

## 禁止
- 不碰 editor-sheet.tsx、不改发送/流式逻辑、不改折叠/页数逻辑
- 不 git commit、不跑 install/build

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\QA-report.md`。
