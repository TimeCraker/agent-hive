# 任务 POL9：能力榜白话化 + 行内减量

一句话任务：把 `GlobalLeaderboard.tsx` 按 owner 反馈重做信息减法——**榜名白话化**（智能/实战/性价比/订阅）、**榜切换改方框 segmented**、**长 note 减量**（owner：文字太密、眼花缭乱）。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4；Swiss 契约 `site/src/styles/globals.css`（token：`text-ink/ink-2/ink-3` `bg-paper/panel/panel-2` `border-line/line-2` `text-accent` `bg-ink text-paper` + `.lbl-mono` `.st-dot` `.hard-shadow` `.tabular`）。
- wave14 现状：柱状图墙 + 40px 榜首分 + 分节带已落地（保留）；tabs 是 mono 短码（IQ/AG/VAL/PLN）+ 2px 墨底线式；行内 note（agent/value 榜的长说明）全量展示。
- 并行波次：POL6/7/8 + EYE2 在改其他文件——**你绝对不碰**。`leaderboards.json` 本任务**只读**（分节标记主控已加好）。

## 改造指令

1. **榜名白话化**（TABS 组件内定义，可改）：
   - intelligence「综合智能」→「智能」（短码 IQ）
   - agent「Agent 能力」→「实战」（短码 AG）
   - value「性价比」→「性价比」（短码 VAL，本就白话）
   - plans「订阅制 / Plan」→「订阅」（短码 PLN）
   - 移动端 short 与 label 可统一（「智能/实战/性价比/订阅」四字内，无需两套）
2. **榜切换方框 segmented**（与 POL6/POL8 同语言）：tablist 外框 `border-[1.5px] border-ink`、格间发丝分隔、选中格 `bg-ink text-paper`（mono 短码 + 名称）；底部 2px 墨线去掉（segmented 自带框）；tab 计数（`· 23`）保留在格内 mono
3. **行内减量**：
   - note 字段（agent/value 榜各行长说明）默认**不显示**；信息并入 hover title（`title={note}`）或截断 12 字 + 省略号。移动端同理
   - 智能榜 tier 徽章（T0/T1/T2）保留；vendor 与 region/access 徽章保留但检查同屏密度——移动端（sm 以下）TypeTag/region/access 徽章收进次行（wave14 P2-6 方向）
   - sub 行（「T1 档」等）与徽章合并为一行
4. **头部精简**：`更新于 REV` 版戳保留；「非本机实测 · 互补参考」保留；board.subtitle（来自 json）默认一行截断（title 全文）
5. **分节带/柱状图墙/榜首大分/列头**（wave14 制式）全部保留不动
6. 动效 150-300ms 只动 transform/opacity/color

## 红线

- **只改 1 文件**：`site/src/components/GlobalLeaderboard.tsx`。**copy.ts / leaderboards.json / globals.css 禁改**
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑零改动（fetch/榜切换/分节渲染/归一）
- **e2e 锚点**：文本「更新于」保留；`role="tablist"`/`role="tab"` 结构保留
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误（他人并行报错可忽略，报告注明）
2. `npx eslint site/src/components/GlobalLeaderboard.tsx` 零 error
3. 自检：文件 `rounded-`=0、`gradient`=0、`backdrop-blur`=0、`lucide`=0
4. 「更新于」文本可见；四个榜切换后数据正确（报告说明确认方式）
5. 每行可见文字行数 ≤ 2（主行 + 一条副行；note 不再整行展示）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\POL9-report.md`

模板：`# POL9 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 结构说明` / `## 自检结果` / `## 遗留与建议`
