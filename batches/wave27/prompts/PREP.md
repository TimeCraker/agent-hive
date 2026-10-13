# PREP：Stage31 全站走查环境拉起（无浏览器测试，纯环境+文档）

## 任务一句话

为 Stage31 全站 Playwright 走查恢复本地基础设施（重点是 Redis 6380）、拉起正式构建 Web 预览与后端服务、扫描全站路由、建立走查文档骨架与 E2E 测试账号，全程不碰浏览器走查本身（那是后续任务的事）。

## 背景（主控已核实的事实，勿重新考古）

- 仓库：`C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main，开工时重新 `git log --oneline -1` 记录 HEAD。
- 先完整读：`docs/stages/stage-31-agent-testing-handoff.md`（权威规范）、根 `AGENTS.md`、`CLAUDE.md`、`apps/web/AGENTS.md`、`docs/stages/stage-31-verification.md`（前次验证记录，含环境欠账）。
- **PostgreSQL 5434 已在跑**：pid 24696，embedded-postgres，命令行 `-D C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage30-runtime/pg-data -p 5434 -h 127.0.0.1`。**该目录树已从磁盘删除，进程是靠打开句柄活着的僵尸：绝对禁止 kill、禁止重启、禁止任何会终止它的操作**。它死了隔离测试库（含 Stage26 fixture 与 ai_config）就永久丢失。验证连通性用只读查询即可。
- **Redis 6380 未起**，且本机 **无 Docker、无 WSL**。前次会话尝试从 npm 拿 Memurai 二进制但进程没监听成功（见 stage-31-verification.md「环境与未完成项」）。Redis 是新上传走 BullMQ 队列的硬前置。
- Web 正式构建预览端口 **3100**（前次已用，见 verification「已验证」）；ai-service **3002**；export-service **3003**。三者当前都没起。
- 根 `.env`：`DATABASE_URL`/`REDIS_URL`/`AI_SERVICE_URL`/`SMTP_HOST` 已配好，但 `DEEPSEEK_API_KEY` 是**占位符**。AI 渠道真实配置在 DB `ai_config`（siteConfig 热更新），前次评分成功靠的是「仓库外启动脚本注入已授权智谱设置」——但那个脚本 `C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage30-runtime/start-stage31-ai.mjs` **已随目录删除**。
- 管理员种子账号（db seed）：`admin@resumeaix.local / Admin123456`（只读验证存在即可，本任务不登录后台）。
- 前次证据目录 `C:/Users/TimeCraker/Documents/Codex/2026-10-12/resume-upload-review` 可参考。

## 步骤

1. **读文档与记录现场**：读完上述文档；记录 `git log --oneline -1`、`git status --short`（工作区已有的 eval 脚本改动不是你的，不要动、不要提交它们）。
2. **PG 只读验证**：用仓库内 Prisma（`packages/db`）或 node + pg 写一次性只读脚本，验证 5434 连通、users/resumes/ai_config 表可查；只输出计数和 ai_config 的 provider/model **名称字段**（禁止输出任何 key/token 字段值）。确认 pid 24696 仍活着。
3. **恢复 Redis 6380**（本任务核心攻关）：
   - 运行时目录固定用 `C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/`（自建，与已删除的 stage30-runtime 无关）。
   - 候选方案按序尝试，每个方案都要留下「实际监听 + 真实 PING 回 PONG」证据才算成功：
     a. npm `redis-memory-server`（Windows 下会下载 Memurai 二进制）装进上述运行时目录（`npm init -y && npm i redis-memory-server`），写 `start-redis.mjs` 启动脚本：显式 host 127.0.0.1、port 6380，进程 detached + 日志落 `redis.log`；分析前次失败原因（多半是没等 binary 首次下载/解包完成、或默认绑定了错误端口）。
     b. 若 a 不成：直接下载 Memurai 开发版 zip 到运行时目录解压运行（同样 127.0.0.1:6380）。
     c. 再不成：全盘搜现成 redis-server/memurai 二进制复用。
   - 验证标准：新开进程 `PING` 得 `PONG`（用仓库 node_modules 里的 ioredis 连 `redis://127.0.0.1:6380` 跑一次性脚本），并且**重启该脚本后仍通**（证明不是偶然）。
   - 写 `start-redis.mjs` 与 `stop-redis.mjs`（含 pid 文件），后续任务与用户都要复用。
