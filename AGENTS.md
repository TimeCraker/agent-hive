# agent-hive · AGENTS.md

本文件是「agent-hive」项目的协作规则。任何进入本目录工作的 agent（含主控会话派发的子 agent）必须遵守。

## 项目定位

主 Agent 的**并行派发控制台**：从一个入口把任务包分发给多个 Claude Code 无头会话（`--dangerously-skip-permissions -p`），支持双模型路由（glm-5.3 文本主力 / glm-5.3-flash 多模态），实时观测每个会话的终端形态，收报告、做验收。

未来可能扩展其他终端工具与 GUI 工具——runner 层留了 adapter 位，但当前**只有 claude-code 一个实现**，不要为假想的工具写抽象。

## 目录约定（自包含波次单元架构）

采用 **Self-contained Wave Architecture**：每个波次（Wave）为一个完全自治的高内聚黑盒，配置、提示词、交付报告与执行日志聚于一处。

| 路径 | 用途 | 可变性 |
|---|---|---|
| `app/server.mjs` | Node 服务：静态页 + API + spawn 管理 + CWD 锁 | 可改 |
| `app/supervise.mjs` | 主脑专属巡检 CLI：一键获取机器高信号巡检报表 | 可改 |
| `app/launcher.ps1` | Claude 启动器：env 注入 + stream-json 落盘（legacy） | 可改 |
| `app/public/` | 前端三件套（index.html / app.js / theme.css）+ `brand/` | 可改 |
| `waves/<wave>/batch.json` | 任务矩阵定义与状态机（**状态的唯一真相源**） | 派发/状态变更时写 |
| `waves/<wave>/prompts/<代号>.md` | 任务提示词输入文件 | 派发前可改，派发后只读 |
| `waves/<wave>/reports/<代号>-report.md` | 会话交付成果与自评报告（波内独立，无同名冲突） | 会话输出；入库追踪 |
| `waves/<wave>/logs/<代号>.ndjson` | stream-json 实时流日志（伴随 `.launcher.err` 排障文件） | 本地运行态，`.gitignore` 忽略 |
| `archive/` | 历史已完结波次归档区（支持整波 zip 归档） | 归档操作产物 |
| `docs/design.md` | UI/UX 设计决策与架构演进记录 | 设计变更时更新 |

## 页首与命名规范（面板文案定稿）

1. **页首标题**：`太木控制台 · <Wave 名>`——品牌名固定「太木控制台」，圆徽直接继承主站 BrandMark（`brand/timecraker-mark-v1.svg`，44px 深墨圆）+ 字标堆叠（副行 `TAIMU HIVE · 并行派发`）；波次号动态取 batch.json 的 `wave` 字段；不堆功能描述、不加任务计数（数字在统计带里）。
2. **meta 徽章**：`LIVE · SSE`（实时推送）/ 时钟 / `派发 <日期>`（无 dispatchedAt 显示 —），均为描边小徽章。
3. **状态词汇定稿（验收状态机）**：已验收 / 待验收 / 进行中 / 排队中 / 待派发 / 失败 / 已打回 / 已取消；禁止口语变体。
4. **统计带与 Tab 顺序对齐**：进行中 · 待验收 · 已验收 · 失败 · 已取消（「排队中」并入「进行中」计数，口径 = running + queued + pending）；零计数淡化显示不隐藏。
5. **完成率口径**：已验收 ÷（全部 − 已取消）；进度条分段：绿=已验收、黄=待验收、蓝=进行中、红=失败/打回、灰=排队。

## batch.json 字段表

```json
{
  "wave": "template",                 // 波次名（= waves/ 下目录名）
  "title": "任务波次标题",
  "dispatchedAt": "ISO 时间",          // 首次派发时写入，此后不改
  "tasks": [{
    "code": "DEMO",                   // 代号：大写短码，波内唯一，= 报告/日志文件名
    "name": "任务中文名",
    "goal": "一句话验收目标（含数字指标）",
    "model": "glm-5.3[1m]",           // 实际模型 ID，直书：[1m] 文本主力 / glm-5.3-flash[1m] 看图
    "cwd": "相对仓根的任务目录",         // 会话工作目录（同 cwd 自动互斥排队）
    "promptFile": "prompts/DEMO.md",  // 相对 waves/<wave>/ 的提示词路径
    "status": "pending"               // pending → queued → running → reported/failed → accepted / rejected / cancelled
  }]
}
```

扩展字段（观测/回填用，派发不要求）：

- 任务级 `dispatchedAt`：dispatch 时由服务写入，该任务的计时起点（elapsed 优先取它，缺省回落 wave 级）
- `queueReason` / `queueDetail`：排队原因（`cwd-lock`: 等待同目录任务释放；`concurrency`: 并发满员等待空位）
- `commit` / `remote`：人工回填的任务产出（提交短哈希 / 远端仓标识）
- `sessionId` / `turns` / `costUsd` / `outTok`：会话收档时自动从 result 事件收获——sessionId 是 resume 续派原料，turns/costUsd/outTok 是成本台账
- `resumeCount` / `followUp`：续派深度（上限 3）与最近一次续派指令
- `pid`：本次 spawn 的进程号（`/api/kill` 的目标）
- `thinkTok` / `overthink`：思考看门狗遥测（超 20000 且 8KB 尾窗零文本/工具产出触发告警）
- `sessionId` 增量落盘：流式期即从系统事件收获（不等收档），服务重启后 resume 能力不丢；孤儿自愈——running 任务进程死亡 + 日志停更 + 无 result 时 `/api/status` 就地收档 `failed`
- `failReason`：failed 时的机器判定（`no-result-event` / `no-report` / API 错误摘要）
- `acceptedAt`·`acceptNote` / `rejectedAt`·`rejectNote`：验收记录
- `settledAt` / `killedAt`：收档与强制结束的时间戳
- `cancelledAt` / `cancelReason`：人工取消记录

