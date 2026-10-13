# ADMIN：管理后台 8 模块只读走查报告（Stage 31 清单第 9 项）

- **执行时间**：2026-10-12 22:27–22:55
- **仓库**：`C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`（main 分支）
- **Git 记录**：走查起始 HEAD `dd5a3ac`；修复 commit `9b6ef16`（趋势图日期标签）；台账登记 commit `35fdff7`（收工 HEAD）
- **本地隔离测试库**（非生产）：Web 3100 正式构建预览，BUILD_ID 走查前 `Kz0lca2hlUy5hPfqoRCyn` → 修复重建后 `lqdffvP-mU9ZzV8mOvaRX`；PG 5434 / Redis 6380 / AI 3002 / Export 3003 开工、重启后、收工共三次 `status-all.mjs` 核对，五项全绿
- **账号**：admin 走查账号 `admin@resumeaix.local`（按走查文档环境限制节口径临时提权，见下文操作记录）；负向验证普通账号 `e2e-stage31@resumeaix.test`（走查文档登记的 E2E 专用账号）；未登录态直接访问验证
- **浏览器**：Playwright MCP 独占；视口 1440×900 为主，390×844 抽查 3 个模块
- **证据目录**：`C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/ADMIN/`（27 张截图全量归档）
- **登记落点**：`docs/stages/stage-31-browser-audit.md` ADMIN 分区矩阵 + 页面清单 21–28 行 ✅ + 缺陷台账 S31-ADMIN-01/02 + 环境事实「ADMIN 收工更新」+ 环境限制节回滚备注（commit `35fdff7`）；本仓库内同步留档 `ResumeAIX/runs/reports/ADMIN-report.md`（runs/ 为 gitignore，报告留本地）

---

## 一、零写操作声明（含两次动态校验的只读短路确认细节）

**全程零业务写操作**：未调任何用户余额、未核销订单、未审转账、未重试退币、未改 AI 渠道配置、未改计费配置、未新建/发布/删除公告、未改提示词、未改任何用户资料、未删任何数据。

仅有的两次动态校验点击，均**先读页面源码确认该路径只发只读请求（或零网络请求）之后**才执行：

1. **T-Coin 快速调整表单（/admin/tcoin 配置管理 tab）**
   - 源码确认：`handleAdjust()` 先 `GET /api/admin/users?search=<email>&limit=1` 查用户；查不到时 `setAdjustResult('未找到用户')` 并 return，**POST `/api/admin/tcoin/adjust` 位于该分支之后，永不触达**。
   - 实测操作：填不存在邮箱 `no-such-user@resumeaix.test` + 数量 10 → 点「调整」。
   - 结果：页面显示「未找到用户」；Playwright 网络记录过滤 `/api/admin/tcoin/adjust` 为**零条请求**；余额无任何变化。
   - 证据：`admin-tcoin-adjust-invalid-1440-02.png`。
2. **公告新建表单（/admin/announcements）**
   - 源码确认：`create()` 首行守卫 `if (!form.title || !form.content) return;`——空表单点击「发布」在发请求前被前端拦截。
   - 实测操作：标题/内容全空 → 点「发布」。
   - 结果：网络记录中 `/api/admin/announcements` 仅初始加载的 1 条 GET（200），**零 POST**；列表仍显示「暂无公告」；表单保持打开。
   - 证据：`admin-announcements-empty-submit-guard-1440-03.png`。

另有两类「只读短路/禁用」证据经源码+DOM 双重核验：用户编辑弹窗「调整 T-Coin」按钮在数量为 0 时 `disabled`（只读证据，POST 按钮不可触达）；ai-config 的「保存配置」「显示密钥」均未点击（红线：不改 AI 渠道、不做掩码绕过）。

## 二、admin 角色提权操作记录（按走查文档登记路径）

