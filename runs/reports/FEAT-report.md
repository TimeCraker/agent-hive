# FEAT 结果报告

## 结论一句话

「复制榜单」与「榜单/趋势方框切换」两功能已在 3 个名下文件内落地并通过全部验收：`npx tsc --noEmit` 零错误、名下 4 文件 eslint 零 error、`boardShare.test.ts` 9/9 全过（全仓单测 182/182 无回归）、既有 e2e 锚点 14 项 grep 实证一字未动、Swiss 合规 grep（rounded-/gradient/backdrop-blur/lucide/内联色值）全 0。

## 改动/新增文件清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `site/src/lib/boardShare.ts` | 新增 | `buildBoardMarkdown(entries, sortKey)` 纯函数（markdown 导出，供单测）+ `copyText(text)` 剪贴板双路径 helper |
| `site/src/components/TrendSpark.tsx` | 新增 | 趋势速览组件：label 归一分组 + 纯手写 SVG polyline 火花线（零图表库、零新依赖） |
| `site/src/components/Leaderboard.tsx` | 改动 | 头部加「榜单/趋势」方框 segmented（`aria-pressed`）与「复制榜单」mono 描边钮 + `role="status"` 反馈；主体按视图切换（默认 list，一切照旧）；排序指标 tablist 仅榜单视图渲染 |
| `tests/unit/boardShare.test.ts` | 新增 | 纯函数单测 9 例（表头/条件行/列序/单位恒定/排序方向/空数组守卫/不可比过滤/单元格守卫） |

红线遵守：copy.ts（主控预落 M 状态，非本任务改动）/ globals.css / storage.ts / 其他组件均未触碰；未做 git 操作、未起 dev server、未装依赖。

## 功能结构说明

### A. 复制榜单（markdown 导出样例）

以两条 complete 条目（browser-direct、cpb-standard@1）为例，`buildBoardMarkdown` 产出：

```markdown
# Coding Plan Bench · 本机榜单（2 条）

条件：cpb-standard@1 · browser-direct

| # | 模型 | TTFT | TPS | Total |
| --- | --- | --- | --- | --- |
| 01 | GLM-5.3-Flash | 198ms | 89.0 | 8.40s |
| 02 | GLM-5.3 | 312ms | 45.3 | 12.35s |

> 数据仅存本地，测试条件见站内方法学。
```

- **取数口径**：只导出当前排序指标下的可比条目（`rankableForMetric`，与榜单视图同口径），按当前指标排序（ttft/total 升序、tps 降序，与视图排序方向一致）；名次两位补零（`01`）与站内 rank 展示一致。
- **条件行**：profile@version · transport 分组去重；多组并列 `／` 分隔并标注 `（K 组）`；无可比条目时无此行。
- **单位恒定**：TTFT 恒 `ms`（`fmtMs(v,"ms")`）、Total 恒 `s`（`fmtMs(v,"s")`）、TPS 无单位（`fmtTps`）；TPS 缺 provider usage 时为 `—`。
- **单元格守卫**：用户 label 含 `|` / 换行时替换为安全文本，防破坏 markdown 表格结构。
- **空数组守卫**：`（0 条）` 标题 + `还没有可比较的记录。` + 尾行免责，不产出表头与数据行。
- **复制双路径**：`copyText` 先走 `navigator.clipboard.writeText`（安全上下文）；抛错或 API 不可用（Tauri webview 权限缺失 / 非安全上下文）时回落 `document.createElement("textarea")`（fixed + opacity:0 + readonly）→ `select()` → `document.execCommand("copy")` → 移除节点，两条路径任一成功才置反馈。成功后按钮旁渲染 `role="status"` 的 `BOARD_SHARE_DONE`（text-ok），2.5s 后消失（`window.setTimeout`，卸载时 `useEffect` 清理防泄漏 setState）。
- **可见性**：按钮仅在 `rankable.length > 0` 时渲染（与「清空全部」的条件渲染同语言），空榜不出死按钮。

### B. 趋势火花线（TrendSpark 分组规则）

