# agent-hive · AGENTS.md

本文件是「agent-hive」项目的协作规则。任何进入本目录工作的 agent（含主控会话派发的子 agent）必须遵守。

## 项目定位

主 Agent 的**并行派发控制台**：从一个入口把任务包分发给多个 Claude Code 无头会话（`--dangerously-skip-permissions -p`），支持双模型路由（glm-5.3 文本主力 / glm-5.3-flash 多模态），实时观测每个会话的终端形态，收报告、做验收。

未来可能扩展其他终端工具与 GUI 工具——runner 层留了 adapter 位，但当前**只有 claude-code 一个实现**，不要为假想的工具写抽象。

## 目录约定

| 路径 | 用途 | 可变性 |
|---|---|---|
| `app/server.mjs` | Node 服务：静态页 + API + spawn 管理 | 可改 |
| `app/launcher.ps1` | Claude 启动器：env 注入 + stream-json 落盘（legacy，派发已内置 server） | 可改 |
| `app/public/` | 前端三件套（index.html / app.js / theme.css）+ `brand/`（主站圆徽标记 SVG） | 可改 |
| `batches/<wave>/batch.json` | 每波任务定义与状态（**状态的唯一真相源**） | 派发/状态变更时写 |
| `batches/<wave>/prompts/` | 任务包提示词 | 派发前可改，派发后只读 |
| `runs/logs/<wave>/<代号>.ndjson` | 各会话 stream-json 实时流（同目录伴随 `<代号>.ndjson.launcher.err` 排障文件） | 只追加，勿手改 |
| `runs/reports/<代号>-report.md` | 各会话结果报告 | 会话自己写 |
| `docs/design.md` | UI/UX 设计决策记录 | 设计变更时更新 |

## 页首与命名规范（面板文案定稿）

1. **页首标题**：`太木控制台 · <Wave 名>`——品牌名固定「太木控制台」，圆徽直接继承主站 BrandMark（`brand/timecraker-mark-v1.svg`，44px 深墨圆）+ 字标堆叠（副行 `TAIMU HIVE · 并行派发`）；波次号动态取 batch.json 的 `wave` 字段；不堆功能描述、不加任务计数（数字在统计带里）。
2. **meta 徽章**：`LIVE · SSE`（实时推送）/ 时钟 / `派发 <日期>`（无 dispatchedAt 显示 —），均为描边小徽章。
3. **状态词汇定稿（验收状态机）**：已验收 / 待验收 / 进行中 / 排队中 / 待派发 / 失败 / 已打回 / 已取消——「已完成(done)」仅作 wave1/wave2 历史数据兼容显示；禁止口语变体。
4. **统计带与 Tab 顺序对齐**：进行中 · 待验收 · 已验收 · 失败 · 已取消（「排队中」并入「进行中」计数，口径 = running + queued + pending）；零计数淡化显示不隐藏。
5. **完成率口径**：已验收 ÷（全部 − 已取消）；进度条分段：绿=已验收、黄=待验收、蓝=进行中、红=失败/打回、灰=排队。

## batch.json 字段表

```json
{
  "wave": "wave2",                    // 波次名（= 目录名）
  "title": "显示标题",
  "dispatchedAt": "ISO 时间",          // 首次派发时写入，此后不改
  "tasks": [{
    "code": "PF",                     // 代号：大写短码，波内唯一，= 报告/日志文件名；跨波复用代号时先把旧报告改名 <代号>-report.<旧波>-archived.md（报告为覆盖写）
    "name": "任务中文名",
    "goal": "一句话验收目标（含数字指标）",
    "model": "glm-5.3[1m]",           // 实际模型 ID，直书：[1m] 文本主力 / glm-5.3-flash[1m] 看图
    "cwd": "相对仓根的任务目录",         // 会话工作目录
    "promptFile": "prompts/<代号>.md", // 相对 batches/<wave>/ 的提示词路径
    "status": "pending"               // pending → queued → running → reported/failed → accepted / rejected / cancelled（cancelled=人工取消：手改 batch.json 并记 cancelledAt/cancelReason，server 无取消 API；done 为旧波次历史值）
  }]
}
```

