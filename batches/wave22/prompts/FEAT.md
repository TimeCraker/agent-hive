# 任务 FEAT：榜单复制分享 + 趋势火花线速览

一句话任务：给 `Leaderboard.tsx` 加两个功能——**「复制榜单」**（markdown 文本导出到剪贴板）与**「榜单 / 趋势」方框切换**（趋势视图 = 新组件 `TrendSpark`：同模型多次测量的纯 SVG 火花线速览）。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4；Swiss 契约 `globals.css` 冻结（token + `.lbl-mono` `.st-dot` `.hard-shadow` `.tabular`）；设计规范 `site/design-system/MASTER.md` v3（先读：方框 segmented 制式 / mono 纪律 / 反模式清单）。
- 数据层：`site/src/lib/storage.ts` 的 `LeaderboardEntryV2[]`（含 `label/model/ranAt/metrics/status/transport/profile`；`loadLeaderboard()` 可全量读）——**只读消费，禁改**。
- **文案契约（主控已落 `copy.ts`，禁改）**：`BOARD_VIEW_LIST="榜单"` `BOARD_VIEW_TREND="趋势"` `BOARD_SHARE="复制榜单"` `BOARD_SHARE_DONE="已复制，去粘贴分享"` `TREND_TITLE="趋势速览"` `TREND_EMPTY="同一模型测 2 次以上，这里会出现它的历史曲线。"` `TREND_SAMPLES="次"`。
- e2e 现有锚点（`tests/e2e/leaderboard.spec.ts` 等）必须全保留。
- 并行波次 EYE3 只读审计——不冲突；你**不碰** RunProgress/ResultCard/GlobalLeaderboard/其他文件。

## 功能规格

### A. 复制榜单（markdown 导出）

1. 榜单头部操作区加「复制榜单」mono 描边小方钮（`BOARD_SHARE`；与「清空全部」同语言）
2. 点击 → 生成当前**可比条目**（rankable、当前排序）的 markdown 表格并复制到剪贴板：
   - 表头：`# Coding Plan Bench · 本机榜单（N 条）` + 条件行（profile · transport 分组，mono）
   - 表格列：`# | 模型 | TTFT | TPS | Total`（数值用现有 fmt 格式；单位恒定——TTFT 恒 ms、Total 恒 s，同列唯一）
   - 尾行：`> 数据仅存本地，测试条件见站内方法学。`
3. 复制方式：`navigator.clipboard.writeText` 优先，失败回落 `textarea + document.execCommand('copy')`（Tauri webview 兼容）；成功后按钮旁出现 `BOARD_SHARE_DONE` 提示（`role="status"`，2.5s 后消失）
4. markdown 构造抽成**纯函数** `buildBoardMarkdown(entries, sortKey)` 导出（放 `site/src/lib/boardShare.ts` 新文件）——供单测

### B. 趋势火花线速览（TrendSpark）

1. 榜单头部加「榜单 / 趋势」**方框 segmented 切换**（两个 button `aria-pressed`；制式 = MASTER.md 的 segmented 语言：墨线外框 + 选中格 `bg-ink text-paper`；文案用 `BOARD_VIEW_LIST/BOARD_VIEW_TREND`）
2. 趋势视图 = 新组件 `site/src/components/TrendSpark.tsx`（props: `entries: LeaderboardEntryV2[]`）：
   - 按 `label` 归一分组（trim + 大小写不敏感）；过滤 status ≠ complete；每组按 `ranAt` 升序
   - 只显示 **≥ 2 条**的组；组行：`label（sans 600）+ N TREND_SAMPLES（mono ink-3）+ TTFT 火花线 + 涨跌` 
   - 火花线：**纯 SVG polyline**（宽 ~120px 高 20px，`stroke="currentColor"` + 数据点 `<circle r=1.5>`，末点加重 2.5px）；TTFT 值归一化映射；**下行（变快）= ok 绿、上行（变慢）= bad 红**（语义色），文字 `↓ 12%`（首末比较，mono）
   - 空态（无 ≥2 组）：`TREND_EMPTY` 居中 `text-ink-3`
   - 区块标题 `.lbl-mono` 用 `TREND_TITLE`；面板制式与榜单同（`bg-panel border-[1.5px] border-ink hard-shadow`）
3. 切换是**纯前端视图状态**（useState），不写 storage、不影响榜单数据

## 红线

- **只改/新增 3 文件**：`site/src/components/Leaderboard.tsx`（改动）、`site/src/components/TrendSpark.tsx`（新增）、`site/src/lib/boardShare.ts`（新增）。copy.ts / globals.css / storage.ts / 其他组件禁碰
- 新增测试：`tests/unit/boardShare.test.ts`（markdown 纯函数：表头/列序/单位恒定/空数组守卫 ≥4 断言）——按现有 vitest 风格
- 不做 git 操作；不起 dev server；不跑 npm install（零新依赖——SVG 手写，禁止引图表库，bundle 门禁 ≤100KB）
- **既有 e2e 锚点一字不改**：tablist「排序指标」、tab 名含「TTFT」「首 token」「TPS」、`remove-entry`、「还没有可比较的记录」、「可比 N 条」、`undo-toast`/`undo-button`/`clear-all`/`confirm-clear-yes`/`confirm-clear-no`/`reset-local`/`methodology` testid
- 新增交互不破坏既有测试路径（默认视图 = 榜单，一切照旧）
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 全仓零错误；`npx eslint` 名下 3 文件 + 新测试零 error
2. `npx vitest run tests/unit/boardShare.test.ts` 全过
3. 榜单视图默认渲染与现状一致（既有锚点 grep 实证）；趋势视图切换后火花线组正确分组（报告附分组逻辑说明）
4. 复制按钮：clipboard API + execCommand 双路径（报告说明回落实现）；`role="status"` 反馈
5. Swiss 合规：名下文件 `rounded-`=0、`gradient`=0、`backdrop-blur`=0、`lucide`=0、内联色值=0（SVG stroke 用 currentColor + 语义色 class）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FEAT-report.md`

模板：`# FEAT 结果报告` / `## 结论一句话` / `## 改动/新增文件清单` / `## 功能结构说明`（markdown 格式样例 + 趋势分组规则）/ `## 自检结果` / `## 遗留与建议`
