# HIVE 结果报告

## 结论一句话

三篇文档整体健康、结构定位清晰（AGENTS 规则权威 / README 入口 / design 决策记录，不算冗余），但存在 7 处确凿失真（端口口径、日志路径层级、派发口径、词汇定稿、范例计数等），已全部就地更正并提交 `be0072e`；另发现 3 项代码级问题只报告不动代码。

## 文档判定表（三篇 + 交叉核对发现）

| 路径 | 一句话主题 | 判定 | 处置 |
|---|---|---|---|
| `README.md` | 入口文档：快速上手 + 目录/设计指引 | **过期**（2 处失真） | ① 默认端口 17878→17879（`server.mjs:12` 实际 `PORT \|\| 17879`），示例改写为「覆盖端口」并注明波次不走 env；② 「面板排队中任务行点击派发」失真——grep 证实 `app/public/` 无任何 `/api/dispatch` 调用，点行只开终端抽屉，更正为仅 POST /api/dispatch |
| `AGENTS.md` | 协作规则权威：目录约定 + 字段表 + 派发 API + 铁律 | **过期**（2 失真 + 1 缺口） | ① 目录表日志路径补 `<wave>/` 层级（`server.mjs:64` logPath 实为 `runs/logs/<wave>/<代号>.ndjson`）；② 字段表补扩展字段：任务级 `dispatchedAt`（dispatch 写入、elapsed 优先取它）、`legacy`、`commit`、`remote`（均经 wave1 实数据核实）；③ 「wave1 prompts 9 份」实为 10 份；④ 派发 API 补 result 事件自愈兜底（`server.mjs:134-139`） |
| `docs/design.md` | UI/UX 决策记录：三次错位复盘 + Swiss Industrial Print + 终端方案 | **过期**（2 处失真） | ① 状态词汇定稿「等待中」→「排队中」——UI 三处锚点（statsband/页脚/行标签 `app.js:10` STLBL）均为排队中，「等待中」仅存于一个失效 nav tab；② 终端方案日志路径补 wave 层级、err 文件更正为全名 `<代号>.ndjson.launcher.err`（磁盘实文件核实） |

交叉核对确认**健康无需动**的部分：AGENTS 会话启动规范五条（skip-permissions argv/模型直书/stdio[0]=ignore/stderr 落盘/key env 注入）逐条与 `server.mjs:207-229` spawn 参数吻合；铁律 5 的 `runs/logs/` gitignore 属实；design.md 全部色值（#F4F4F0/#111/#E61919/#2D5A88/#3A7D44/#B07D1A/#8A8F98/#0C0E10/#E3B341/#7EE787）逐一在 theme.css 命中；launcher legacy 定位、v1 单 runner、报告路径 `runs/reports/<代号>-report.md` 均与代码一致。

## 已执行处置与提交（含 commit hash）

Commit **`be0072e`**（main），`git show --stat` 仅含三篇文档，3 files changed, +14/−8：

1. **README**：默认端口 17879 + 覆盖端口示例口径 + 波次指定方式说明；派发步骤改为 POST /api/dispatch 口径（注明面板无派发按钮）。
2. **AGENTS**：目录表日志路径补 wave 层级（含 .launcher.err 伴随说明）；字段表后新增扩展字段段（任务级 dispatchedAt / legacy / commit / remote）；prompts 范例 9→10；派发 API 补自愈句。
3. **design**：状态词汇定稿改排队中；终端日志路径与 err 文件名对齐实况。

约束遵守：未触碰 `app/`、`batches/`（wave2）、`runs/`（报告写入除外）、`.gitignore`；未 push、未动任何 node 进程；`git add` 逐文件点名，未用 `-A`。

## 建议人工复核（含代码级问题的建议）

1. **[代码 bug] nav「等待中」tab 失效**（`app/public/app.js:35`）：tab 取 `d.counts.waiting`（server 只发 `counts.pending`）恒显 0；filter key `'waiting'` 与任务状态 `'pending'` 永不匹配，点击后两区全空。建议改为 `['pending','排队中',d.counts.pending]`。本报告已把 design.md 词汇定稿对齐为「排队中」，若你反而想保留「等待中」词汇，则应改代码三处锚点。
2. **[代码残留] 旧名 agent-console 未清**：`index.html:3`（`<title>AGENT-CONSOLE`）、`index.html:53`（页脚）、`server.mjs:1` 头注释、`server.mjs:291` 启动日志，与已更名「agent-hive/蜂巢」不一致。
3. **[代码小疵] `server.mjs:291` 启动日志硬编码 `(wave1)`**：wave 实际由每次 API 的 query/body 决定，日志有误导性。
4. **[产品建议] 面板加派发按钮**：README 原本声称「面板点击派发」说明这曾是预期交互；当前 pending 行只显示「等待派发」，派发必须 curl。加个小按钮即可让 README 那句话重新成真（本次已按现状改文档，二选一即可）。
5. 工作区级 `my_workspace/CLAUDE.md` 记 agent-console 端口 17878——若实例实际以 PORT=17878 运行则该记录没错，但「默认端口」口径与本仓 README 现已统一为 17879，供知悉。

## 自评

**达标**。理由：① 报告整文件覆盖写入指定路径，五段结构齐全；② 7 处确凿失真 + 1 处任务指定补充全部处置，`git show --stat HEAD` 仅含三篇文档；③ `git status` 对比初始快照，差异仅 `batches/wave2/batch.json` 运行时状态与其他会话新写的 untracked 报告（CPB/PWA/SEXA/VSW，非本会话产物）；④ 红线全守：未动代码/运行时数据/进程，未 push。不确定项（AGENTS 与 README 的双模型路由表述、design.md 历史复盘段）按「拿不准一律保留」原则未动。