走查文档「环境事实·测试账号节」与「环境性限制节」登记：2026-10-12 18:45 PGFIX 全新重建后 seed 出的 admin 账号 **role=USER**（seed.ts 不设 role，走 schema 默认），并明确「ADMIN 任务仍需直接 `UPDATE users SET role='ADMIN'`（或对应枚举值）提权后走查，完事可回滚」。

实际操作按该既定口径执行并闭环：

1. **提权**（走查开始前，`packages/db` 目录下用生成的 Prisma Client 直跑，DATABASE_URL 从仓库 .env 读取）：
   `prisma.user.update({ where: { email: 'admin@resumeaix.local' }, data: { role: 'ADMIN' } })`
   回显确认：`elevated: admin@resumeaix.local role=ADMIN id=cmv54kzmb0000uvjgi60792b5`。提权后既有 JWT 会话即时生效（requireAdmin 每次请求重读 DB，无需重登）。
2. **走查 + 修复回归**全部在提权态完成。
3. **回滚**（回归通过后）：同法 `data: { role: 'USER' }`，回显确认 `rolled back: admin@resumeaix.local role=USER`。**DB 现值 role=USER**。
4. 该提权/回滚属走查文档规定的测试基建写（非业务写），已在走查文档环境事实「ADMIN 收工更新」与环境限制节双处登记。

## 三、模块矩阵（8/8，与 handoff「当前 8 个」预期一致；✅通过 / ⏸未测+原因 / —不适用）

| 模块 | 导航/可达 | 列表渲染 | 筛选 | 空态 | 表单验证 | 写操作（只读约束） | console 结论 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| /admin 数据概览 | ✅ 高亮正确（aria-current+左侧指示条） | ✅ 6 指标卡+近 30 天注册趋势图+T-Coin 消耗分布+最近注册表 | —（无筛选） | ✅ dailySignups 空数据分支在案（源码） | — | —（纯只读页） | 0 错误 0 警告 |
| /admin/users 用户管理 | ✅ | ✅ 3 用户 × 10 列完整（邮箱/姓名/套餐/角色/T-Coin/简历/登录次数/最后登录/注册时间/操作） | ✅ 搜「e2e」命中 2 行、标题计数同步 3→2、清除后恢复 3 行 | ✅ 不存在关键词 → 「暂无用户数据」实测 | ⏸ 编辑弹窗字段预填正确、Label 关联控件；「保存修改」=无条件 PATCH（源码）未点；「调整 T-Coin」amount=0 时 disabled（只读证据） | 未测（只读约束） | 0 错误 0 警告 |
| /admin/ai-config AI 配置 | ✅ | ✅ API 连接卡 + 7 模型行（parsing/rewrite/polish/hallucination/score/vision/design） | —（配置页） | —（配置页无空态概念；「加载中...」态在案） | ✅ 密钥输入框 password 掩码 + 显隐按钮 aria-label；服务端 GET 恒掩码、PATCH 对 `***` 前缀保留原值（源码核） | 保存未测（红线：不改 AI 渠道） | 0 错误 0 警告（另 2 条 VERBOSE 级 DOM 提示：密码框不在 form 内，非缺陷） |
| /admin/prompts 提示词管理 | ✅ | ✅ 9 张提示词卡（vibe-editor×2/rewrite×2/match/strategy/appearance/supplement/parsing） | — | ✅ 「暂无提示词」分支在案（源码） | ✅ 卡片展开/收起 aria-expanded 正确、textarea 全文载入、无「已覆盖」徽标（无覆盖项，「恢复默认」按设计隐藏） | 保存覆盖/恢复默认未测（写约束） | 0 错误 0 警告 |
| /admin/tcoin T-Coin 管理 | ✅ | ✅ 4 tab 全渲染：退币处理/配置管理/历史订单核销/待审核，tablist-tab-tabpanel 语义正确 | ✅ tab 切换正常（selected 态跟随） | ✅ 三个空态实测：「暂无待核销订单」「暂无待审核的转账请求」+辅助文案、「当前没有待处理的退币」 | ✅ 动态校验证据：不存在邮箱+数量 10 → 「未找到用户」，网络层零 adjust 请求（见零写操作声明） | 保存配置/核销到账/驳回/通过/重试未测（红线：余额/核销） | 0 错误 0 警告 |
| /admin/coin-stats 消费统计 | ✅ | ✅ 3 汇总卡（充值 108/消耗 25/流通 83）+ 各功能消耗占比（含百分比）+ 营收估算；数字与数据概览互相一致 | —（聚合页） | —（聚合页恒有数据；加载失败/加载中态在案） | — | —（纯只读页） | 0 错误 0 警告 |
| /admin/system 系统健康 | ✅ | ✅ 三服务卡全绿（PG 1ms→0ms / Redis 2ms / AI 15ms→3ms）+ 内存使用（RSS/Heap+进度条）+ 运行信息 | — | ✅ 「正在检查服务状态...」加载态在案 | ✅ 「刷新」按钮重查生效：disabled+loading 态、延迟数值实时更新（只读交互实测） | —（只读页） | 0 错误 0 警告 |
| /admin/announcements 公告管理 | ✅ | ✅ 卡片列表/类型徽标（信息/警告/紧急）/显隐+删除操作钮 | — | ✅ 「暂无公告」实测（本地库为空） | ✅ 空表单点「发布」→ 零 POST、列表仍空、表单未关（网络层证据，见零写操作声明）；表单「关闭」按钮 aria-label 正常 | 发布/隐藏/删除未测（红线：不发公告）；删除无确认（S31-ADMIN-02） | 0 错误 0 警告 |

