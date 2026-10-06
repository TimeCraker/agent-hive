# AUDLKS 结果报告

> 审计对象：`lekao`（K12 机构 AI 助教工作台）仓内代码 · 只读审计
> 日期：2026-10-06 · 基线 commit：`ace742d`（main，工作树 clean）
> 方式：纯静态代码审读 + `pnpm audit --prod`（registry 查询）；未调用任何线上接口，未做任何写操作验证

## 结论一句话

**无 P0/P1**：36/36 API 路由鉴权判定全覆盖且无「应有鉴权却公开」缺口；签到 T-Coin 幂等/并发防护扎实（DB 唯一约束 + 事务 + 原子 increment）；全仓无 SQL 注入面（唯一 `$queryRaw` 是常量 `SELECT 1`）、无生产密钥硬编码；存在 5 项 P2（构建链 high 漏洞、Android keystore 入库、admin 角色变更无审计、调币竞态、批量注册刷币面）与 5 项 P3。

## API 鉴权覆盖矩阵

**前置事实**：`src/proxy.ts:47` 的 matcher 仅覆盖页面（`/dashboard/:path*`、`/admin/:path*`），**不拦 `/api/*`**——API 鉴权完全依赖各路由自查。逐文件核验后确认无缺口。

路由总数 **36** × 已判定 **36**（100%）。守卫模式经 `grep -A4` 批量核验：admin 组 19 条完全一致（`session.user.role !== "ADMIN"` → 403），多方法路由（invite-codes GET+POST、ideas GET+POST、templates GET+POST）**每个方法独立守卫**。

### A. 需 ADMIN 角色（403）—— 19 条

| # | 路由 | 方法 | 守卫证据 |
|---|---|---|---|
| 1 | `/api/admin/analytics/hourly-24h` | GET | `route.ts:8` `role !== "ADMIN"` → 403 |
| 2 | `/api/admin/analytics/overview` | GET | 同上模式 |
| 3 | `/api/admin/analytics/trend-30d` | GET | 同上模式 |
| 4 | `/api/admin/analytics/trend-7d` | GET | 同上模式 |
| 5 | `/api/admin/audit-log` | GET | 同上模式 |
| 6 | `/api/admin/coin-log` | GET | 同上模式 |
| 7 | `/api/admin/comments` | GET | 同上模式 |
| 8 | `/api/admin/comments/[commentId]` | DELETE | 同上模式 |
| 9 | `/api/admin/history` | GET | 同上模式 |
| 10 | `/api/admin/ideas` | GET | 同上模式 |
| 11 | `/api/admin/ideas/[id]` | DELETE | 同上模式 |
| 12 | `/api/admin/ideas/[id]/status` | PATCH | 同上模式 |
| 13 | `/api/admin/invite-codes` | GET+POST | `route.ts:20,47` 两方法各自守卫 |
| 14 | `/api/admin/online-users` | GET | 同上模式 |
| 15 | `/api/admin/settings` | GET | `route.ts:8` |
| 16 | `/api/admin/stats` | GET | 同上模式 |
| 17 | `/api/admin/tcoin/adjust` | POST | `route.ts:8` |
| 18 | `/api/admin/users` | GET | 同上模式 |
| 19 | `/api/admin/users/[id]` | PATCH | 同上模式 |

### B. 需登录（401）—— 12 条

