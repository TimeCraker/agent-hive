# XFZ 体检报告：社区小饭桌点餐服务质量门与契约体检

## 1. 项目概况与检查时间

| 项 | 值 |
|---|---|
| 项目 | xiaofanzhuo —— 社区小饭桌点餐（顾客链接点餐 + 商家管理端；无在线支付，订单快照 + 微信私信收款） |
| 线上地址 | https://xiaofanzhuo.asterforge.top （2026-08-23 HTTPS 公网验收全绿；2026-08-28 微信真机复验通过） |
| 技术栈 | Next.js 16.3.7 (Turbopack) + React 19.2.8 + Prisma 6.19.3 + SQLite（standalone）；Vitest 4.1.11 |
| 检查时间 | 2026-11-01 17:09–17:16（本地，Asia/Shanghai） |
| 检查基线 | commit `228f3e9`（master，与 origin/master 同步，工作树干净） |
| 检查环境 | Windows 11 / Git Bash；Node v24.16.0（满足 engines >=20）；pnpm 9.15.9（与 packageManager 声明一致） |

**环境准备事实**：仓库 `node_modules` 原缺失，先执行 `pnpm install --frozen-lockfile` 补装（1m 9.2s，锁文件一致无漂移）；Prisma Client 随安装自动生成至 `src/generated/prisma`（`binaryTargets = ["native", "debian-openssl-3.0.x"]` 双平台引擎，对应 Windows 构建 / Linux 服务器运行的部署形态）。任务指定的 `npm test` / `npm run build` 经 npm scripts 正常驱动 vitest 与 next，无包管理器冲突。

## 2. 单测执行结果（Vitest 质量门）

**命令**：`npm test`（即 `vitest run`）

| 指标 | 结果 |
|---|---|
| 测试文件 | **10 / 10 通过** |
| 用例总数 | **79 / 79 通过（通过率 100%）** |
| 失败 / 跳过 | 0 / 0 |
| 总耗时 | **595ms**（transform 835ms、import 1.38s、纯断言执行 91ms） |
| 退出码 | 0 |

逐文件用例数（verbose reporter 逐条 ✓ 复核，合计 79）：

| 测试文件 | 用例数 | 覆盖契约 |
|---|---|---|
| `validation.test.ts` | 16 | 菜品/订单输入校验（必填、价格>0 两位小数、长度上限） |
| `order-no.test.ts` | 11 | 订单号 ORD-MMDD-XXXX 生成规则 |
| `auth.test.ts` | 10 | 商家密码 bcrypt 认证 |
| `pricing.test.ts` | 10 | 服务端计价与金额展示（见 §4） |
| `rate-limit.test.ts` | 7 | FixedWindowLimiter 通用限频器 + 登录失败锁定 AttemptTracker |
| `time.test.ts` | 7 | 午/晚市时间窗口判定 |
| `order-limits.test.ts` | 6 | 下单限频策略（分钟级 peek/note、天级上限） |
| `order-state.test.ts` | 5 | 订单状态机守卫矩阵（见 §4） |
| `reorder.test.ts` | 5 | 再来一单：快照对照当前菜单 |
| `uploads.test.ts` | 2 | 上传扩展名白名单 |

**非阻塞观察**：Vitest 启动时提示 `vitest.config.ts` 使用 ESM 语法但被作 CJS 加载，与 Vite `configLoader: 'native'` 未来默认不兼容——仅弃用预警，不影响执行，未做修改（遵守只读红线）。

**覆盖面如实说明**：79 用例均为 `src/lib` 纯函数单元测试，无 DB / API 路由集成用例——这是该仓既定测试策略（端到端验收走 `docs/CHECKLIST-DEVICE` 真机流程），属现状描述而非本次回归缺陷。

## 3. Next.js 构建结果与性能指标

**命令**：`npm run build`（`next build`，Turbopack）→ **退出码 0，构建成功，无编译/类型错误**

| 阶段 | 耗时 |
|---|---|
| 编译（Compiled successfully） | **883ms** |
| TypeScript 检查 | **1915ms** |
| 静态页生成（11 workers） | **31/31，407ms** |

**路由分布（App Router 共 39 条 + 1 条 Middleware）**：

- **静态 ○（5 条）**：`/_not-found`、`/address`、`/admin/analytics/login`、`/admin/login`、`/recover` —— 均为无需请求期数据的登录/找回/表单页
- **动态 ƒ（34 条）**：顾客侧 `/`、`/checkout`、`/me`、`/orders`、`/order/[id]` 等 + 商家端 `/admin/*` 全部管理页 + **20 条 `/api/*` 路由**（订单创建/取消/删除/状态、菜单、地址、上传、健康检查、黑名单等）
- **Proxy（Middleware）×1**：请求入口中间件

全部 34 条动态路由符合点餐业务形态（菜单、订单、商家后台均依赖请求期 DB 数据与身份态，无应静态化而未静态化的页面）。

**构建警告（4 条，均非阻塞）**：全部为 Turbopack `Dynamic filesystem access causes tracing of the whole project` 追踪广度类警告——2 条来自 Prisma 生成客户端（`src/generated/prisma/index.js:262`、`runtime/library.js:7`），2 条来自 `src/lib/uploads.ts:69/81` 的 `path.join` 动态路径（`/uploads/[...path]` 路由运行时按请求路径读上传文件，属该路由的固有行为）。语义为「tracing 会带上更多文件」，不是正确性缺陷，不影响 standalone 产物运行。

