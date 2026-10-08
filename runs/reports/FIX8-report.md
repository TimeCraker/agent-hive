# FIX8 结果报告

## 结论一句话

EYE2 四项处方全部落地：榜单面板头部 5 层压至 2 层（计数并入标题行右段、排序方向并入激活 tab 后缀、独立排序说明行删除）、示例/遗留区复用 ColumnHeader 补列头、transport 徽章上提名称行消 768 短尾、方法学补第 6 格附录链接凑齐 3×2；`tsc --noEmit` 与 eslint 双零错，e2e 锚点静态核查全数保留。

## 改动清单

**`site/src/components/Leaderboard.tsx`**

1. **P1-2 计数并入标题行**：可比/示例/遗留 N 条（含「· N 组」后缀）移入 header 右段——发丝延伸线之后、「清空全部」钮左侧，11px mono tabular、`whitespace-nowrap` 保持整段为一视觉单元；原独立计数行整段删除。
2. **P1-2 方向并入激活 tab**：active tab 追加 mono 珊瑚箭头后缀（「Total 总耗时 ↓」式，TPS 为「↑」）；箭头 `aria-hidden`，tab 可访问名不随激活态变化（name 匹配零风险）。原「排序：总耗时 · 越低越好 ↓」整行删除（与选中 tab 信息重复）。
3. **P2-7 示例/遗留区列头**：ColumnHeader（原有 aria-hidden 装饰层）零改造直接复用，在示例、遗留两个 `<ul>` 顶部同款渲染——首测前示例区 `1389ms 89.0 19.94s` 从裸数字变为有列头标注。
4. **P2-8 transport 徽章上提**：「直连/代理/本地」徽章从指标折行区移入名称行（与「本组最优」「示例」「遗留·不可排名」同排），折行尾只剩删除钮；列头「来源」列同步删除（无数据列不留空壳）、`COL_TRANSPORT` 常量删除；遗留行（无 run）不再显示「—」占位。
5. 附带清理：`METRICS.unit` 字段随排序行删除失去唯一消费者，一并移除；TPS「需上游 usage」口径由方法学 03 格承载（copy.ts「官方没给用量就不算」，未动）。

**`site/src/components/Methodology.tsx`**

6. **P2-11 第 6 格附录链接**：`border border-line bg-panel p-3` 与五格同构；序号 `METHODOLOGY_POINTS.length + 1` 自动续排（现渲染 06）mono 珊瑚；链接文字「口径详情 → README」→ `https://github.com/TimeCraker/coding-plan-bench`（`target="_blank" rel="noreferrer"`），印刷风下划线（`decoration-line-2 underline-offset-4`）hover 转珊瑚，`transition-colors duration-200` 合动效铁则。lg 三列由 3+2 参差变 3×2 齐格。

## 头部层级前后对照

| 层 | 前（5 层） | 后（2 层） |
|---|---|---|
| 标题行 | ① `03 · LEADERBOARD · 本机榜单` + 清空钮 | ① 标题 + **计数（右段）** + 清空钮 |
| 计数行 | ② 可比 N 条 · 示例 N 条 · 遗留 N 条 | **并入 ①** |
| 指标 tabs | ③ TTFT / TPS / Total segmented | ② tabs（active 带 **↓/↑ 后缀**） |
| 排序方向行 | ④ 排序：总耗时 · 越低越好 ↓ | **并入 ②（行删除）** |
| 分区标 | ⑤ 可比排名 · 同条件才比 | ③ 保留（分区标层级仅此一行） |

标题到首行内容之间的结构行：**4 行 → 2 行**（tabs 行 + 分区标行），其后即条目内容。

**决策说明**：示例（「示例 · 不参与排名」）与遗留（「旧版记录 · 不可比」）分区标**保留**——两者是 `leaderboard.spec.ts` 现行断言（「示例 · 不参与排名」×4、「旧版记录」/「不可排名」），spec 不在本任务可改两文件之内，删除即挂测试。「只保留一处」按头部层级栈执行：计数、排序两个层级行消解，分区标层级仅存「可比排名 · 同条件才比」一行。

## 自检结果

- `npx tsc --noEmit`：exit 0，全仓零类型错误。
- `npx eslint Leaderboard.tsx Methodology.tsx`：exit 0，零 error / 零 warning。
- e2e 锚点静态核查（grep + DOM 结构推演）：
  - tablist「排序指标」aria-label ✓ 未触碰；tab 名含 TTFT / 首 token / TPS ✓（箭头 aria-hidden，可访问名恒为「XX 标签」，`getByRole({name:"TPS"})` 子串匹配不受激活态影响）；
  - `remove-entry` / `undo-toast` / `undo-button` / `clear-all` / `confirm-clear-yes` / `confirm-clear-no` / `reset-local` ✓（grep 12 处命中，均未触碰）；
  - 「还没有可比较的记录」✓；「可比 N 条」连续性 ✓——header 内计数 `<p>` 的 textContent 为「可比 N 条 · 示例 N 条 · 遗留 N 条」，四字 + 数字 +「条」在同一元素内连续，`getByText("可比 1 条")` 子串可命中；
  - `methodology` testid ✓。
- 红线遵守：仅改 2 个目标文件（`git diff --stat` 其余文件均为并行波次改动）；copy.ts / globals.css / lib 未动；未做 git 操作、未起 dev server、未跑 install。

## 遗留

1. **e2e 未实跑**（红线禁起 dev server）：锚点为静态核查结论，建议主控 verify 阶段实跑 `test:e2e` + `test:a11y` + `test:responsive` 复核。
2. **visual.spec 截图基线必然过期**（workbench-*.png 全页快照），UI 改动后需 `--update-snapshots` 重生成，不在本任务两文件范围。
3. **方向箭头对屏幕阅读器不可感知**（aria-hidden 换取可访问名稳定）：如需无障碍补全，后续轮可改 tab `aria-label` 全名方案（如「总耗时，越低越好」）并同步核对 spec 的 name 匹配。
4. 排序行删除后，「TPS 需上游 usage」的即时提示不再出现在榜单头部，仅存于方法学 03 格——信息未丢，密度让位（EYE2 P1-5 同一取向）。
