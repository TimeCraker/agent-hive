# PGFIX：隔离测试库重建（PG 5434 死亡后的恢复，无浏览器测试）

## 任务一句话

原隔离 PG（僵尸进程 pid 24696）已于 ~18:00 后死亡且数据目录早已删除、不可恢复——用 embedded-postgres 重建 5434 全新库，完成 db:push + seed + E2E 账号重注册，保活其余四服务，更新走查文档。

## 背景（主控已核实）

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。**先读 `docs/stages/stage-31-browser-audit.md`**（PREP 建立的权威 runbook：端口表、启动脚本、E2E 账号注册流程、WMI 拉起定案）。
- 死亡事实：pid 24696 已不存在、5434 无监听；数据目录 `stage30-runtime/pg-data` 早已删除，**旧库数据（Stage26 fixture、e2e-stage31 账号、PUB/UPLD 测试简历）全部丢失，不可恢复**。17:12 时仍存活（EDIT 日志），死亡窗口 17:12–18:35，死因不可考（原进程本就是僵尸态）。
- 其余服务存活：3100（Web 正式构建）/ 3002（ai-service）/ 3003（export）/ 6380（Redis）——**全程不许动它们**（除步骤 5 的 3002 重启）。
- 运行时目录 `C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/`（仓库外）已有 redis/web/ai/export 启停脚本与 `status-all.mjs`。
- 前次 PG 的跑法（供复刻）：`@embedded-postgres/windows-x64` 的 `native/bin/initdb.exe` + `pg_ctl start`，数据目录 `pg-data`，端口 5434，绑定 127.0.0.1，用户 postgres/postgres，库名 resumeaix（看根 `.env` 的 `DATABASE_URL` 核对实际值）。
- **关键教训（Redis 攻关已证）**：npm 包的常驻 node 包裹进程死了会连坐杀子进程；且从 Agent 沙箱 shell 直接 spawn 的进程树会被沙箱 job 收割。**解法：initdb 后用 detached 方式直接跑 postgres.exe（参考 start-redis.mjs 的 detached spawn 写法）；若仍被收割，用 WMI `Win32_Process.Create` 拉起（参考 start-all-cim.ps1）**。启动后必须跨多个命令窗口 + ≥60s 间隔复验存活。

## 步骤

1. **建库**：在 stage31-runtime 里 `npm i @embedded-postgres/windows-x64`；`initdb -D pg-data -U postgres --auth=trust -E UTF8`；创建 detached 启动脚本 `start-pg.mjs`（spawn postgres.exe `-D pg-data -p 5434 -h 127.0.0.1`，日志落 pg.log，pid 文件 pg.pid）+ `stop-pg.mjs`（pg_ctl stop 或树杀）；起后 `createdb resumeaix`（或 initdb 后用 psql/一次性 node 脚本建库）。
2. **存活验证**：跨 ≥3 条独立命令 + 60s 间隔查询 `SELECT 1`；失败则改 WMI 拉起再验。记录最终启动方式。
3. **schema + seed**：仓库根 `pnpm db:generate`（如需）→ `pnpm db:push` → `pnpm db:seed`（创建 admin@resumeaix.local）。验证 users 表有 admin、resumes 为空。
4. **E2E 账号重注册**（runbook 有现成命令）：`POST http://127.0.0.1:3100/api/auth/send-code`（邮箱 e2e-stage31@resumeaix.test）→ 从 Redis `auth_code:<email>` 读码 → `/api/auth/verify-code` → `/api/auth/complete-registration`（name=【E2E】Stage31 走查，密码 E2eStage31!2026，与走查文档登记一致）→ NextAuth 密码登录验证 `GET /dashboard` 200。
5. **服务重连**：重启 ai-service（`taskkill /PID (ai-3002.pid) /T /F` → `start-all-cim.ps1`），确认 `/health` 200 且日志 BullMQ worker started（其 Prisma 池指向旧死库需重连）。3100 用一次真实请求验证（如首页 200 + 登录接口走通即可，BFF 按需重连）；有问题再按 runbook 重启 3100。
6. **文档更新 + commit**：`docs/stages/stage-31-browser-audit.md`：环境事实节改写——PG 僵尸红线整段替换为「新 PG（重建于 HH:MM，数据丢失事件时间线，start/stop 命令）」；新增「数据丢失影响」小节：旧 fixture 与 PUB/UPLD 测试简历已失，下游任务（EDIT 续派/AIFLOW/LAYPDF/MISC）需自建【E2E】合成简历（素材在 `C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/UPLD/materials/` 可重新上传，或 dashboard 新建）；E2E 账号已重注册（余额 200）。`docs: ...` 中英文 commit。
7. **报告**：写 `C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/PGFIX-report.md`。

## 红线

- 不碰 3100/3003/6380（除验证请求）；3002 只允许按步骤 5 重启一次。
- 不 push 不部署；零密钥；PG 数据放 stage31-runtime（仓库外）；不动仓库代码（只 commit 走查文档）。
- 不做浏览器走查；不上传简历文件；不动面试线。

## 验收标准

1. 5434 监听 + 跨命令窗口存活证据 + start/stop 脚本落盘。
2. db:push/seed 完成：admin 存在、schema 完整（表数合理）。
3. E2E 账号重注册 + 登录 200 证据。
4. status-all.mjs 五项全绿（3002 重启后 worker started）。
5. 走查文档更新 + commit；报告落盘。
