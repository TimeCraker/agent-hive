# agent-hive

主 Agent 的**并行派发控制台**：把任务包分发给多个 Claude Code 无头会话，双模型路由（glm-5.3 文本 / glm-5.3-flash 多模态），实时终端观测，报告归档与验收。**终态只出自验收**（reported → accepted/rejected 状态机），会话可 `--resume` 续派。

架构全面采用**自包含波次单元（Self-contained Wave Architecture）**：每个波次的配置、提示词、报告、执行日志全部聚合在单个 `waves/<wave>/` 目录内，零跨波污染，归档即插即拔。内置**同仓库避让锁（CWD Lock）**与**主脑自治代管协议**。

## 快速上手

```powershell
# 启动控制台（默认端口 17879 → http://127.0.0.1:17879）
node app/server.mjs

# 覆盖端口（例：17878）；波次支持直接访问（自动加载首个可用波次）或 URL 指定 ?wave=<wave>
$env:PORT=17878; node app/server.mjs
```

**启动后第一件事：把控制台交给用户**——`http://127.0.0.1:17879?wave=<wave>` 要在首个任务派发前明确给出。控制台是用户的实时监督与验收入口；主控只在后台跑而不交入口，等于把「主控派发、用户监督」的分工做成黑箱。主控以后台进程方式起服务时，需同时说明服务随主控会话存亡（会话退出服务即停，连带杀死在跑会话）。

1. 在 `waves/<wave>/batch.json` 定义任务（代号/目标/cwd/提示词文件），`model` 字段**直书实际模型 ID**：`glm-5.3[1m]`（文本主力）/ `glm-5.3-flash[1m]`（多模态看图）
2. 提示词放 `waves/<wave>/prompts/<代号>.md`
3. 派发：`POST /api/dispatch {"wave","code"}`——**同仓库（同 cwd）自动互斥排队、并发满员自动排队**（防 429 与 Git 代码踩踏），前序退出自动补位
4. 点「查看终端 →」实时观看会话动态（stream-json，markdown-lite 渲染）
5. 会话写报告到 `waves/<wave>/reports/<代号>-report.md`；**进程退出 ≠ 完成**——干净退出且有报告 → `待验收(reported)`，出错/无报告 → `失败(failed)`，不再假绿
6. 验收：主控核查报告与 git 实证 → 面板归档区「✓ 验收」或 `POST /api/accept {verdict:"accept"}` → `已验收`（唯一绿色终态）；不实则「✗ 打回」并附理由
7. 打回后续派：面板「▶ 续派重做」或 `POST /api/dispatch {resume:true, prompt:"<指令>"}`——`--resume <sessionId>` 派回**原会话**，记住上下文免冷启动（同任务 ≤3 次）；挂死会话「⏹ 强制结束」走 `/api/kill`
8. 主脑巡检：`node app/supervise.mjs --wave <wave>`——一键获取高信号报表，支持主脑日常小问题自治修复（续派/验收）与重大阻断升级请示用户

完整字段表、API 细则与铁律见 [AGENTS.md](AGENTS.md)。

## 设计

UI/UX 决策与架构演进（三次错位复盘、Swiss Industrial Print 选型、终端视图方案、自包含 Wave 架构、CWD 锁与主脑代管协议）见 [docs/design.md](docs/design.md)。

## runner 抽象

v1 只有 claude-code 一个 runner（server 内置 spawn claude.exe；app/launcher.ps1 为 legacy）。未来扩展其他终端工具/GUI 工具时，在 server.mjs 的 dispatch 分支按 runner 类型分派——约束细则见 AGENTS.md 定位段。