**响应式（390×844 抽查 3 模块）**：数据概览、用户管理、公告管理——桌面侧栏收起为汉堡菜单按钮、宽表格横向滚动不破版、空态卡片居中、指标卡两列堆叠，无溢出无裁切（admin-home-390-01 / admin-users-390-01 / admin-announcements-390-01）。其余模块按「后台桌面为主」原则以 1440 验收。

## 四、权限三态双证据表

| 权限态 | 页面守卫结果 | API 守卫结果 | 截图/取证 |
| --- | --- | --- | --- |
| admin 登录 | /admin 可进；侧栏 4 组 8 模块导航完整、当前项高亮；前台顶栏出现按角色渲染的「管理后台」入口 | —（admin 态 API 正常供数） | admin-home-1440-01.png |
| 普通账号（e2e-stage31@resumeaix.test） | 直达 `/admin` → 重定向 /dashboard；直达 `/admin/users` → 重定向 /dashboard（requireAdmin 布局级守卫覆盖全部 8 模块路由） | 页面上下文 fetch `/api/admin/stats` → **403** `{"error":"权限不足"}` | admin-normal-user-denied-1440-01.png、admin-normal-user-denied-users-1440-02.png |
| 未登录 | 直达 `/admin` → 重定向 /login | curl `GET /api/admin/stats` → **401**；`GET /api/admin/users` → **401** | admin-unauth-redirect-login-1440-01.png、admin-unauth-redirect-login-1440-02.png |

补充：普通账号登录 /dashboard 时 console 有 1 条 error，经核对为**已登记的 S31-PUB-02 基线噪音**（无设计稿简历请求 /design 404，优雅降级），非新缺陷。

## 五、S31-ADMIN-01（已修，commit 9b6ef16）：趋势图日期标签裸 ISO