## 4. 业务契约健康度分析

### 4.1 订单状态机（核心契约）

- **模型**：4 状态 `pending → accepted → finished / cancelled`；守卫纯函数 `canMerchant` / `canCustomer`（`src/lib/order-state.ts`，自称 PRD §4 操作矩阵唯一权威，非法流转一律 400）：
  - 商家：`accept` 仅 `pending`（「确认收款并接单」唯一接单入口）、`finish` 仅 `accepted`、`cancel` 限 `pending/accepted`
  - 顾客：`cancel` 限 `pending/accepted`（P0 熟人场景有意不拦 accepted）、`delete` 仅终态 `finished/cancelled`（删自己侧记录，不影响商家数据）
- **API 接线验证（非纸上契约）**：守卫真实接入三个路由——商家操作 `api/admin/orders/[id]/action/route.ts:35`、顾客取消 `api/order/[id]/cancel/route.ts:25`、顾客删除 `api/order/[id]/delete/route.ts:28`
- **测试锚定**：`order-state.test.ts` 5 组矩阵断言逐一覆盖「角色 × 动作 × 状态」的放行与拒绝边界 ✅
- **Schema 侧配套**：`acceptTime/finishTime/cancelTime/cancelledBy`（customer | merchant）完整记录流转轨迹；终态后不可再变更由守卫保证

**结论：状态机契约稳定，纯函数单测 + API 三点接线 + Schema 时间戳三方一致。**

### 4.2 计价契约（金额计算）

- `computeTotals`（`src/lib/pricing.ts`）以**「分」为整数单位累加**再除回元，规避浮点误差（测试锚点：`0.1×3 + 0.2 → 0.5`，直加浮点会得 `0.5000000000000001`）；`subtotal + deliveryFee = total`，配送费 `round2` 取整
- `formatMoney` 餐价习惯展示：整数不带 `.00`（¥28）、一位小数保留一位（¥28.5）、末尾零剥掉、以分取整免疫浮点尾差（`56.00000000000001 → ¥56`）
- 服务端结算权威（C-CK-07），10 用例覆盖正交边界 ✅

### 4.3 快照契约（点餐冻结原则）

- **Schema 落地**：`Order.items` / `addressSnapshot` 以 JSON 序列化文本存储——菜品名/价格/地址/金额**下单即冻结**，不受后续改菜改价影响（SQLite 无 Json 类型，以 String 承载，注释明确该约定）
- **再来一单对照**：`reconcileReorder` 将历史快照对照当前菜单——dishId 不在架 → 「已下架」，`soldOut` 或 `stock≤0` → 「已售罄」（与下单 API 判定口径一致），全部不可点则不写车不跳转；5 用例 ✅
- **快照图片**：`snapshot.ts` 客户端 canvas 绘制订单快照 PNG（1500px 宽 2x，微信内长按保存路径）

### 4.4 数据层与防护面

- **迁移状态**：`prisma migrate status` → 2 个迁移（`20260823080036_init`、`20260823215930_add_blocklist`），**Database schema is up to date**（本地 dev 库；线上另有部署手册管束，本次未触碰任何数据库）
- **唯一性约束**：`Order.idempotencyKey @unique`（下单幂等防重复提交）、`Customer.phone @unique`（手机号即身份锚）、`Blocklist.phone/deviceToken` 双 `@unique`（P2 骚扰拦截，拉黑 = 1 手机号行 + N 设备行）
- **限频参数**（与 HEAD `228f3e9` 保鲜度审计同步值一致）：下单 1 单/分钟（`peek` 预检 + 成功才 `note`，**校验失败不消耗配额**，顾客移除售罄菜可立即重提）+ 10 单/天；地址增删 10 次/分钟；登录/找回连续失败锁定（AttemptTracker，锁期拒绝、过期自解、成功清零）

## 5. 自评结论

**达标 ✅** —— 三项验收标准全部满足：

| 验收标准 | 结果 |
|---|---|
| Vitest 单测数字化通过率与耗时 | **79/79 = 100%，595ms**（10 文件全过）✅ |
| Next.js 构建结果明确（页面数、静态/动态分布） | **EXIT=0；39 条路由 = 5 静态 + 34 动态，另 1 条 Middleware**；编译 883ms / TS 1.9s / 静态页 31/31 ✅ |
| 结构化体检报告 | 本文件 ✅ |

**质量门判定**：单测与构建双绿，订单状态机、计价、快照三大核心契约「测试锚定 + API 接线 + Schema 约束」三方一致，限频/幂等/黑名单防护参数与文档审计同步，迁移与本地库一致。**无阻塞缺陷。**

**遗留观察（均不阻塞，未扩围处理）**：

1. 4 条 Turbopack tracing 广度类警告（Prisma 生成代码 ×2、uploads.ts 动态路径 ×2）——固有行为，仅影响 standalone 追踪体积；
2. `vitest.config.ts` ESM-in-CJS 的 Vite configLoader 弃用预警——未来 Vite 大版本前需改 `.mjs` 或加 `"type": "module"`；
3. 测试策略为纯函数单测 + 真机清单验收，无自动化集成/E2E 层——现状如实记录。

**红线遵守声明**：全程只读体检（依赖补装与 Prisma Client 生成为可逆本地构建产物，均在 gitignore 内）；未修改数据库结构与业务逻辑；结束时 `git status` 干净，无脏提交、无未追踪残留（本报告文件为任务指定交付物，位于 `waves/wave30/reports/`）。