| # | 路由 | 方法 | 守卫证据 | 数据隔离（IDOR） |
|---|---|---|---|---|
| 20 | `/api/checkin` | POST | `route.ts:29` | 只操作 session 本人 |
| 21 | `/api/auth/me` | PATCH | `route.ts:26` | 只更新本人 `name` 单字段（白名单，`route.ts:72-76`） |
| 22 | `/api/lekao/history` | GET | `route.ts:21` | `where` 钉死 `{ userId }`（`route.ts:33`，不接受外部 userId） |
| 23 | `/api/lekao/ideas` | GET+POST | `route.ts:124,241` | POST 另有 IP 频控 + banned 拦截（`route.ts:224-246`） |
| 24 | `/api/lekao/ideas/[id]` | DELETE | `route.ts:19` | 所有权校验 403（`route.ts:33-38`） |
| 25 | `/api/lekao/ideas/[id]/comments` | GET+POST | `route.ts` 双方法守卫 | 评论挂 idea 公开墙（产品语义） |
| 26 | `/api/lekao/ideas/[id]/comments/[commentId]` | DELETE | `route.ts:19` | 只能删自己的评论 403（`route.ts:33-38`） |
| 27 | `/api/lekao/ideas/[id]/like` | POST | `route.ts:18` | `(ideaId, userId)` 复合唯一，toggle 语义无双赞 |
| 28 | `/api/lekao/summarize` | POST | `route.ts` `!session?.user?.email \|\| !session.user.id` → 401 | 25MB body 上限 + 并发槽位控制 |
| 29 | `/api/lekao/feedback/batch` | POST | `route.ts:93` | 4MB body 上限（`route.ts:99-102`） |
| 30 | `/api/lekao/templates` | GET+POST | `route.ts:28` | GET `where` 钉死 `{ userId }`（`route.ts:34-37`） |
| 31 | `/api/lekao/templates/[id]` | DELETE | `route.ts:17` | `deleteMany({ id, userId })` 不匹配按 404（`route.ts:26-28`） |

### C. 公开（设计如此）—— 5 条

| # | 路由 | 方法 | 公开理由与自带防护 |
|---|---|---|---|
| 32 | `/api/auth/[...nextauth]` | * | next-auth 标准 handler |
| 33 | `/api/auth/register` | POST | 需邮箱验证码（`route.ts:35`）+ bcrypt(10) + 8 位密码下限 |
| 34 | `/api/auth/send-code` | POST | IP 级限频（60s 冷却 + 1min 窗口 5 次 + LRU 10k，`route.ts:22-92`，只信 nginx `X-Real-IP`）+ 邮箱级 60s 冷却 |
| 35 | `/api/auth/verify-code` | POST | 验证码 5 次错码锁定 + 10min 过期（`verification.ts:9,97`）；banned 拦截（`route.ts:49-55`）；邀请码原子 claim 防双兑（`route.ts:79-83`） |
| 36 | `/api/client-error` | POST | 设计性不鉴权：不入库、4KB 上限、字段截断、仅 console.error（`route.ts:10-13,21`）→ 见 P3-3 |

**横切面**：无 `pages/api` 遗留目录；无 CORS 头（纯同源部署）；`dangerouslySetInnerHTML` 仅用于静态 JSON-LD 字面量（`src/components/landing/faq-jsonld.ts:9` 注释明确「禁拼入任何用户输入」）；Redis 键仅用 JWT `sub`（服务端 cuid），无用户自由文本入键。

## 签到 T-Coin 防刷

**结论：单账号维度防护扎实（幂等/并发/竞态三关全过）；唯一剩余攻击面是多账号批量注册（见 P2-5）。**