| 项 | 内容 |
| --- | --- |
| 页面/状态 | /admin 数据概览 · 近 30 天注册趋势图 |
| 操作 | 查看横轴标签与柱体悬停提示 |
| 期望 | 日期正常展示（如「10-12」/「2026-10-12: 3 人」） |
| 实际（修前） | 横轴「10-12T00:00:00.000Z」、悬停「2026-10-12T00:00:00.000Z: 3 人」（admin-home-1440-01.png 目检在案） |
| 根因 | `GET /api/admin/stats` 的 dailySignups 用 `prisma.$queryRawUnsafe` 裸查询 `SELECT DATE("createdAt") as date`，pg 驱动把 DATE 列反序列化为 JS Date → JSON 序列化成完整 ISO 串；前端 `d.date.slice(5)` 预期 `YYYY-MM-DD`，时间尾巴全部露出 |
| 修法与影响面 | SQL 侧根修：SELECT 列改 `DATE("createdAt")::text as date`（GROUP BY 不变），输出纯 `YYYY-MM-DD` 字符串。改动前核查消费方：`date` 字段全仓唯一消费方即首页图表；coin-stats 虽同用 /api/admin/stats 但不用任何日期字段——影响面安全，单行改动 |
| 提交 | `9b6ef16` `fix(admin): 修复数据概览注册趋势图日期标签带时间后缀 / show clean date labels in admin signup trend chart`（单文件 1 行；husky lint-staged eslint --fix + prettier 通过） |
| 回归 | `pnpm --filter @resumeaix/web build` 成功 → 按 runbook 杀旧进程树重启 3100（新 pid 32008，BUILD_ID `lqdffvP-mU9ZzV8mOvaRX`）→ admin 重登复测：横轴「10-12」、悬停「2026-10-12: 3 人」、**全页正则零匹配 `T00:00:00`**、console 0（admin-home-date-fixed-1440-02.png 修后目检在案） |

## 六、S31-ADMIN-02（观察，不修，交设计轮）：公告删除无二次确认

- **页面/操作**：/admin/announcements 公告卡上的「删除公告」图标按钮（aria-label 正常）。
- **现象**：源码 `remove()` 对按钮单击**直接发 `DELETE /api/admin/announcements?id=<id>`**，无任何确认弹层；列表项被移除无撤销入口。
- **本轮处置**：红线约束（不发公告、不删数据）下**未实际点击删除**，结论来自源码审读 + 按钮存在性目检（列表卡截图在案）。
- **同类对照**：与 S31-MISC-04（/assets 素材删除无确认）同一模式，属「删除类交互缺确认」的统一设计事项。
- **定级**：信息（无确认删除，设计轮统一事项）；**不修**——删除确认弹层属交互设计轮范围，超出本任务「边界明确的小修复」边界。

**交回主会话的复杂问题：无。** 本模块未发现鉴权/数据隔离/计量类问题；页面守卫（requireAdmin redirect）与 API 守卫（requireAdminOrReject 401/403）双重有效。

## 七、写操作未测清单（只读约束，留待授权专门轮次）

| 模块 | 未测写操作 | 未测原因 |
| --- | --- | --- |
| /admin/users | 编辑用户保存 PATCH（套餐/角色/姓名）；T-Coin 调整 POST | 源码确认无前端校验、点击即写库；红线：不动真实用户数据 |
| /admin/users | 分页翻页（上一页/下一页） | 分页 UI 仅 totalPages>1 渲染；本地仅 3 用户，不构造 11+ 条测试数据 |
| /admin/ai-config | 保存配置 PATCH | 红线：不改 AI 渠道配置 |
| /admin/ai-config | 「显示密钥」按钮 | 不做掩码绕过路径（掩码正确性已经由 DOM type=password + 服务端掩码源码双证） |
| /admin/prompts | 保存覆盖 PATCH；恢复默认 PATCH | 写约束（提示词热更新影响 AI 行为） |
| /admin/tcoin | 保存配置 PATCH；核销到账/驳回；转账通过/驳回；退币重试 | 红线：计费配置、订单核销、余额变更一律不动 |
| /admin/announcements | 发布 POST；隐藏 PATCH；删除 DELETE | 红线：不发公告、不删数据 |

另登记（非缺陷）：ai-config 页模型名为 DB 存量 DeepSeek 时代名称（`deepseek-v4-*`），运行时由环境变量覆盖（PREP「AI 渠道结论」在案），非 UI 缺陷、未动。

## 八、截图清单（27 张，绝对路径）

目录：`C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/ADMIN/`

