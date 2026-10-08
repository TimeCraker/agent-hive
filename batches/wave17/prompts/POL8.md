# 任务 POL8：榜单与方法学减法方框化

一句话任务：把 `Leaderboard.tsx` / `Methodology.tsx` 按 owner 反馈做减法与方框化——**排序指标 tabs 改方框 segmented**、计数行/分区标题白话精简（「执行位置」→「连接方式」）、方法学五条改小方格 grid。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4；Swiss 契约 `site/src/styles/globals.css`（token：`text-ink/ink-2/ink-3` `bg-paper/panel/panel-2` `border-line/line-2` `text-accent` `bg-ink text-paper` + `.lbl-mono` `.st-dot` `.hard-shadow` `.tabular`）。
- wave14 现状：榜单行式列表 + 排序底线 tabs；方法学是 hairline 分隔行列表；`SectionLabel` 文案偏长（「可比排名（同 profile · 同测量版本 · 同执行位置 · 完整结果）」）。
- **主控已精简 `METHODOLOGY_POINTS` 五条为大白话短句**（copy.ts 工作树中，禁改）；「执行位置」全站更名「连接方式」。
- 并行波次：POL6/7/9 + EYE2 在改其他文件——**你绝对不碰**。

## 改造指令

1. **排序 tabs 方框 segmented**（与 POL6 nav 同语言）：`role="tablist"`「排序指标」外框 `border-[1.5px] border-ink`、格间发丝分隔、选中格 `bg-ink text-paper`；tab 键盘行为保留
2. **SectionLabel 白话精简**（组件内文案，可改）：
   - 「可比排名（同 profile · 同测量版本 · 同执行位置 · 完整结果）」→「可比排名 · 同条件才比」（或等长内更白话）
   - 「遗留数据（旧版本记录 · 无执行位置与 profile 信息 · 不可排名）」→「旧版记录 · 不可比」
   - 计数行精简：数字 600 + 标签 ink-3 的分段制保留，但段名砍短（「可比 N 条 · 示例 N 条 · 遗留 N 条 · N 组」）
3. **方法学五条小方格 grid**：`METHODOLOGY_POINTS`（已是短句）渲染为 `grid sm:grid-cols-2 lg:grid-cols-3 gap-2`——每格：`border border-line bg-panel p-3` + mono 序号（01-05，`text-accent`）+ 短句（`text-[12.5px] text-ink-2 leading-relaxed`）；最后一格若空可放「数据只在你浏览器里」之类已有事实句或留空（不造新承诺）
4. **榜单行内减量**：transport 徽章（直连/中转/本地）文字化保留；行内 host/profile 行若与 model 行重复信息可砍 host（保留 model + profile 档位）；其他不动（wave14 排名戏剧化/最优规线保留）
5. 动效 150-300ms 只动 transform/opacity/color

## 红线

- **只改 2 文件**：`site/src/components/Leaderboard.tsx`、`site/src/components/Methodology.tsx`。**copy.ts 禁改**；globals.css 禁改；`lib/storage.ts` 禁改
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑零改动（排序/删除/恢复/清空/重置）
- **e2e 锚点一字不改**：`role="tablist"` aria-label「排序指标」、tab 名含「TTFT」「首 token」「TPS」、`data-testid="remove-entry"`、文本「还没有可比较的记录」「可比 N 条」、`undo-toast`/`undo-button`/`clear-all`/`confirm-clear-yes`/`confirm-clear-no`/`reset-local`/`methodology` testid（注意：「可比 N 条」若计数行改版，该四字+数字必须仍连续可匹配——调整时保留「可比 N 条」字样或同步测试文件并报告）
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误（他人并行报错可忽略，报告注明）
2. `npx eslint site/src/components/Leaderboard.tsx site/src/components/Methodology.tsx` 零 error
3. 自检：两文件 `rounded-`=0、`gradient`=0、`backdrop-blur`=0、`lucide`=0
4. e2e 锚点齐全（tablist/tabs/remove-entry/空态/可比计数/全部 testid）
5. 方法学五格 grid 在 375/768/1440 无溢出（报告说明列数行为）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\POL8-report.md`

模板：`# POL8 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 结构说明` / `## 自检结果` / `## 遗留与建议`
