# 任务 FIX8：榜单头部 5 层减 2 层 + 示例区列头（EYE2 P1-2 / P2-7 / P2-8 / P2-11）

一句话任务：按 EYE2 密度体检报告（`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\EYE2-report.md`，可读）修 `Leaderboard.tsx` 与 `Methodology.tsx`——面板头部信息层级从 5 层压到 2 层、示例区补列头、768 行尾收拾、方法学第 6 格补齐。

## 背景（已核实事实）

- **P1-2**：榜单面板从标题到第一行内容之间 5 层低权重 mono 微信息（标题行→计数行→指标 tabs→排序方向行→分区标），「排序：总耗时 · 越低越好 ↓」与选中 tab 信息重复。
- **P2-7**：示例区/遗留区桌面端无列头（ColumnHeader 只在可比分支渲染），首测前用户看到的裸数字 `1389ms 89.0 19.94s` 无标注。
- **P2-8**：768 附近「直连」徽章 + 删除钮折成独立短尾行。
- **P2-11**：方法学 lg 三列 3+2 参差空格。
- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`；Swiss 契约 `globals.css` 冻结；copy.ts 禁改；并行 FIX6/7/9 在改其他文件。

## 改造指令（EYE2 处方）

1. **P1-2 头部 5 层 → 2 层**：
   - 计数行（可比/示例/遗留 N 条）并入标题行右段（「清空全部」钮左侧，小号 mono）
   - 排序方向（↓ 越低越好）并入 active tab 后缀（如「Total 总耗时 ↓」）或 tabs 行右端小注，**删除独立排序说明行**
   - 分区标只保留「可比排名 · 同条件才比」一处；其余层级行删除
   - 最终：标题行（含计数）→ tabs 行（含方向）→ 内容
2. **P2-7 示例/遗留区列头**：ColumnHeader（已是 aria-hidden 装饰层）在示例与遗留列表上方同样渲染
3. **P2-8 行尾收拾**：「直连/中转/本地」transport 徽章上提进名称行（与「示例」徽章同排），折行尾只留删除钮
4. **P2-11 方法学第 6 格**：补链接格——`border border-line bg-panel p-3` + mono「附录」序号（06）+ 链接文字「口径详情 → README」（href 指向 `https://github.com/TimeCraker/coding-plan-bench`，target=\_blank rel=noreferrer），凑齐 3×2
5. 动效铁则照旧

## 红线

- **只改 2 文件**：`site/src/components/Leaderboard.tsx`、`site/src/components/Methodology.tsx`。copy.ts/globals.css/lib 禁改
- 不做 git 操作；不起 dev server；不跑 npm install
- e2e 锚点：tablist「排序指标」、tab 名含「TTFT」「首 token」「TPS」、`remove-entry`、「还没有可比较的记录」、「可比 N 条」（四字+数字连续可匹配）、`undo-toast`/`undo-button`/`clear-all`/`confirm-clear-yes`/`confirm-clear-no`/`reset-local`/`methodology` testid 保留
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误；eslint 两文件零 error
2. 头部层级：面板标题到首行内容之间 ≤ 2 个结构行（报告附层级对照）
3. 示例/遗留区有列头（报告说明复用方式）
4. e2e 锚点齐全（特别注意「可比 N 条」连续性）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FIX8-report.md`

模板：`# FIX8 结果报告` / `## 结论一句话` / `## 改动清单` / `## 头部层级前后对照` / `## 自检结果` / `## 遗留`
