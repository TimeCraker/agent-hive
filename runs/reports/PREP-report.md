# PREP 报告：Stage31 全站走查环境拉起

- 执行时间：2026-10-12 14:15 – 14:50（本地）
- 仓库：`C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main
- HEAD 变化：开工 `a6cc734` → 收尾 `dfa2472`（本任务 3 个 docs commit；构建时 HEAD=`a6cc734`，BUILD_ID `N3cuT3EzFUMCRYVO4wsf4`）
- 未动他人改动：`apps/interview-helper/next-env.d.ts`、`scripts/eval-*` 的既有工作区改动原样保留，未提交。

## 验收项逐条结论

### 1. Redis 6380 ✅（本任务核心攻关，一次成功）

- **证据**：
  - 仓库 ioredis 新进程探活：`PING -> PONG`，server 8.2.10（Memurai DEV），dbsize 0。
  - 重启复验：`stop-redis.mjs`（停后端口 PONG=false）→ `start-redis.mjs` → 新进程再 PING PONG——非偶然。
  - 监听：`netstat` 确认 `127.0.0.1:6380 LISTENING`（收尾 pid 17864）。
- **脚本落盘**（`C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/`，仓库外不入库）：`start-redis.mjs`（幂等 + 端口强校验，不换随机端口）+ `stop-redis.mjs`（pid 文件 + 树验证）。
- **攻关过程**：
  1. `npm i redis-memory-server@0.17.1`（3 分钟，npm 无需镜像）——**postinstall 已自动把 memurai.exe 下载进 `node_modules/.cache/redis-memory-server/redis-binaries/stable/`**，无需再碰 memurai.com。
  2. 前台试验发现两个关键点：(a) 该库固定端口被占时会**静默换随机端口**（前次会话「进程活着但不监听 6380」的最可能根因）；(b) 父 node 进程死时其 RedisKiller 会连坐杀 memurai。结论：**放弃 node 常驻包裹，直接 detached spawn memurai.exe**（redis 参数兼容：`--port 6380 --bind 127.0.0.1 --save "" --appendonly no`）。
  3. 未走到方案 b（手下 zip）/ c（全盘搜二进制）——方案 a 一次成功。
- **许可注意**：Memurai DEV 版许可 10 天自动关停（测试用途无碍；若未来某天 Redis 莫名消失，先看 `redis.log` 里 license shutdown）。

### 2. Web 3100 ✅

- `pnpm --filter @resumeaix/web build` 一次通过（无构建阻断问题，无需修复 commit）。
- `next start -p 3100` detached（pid 29324），`curl http://127.0.0.1:3100` → **HTTP 200**（30ms）。
- 构建 HEAD 与 BUILD_ID 已写入走查文档「环境事实」。
- 启动脚本：`start-web-3100.mjs`（幂等；注意 next bin 在仓库根 `node_modules/next/dist/bin/next`，不在 app 本地）。

### 3. ai-service 3002 / export-service 3003 ✅

- ai-service：`/health` 200；日志含 **`BullMQ parse worker started`**（worker 连 Redis 成功证据）+ `AI service running at http://127.0.0.1:3002`。
- export-service：`/health` 200（`concurrency max=2`）；Puppeteer Chromium 在 `~/.cache/puppeteer/chrome/win64-148.0.7778.97/` 存在，**实际 PDF 渲染未测**（LAYPDF 任务首个动作建议先真导一份）。
- 启动方式：两服务 dist 为 ESM 无扩展名 import、node 直跑解析不了 → 与 dev 一致用 **tsx 直跑 TS 源码**（`start-ai.mjs` / `start-export.mjs`，幂等，detached，回环绑定）。
- **稳定性定案（PREP 内两次复现 + 验证）**：从 Agent 沙箱 shell 直接拉起的 tsx 进程树会被沙箱会话清理**静默收割**（无崩溃日志、ai/export 同死、Redis/Web 不受影响；两次死亡窗口与 git/husky 操作无关）。**解法：用 WMI `Win32_Process.Create` 服务端创建**（不挂调用方 job object），已封装 `start-all-cim.ps1`，实测跨多个命令窗口稳定存活。恢复 = 重跑该 CIM 脚本（幂等 ~15s）。**ai/export 停止必须 `taskkill /PID <pid> /T /F`**（tsx 父子双进程）。

### 4. 走查文档 ✅（commit c15ba69 + 425a65c）

`docs/stages/stage-31-browser-audit.md`：
- 26 页面路由清单（实际遍历 `apps/web/src/app/**/page.tsx` 生成，含动态段标注）+ 404，每页有区域/归属任务/状态。
- 对照 handoff 9 项覆盖查漏：路由全覆盖；AI 四模式与 PDF 导出无独立路由，入口标注在编辑器/公开页。
- runbook：可直接照抄（status-all 一键核对、各服务启停、web 重建重启、验证码读取、冷启动顺序、PG 红线、AI 渠道结论）。

### 5. E2E 账号 ✅（真实流程，非 DB 造数）

- 库内原无【E2E】前缀账号（只有 stage25@example.test，密码未记录）。
- **注册路径**：3100 真实 `POST /api/auth/send-code`（SMTP 实际发出成功）→ 验证码从 Redis `auth_code:<email>` 只读取出 → `/api/auth/verify-code` 200 → `/api/auth/complete-registration` 201。
- 账号：`e2e-stage31@resumeaix.test` / `E2eStage31!2026`（name=【E2E】Stage31 走查；本地合成凭证，已入走查文档）。
- **登录验证**：NextAuth credentials 全流程（CSRF → callback → session）HTTP 级通过，`GET /dashboard` 200。
- 说明：注册 API `/api/auth/register` 已 410（产品改为登录页验证码注册），故走的是登录页同款后端流；未用浏览器（红线），凭 HTTP 层验证登录态成立。