4. **Web 正式构建 3100**：`pnpm --filter @resumeaix/web build`（构建失败要修复到通过，但只允许修复阻断构建的问题并单独 commit）；然后后台 `next start -p 3100`（在 apps/web 内，日志落 stage31-runtime/web-3100.log）。`Invoke-WebRequest http://127.0.0.1:3100` 确认 200。记录构建时的 HEAD。
5. **ai-service 3002**：先纯 `pnpm --filter ai-service dev`（tsx watch）或 build+start 起（日志落 ai-3002.log），确认 health 端点、BullMQ worker 连上 Redis（日志出现 worker/queue ready 类字样）。
   - 然后做一次**最小真实渠道探活**：看代码确认评分/解析走的配置来源（DB ai_config 优先、env 兜底）。若 DB 配置直接可用——不额外注入任何 env；若探活返回 401/无渠道：
     - 允许重建「仓库外启动脚本」思路：新建 `stage31-runtime/start-ai.mjs`，从 `C:/Users/TimeCraker/.claude/zhipu.env` **读取既有已授权设置**（先看该文件有哪些变量名，只报告变量名不报告值），按 ai-service 实际读取的 env 变量名映射注入子进程（智谱 OpenAI 兼容端点是 `https://open.bigmodel.cn/api/paas/v4`，模型名用代码/DB 里配置的），仅本机回环使用。
     - 禁止把任何密钥写进仓库、日志输出、报告或 commit。
     - 若两条路都失败：登记「AI 渠道未就绪」+ 具体证据（状态码/错误摘要），不阻塞其余步骤——后续 AIFLOW 任务会用真实 401 验证失败态。
6. **export-service 3003**：起服务（日志落 export-3003.log），确认 health。若 Chromium/Puppeteer 依赖缺失导致起不来：登记证据（后续 LAYPDF 任务标注 PDF 未测原因）。
7. **全站路由扫描**：遍历 `apps/web/src/app/` 目录树，产出**页面路由清单**（排除 api/、layout、loading 等非页面文件；记录动态段如 [id]）。给每个页面标注归属区域（公开/工作台/上传/编辑器/AI/版式历史/投递分享PDF/素材/设置/admin）。对照清单第1-9项（handoff 文档「页面与路径覆盖」）查漏。
8. **E2E 测试账号**：只读查库看是否已有「【E2E】」前缀账号；没有则通过 http://127.0.0.1:3100/register 页面**用 UI 注册**（密码流程；若注册强制邮箱验证码且无法取得，登记人工介入点为未测并换用 DB 中既有可用测试账号——账号密码是本地合成测试凭证，可写入走查文档，但 API key/验证码绝不行）。验证能从 /login 登录进 dashboard。
9. **建走查文档骨架** `docs/stages/stage-31-browser-audit.md`：
   - 环境事实：日期、HEAD、端口表（3100/3002/3003/5434/6380 及状态）、AI 渠道结论、测试账号、各服务启动/停止/重建 runbook（精确命令，含 start-redis.mjs 用法、web 重建重启步骤——后续每个走查任务开工先核对这份 runbook）。
   - 页面清单表：路径｜区域｜归属任务（PUB/UPLD/EDIT/AIFLOW/LAYPDF/MISC/ADMIN）｜状态（未测）。
   - 各任务结果分区（空）+ 缺陷台账总表（空表，列：编号S31-xx｜页面/状态｜操作｜期望/实际｜根因｜严重度｜前后截图｜提交｜回归｜未测原因）。
   - 用 `docs: ...` conventional commit（中英文）提交这份骨架（连同你可能修的构建阻断问题，分开 commit）。
10. **收尾保持运行**：四个服务（Redis/Web/AI/Export）收尾时都必须保持运行状态（detached 后台 + 日志文件），把 pid/日志路径写进走查文档 runbook。写报告。

## 红线

- 禁止 kill/重启 pid 24696 的 PostgreSQL；禁止连生产/远端；禁止 push、部署。
- 禁止修改交接文档定义的「本会话独占文件」（upload 相关五个组件+五个基础表单+content-section-draft.ts+ai-service 解析队列/parse-identity.ts/image-parser.ts+ai-prompts/parsing.ts+docs/stages/stage-31-*.md 三份）——本任务本就不该碰它们。
- 密钥零输出零入库：zhipu.env/ai_config 的 key 字段只许说「已配置/未配置」，不许打出值；`git diff --cached` 提交前自查。
- 不做浏览器走查（首页 200 探活除外，用 HTTP 请求即可）；不上传文件；不动 interview 两条产品线；不动工作区里他人留下的 eval 脚本改动。
- 运行时产物（stage31-runtime）不入库；Redis 探活失败不算整体失败——如实登记并保证其余交付物完整。

## 验收标准（主控按此核查）

1. `redis://127.0.0.1:6380` 从新进程 PING 通，且有 start/stop 脚本落盘；ai-3002.log 能看到 worker 连队成功证据。
2. http://127.0.0.1:3100 返回 200，走查文档记录了构建 HEAD。
3. 3002/3003 health OK（或明确的失败证据与未测登记）。
4. `docs/stages/stage-31-browser-audit.md` 已提交：路由清单覆盖实际 app 树全部页面路由、每页有归属任务、runbook 命令可直接照抄执行。
5. E2E 账号可登录（或登记人工介入点与替代账号）。
6. 报告落盘 `runs/reports/PREP-report.md`。

## 报告要求

整文件覆盖写入 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PREP-report.md`：每个验收项的结论与证据（命令+输出摘要+文件路径）、Redis 攻关过程（试了什么、什么成/败）、AI 渠道结论、遗留风险（尤其 PG 僵尸进程风险提示）、给后续 7 个走查任务的交接注意事项。附自评（哪些项没把握、为什么）。
