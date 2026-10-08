# POL3 结果报告

- 任务：结果呈现精致化——统计带大数字戏剧化 + 单位上标 + 状态语义强化（RunProgress.tsx / ResultCard.tsx，仅此 2 文件）
- 基线：wave12 Swiss 契约（globals.css 冻结未动）；参照 agent-hive `.statsband` 38px mono + 3px 底条

## 结论一句话

结果英雄卡完成「数据主角」改造：三指标大数字升至 44/48px（mono semibold tabular、行高 1、tighter 字距）+ 单位 text-sm 上标置数字右上，状态词升级为 mono 大写双语校对章（状态色描边 + 中文细字），明细表 S01 补零序号 + 双 hairline 表头 + 状态窄徽章 + 列内单位恒定（TTFT 恒 ms / Total 恒 s）；tsc / eslint / 契约自检全绿，e2e 锚点与 4 处中文状态断言静态核实兼容。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `site/src/components/ResultCard.tsx` | 状态双语校对章、44/48px 统计带 + 单位上标 + 双段标签、4px 状态条、外框 1.5px、明细表精修（S01/双线表头/窄徽章/列内恒定单位）、bad 左轨 4px |
| `site/src/components/RunProgress.tsx` | consent 面板（eyebrow「CONSENT · 代理确认」+ 4px 琥珀轨 + h-10 等高按钮 + 1.5px 外框）、running 面板（SAMPLE 02/03 计数制式 + 1.5px 外框） |

未触碰：globals.css 及其他一切文件（工作区其余 M 文件均为 POL1/2/4/5 并行波次产物）。

## 制式细节说明

### 大数字（统计带）
- 字号 34/36px → **44px（移动）/ 48px（桌面）**，满足 P3-3 下限 38px、落在任务 44–52px 区间。
- 制式：`font-mono font-semibold leading-none tracking-tighter tabular`——`.tabular`（契约类）提供 mono 字体 + 表格数字，`tracking-tighter`（utilities 层）覆盖其 -0.02em 为 -0.05em。
- count-up 600ms 动效、`title` 悬停完整口径（METRIC_COPY.desc）原样保留。

### 单位上标（印刷数据制式）
- `ms` / `tok/s` / `s` 以 `text-sm`（≈大数字 1/3，即任务指定的固定档）`flex items-start` 顶对齐置数字右上，`mt-0.5` 下沉 2px 贴合字形视觉顶；`text-ink-3` 弱化为注记级。
- 单位映射 `STAT_UNIT`：**TTFT 恒 ms、Total 恒 s**（消费主控已在 format.ts 落地的 `fmtMs(x,"ms"/"s")` 策略参数，P2-1 同列不再 ms/s 混排）；TPS 由 copy 的 `tokens/s` 收紧为紧凑 `tok/s`（上标制式下过长会破坏数字轮廓；无 e2e/单测断言该字符串，已核实）。
- 标签双段式：`.lbl-mono`（TTFT/TPS/TOTAL）+ 11px `text-ink-3` 中文小注（首 token 延迟 / 每秒输出 / 端到端）。

### 状态章（校对章语言）
- 结构：`st-dot` 方点 + **mono 大写英文**（COMPLETE/PARTIAL/FAILED/CANCELLED，`font-bold tracking-[0.14em] text-xs`）+ 中文状态词（11px `font-sans font-medium`，sans 栈避免 mono 栈 CJK 发虚）+ 状态色描边小框（`border-` 当前状态色），整体 `text-` 当前状态色——色 + 文字双通道。
- **双语制是刻意决策**：e2e 有 4 处断言 `result-status` 含中文（benchmark-flow「已取消」、copy-provenance/leaderboard「完整」「部分成功」），纯英文章会击穿锚点；双语章同时满足「章语言」形制与断言兼容（海关/校对双语章亦为印刷正制）。
- 样本状态同步章化：窄徽章 `px-1.5 py-0.5 border` + 状态色文字/描边（成功/失败/已取消），色 + 中文词双通道。

### 明细表结构
- 表头：`.lbl-mono` + **双 hairline**（`border-y border-line-2`，表头上下各 1px）。
- 行制式：`py-2` 统一行高；序号 `S01`–`S05` 两位补零 mono；数值列右对齐 tabular；TTFT 恒 `fmtMs(x,"ms")`、Total 恒 `fmtMs(x,"s")`。
- 统计带底条 3→**4px**；consent 琥珀轨与失败样本 bad 轨统一 3→**4px**（同为警示左轨语言，一并收敛）。

### 面板与其他
- ResultCard 外框 `border` → `border-[1.5px]`（P1-3，与表单/能力榜同重；hard-shadow-lg 保留）；RunProgress 两面板（consent/running）同步 1.5px，补齐主面板描边一致性。
- consent 面板：eyebrow `.lbl-mono`「CONSENT · 代理确认」置于标题上方；按钮组 `h-10` 等高（inline-flex 居中；移动端由契约 `min-height:44px` 媒体查询统一抬高，仍等高）。
- running 计数：进度条右侧 `n/N` → `SAMPLE 02/03`（两位补零 mono、`text-ink-2`、0.08em 字距）。
- 空值诚实制式：TPS 无 usage 时 `—` 以同字号（44/48px）mono `text-ink-3` 呈现于数字基线，不缩不藏，单位不显示（TOKEN_SOURCE 行琥珀说明原因）。

## 自检结果

| 检查 | 结果 |
|---|---|
| `npx tsc --noEmit` | exit 0，全仓零错误（并行波次亦无报错，无需豁免说明） |
| `npx eslint RunProgress.tsx ResultCard.tsx` | exit 0，零 error 零 warning |
| `rounded-` / `gradient` / `backdrop-blur` / `lucide` / `#hex` / `rgb(` | 两文件全部 **0**（grep 逐项核实；圆形仅存于契约 `.pulse-dot`） |
| e2e 锚点 | button「取消」✓、CONSENT_ACCEPT（含「同意」）✓、`data-testid="proxy-consent"` ✓、run-progress / result-card / result-status / result-samples / result-transport / result-profile / result-token-source 全保留 ✓；4 处 `result-status` 中文断言经双语章兼容 ✓ |
| 四状态可区分 | complete=绿 / partial=琥珀 / failed=红 / cancelled=灰——章描边 + 章文字 + 方点 + 4px 底条四通道同色变 ✓ |
| 业务逻辑 | phase 状态机 / consent 流 / cancel / countUp / 四态判定零改动（仅呈现层类名与静态映射）✓ |

## 遗留与建议

1. **e2e 未实跑**（红线禁 dev server）：锚点与断言为静态核实；建议并测窗口收尾后跑 `npm run test:e2e` 复验 4 处状态断言与 consent 流。
2. **计数口径微差**：running 面板头部仍是 `RUNNING · SAMPLE 1/3`（未补零，任务仅点名右侧计数），与右侧 `SAMPLE 02/03` 并存时口径略异；建议下轮统一头部亦补零（一处 pad2 即可）。
3. **明细表行内单位**：`fmtMs` 返回值自带单位字符串（如 `1390ms`），行内 ms/s 重复 5 次；若要「单位进列头一次」的完全制式，需 format.ts 增加纯数值出口（不在本任务 2 文件红线内）。
4. **双面板 44px 高度差**：consent 按钮移动端由契约媒体查询抬至 44px，取消按钮（running 头部小钮）维持 py-2 制式——同为小钮语言但场景不同（主操作 vs 中断操作），维持现状未强行等高。
