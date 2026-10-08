# 任务 POL5：本机榜单与方法学精致化——排名数字戏剧化 + 最优值标记 + 行节奏

一句话任务：在 wave12 已完成的 Swiss 基础上对 `Leaderboard.tsx` 与 `Methodology.tsx` 做**美术精致化**——把榜单做成「成绩公报」：排名数字立得住、最优值有制式标记、行节奏像表格印刷品。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4。
- wave12 已落地：行式列表（3px 状态轨 + 固定列基准 + mono tabular 数字）、排序 tablist（2px 墨底线 + 珊瑚选中底线）、空态 NO DATA、恢复 toast、隐藏列头（桌面）。契约 `site/src/styles/globals.css` 已冻结（token 同 POL1）。
- 参照系：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css`。
- 并行波次：POL1/POL2/POL3/POL4 在改其他文件——**你绝对不碰**。

## 打磨方向（最小共识 + 你的发挥）

**铁则不变**（零圆角/单珊瑚/发丝线+墨线/硬阴影/无 blur 渐变图标/mono 只用于数据/动效只 transform+opacity）。

1. **排名数字戏剧化**：前三名从 text-lg 放大到 **text-2xl**（`font-mono tabular tracking-tighter`）；#1 珊瑚 + 底部 3px 珊瑚短规线（宽 20px，`absolute` 于数字下方）；#2/#3 墨色 600；其余保持次级
2. **最优值制式标记**：本组最优值（当前已有珊瑚 700）加下划规线——`border-b-2 border-accent`（数值文字下方 2px 珊瑚线，像印刷表格的汇总强调线）；列头当前排序指标列同步强调
3. **行节奏优化**：行 padding py-3 → **py-3.5**；行 hover `bg-panel-2` 保留 + 左轨加宽 3→4px；列头行与首行间距 mt-2
4. **计数行制式化**：头部「可比 N 条 · 示例 N 条 · 遗留 N 条 · N 个条件组」改 mono 分段制式：每段 `数值 600 text-ink + 标签 text-ink-3`，段间 `·` 分隔 + `tracking-[0.02em]`
5. **区块头编号**：`.lbl-mono` 标题升级「编号制」——`03 · LEADERBOARD · 本机榜单`（编号 `text-accent`，与表单/结果区段形成 01/02/03 全站序列；数字选择与你所见其他区段编号自洽即可）
6. **空态精修**：NO DATA 徽章 + 虚线框内加 mono 装饰行（如 `— AWAITING FIRST RUN —` `text-ink-3 tracking-[0.14em]` 10px）
7. **Methodology 制式化**：标题编号同序列（如 `04 · METHODOLOGY`）；术语行（TTFT/TPS/Total）改「术语表」制式——左列 mono 术语 600 + 右列中文释义，行间 hairline，像印刷词汇表

## EYE 批评吸收（美术总监批评全文：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\EYE-report.md`，可读）

以下条目必须落地：

1. **P1-3 面板描边统一**：Leaderboard 外框 `border border-ink` → `border-[1.5px] border-ink`（与表单/能力榜同重）
2. **P2-1 列内单位恒定**：主控已给 `site/src/lib/format.ts` 的 `fmtMs` 加单位策略参数（`fmtMs(x, "ms" | "s" | "auto")`，默认 auto 向后兼容）——TTFT 列恒 `fmtMs(x,"ms")`、Total 列恒 `fmtMs(x,"s")`，同列不再 ms/s 混排
3. **P2-4 列头 9px→10px**：列头 `text-[9px]` → `text-[10px]`，letter-spacing 对齐 `.lbl-mono` 体系（0.16em）
4. **P2-5 NO DATA 升格**：虚线框 `border-line`→`border-line-2`；NO DATA chip 改珊瑚描边 `border-accent text-accent`；下方补 mono 引导行 `RUN #001 · 待产生`（`text-ink-3 tracking-[0.14em]` 10px）
5. **P1-7 方法学桌面双栏**：`md:columns-2 md:gap-8`（或 grid-cols-2），65ch 限制移至列内，行分隔 hairline 保留
6. **P1-1 编号序列**：区块编号用 `03 /`（LEADERBOARD）与 `04 /`（METHODOLOGY）——与表单 01/02、执行位置的序列自洽即可（读 EYE 报告 P1-1）

## 红线

- **只改 2 文件**：`site/src/components/Leaderboard.tsx`、`site/src/components/Methodology.tsx`。不碰 globals.css 与其他任何文件
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑零改动（排序/删除/恢复/清空/重置/storage 接口）；**e2e 锚点一字不改**：`role="tablist"` aria-label「排序指标」、tab 名含「TTFT」「首 token」「TPS」、`data-testid="remove-entry"`、文本「还没有可比较的记录」「可比 N 条」、`undo-toast`/`undo-button`/`clear-all`/`confirm-clear-yes`/`confirm-clear-no`/`reset-local`/`methodology` 等 testid
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误（他人并行报错可忽略，报告注明）
2. `npx eslint site/src/components/Leaderboard.tsx site/src/components/Methodology.tsx` 零 error
3. 自检：两文件 `rounded-`=0、`gradient`=0、`backdrop-blur`=0、`lucide`=0、内联色值=0
4. e2e 锚点齐全（tablist/tabs/remove-entry/空态/可比计数/全部 testid）
5. 列宽基准不随内容伸缩（固定 flex-basis + min-width:0 + 省略）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\POL5-report.md`

模板：`# POL5 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 制式细节说明` / `## 自检结果` / `## 遗留与建议`
