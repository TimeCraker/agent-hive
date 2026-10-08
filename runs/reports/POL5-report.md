# POL5 结果报告

## 结论一句话

本机榜单与方法学两区块已按「成绩公报」制式精致化完成：前三名排名数字升 text-2xl（#1 珊瑚 + 短规线）、本组最优值珊瑚 700 + 2px 下划规线、行节奏 py-3.5 + 4px 轨、计数行 mono 分段制式、03/04 编号序列、NO DATA 空态升格、方法学词汇表化 + 桌面双栏，EYE 六条必落地项（P1-3 / P2-1 / P2-4 / P2-5 / P1-7 / P1-1）全部落地；tsc 与 eslint 零错误，e2e 锚点一字未动。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `coding-plan-bench/site/src/components/Leaderboard.tsx` | 美术精致化（业务逻辑零改动） |
| `coding-plan-bench/site/src/components/Methodology.tsx` | 制式化重写（文案源 copy.ts 未动） |

## 制式细节说明

### Leaderboard（03 · LEADERBOARD · 本机榜单）

1. **面板描边统一（EYE P1-3）**：外框 `border` → `border-[1.5px]`，与表单/能力榜同重。
2. **区块头编号（EYE P1-1）**：标题改 `03 · LEADERBOARD · 本机榜单`，编号 `text-accent`（01/02 由并行波次负责，序列自洽）。
3. **排名数字戏剧化**：前三名 `text-2xl`（`font-mono tabular tracking-tighter leading-none`）；#1 珊瑚 700 + 数字下方 3px×20px 珊瑚短规线（`absolute -bottom-[7px] left-1/2 -translate-x-1/2`）；#2/#3 墨 600；rank≥4 维持次级（15/17px ink-2）。
4. **最优值制式标记**：当前排序指标列的最优值 = 珊瑚 700 + `border-b-2 border-accent`（印刷表格汇总强调线）；**列头当前排序指标列同步 `text-accent` 强调**（ColumnHeader 新增 `metric` prop）。
5. **行节奏**：主列 `py-3` → `py-3.5`、移动折行 `pb-3` → `pb-3.5`；左轨 3px → **4px**（列头占位条与移动折行起点 `pl-[47px]`→`pl-[48px]` 同步）；列头行与首行间距 `mb-2`；hover `bg-panel-2` 保留。
6. **计数行制式化**：「可比 N 条 · 示例 N 条 · 遗留 N 条 · N 个条件组」每段 = 数值（600 墨）+ 标签（ink-3），段间 mono 中点，整行 `tracking-[0.02em]`；textContent 顺序原样保留「可比 N 条」锚点。
7. **空态升格（EYE P2-5）**：虚线框 `border-line`→`border-line-2`；NO DATA chip 珊瑚描边 `border-accent text-accent`（10px/0.16em，**手写 mono 制式而非 `.lbl-mono` 类**——规避其 `color: ink-3` 在 utilities 层后置声明覆盖 `text-accent` 的层叠问题）；补两条 mono 装饰行 `— AWAITING FIRST RUN —` 与 `RUN #001 · 待产生`（10px/0.14em/ink-3）。
8. **列头入 lbl 体系（EYE P2-4）**：`text-[9px] tracking-[0.14em]` → `text-[10px] tracking-[0.16em]`。
9. **列内单位恒定（EYE P2-1）**：`metricCellText` 改用主控新加的单位策略——TTFT 列恒 `fmtMs(x,"ms")`、Total 列恒 `fmtMs(x,"s")`，同列不再 ms/s 混排。

### Methodology（04 · METHODOLOGY · 方法学与口径）

1. **标题编号同序列**：`04 · METHODOLOGY · 方法学与口径`（编号 `text-accent`），`METHODOLOGY_TITLE` 文案源不动。
2. **术语表制式**：5 条改「印刷词汇表」——左列 mono 术语 600 墨（展示层映射 `TERMS = PROFILE / TTFT / TPS / TOTAL / STORAGE`，不改 copy.ts；越界回退 2 位序号），右列中文释义；术语条目剥离开头「TTFT =」式前缀避免左右重复；正文内 TTFT/TPS/Total 提及仍 mono 高亮；行间 hairline（divide-line）保留。
3. **桌面双栏（EYE P1-7）**：`md:columns-2 md:gap-8` + `break-inside-avoid`，65ch 行宽限制从 ul 移至列内 `p`（`max-w-[65ch]`）；divide-y 在多列下自然形成列尾规线，第二列首行无顶线（干净）。

## 自检结果

| 检查 | 结果 |
|---|---|
| `npx tsc --noEmit` | **0 错误**（全仓通过，无他人并行报错需备注） |
| `npx eslint` 两文件 | **0 error / 0 warning** |
| `rounded-` / `gradient` / `backdrop-blur` / `lucide` | 两文件均 **0** |
| 内联色值 | **CSS 色值 0**（grep 命中 1 处为空态文案「RUN #001」的 `#001` 被 hex 正则误匹配，非样式） |
| e2e 锚点 | `role="tablist"`+aria-label「排序指标」✓、tab 名含「TTFT」「首 token 延迟」「TPS」✓、`remove-entry` ✓、「还没有可比较的记录」✓、「可比 N 条」✓、`undo-toast`/`undo-button`/`clear-all`/`confirm-clear-yes`/`confirm-clear-no`/`reset-local` ✓、`methodology` ✓ —— 全部原样保留 |
| 列宽基准 | COL_RANK / COL_MAIN / METRIC_COL / COL_ACTION 固定 flex-basis + `min-w-0` 未动，列宽不随内容伸缩 ✓ |
| 红线 | 仅改 2 文件；globals.css 未碰；无 git / npm / dev server 操作 ✓ |

## 遗留与建议

1. **`.lbl-mono` 层叠陷阱**：它在 globals.css `@layer utilities` 末尾声明，`color: var(--color-ink-3)` 会覆盖同元素上后置的原生 `text-*`（本任务已用「子 span 直接声明」与「手写 chip」规避）——后续波次在此类标题内做珊瑚强调时同样注意。
2. **列头 mb-2 间隙**：列头带与数据首行之间的 8px 间隙露出 panel 白底（表头/表体分离的印刷制式）；若要间隙与列头带同色需动 globals.css 或接受现状。
3. **Total 恒 s 的口径副作用**：<1s 的 Total 现显 `0.89s`（原 auto 显 `890ms`）——符合 EYE P2-1「列内单位唯一」的意图，但 ResultCard 内的 fmtMs 调用（P2-1 亦点名）不在本任务 2 文件红线内，建议另行工单统一。
4. **#1 规线与移动端**：24px 大数字 + 短规线在 44px rank 列（移动）实测宽度余量充足（tabular 两位 ≈29px）；若后续 wave 实机截图发现规线与折行指标贴得过近，可把 `-bottom-[7px]` 收到 `-5px`。
