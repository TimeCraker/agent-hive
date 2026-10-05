# agent-console · AGENTS.md

本文件是「agent-console」项目的协作规则。任何进入本目录工作的 agent（含主控会话派发的子 agent）必须遵守。

## 项目定位

主 Agent 的**并行派发控制台**：从一个入口把任务包分发给多个 Claude Code 无头会话（`--dangerously-skip-permissions -p`），支持双模型路由（glm-5.3 文本主力 / glm-5.3-flash 多模态），实时观测每个会话的终端形态，收报告、做验收。

未来可能扩展其他终端工具与 GUI 工具——runner 层留了 adapter 位，但当前**只有 claude-code 一个实现**，不要为假想的工具写抽象。

## 目录约定

| 路径 | 用途 | 可变性 |
|---|---|---|
| `server.mjs` | Node 服务：静态页 + API + spawn 管理 | 可改 |
| `launcher.ps1` | Claude 启动器：env 注入 + stream-json 落盘 | 可改 |
| `public/` | 前端三件套（index.html / app.js / theme.css） | 可改 |
| `batches/<wave>/batch.json` | 每波任务定义与状态（**状态的唯一真相源**） | 派发/状态变更时写 |
| `batches/<wave>/prompts/` | 任务包提示词 | 派发前可改，派发后只读 |
| `runs/logs/<代号>.ndjson` | 各会话 stream-json 实时流 | 只追加，勿手改 |
| `runs/reports/<代号>-report.md` | 各会话结果报告 | 会话自己写 |
| `docs/design.md` | UI/UX 设计决策记录 | 设计变更时更新 |

## 铁律

1. **状态的唯一真相源是 batch.json**——面板显示、验收、时间计算全部以它为准。`dispatchedAt` 写入后不改。
2. **一个 agent 只写自己的文件**：报告写 `runs/reports/<自己代号>-report.md`（整文件覆盖），日志由 launcher 管理。禁止多 agent 共写任何文件。
3. **key 零入库**：`ZHIPU_API_KEY` 只从 `~/.claude/zhipu.env` 读取经进程 env 注入。提交前必须 `git diff --cached` 自查无 key。
4. **派发前冒烟**：改过 launcher/env 注入逻辑后，先用一个 1 分钟小任务验证模型路由与日志落盘，再全量派发。
5. **主仓提交规范**：Conventional Commits 中英对照；`runs/logs/` 加入 .gitignore 不入库。
6. **验收纪律**（主控执行）：报告声称的每一条都要抽查实证（git log / CI / 产物文件），虚报打回。