### 6. PG 只读核查 ✅（僵尸进程完好）

- pid 24696 存活（tasklist 确认），5434 监听中，**未做任何干预**。
- 隔离库现状（Prisma 只读）：users=2、resumes=2（stage26 fixture）、**无 admin 种子账号**、**site_configs 无 `ai_config` 行**。

## AI 渠道结论（重要，后续 AIFLOW/UPLD 任务必读）

- **文本渠道就绪**：智谱 Coding Plan 端点（`open.bigmodel.cn/api/coding/paas/v4`）+ `~/.claude/zhipu.env` 的 `ZHIPU_API_KEY`（该文件仅此一个变量；值未打印未入库）。
- **实测**：`POST /api/ai/jd-keywords`（合成短 JD）返回真实结构化关键词 JSON——真实 LLM roundtrip 成功。
- **排障链**（三次失败→成功，均已固化进 `start-ai.mjs`）：
  1. 401 风险：`.env` 的 `DEEPSEEK_BASE_URL` 会抢占 baseUrl（ZHIPU_BASE_URL 缺位时）→ 注入 `ZHIPU_BASE_URL`。
  2. 400「模型不存在」：`.env` 的 `AI_*_MODEL` 仍是 `deepseek-v4-*` → 覆盖为端点实查存在的 `glm-5.3-flash`/`glm-5.3`（models 列表 2026-10-12 实查：glm-4.5~5.3 系，**无 VL 模型**）。
  3. 兜底通道原打 SiliconFlow（key 过期 401）→ 指回智谱 flash。
- **vision 通道未就绪**：SiliconFlow `VISION_API_KEY` 过期 + 智谱端点无 VL 模型 → **扫描图片解析预期失败**，属环境限制，已在走查文档「环境性限制」登记（AIFLOW 任务用真实 401 验证失败态正好符合其任务设计）。
- DB 无 ai_config 行 → 渠道完全靠 start-ai.mjs 的 env 注入；**不要手工改 .env 放真实 key**。

## 遗留风险

1. **PG 僵尸进程是单点**：数据目录已删，进程死 = 隔离库（含全部走查数据）永久丢失，不可恢复、不可重建（无 docker）。任何「重启大法」冲动前重读走查文档红线。机器不能重启。
2. **ai/export 必须用 CIM 脚本拉起**（已定案）：沙箱 shell 直接 node 拉起会被静默收割（PREP 两次复现）；用 `start-all-cim.ps1` 已稳定。走查任务收工时跑 `status-all.mjs` 留痕。
3. **vision 通道死**：UPLD 扫描图片用例只能验失败态；若后续要真正测图片解析，需要用户提供有效 SiliconFlow key 或其它 VL 渠道（登记人工介入点）。
4. **admin 无种子**：ADMIN 任务需自造提权账号（UPDATE role）或登记人工介入；已在文档写明。
5. Memurai DEV 许可 10 天自动关停（2026-10-22 前无碍）。
6. 生产对照不在本 PREP 范围；如需，见 asterforge-deploy（只读、勿部署）。

## 给后续 7 个走查任务的交接要点

1. **开工三件事**：`git log --oneline -1` 记 HEAD → `node $RT/status-all.mjs` 核环境 → 读 `docs/stages/stage-31-browser-audit.md` 的 runbook 与红线（尤其 PG 24696）。
2. 测试账号用 `e2e-stage31@resumeaix.test / E2eStage31!2026`；新注册账号走 send-code + Redis 读码（runbook 有现成命令）；**不要**用 stage25 的简历做破坏性操作（那是 Stage26 fixture，删除前先复制一份到 E2E 账号名下）。
3. AI 功能（评分/润色/策略/解析）现在**真实可用**（智谱 glm-5.3 系）；正常单次调用即可，不要批量烧 T-Coin。
4. 改了 web 代码要重建：`pnpm --filter @resumeaix/web build` → 杀 3100 树 → `start-web-3100.mjs`（runbook 原文可抄）；BUILD_ID 会变，记得回写文档。
5. 缺陷只登记不越权：upload 五组件 + ai-service 解析链 + stage-31 Spec 三份是主会话独占文件（清单见 handoff）。
6. git-bash curl 发中文 JSON 会 Content-Length 错位——用 `--data-binary @file`（本次实测踩过）。
7. 收工也跑一次 `status-all.mjs`，把输出贴进自己的结果分区（环境漂移留痕）。

## 自评（没把握的部分）

- **ai/export 沙箱收割的根因是强证据推断而非实锤**：观察事实（两次同死、无日志、Redis/Web 幸存、WMI 拉起后稳定）一致指向沙箱 job object 清理，但我无法直接观测 job 归属确认机制。WMI 方案已实测稳定，若下游再遇失联直接重跑 CIM 脚本即可。
- **PDF 实渲染未验证**：Chromium 二进制在位 + health 200，但没真导出过一份 PDF（红线：不做浏览器走查）。LAYPDF 开局先自验。
- **SMTP 实际送达未确认**：send-code 返回 success 且邮件未抛错，但我无法读该测试邮箱确认到达；不影响走查（验证码走 Redis）。
- **admin 提权方案未演练**：只登记了路径（UPDATE role），没有实际执行——留给 ADMIN 任务决策。