wave1 起实际数据中另有以下扩展字段（观测/回填用，派发不要求）：

- 任务级 `dispatchedAt`：dispatch 时由服务写入，该任务的计时起点（elapsed 优先取它，缺省回落 wave 级）
- `legacy: true`：旧 launcher 派发的会话标记（无流式日志，面板明示 LEGACY）
- `commit` / `remote`：人工回填的任务产出（提交短哈希 / 远端仓标识）
- `sessionId` / `turns` / `costUsd` / `outTok`：会话收档时自动从 result 事件收获——sessionId 是 resume 续派的原料，turns/costUsd/outTok 是成本台账（outTok 为输出 tok，抽屉 tok/s 的分子）
- `resumeCount` / `followUp`：续派深度（上限 3）与最近一次续派指令
- `pid`：本次 spawn 的进程号（`/api/kill` 的目标）
- `thinkTok` / `overthink`：思考看门狗遥测——当前思考块 tokens 与超阈标记（`HIVE_OVERTHINK_TOK` 默认 20000，且 8KB 尾窗零 say/tool 产出才触发）；面板 LIVE 列显示「⚠ 深思 Nk · 近窗零产出」，干预仍归主控（kill + fresh 重派或接管直改）
- `sessionId` 增量落盘：流式期即从系统事件收获（不等收档），服务重启后 resume 能力不丢；另有孤儿自愈——running 任务进程死亡 + 日志停更 + 无 result 时 `/api/status` 就地收档 `failed`（failReason=`server-restart-orphaned`）
- `failReason`：failed 时的机器判定（`no-result-event` / `no-report` / API 错误摘要）
- `acceptedAt`·`acceptNote` / `rejectedAt`·`rejectNote`：验收记录（rejectNote 会作为续派提示词预填）
- `settledAt` / `killedAt`：收档与强制结束的时间戳
- `cancelledAt` / `cancelReason`：人工取消记录（主控手改 batch.json 落 cancelled 时写入；server 无取消 API）

## 任务包提示词写法约定

每份提示词是**自包含**的——执行会话没有主控上下文，必须写全。固定结构：

1. **任务一句话** + 背景（已核实的事实，勿让执行者重新考古）
2. **步骤**（编号，可执行）
3. **红线**（不碰什么、并发避让、安全约束）
4. **验收标准**（数字化，写明检查命令）
5. **报告要求**（整文件覆盖写入 `runs/reports/<代号>-report.md`，含自评）
范例：`batches/wave1/prompts/` 下 10 份。

## 派发与验收 API

- `POST /api/dispatch`，body `{"wave","code"}`——fresh 派发（接受 pending / queued / failed；failed 重跑会重写日志）
- `POST /api/dispatch`，body `{"wave","code","resume":true,"prompt":"<后续指令>"}`——**续派**：`--resume <sessionId>` 派回原会话，记住上下文免冷启动（仅 reported / failed / rejected 可续，深度上限 3 次）
- `POST /api/accept`，body `{"wave","code","verdict":"accept"|"reject","note?"}`——**验收终裁**：accepted 是唯一绿色终态，只能由这里产生；reject 必须带 note（作为续派提示词）
- `POST /api/kill`，body `{"wave","code"}`——强制结束 running 会话树（仅日志停更的挂死会话用；exit 回调随后收档 failed）
- **并发信号量**：同时 running 上限 `HIVE_MAX_CONCURRENT`（默认 4；12 路并发实测撞智谱账户级 429）。满员时 dispatch 转 queued，有任务退出自动补位；`force:true` 可插队（仅冒烟/抢修）
- **进程退出 ≠ 完成**：exit 回调读日志 result 事件收档——`is_error=true` 或无报告 → `failed`；干净退出且有报告 → `reported`（待验收）。日志停更超 `HIVE_STALE_MINUTES`（默认 5 分钟）面板标 stale
- **收档自愈**：exit 回调丢失（如服务重启）时，`/api/status` 扫描发现日志已有 result 事件而 batch 仍 `running` → 就地收档，running 不会永久卡死
- **日志文件模式**：fresh 派发重写（`w`），resume 续派追加同一 ndjson（`a`）——续派后抽屉从头读会含前次会话事件

