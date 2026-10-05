# agent-hive

主 Agent 的**并行派发控制台**：把任务包分发给多个 Claude Code 无头会话，双模型路由（glm-5.3 文本 / glm-5.3-flash 多模态），实时终端观测，报告归档与验收。**终态只出自验收**（reported → accepted/rejected 状态机），会话可 `--resume` 续派。

## 快速上手

```powershell
# 启动控制台（默认端口 17879 → http://127.0.0.1:17879）
node app/server.mjs

# 覆盖端口（例：17878）；波次不走 env，由面板 URL ?wave= 或 API 参数指定
$env:PORT=17878; node app/server.mjs
```

1. 在 `batches/<wave>/batch.json` 定义任务（代号/目标/cwd/提示词文件），`model` 字段**直书实际模型 ID**：`glm-5.3[1m]`（文本主力）/ `glm-5.3-flash[1m]`（多模态看图）
2. 提示词放 `batches/<wave>/prompts/<代号>.md`
3. 派发：`POST /api/dispatch {"wave","code"}`——并发满员自动转 `queued` 排队、退出自动补位（上限 `HIVE_MAX_CONCURRENT`，默认 4，防 429）
4. 点「查看终端 →」实时观看会话动态（stream-json，markdown-lite 渲染）
5. 会话写报告到 `runs/reports/<代号>-report.md`；**进程退出 ≠ 完成**——干净退出且有报告 → `待验收(reported)`，出错/无报告 → `失败(failed)`，不再假绿
6. 验收：主控核查报告与 git 实证 → 面板归档区「✓ 验收」或 `POST /api/accept {verdict:"accept"}` → `已验收`（唯一绿色终态）；不实则「✗ 打回」并附理由
7. 打回后续派：面板「▶ 续派重做」或 `POST /api/dispatch {resume:true, prompt:"<指令>"}`——`--resume <sessionId>` 派回**原会话**，记住上下文免冷启动（同任务 ≤3 次）；挂死会话「⏹ 强制结束」走 `/api/kill`

完整字段表、API 细则与铁律见 [AGENTS.md](AGENTS.md)。

## 设计

UI/UX 决策与历史（三次错位复盘、Swiss Industrial Print 选型、终端视图方案）见 [docs/design.md](docs/design.md)。

## runner 抽象

v1 只有 claude-code 一个 runner（server 内置 spawn claude.exe；app/launcher.ps1 为 legacy）。未来扩展其他终端工具/GUI 工具时，在 server.mjs 的 dispatch 分支按 runner 类型分派——约束细则见 AGENTS.md 定位段。