| 防护维度 | 实现与证据 | 判定 |
|---|---|---|
| 防重放（每日一次） | `prisma/schema.prisma:253` `@@unique([userId, dayKey])`（Asia/Shanghai 自然日 key，`src/lib/checkin.ts:20-27`）；API 先查给友好提示（`src/app/api/checkin/route.ts:41-45`），DB 唯一索引兜底 | ✅ |
| 并发同秒双发 | 签到记录+加币+流水在同一事务（`route.ts:61-99`）；第二个请求的 `create` 撞唯一约束 P2002 → 整个事务回滚（不会出现「币发了但签到没记」）→ catch 读回既有记录返回 `alreadyCheckedIn`（`route.ts:110-118`） | ✅ |
| 余额竞态 | 未初始化(-1) 用**条件 updateMany** 置值，否则**原子 increment**，绝不读后写绝对值（`route.ts:67-77`）——与并发 AI 扣费/退款不相互覆盖 | ✅ |
| 防脚本刷（未登录） | `route.ts:29-35` 无 session 直接 401 | ✅ |
| streak 篡改 | streakDay 由服务端按 last 记录计算（`route.ts:48-57`），客户端不可传参；奖励查表 `AWARD_BY_DAY`（2-8 币封顶，`src/lib/checkin.ts:7-15`） | ✅ |
| 账户维度上限 | 每账号每日最多 1 次 × 8 币封顶；流水全记 `lekao_coin_log`（含 before/after 快照，`route.ts:85-96`）可审计 | ✅ |
| 多账号批量 | 注册需真实邮箱收验证码；send-code 有 IP 频控（in-memory 单实例，重启清零）；邀请码**不是注册门槛**（仅可选 +15 兑换，`verify-code/route.ts:68`） | ⚠️ 见 P2-5 |

**AI 扣费侧**（同属经济系统）：summarize 与 feedback/batch 均接入幂等计费状态机 `reserve → settle | release`，`(userId, idempotencyKey)` 唯一（`summarize/route.ts:317-384`、`feedback/batch/route.ts:214-293`）；幂等键客户端可自报（header/body.requestId）但唯一约束含 userId，无法跨用户碰撞；缺 key 时兼容期自动补随机 UUID（`feedback/batch/route.ts:371-377`，旧客户端无幂等保护，属已知兼容权衡）。

## 注入与数据安全

- **原生 SQL**：全仓仅 1 处 `prisma.$queryRaw`，位于 `src/app/api/admin/settings/route.ts:12`，内容为常量 `SELECT 1`（DB 连通性探活），tagged template 参数化形式，**零注入面**。无 `$executeRaw`、无 `*Unsafe` 变体、无字符串拼接 SQL。
- **ORM 层**：其余全部走 Prisma 类型化 API，参数化由驱动保证。
- **XSS**：无用户输入进入 `dangerouslySetInnerHTML`（仅静态 JSON-LD）；React 默认转义覆盖灵感墙/评论渲染。
- **next-auth 配置**（`src/lib/auth.ts`）：JWT strategy，secret 来自 `process.env.NEXTAUTH_SECRET`（无硬编码兜底，缺失即报错而非降级）；session callback 暴露 `id/role/lekao_gift_coin/t_coin/banned`（`auth.ts:161-169`）——余额与封禁态属产品必需字段，无 password/email 凭证类敏感字段泄露。
- **手工 JWT 签发**（`verify-code/route.ts:104-126`）：`encode()` 用同一 NEXTAUTH_SECRET、httpOnly + sameSite=lax + 生产 secure，字段与 jwt callback 对齐，banned 在签发前拦截（`route.ts:49-55`）。
- **日志 PII**：5 处 console 输出 email（`verify-code/route.ts:50,64`、`auth.ts:60,105,114`），但 `next.config.ts:21` `removeConsole: { exclude: ["error"] }` 生产剥离 log/warn——**生产日志实际不含这些 email**，仅开发环境可见。验证码本身只存 bcrypt 哈希（`verification.ts:52,63`）。
- **密钥文件**：`.gitignore:39-43` 覆盖全部 `.env*` 变体，仓内仅 `.env.example` 模板。

## 硬编码密钥与依赖漏洞

### 硬编码扫描（`git grep` 密钥形态，排除 md/test/env 引用）