## 会话启动规范（派发 claude 的硬性要求）

1. **必须以「允许一切」模式启动**：`claude --dangerously-skip-permissions -p ...`——无头会话无人值守，任何权限弹窗都会静默卡死会话，没有例外。
2. **model 字段直书实际模型 ID**（声明即执行，spawn 原样传 `--model`，零映射零图例）：
   - `glm-5.3[1m]`：文本主力（编码 / 审计 / 续写 / 跑分）
   - `glm-5.3-flash[1m]`：多模态（截图目检 / 封面验收 / UI 走查）
   - 后台轻任务（HAIKU / SMALL_FAST）固定走 `glm-5.3-flash[1m]`，与主模型解耦
3. **prompt 必须走 argv 位置参数**：stdio[0]='ignore'，漏传会报「Input must be provided」秒退（实踩）。
4. **stderr 必须落 `<log>.launcher.err` 文件**：claude 的警告（如 unrecognized_model）全在这里，是排障第一现场。
5. **key 走 env 注入**：`ANTHROPIC_BASE_URL`（智谱端点）+ `ANTHROPIC_AUTH_TOKEN`（读 `~/.claude/zhipu.env`），每次派发经 spawn env 注入，零配置文件依赖。同批 env 另注入 1M 上下文档（`CLAUDE_CODE_AUTO_COMPACT_WINDOW` / `CLAUDE_CODE_MAX_CONTEXT_TOKENS` = 1000000）与 `API_TIMEOUT_MS=600000`、`CLAUDE_CODE_EFFORT_LEVEL=max`。

## 铁律

1. **状态的唯一真相源是 batch.json**——面板显示、验收、时间计算全部以它为准。`dispatchedAt` 写入后不改。
2. **一个 agent 只写自己的文件**：报告写 `runs/reports/<自己代号>-report.md`（整文件覆盖），日志由 launcher 管理。禁止多 agent 共写任何文件。
3. **key 零入库**：`ZHIPU_API_KEY` 只从 `~/.claude/zhipu.env` 读取经进程 env 注入。提交前必须 `git diff --cached` 自查无 key。
4. **派发前冒烟**：改过 launcher/env 注入逻辑后，先用一个 1 分钟小任务验证模型路由与日志落盘，再全量派发。
5. **主仓提交规范**：Conventional Commits 中英对照；`runs/logs/` 加入 .gitignore 不入库。
6. **验收纪律**（主控执行）：**终态只出自验收**——进程退出最多到 `reported`，`accepted` 必须由主控核查报告与 git 实证后经 `/api/accept` 产生；虚报用 reject 打回（note 即续派指令）并 resume 重做，同任务续派 ≤3 次。
7. **控制台入口先行**：服务启动后、首个任务派发**前**，把带 `?wave=` 的面板 URL 明确交给用户——用户是实时监督与验收主体，无头跑完整波不交入口 = 流程违规（2026-10-05 wave5 实犯，用户来问「我的控制台呢」才补交）。主控以后台进程起服务时，须同时言明服务随主控会话存亡。
8. **波次收口归档**：波全部终态后跑 `.\app\archive.ps1 -Wave <wave>`（或 `-All` 批量，脚本内置活跃任务守卫）——`runs/logs/<wave>/` 压缩至 `runs/archive/<wave>-logs.zip` 并删原目录；`batches/` 与 `runs/reports/` 永久保留不归档。