1. **归一 key**：`(label || model).trim().toLowerCase()` —— 同名模型（忽略首尾空白与大小写）归为一组；组内展示名取首次出现的原 label。
2. **准入过滤**：只收 `run.status === "complete"` 且 `aggregate.ttftMs` 非 null 的条目——partial/failed/cancelled、无 run 的 legacy、缺 TTFT 数据的一律不入（缺数据不伪装）。
3. **组内排序**：按 `ranAt` 升序（火花线左旧右新）；**组间排序**：按组内最新 `ranAt` 降序（最近测过的模型在前）。
4. **成组阈值**：≥2 条才显示，否则整组丢弃；全部不足 2 条时渲染 `TREND_EMPTY` 空态（居中 `text-ink-3` + 虚线框 + `NO TREND` mono 标，与榜单空态同语言）。
5. **火花线几何**：120×20 viewBox，上下各留 2px；TTFT 值 min-max 归一化（值域退化为 0 时画居中水平线）；`<polyline>` stroke=`currentColor` 1.5px 圆角连接 + 每点 `<circle r=1.5>`、末点加重 `r=2.5`；svg 带 `role="img"` + aria-label（模型名 + 次数）。
6. **涨跌语义**：首末两点比较，`pct = round(|last-first|/first×100)`；TTFT 下行（变快）= `text-ok` + `↓ N%`、上行（变慢）= `text-bad` + `↑ N%`、持平 = `text-ink-3` + `±0%`（first≤0 退化守卫）。箭头 + 符号保证方向不依赖颜色可读（非颜色冗余通道）。
7. **视图切换**：`useState<ViewKind>` 纯前端状态，不写 storage、不动榜单数据；切换控件为方框 segmented（1.5px 墨线外框 + 格间发丝分隔 + 选中格 `bg-ink text-paper`，两 button `aria-pressed`），文案 `BOARD_VIEW_LIST/BOARD_VIEW_TREND`；趋势视图下排序指标 tablist 隐藏（趋势只看 TTFT 历史）；undo toast / 损坏隔离提示与视图无关，恒渲染。

## 自检结果

| 验收项 | 命令 | 结果 |
|---|---|---|
| 全仓类型 | `npx tsc --noEmit` | exit 0，零错误 |
| 名下 lint | `npx eslint` 4 文件 | exit 0，零 error/warning |
| 新增单测 | `npx vitest run tests/unit/boardShare.test.ts` | 9/9 passed |
| 全量回归 | `npx vitest run` | 17 文件 182/182 passed |
| 既有 e2e 锚点 | grep `Leaderboard.tsx` | `role="tablist"`+`排序指标` / `>TTFT<` / `首 token` / `>TPS<` / `remove-entry` / `还没有可比较的记录` / `可比 ` / `undo-toast` / `undo-button` / `clear-all` / `confirm-clear-yes` / `confirm-clear-no` / `reset-local` 各恰 1 处，全部保留（`methodology` testid 不在名下文件，未触碰） |
| 默认视图不变 | 代码路径 | `view` 初始值 `"list"`，默认渲染路径与现状逐行一致（新增均为条件分支） |
| Swiss 合规 | grep 名下 3 文件 | `rounded-`/`gradient`/`backdrop-blur`/`lucide` 计数 0；内联色值 0（SVG 用 `currentColor` + `text-ok`/`text-bad`/`text-ink-3` 语义类；grep 唯一命中 `RUN #001` 为既有文案字面量，非色值） |
| bundle 门禁 | — | 零新依赖、SVG 手写，无图表库引入 |

说明：任务红线禁止起 dev server，故未做浏览器实证；行为验证以单测（纯函数全分支）+ 类型 + lint + 锚点 grep + 全量回归覆盖。

## 遗留与建议

1. **趋势视图暂无 e2e**：任务只要求 `boardShare.test.ts` 单测；建议后续波次补一条 e2e（点「趋势」→ 断言 `TREND_TITLE`/火花线分组），锚点可用 `TrendSpark` 内稳定文本。
2. **趋势仅 TTFT 单指标**：按规格只画 TTFT 火花线；若后续要 TPS/Total 趋势，可复用 `sparkCoords` 泛化指标参数，无需改结构。
3. **demo 数据天然不进趋势**：demo 条目每个 label 唯一（≤1 条/组），不满足 ≥2 阈值自然排除；若未来 demo 数据出现同名多条，需在 `buildGroups` 显式加 `e.demo` 过滤（当前按规格未加）。
4. **`copyText` 回落路径未单测**：execCommand 依赖真实 DOM，node 环境不可测；建议纳入后续 e2e（Clipboard 权限上下文里点复制 → 断言剪贴板内容与 `role="status"` 反馈出现/消失）。