| 命中 | 位置 | 性质 | 定级 |
|---|---|---|---|
| `LekaoE2E!2026` | `e2e/auth.global.ts:21`、`scripts/e2e-env.mjs:80` | E2E 测试账号（`e2e@lekao.test`）密码，仅存在于**嵌入式一次性 PG**（127.0.0.1:5433，`e2e-env.mjs:5-8` 注释明确与生产 5434 零接触） | P3 |
| `lekao2024` | `lekao-android/app/build.gradle.kts:53,55` | Android **release** keystore 口令，且 keystore 文件本体入库（`git ls-files` 确认 `app/release.keystore` 被追踪） | **P2-2** |
| `postgres:postgres` | `scripts/e2e-env.mjs:78,136` | 嵌入式 E2E PG 超级用户口令（随目录丢弃的临时实例） | P3 |
| 邀请码生成 `Math.random` | `scripts/generate-invite-codes.ts:20` | 运维脚本 6 位码熵源弱；**线上 admin API 版已是 `crypto.randomInt` + 8 位 + 32 字符表（32^8≈1.1e12，不可爆破）**，见 `src/app/api/admin/invite-codes/route.ts:2,6-14` | P3 |

未发现任何 AI key（sk- 形态）、NEXTAUTH_SECRET、SMTP 凭证、DB 生产口令入仓。

### 依赖漏洞（`pnpm audit --prod`）

首次对 npmmirror 执行失败（镜像无 audit 端点，`ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS`），按重试规则换官方 registry 成功（重试 1/2 次）：

- **1 high**：`source-map-js@1.2.1` 事件循环 DoS（GHSA-68fv-2mgg-jv7q），传递路径 `next@16.3.7 → postcss@8.5.23 → source-map-js`；修复版 ≥1.2.2。
- 可达性评估：source-map-js 由 postcss 在**构建期**消费，生产 standalone 运行时不加载 postcss——实际暴露面为 CI/构建环境解析恶意 source map（本仓依赖均来自官方 registry + lockfile 锁定），运行时风险低。定级 P2-1（官方 high 标签 + 修复成本极低：`pnpm.overrides` 强制 `source-map-js@^1.2.2`）。
- 其余（0 critical / 0 moderate / 0 low）。

## 分级问题清单（P0-P3）

**P0：无。** 无「应有鉴权却公开」的路由；无生产密钥泄露；无注入点；签到幂等完整。

**P1：无。**（以下最重项均因「触发条件受限 / 影响面有兜底」降为 P2）

