# XFZ 报告:xiaofanzhuo 文档保鲜度审计与修复(Wave 8)

- 日期:2026-10-06
- 范围:xiaofanzhuo 全部 9 份说明性文档(README / AGENTS / CLAUDE.md / docs/{BRD, PRD, DEPLOY, CHECKLIST-DEVICE, e2e 台账, health-audit} / docs/stages/*)
- 结论:**发现并修复 6 处过期/缺失,提交 228f3e9**(仅 .md,9 增 4 删);其余核对条目与仓库实况一致
- 前置检查:工作区 clean、无他人未提交改动 → 正常 commit;本地领先 origin/master 6 个提交,未 push(按红线)

## ① 过期点清单(已全部当场修复)

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---|---|---|---|
| 1 | README.md:18 常用命令 | `pnpm test`(vitest **74** 用例) | vitest **79** 用例 | 2026-10-06 本机实跑 `pnpm test`:10 文件 79 passed;DEPLOY §8.5 与 10-05 注记均记 79 |
| 2 | README.md:26 技术栈 | standalone 部署(实测常驻 **120.7MB**) | 2026-10-03 16.3.7 实测常驻 **~56MB** | 120.7MB 为 P1 期历史值;README 自己的状态行与 DEPLOY §8.5(56MB 稳态)均为 56,原文自相矛盾 |
| 3 | README.md:5 状态行 | 22 条 AC「正式逐条勾检记录**待补**」 | 已出逐条核对表(2026-10-05,生产全量 8 + 半量 4,指向 DEPLOY §8 注记与 XFZ2 报告) | agent-hive/runs/reports/XFZ2-report.md 存在且含「AC 22 条核对表」节;DEPLOY §8 已有同日考古注记,README 未同步 |
| 4 | docs/PRD.md §8 NFR-05 | 按手机号限频(1 单/分钟,**20 单/天**) | 1 单/分钟、**10 单/天**(P1-7 由 20 收紧)另加设备维度天级 10 单/天(P2) | `src/lib/order-limits.ts:13` `orderPerDay = FixedWindowLimiter(24h, 10)`;`api/order/route.ts:131` 429 文案「上限(10 单)」;stage-p1-ux-fixes P1-7 明确记录「天下单 20→10」(commit 0ca5e4a) |
| 5 | docs/PRD.md §1.4 路由总览 | 表止于 `/admin/settings`,无运营后台路由(缺失) | 表下补注:P1 起另有 `/admin/analytics`(+login,独立口令),不在 P0 基线内,指向 stage-p1 | `src/app/admin/analytics/page.tsx` 与 `analytics/login/page.tsx` 实际存在;README 已列而 PRD 路由权威表缺 |
| 6 | docs/CHECKLIST-DEVICE.md 末节 | 「生产复检以同一清单逐条执行」无进度(缺失) | 补 2026-10-05 桌面端核对进度:全量 8 + 半量 4,逐条表见 XFZ2 报告;C03/B02 真机项待人工 | 同 #3 证据;该文档头部 10-05 回填仅覆盖真机复验状态,AC 复检节未同步 |

## ② 核对无误条目(抽查证据在括号内)

- **重点项·BRD/PRD 状态标记**:均为「已定稿(P0 已于 2026-08-23 上线)」(commit 20870e0 早已修正,本次复核确认无回归)
- **重点项·DEPLOY HTTPS/证书记录**:头部与 §0 记「2026-08-23 certbot --nginx 签发、2026-11-21 到期自动续签、HTTP 301」(commit 9886db6 已修,§8.1 有验收勾选;证书实态需服务器侧核实,文档记录本身与提交史一致)
- **重点项·README 验收表述**:状态行三阶段(8-23 部署 / 8-28 真机复验 / 10-03 16.3.7+E2E)与 commit 史逐条对得上(8f3994e、072f158)
- README 快速开始:`.env.example` 存在且含 SESSION_SECRET/MERCHANT_PWD/ANALYTICS_PWD_B64;`db:migrate`/`db:seed`/`db:studio`/`test`/`lint` 全在 package.json scripts
- README 路由清单与 `src/app` 实况一致(顾客 5 页 + 商家 4 页 + analytics 登录)
- README 文档索引 11 行与 docs/ 实际文件一一对应;e2e 台账「26 项 / 0 缺陷」、CHECKLIST「7+11 项」与各文档实文一致
- PRD 数据模型 §7 与 `prisma/schema.prisma` 逐字段一致(含 cancelReason/cancelledBy/customerDeleted/idempotencyKey;Blocklist 属 P2,PRD 状态行已声明 P1–P3 见 stages)
- PRD 锁定参数:登录 5 次锁 10 分钟(`admin-guards.ts:8`)、找回 5 次锁 30 分钟(`admin-guards.ts:9`),与 §3.1/§2.7 一致
- DEPLOY §8 各批次 commit 号(6dbce5c/d89f48b/1a0be68/072f158)全部存在于 git log;§2 八条陷阱、§3 clean swap、§5 备份演练 10-03 PASS 记录与提交史一致
- next 16.3.7、React 19.2.8、Prisma 6.19.3 与 package.json 一致
- AGENTS.md 为 next dev 自动注入的版本警示、CLAUDE.md 仅 @AGENTS.md 引用——非业务陈述,无需动
- e2e 台账 / health-audit / 4 份 stage spec:带日期的历史实录,内容与提交史自洽,按惯例不改写历史记录

## ③ 自评

- **方法**:先 git log + 目录 + manifest + 关键代码摸实况,再逐文档摘可验证陈述逐条比对;每处修正都有代码/提交/实跑三类硬证据之一,无凭记忆改写。
- **抽查可复现性**:验收标准要求抽 5 条可复现——① `pnpm test` 输出 79;② `grep -n "10" src/lib/order-limits.ts` 见天级 10;③ `ls src/app/admin/analytics/login/page.tsx` 存在;④ `grep "AC 22" agent-hive/runs/reports/XFZ2-report.md` 命中;⑤ DEPLOY §8.4 commit 号 `git log --oneline | grep 1a0be68` 命中。
- **已知边界**:生产服务器侧实态(证书剩余有效期、锚点 `current.old-202610031637` 是否已删、监控 cron 实况)本地不可核实,文档相应记录与提交史一致故保留,未标注也不应标注为「过期」。
- **未动项**:PRD §12 迭代规划与实际 P1 交付内容有出入(如「库存自动扣减」未做),属计划 vs 实际的规划性记录且状态行已指向 stages,按最小改动原则不改;`rate-limit.test.ts:7` 代码注释「20/天」与实现不符,但红线禁改代码,留给代码侧任务。
- **产出**:commit 228f3e9(docs(freshness),3 文件 9+/4-);本报告覆盖写入 XFZ-report.md。
