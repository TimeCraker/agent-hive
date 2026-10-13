# PGFIX 报告：隔离测试库重建（2026-10-12 18:39–18:50）

任务：旧隔离 PG（僵尸 pid 24696）死亡且数据目录早删 → 用 embedded-postgres 重建 5434 全新库，push+seed+E2E 重注册，恢复服务链，更新走查文档。

## 验收结果（全过）

| # | 验收标准 | 结果 | 证据 |
|---|---------|------|------|
| 1 | 5434 监听 + 跨命令存活 + start/stop 落盘 | ✅ | PG 18.4 pid 3308；18:42–18:49 间 7 条独立命令（probe1–4、status-all×2、final-probe）全部存活，最长间隔 7 分钟；`$RT/start-pg.mjs` / `stop-pg.mjs` 落盘，start 自带幂等建库 |
| 2 | db:push/seed：admin 存在、schema 完整 | ✅ | 25 表（accounts…resume 全链）；users=2（admin `cmv54kzmb…` + e2e），resumes=0 |
| 3 | E2E 重注册 + 登录 200 | ✅ | 新 uid `cmv54mckv000iuvmov992fzaj`，tCoin=200；send-code→Redis 读码 640581→verify→complete-registration 201→NextAuth 密码登录 session 200→/dashboard HTTP 200 |
| 4 | status-all 五项全绿（3002 worker started） | ✅ | 18:49:15 全表：PG SELECT 1 OK / Redis PONG / Web 3100 200 / AI 3002 200（log: "BullMQ parse worker started"）/ Exp 3003 200（并发 2） |
| 5 | 走查文档更新 + commit；报告落盘 | ✅ | commit `92a763a`（仅 docs/stages/stage-31-browser-audit.md，+43/−18）；本文件 |

## 时间线（关键事实）

- 17:12 旧 PG 最后确认存活（UPLD 收工）；17:12–18:35 间死亡（主控核实，不可恢复）
- 18:39 开工；18:42 initdb + WMI 拉起新 PG（18.4，trust 认证，127.0.0.1:5434，库 resumeaix）
- 18:44 db:push（25 表）；18:45 seed（admin）
- 18:46 E2E 重注册完成；发现 curl 中文 name 乱码入库，DB 参数化 UPDATE 修正为「【E2E】Stage31 走查」（len 15）
- 18:47 重启 3002：旧 tsx 树（pid 29908/监听 8708）已先期失联死亡，CIM 直接拉起，worker started
- 18:48 发现 3003 被**静默收割**（最后日志 17:11 health 200，无崩溃——runbook 登记过的已知模式，本次单死），按 runbook 定案 CIM 恢复
- 18:49 status-all 五项全绿；18:50 commit + 本报告

## 关键决策与坑（已写回走查文档）

1. **PG 启动方式**：直接走 WMI `Win32_Process.Create` 拉起 start-pg.mjs（未试沙箱 detached 直跑——Redis/ai/export 攻关已证会被收割，一步到位）。实测稳定。
2. **db:push 两坑**：turbo `db:push` task 未声明 env 透传，`export DATABASE_URL` 传不进 → 绕 turbo 在 packages/db 直跑 prisma；`prisma db push` 附带的 generate 因运行中服务锁 engine DLL 报 GEPERM（push 本身成功），以后用 `--skip-generate`。
3. **`start-all-cim.ps1` 编码坑**：本会话 git-bash→powershell -File 调用时 ps1 内中文被按 GBK 解析导致 ParserError（PREP 环境能跑，编码环境差异）；改用内联 `Invoke-CimMethod` 等价命令，已写入 runbook 通用写法。
4. **status-all.mjs PG 探测过时**：原硬编码旧僵尸 pid 24696 → 改为 pg 客户端真实 SELECT 1 + pg.pid（仓库外脚本，随本任务配套更新）。
5. **seed 事实修正**：仓库 seed.ts 不设 role，admin@resumeaix.local 落库 role=USER（非 ADMIN）——ADMIN 走查任务仍需 UPDATE 提权，文档已按事实改写。

## 数据丢失影响（已在走查文档「数据丢失影响」节登记）

丢失不可恢复：Stage26 fixture（stage25@example.test 及 2 份简历）、旧 E2E 账号、PUB 走查创建的简历与副本、UPLD 六份上传记录。新库 resumes=0。下游（EDIT/AIFLOW/LAYPDF/MISC）需自建【E2E】合成简历：素材可从 `Documents/ResumeAIX-stage31-audit/UPLD/materials/` 重传或 BFF 新建。E2E 账号已重注册（余额 200）。

## 红线遵守

- 3100/6380 全程未动（仅验证请求）；3003 非我所杀（17:11 起就被收割，18:41 后才消失），恢复动作符合 runbook 定案；3002 仅重启一次。
- 零密钥打印（DATABASE_URL 仅报告长度）；未 push 未部署；仓库内仅 commit 走查文档（工作区既有改动原样保留）；无浏览器走查、无简历上传、未动面试线。

## 遗留风险

- 新 PG 经 WMI 拉起理论上稳（同 ai/export 定案），但本机沙箱收割已有两次前科 + 本次 3003 一例——下游任务开工/收工各跑一次 `status-all.mjs` 即可及时发现；若 PG 再死，start-pg.mjs 幂等可重拉（数据会再丢，走查数据请及时登记到文档而非只存库里）。
- commit `92a763a` 未 push（红线），主控后续按节奏统一 push。