| 编号 | 定级 | 问题 | 证据 | 建议修复 |
|---|---|---|---|---|
| P2-1 | P2 | 依赖 high 漏洞：source-map-js 1.2.1 事件循环 DoS（next→postcss 传递）；构建链可达、运行时基本不可达 | `pnpm audit --prod --registry=https://registry.npmjs.org` 输出；GHSA-68fv-2mgg-jv7q | package.json 加 `pnpm.overrides: { "source-map-js": "^1.2.2" }` 后 `pnpm install` 刷新 lockfile |
| P2-2 | P2 | Android release keystore 文件+口令双双入库：任何有仓读权限者可伪造同签名 APK（对已装 demo APK 的更新攻击面）；仓内注释已自认 demo 且声明商业化前重生成，Android 线已冻结（web-only 决策） | `lekao-android/app/build.gradle.kts:52-55,75-76`；`git ls-files` 含 `app/release.keystore` | 从 git 历史移除（filter-repo）+ 口令改环境变量注入；或至少确认 GitHub Releases 旧 APK 已下架（hero 入口已移除） |
| P2-3 | P2 | admin 改用户 `role`（提权/降权）**无审计日志**——对比 invite_create（`invite-codes/route.ts:70-85`）与调币（`tcoin/adjust` 写 coinLog）均有留痕，最敏感的权限变更反而无痕 | `src/app/api/admin/users/[id]/route.ts` 全文 grep `audit` 为空；可改字段白名单本身正确（`route.ts:16-20` 仅 name/role） | 补 `auditLog.create`（action: `role_change`，含 before/after role） |
| P2-4 | P2 | `admin/tcoin/adjust` 读后写绝对值：先查余额、内存计算、再写回绝对数，与并发 AI 扣费/退款竞态会**覆盖掉并发变动**——正是 checkin 已修复的同类反模式（`checkin/route.ts:19-20` 注释点名） | `src/app/api/admin/tcoin/adjust/route.ts:36-53` | 改为条件 `updateMany` + `{ increment/decrement }` 原子操作（照抄 checkin 事务写法） |
| P2-5 | P2 | 批量注册刷 T-Coin 攻击面：注册无邀请码/设备门槛（邀请码仅可选 +15 兑换），防线只剩「真实邮箱收验证码」+ send-code IP 频控（**in-memory 单实例，重启清零，仅挡 send-code**）。免费模式下被刷的直接成本是 owner 的 AI API 额度。单账号日收益 ≤8 币、需独立真实邮箱，实际利用成本较高 | `register/route.ts:35`（仅验证码）；`send-code/route.ts:13`（注释自认单实例局限）；`verify-code/route.ts:68`（邀请码可选） | 频控迁 Redis（跨重启/多实例）；是否加注册邀请码门槛属产品决策（免费模式 vs 防刷权衡，你拍板） |
| P3-1 | P3 | 验证码用 `Math.random()` 生成（非 CSPRNG），6 位数字空间 10^6；受 5 次锁定+10min 过期+IP 频控约束，实际可利用性低 | `src/lib/verification.ts:16` | 换 `crypto.randomInt(0, 1_000_000)`（一行改动，admin 邀请码已用同法） |
| P3-2 | P3 | 邮箱枚举：send-code 按分支返回「该邮箱已注册/未注册」（`send-code/route.ts:130,141`）+ verify-code 返回「用户不存在」404（`route.ts:45`）；注释声称防枚举但行为恰是枚举 | 同左 | 统一返回模糊提示「验证码已发送」（若产品接受登录页体验变化） |
| P3-3 | P3 | `/api/client-error` 设计性无鉴权：不入库但可刷 console.error 日志（journal 噪音/磁盘）；已有 4KB 上限+字段截断缓解 | `client-error/route.ts:10-13,21` | 可加轻量 IP 频控或保持现状（影响仅日志噪音） |
| P3-4 | P3 | 邀请码生成脚本 `Math.random` 6 位（线上 API 版无此问题） | `scripts/generate-invite-codes.ts:18-22` | 脚本同步用 `crypto.randomInt` + 8 位 |
| P3-5 | P3 | E2E 凭证入库（测试账号密码 + 嵌入式 PG 口令）；已验证与生产实例零接触、环境一次性 | `scripts/e2e-env.mjs:78-80`、`e2e/auth.global.ts:21` | 可接受现状；若收紧可改 env 注入 |

## 自评

- **验收达成**：① 矩阵 36/36 路由全覆盖（19 admin + 12 用户 + 5 公开，多方法路由逐方法核验）；② 签到防刷有代码级结论（schema 唯一约束 + 事务原子性 + P2002 兜底三重证据，文件:行号见上表）；③ P0-P3 每条附路径:行号或命令输出。
- **做得实的**：鉴权判定不靠文件名猜，逐条 `grep -A4` 核验守卫代码段；IDOR 抽查了全部 6 个带资源 ID 的写路由；扣费幂等状态机核对了幂等键来源与唯一约束边界；审计依赖先用镜像失败后按重试规则换官方 registry 成功（未 install、未写 lockfile）。
- **局限**：纯静态审计，未做运行时验证（任务红线禁止线上写操作，未发起任何请求）；in-memory 频控的「重启清零」是代码推断未实测；`pnpm audit` 仅覆盖 prod 依赖（devDependencies 未审）；Android 冻结目录与 scripts/ 归档脚本只做了密钥形态扫描，未做全量逻辑审计；未审计部署层（nginx/systemd 配置在 asterforge-deploy 仓，超出本任务范围）。
- **红线遵守**：零 git 写操作、零依赖安装、零线上请求、除报告文件外零写入；并行波次的 .md 未提交改动未触碰（审计期间 git status 保持 clean）。