## 调度机制：CWD 避让锁与并发信号量

1. **同仓库避让锁（CWD Mutex Lock，铁律）**：
   * 严禁多个子 Agent 同时在同一个本地代码仓库（相同的规范化绝对 `cwd`）中并发施工，杜绝 Git 冲突与代码踩踏。
   * 跨仓库任务（不同 `cwd`）：允许并行推进（受全局并发上限约束）。
   * 同仓库任务（相同 `cwd`）：后序派发任务自动转为 `queued`，标注原因 `waiting-cwd-lock: 等待同目录任务 [CODE] 释放`；前序同目录任务退出后，调度器自动唤醒补位。
   * 特殊抢修或无冲突子目录可传 `force: true` 强行插队。
2. **全局并发信号量**：
   * 全局同时 running 上限 `HIVE_MAX_CONCURRENT`（默认 4，防 API 429）。满员自动排队，退出自动补位。

## 主脑代管与自愈协议（Master Agent Autonomy Protocol）

主 Agent（如 Antigravity、Claude Code、Codex）作为用户的技术总监，全权接管波次的派发、监督、自愈与验收。

### 1. 主脑巡检入口
* **CLI**：`node app/supervise.mjs --wave <wave> [--json]`
* **API**：`GET /api/supervise?wave=<wave>`（输出机器高信号巡检清单）
* **报告内容**：`GET /api/report/:code?wave=<wave>`

### 2. 分级处置原则（自治修复 vs 升级请示）
* **【常规/小异常 · 主脑完全自治】**（不打扰用户，自行闭环）：
  - 任务已干净退出并生成合格报告（`reported`）→ 主脑核对报告和 git diff，确认通过后自动调用 `/api/accept` 验收打勾。
  - 任务微调、漏改个别文件、单测某一项未通过、缺少 import 或未生成报告 → 主脑自动调用 `/api/dispatch { resume: true, prompt: "..." }` 发送补修指令让其继续完成，单任务续派重做上限 3 次。
  - 会话异常中断（孤儿进程）→ 主脑自动重新派发。
* **【重大阻断/架构分歧 · 立即向用户求助】**（严禁盲目试错）：
  - 当子 Agent 报告底层架构方案行不通、选型冲突、第三方硬依赖不存在或涉及不可逆的破坏性改动；
  - 续派达到 3 次上限仍无法解决；
  - **处置动作**：主脑立即暂停盲目重试，将阻碍事实与推荐的 2~3 个替代方案直接呈报用户，由用户决策拍板后再行推进。

## 派发与验收 API

- `POST /api/dispatch`，body `{"wave","code","force?"}`——fresh 派发（接受 pending / queued / failed）
- `POST /api/dispatch`，body `{"wave","code","resume":true,"prompt":"<后续指令>"}`——续派：`--resume <sessionId>` 派回原会话，保留上下文
- `POST /api/accept`，body `{"wave","code","verdict":"accept"|"reject","note?"}`——验收终裁：accepted 是唯一绿色终态
- `POST /api/kill`，body `{"wave","code"}`——强制结束 running 会话树
- `GET /api/supervise?wave=<wave>`——主脑巡检报表
- `GET /api/report/:code?wave=<wave>`——读取指定任务的交付报告正文

## 会话启动规范（派发 claude 的硬性要求）

1. **必须以「允许一切」模式启动**：`claude --dangerously-skip-permissions -p ...`。
2. **model 字段直书实际模型 ID**：`glm-5.3[1m]`（文本主力）/ `glm-5.3-flash[1m]`（多模态）。
3. **prompt 必须走 argv 位置参数**：`stdio[0]='ignore'`，漏传会秒退。
4. **stderr 必须落 `<log>.launcher.err` 文件**。
5. **key 走 env 注入**：`ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`（读 `~/.claude/zhipu.env`）。

## 铁律

1. **状态的唯一真相源是 batch.json**。`dispatchedAt` 写入后不改。
2. **一个 agent 只写自己的波内文件**：报告写 `waves/<wave>/reports/<自己代号>-report.md`。
3. **同目录互斥施工**：严禁多个子 Agent 并在同一 `cwd` 抢占修改代码。
4. **主脑代管，分级升级**：主脑自治解决常规修补；重大架构阻断必须呈报用户确认。
5. **终态只出自验收**：进程退出最多到 `reported`，`accepted` 只能经 `/api/accept` 确认。
6. **波次生命周期与主脑强绑定铁律（同主脑同波次原则）**：
   - **重置起点**：历史批次清退后，序号统一从 `wave1` 重新起步，严禁延续过时的历史废弃序号。
   - **同主脑同波次推进**：同一个主脑（Master Agent 对话会话）在统领工作期间，所有派发的子任务（包含初始体检、发现缺陷后的跟进修复任务、以及后续二次追加任务），必须全量纳入**同一个波次目录（如 `wave1`）**中的 `batch.json` 增量追加并闭环，保证任务全景在同一个大盘中追踪。严禁同主脑为了追加修补任务而就地乱开 `wave2`、`wave3`、`wave31` 等，造成上下文割裂与虚假隔离。
   - **新波次触发边界**：只有当且仅当切换了**全新的 Agent 对话（新主脑）**接管控制台，或者用户明确要求开辟全新的独立业务大隔离带时，波次编号才自增递进新建波次（`wave2`...）。
