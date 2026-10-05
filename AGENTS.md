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
| `app/public/` | 前端三件套（index.html / app.js / theme.css） | 可改 |
| `batches/<wave>/batch.json` | 每波任务定义与状态（**状态的唯一真相源**） | 派发/状态变更时写 |
| `batches/<wave>/prompts/` | 任务包提示词 | 派发前可改，派发后只读 |
| `runs/logs/<wave>/<代号>.ndjson` | 各会话 stream-json 实时流（同目录伴随 `<代号>.ndjson.launcher.err` 排障文件） | 只追加，勿手改 |
| `runs/reports/<代号>-report.md` | 各会话结果报告 | 会话自己写 |
| `docs/design.md` | UI/UX 设计决策记录 | 设计变更时更新 |

## batch.json 字段表

```json
{
  "wave": "wave2",                    // 波次名（= 目录名）
  "title": "显示标题",
  "dispatchedAt": "ISO 时间",          // 首次派发时写入，此后不改
  "tasks": [{
    "code": "PF",                     // 代号：大写短码，全仓唯一，= 报告/日志文件名
    "name": "任务中文名",
    "goal": "一句话验收目标（含数字指标）",
    "model": "glm-5.3[1m]",           // 实际模型 ID，直书：[1m] 文本主力 / glm-5.3-flash[1m] 看图
    "cwd": "相对仓根的任务目录",         // 会话工作目录
    "promptFile": "prompts/<代号>.md", // 相对 batches/<wave>/ 的提示词路径
    "status": "pending"               // pending → running → done / cancelled
  }]
}
```

wave1 起实际数据中另有以下扩展字段（观测/回填用，派发不要求）：

- 任务级 `dispatchedAt`：dispatch 时由服务写入，该任务的计时起点（elapsed 优先取它，缺省回落 wave 级）
- `legacy: true`：旧 launcher 派发的会话标记（无流式日志，面板明示 LEGACY）
- `commit` / `remote`：人工回填的任务产出（提交短哈希 / 远端仓标识）

## 任务包提示词写法约定

每份提示词是**自包含**的——执行会话没有主控上下文，必须写全。固定结构：

1. **任务一句话** + 背景（已核实的事实，勿让执行者重新考古）
2. **步骤**（编号，可执行）
3. **红线**（不碰什么、并发避让、安全约束）
4. **验收标准**（数字化，写明检查命令）
5. **报告要求**（整文件覆盖写入 `runs/reports/<代号>-report.md`，含自评）
范例：`batches/wave1/prompts/` 下 10 份。

## 派发 API

`POST /api/dispatch`，body `{"wave":"wave1","code":"VS"}`——仅接受 pending；claude 退出后状态自动翻 done（exit 回调），日志出现 result 事件时另有自愈兜底翻 done。

## 会话启动规范（派发 claude 的硬性要求）

1. **必须以「允许一切」模式启动**：`claude --dangerously-skip-permissions -p ...`——无头会话无人值守，任何权限弹窗都会静默卡死会话，没有例外。
2. **model 字段直书实际模型 ID**（声明即执行，spawn 原样传 `--model`，零映射零图例）：
   - `glm-5.3[1m]`：文本主力（编码 / 审计 / 续写 / 跑分）
   - `glm-5.3-flash[1m]`：多模态（截图目检 / 封面验收 / UI 走查）
   - 后台轻任务（HAIKU / SMALL_FAST）固定走 `glm-5.3-flash[1m]`，与主模型解耦
3. **prompt 必须走 argv 位置参数**：stdio[0]='ignore'，漏传会报「Input must be provided」秒退（实踩）。
4. **stderr 必须落 `<log>.launcher.err` 文件**：claude 的警告（如 unrecognized_model）全在这里，是排障第一现场。
5. **key 走 env 注入**：`ANTHROPIC_BASE_URL`（智谱端点）+ `ANTHROPIC_AUTH_TOKEN`（读 `~/.claude/zhipu.env`），每次派发经 spawn env 注入，零配置文件依赖。

## 铁律

1. **状态的唯一真相源是 batch.json**——面板显示、验收、时间计算全部以它为准。`dispatchedAt` 写入后不改。
2. **一个 agent 只写自己的文件**：报告写 `runs/reports/<自己代号>-report.md`（整文件覆盖），日志由 launcher 管理。禁止多 agent 共写任何文件。
3. **key 零入库**：`ZHIPU_API_KEY` 只从 `~/.claude/zhipu.env` 读取经进程 env 注入。提交前必须 `git diff --cached` 自查无 key。
4. **派发前冒烟**：改过 launcher/env 注入逻辑后，先用一个 1 分钟小任务验证模型路由与日志落盘，再全量派发。
5. **主仓提交规范**：Conventional Commits 中英对照；`runs/logs/` 加入 .gitignore 不入库。
6. **验收纪律**（主控执行）：报告声称的每一条都要抽查实证（git log / CI / 产物文件），虚报打回。