- **权限三态**：`admin-unauth-redirect-login-1440-01.png`、`admin-unauth-redirect-login-1440-02.png`（未登录→/login）；`admin-normal-user-denied-1440-01.png`、`admin-normal-user-denied-users-1440-02.png`（普通账号→/dashboard）
- **数据概览**：`admin-home-1440-01.png`（修前，裸 ISO 横轴）、`admin-home-date-fixed-1440-02.png`（修后回归）
- **用户管理**：`admin-users-1440-01.png`（列表）、`admin-users-search-e2e-1440-02.png`（搜索命中 2 行）、`admin-users-empty-1440-03.png`（空态）、`admin-users-edit-modal-1440-04.png`（编辑弹窗，调整按钮 disabled）
- **AI 配置**：`admin-aiconfig-1440-01.png`（掩码+7 模型行）
- **提示词**：`admin-prompts-1440-01.png`（9 卡）、`admin-prompts-expand-1440-02.png`（展开态全文载入）
- **T-Coin**：`admin-tcoin-config-1440-01.png`（4 tab+配置表单）、`admin-tcoin-adjust-invalid-1440-02.png`（「未找到用户」校验证据）、`admin-tcoin-orders-1440-03.png`（核销空态）、`admin-tcoin-review-1440-04.png`（审核空态）、`admin-tcoin-returns-1440-05.png`（退币空态）
- **消费统计**：`admin-coinstats-1440-01.png`
- **系统健康**：`admin-system-1440-01.png`（三服务全绿）、`admin-system-refresh-1440-02.png`（刷新后延迟更新）
- **公告**：`admin-announcements-1440-01.png`（空态）、`admin-announcements-create-form-1440-02.png`（新建表单）、`admin-announcements-empty-submit-guard-1440-03.png`（空提交守卫证据）
- **390px 抽查**：`admin-home-390-01.png`、`admin-users-390-01.png`、`admin-announcements-390-01.png`

**脱敏说明**：本地隔离库仅含合成账号（admin@resumeaix.local 与 2 个 `e2e*@resumeaix.test` 合成凭证）及种子数据，截图中出现的邮箱均为合成凭证，无真实用户数据。

## 九、验证命令与结果

- `node $RT/status-all.mjs`：开工、修复重启后、收工共 3 次，PG/Redis/Web/AI/Export 五项全绿。
- 修复提交：`git commit 9b6ef16`（单文件 1 行 SQL；husky lint-staged 通过）。
- `pnpm --filter @resumeaix/web build`：构建成功；重启后 BUILD_ID `lqdffvP-mU9ZzV8mOvaRX`（验版以 BUILD_ID 为准，不用 Turbopack chunk 名）。
- 回归断言（Playwright 实测）：页面文本「10-12」存在、正则 `T00:00:00` 零匹配、console 0。
- 收工 `git status`：仅剩本任务开工前已存在的其他会话改动（interview-helper/next-env.d.ts、scripts/eval-*），本任务产物全部入库或归档，仓库根无残留临时文件。

## 十、自评与遗留

**自评**：

- 8 个模块全部有矩阵登记行（导航/列表/筛选/空态/表单验证/写操作/console 七维），无遗漏。
- 三种权限态均有页面+API 双证据；admin 提权按走查文档登记路径执行并闭环回滚。
- 零业务写操作达成；仅有的两次动态校验均到网络层取证（零请求），不是「模型声称 PASS」。
- 唯一发现的用户可见缺陷（S31-ADMIN-01）完成 修复→commit→重建→回归 全链；台账与页面清单同步登记（commit `35fdff7`）。

**遗留**：

1. 第七节写操作未测清单需授权后专门轮次覆盖（核心阻塞：余额/核销/公告红线）。
2. users 分页 UI 未测（数据不足，需 21+ 用户数据才能触发第二页）。
3. S31-ADMIN-02（删除无确认）与 S31-MISC-04 同类，建议合并进删除确认设计轮统一处理。
4. 本报告第一版误写至 `ResumeAIX/runs/reports/`（hive 不读取该路径）导致 no-report 判定；本文件为正式交付版，两处内容一致。
