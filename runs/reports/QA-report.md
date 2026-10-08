# QA 报告 · Vibe 消息问答内容视觉区分

- **日期**:2026-10-07
- **目标文件**:`apps/web/src/components/editor/vibe-chat-panel.tsx`(单文件改动,+59 行)
- **状态**:✅ 完成,type-check / eslint 双绿

## 改动内容

### 1. 具名常量(防误伤参数,便于调整)

```ts
const ANSWER_QUESTION_MARK = '？';   // 仅解析含全角问号的段落
const ANSWER_MAX_LENGTH = 60;       // 单片段超过 60 字不套高亮
```

### 2. 解析函数 `renderWithAnswers(para, isUser): ReactNode[]`

放在 `splitParagraphs` 之后、`estimateLines` 之前,纯函数返回 React 节点数组:

- **解析条件**:段落含「？」才解析;无「？」直接返回 `[para]` 原文,零解析
- **片段切分**:逐个「：」处理,片段 = 冒号后到第一个「。」或段落尾;句号留在普通文本流,冒号保留在问句侧;支持一段内多个「：」连续解析
- **防误伤**:片段为空或 >60 字时不套高亮,按普通文本渲染(其余短片段照常高亮,逐片段判断)
- **`**` 边界剥离**(超出 QA 字面要求的一处防御,见「决策说明」):冒号紧邻的问句侧尾部 `**` 与答案片段两侧 `**`/空白剥掉,避免答案条内外露出星号字面

### 3. 答案条样式(按气泡归属二选一)

- 助手纸底气泡:`rounded-md bg-[var(--primary-deep)]/8 px-1.5 py-0.5 font-medium text-[var(--primary-text)]`
- 用户铜底气泡:`rounded-md bg-white/15 px-1.5 py-0.5 font-medium text-white`

### 4. 接入点

`MessageBubble` 段落渲染改为 `{renderWithAnswers(para, isUser)}`,`<p>` 的 `whitespace-pre-wrap` 与外层 `line-clamp` 折叠不动。

## 逻辑自测(心算用例)

| 输入段落 | 结果 |
|---|---|
| `投哪类公司？影响措辞。：财务分析 / FP&A` | `投哪类公司？影响措辞。:` 普通文本 + `<条>财务分析 / FP&A</条>` |
| QA 例:`…打字告诉我真实数。**：5 年财务经验…800 万元…**`(段落含？) | `**` 剥掉,答案约 30 字 <60 → 高亮条 |
| `其一：答一。其二：答二`(段落含？) | 两个片段各自成条,句号留在文本流 |
| `陈述：没有问号的段落。` | 无「？」→ 完全不解析,原样渲染 |
| 含？段落中 80 字超长答案 | 该片段普通渲染,不糊底色 |
| `？：。`(空片段) | 空串不套条,无空高亮渲染 |

## 决策说明

- **`**` 处理是超出 QA 字面要求的防御**:QA 示例答案被 `**` 包裹,但 5 条改造要求均未提 `**`。判断为 AI markdown 加粗残留(QA 措辞「实际输出格式」),若不剥会以星号字面露在高亮条内外。剥离仅在片段/冒号紧邻边界,无 `**` 场景零影响。若验收认为不该剥,删除两处 `.replace(/\*+…/)` 即可
- **StreamingBubble 未接入**:QA 指向 `MessageBubble`,流式气泡是临时渲染(流结束即被正式消息替换),保持不动以免触碰「不改流式逻辑」红线
- **验证方式**:任务禁 install/build,采用 `pnpm --filter @resumeaix/web type-check`(tsc --noEmit 零错误)+ `npx eslint <该文件>`(零告警);未做真实页面验收

## 未动清单(符合禁止条款)

- editor-sheet.tsx 未触碰;发送/流式逻辑未触碰;splitParagraphs / estimateLines / 折叠(line-clamp)/展开按钮行为未改变
- 未 git commit;工作区其余既有改动(next-env.d.ts、eval-f5-*.json、eval-inkblue-*.png)未触碰

## 剩余风险

- 「？」/「。」仅匹配全角(QA 措辞即全角);AI 若输出半角 `?:.` 混排则不解析——属防误伤保守取向
- 高亮只覆盖含「？」段落;QA 两个例句本身不含「？」,若实际消息里这些复述段真的无「？」,则按规则不解析(需验收时用真实消息确认段落结构)
