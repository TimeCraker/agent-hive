# Stage31 走查报告 · MISC（素材 / 自由对话 / 个人设置 / T-Coin）

- **执行时间**：2026-10-12 21:51–22:22
- **仓库**：`C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main
- **开工 HEAD**：`0308093`（Web BUILD_ID `DsduBMp2C7jTHGbLt_FCG`，与 LAYPDF 收工登记一致）
- **收工**：修复 commit `f424796` + 台账 commit `dd5a3ac`，重建后 Web BUILD_ID `Kz0lca2hlUy5hPfqoRCyn`；收工 status-all 五项全绿（PG 5434 / Redis 6380 / Web 3100 / AI 3002 / Export 3003）
- **测试账号**：主 E2E `e2e-stage31@resumeaix.test`（昵称已改为「【E2E】Stage31 走查【E2E】MISC」，签到后余额 233）；新增小号 `e2e-misc2@resumeaix.test`（注册送 200，签到后 250，浏览器会话已登出）
- **证据目录**：`C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/MISC/`（21 张截图，全部读图目检）
- **走查台账**：`docs/stages/stage-31-browser-audit.md` MISC 分区 + 缺陷台账 S31-MISC-01~05（commit `dd5a3ac`）
- **本仓库内报告副本**：`ResumeAIX/runs/reports/MISC-report.md`（runs/ 为该仓库 gitignore 目录，按要求落盘本地）

## 一、四块逐项结论表

| 块 | 页面 | 结论 | 关键证据 |
|---|---|---|---|
| 经历素材库 | /assets | ✅ 通过（1 交回 + 2 观察） | 创建四方一致（UI 卡片/计数 全部1·项目经历1/API 201/DB 字段逐字）；筛选空态文案「这个分类暂时没有素材」；筛选往返与跨页返回（/tcoin ↔ /assets）列表状态保持、无报错；**页面无编辑功能**（仅增/删，API 亦无 PUT/PATCH，按任务约定以页面实际能力如实登记 S31-MISC-03）；删除假成功（后端无 DELETE 路由）取证交回（S31-MISC-01）；「从素材生成简历」空库正确禁用、有素材后走真实 403 配额错误面板 |
| 自由对话 | /vibe | ✅ 真实失败路径通过 | 一轮【E2E】MISC 合成问题 → `POST /api/vibe-chat` 500 →「抱歉，出了点问题，请再试一次。」气泡、用户消息回显、未扣币；与 AIFLOW 任务登记的 S31-AIFLOW-01 同渠道根因（BFF 直连 LLM 凭证漂移），22:04 复测仍在，渠道配置交回不变；草稿 localStorage 跨页往返持久（含隔任务遗留的 AIFLOW 草稿，佐证持久化真实有效）；无历史会话列表/新会话入口（能力边界，S31-MISC-05） |
| 个人设置 | /profile | ✅ 通过（专用 E2E 账号，绝未动 admin 账号） | 昵称加【E2E】MISC 后缀保存→「资料更新成功」→刷新后服务端身份卡/顶栏/表单**三处持久**；密码表单**双负例**：①两次输入不一致→客户端拦截「两次输入的密码不一致」、零网络请求（network 面板无 change-password 请求）；②错误当前密码+合法新密码→服务端「当前密码错误」提示、不落库（登出后原密码重登成功，验证未真改密）；减少动画开关→localStorage `resumeaix:reduce-motion=true`，刷新后 checked 仍 true；邮箱只读（「邮箱不可修改」，无变更入口）；登出（头像菜单）→落首页→访问 /dashboard 重定向 `login?callbackUrl=%2Fdashboard`→原密码重登回 /dashboard，会话闭环 |
| T-Coin | /tcoin | ✅ 通过（1 修复） | 基线对账 183/10 条逐笔吻合（见第二节）；主账号签到 +50→233、按钮态切「今日已签到」、流水 +1；同日 API 幂等复打 `alreadyCheckedIn:true`、余额不变、DB 断言 tx=11/checkins=1；断网签到静默缺陷已修（`f424796`）并以 misc2 小号全链回归；/dashboard/transfer 静态预渲染页水合后跳 /tcoin，实测落地「T-Coin 余额中心」 |

## 二、余额流水逐笔对账（183 → 233）

**开工基线对账（对 AIFLOW/LAYPDF 终态）**：/tcoin 页余额 183、流水共 10 条，逐笔余额链与走查文档完全吻合、差异为零：

| 流水（新→旧） | 变动 | 页面显示余额 | 归属任务 |
|---|---|---|---|
| AI 设计生成退款 | +8 | 183 | LAYPDF（全额返还） |
| AI 设计生成消耗 | -8 | 175 | LAYPDF |
| Vibe Resume ×3 | 各 -2 | 183 / 185 / 187 | AIFLOW（对话/工坊/Agent 模式） |
| 简历评分（第二次） | -2 | 189 | AIFLOW |
| JD 匹配 | -2 | 191 | AIFLOW |
| 策略优化 | -3 | 193 | AIFLOW |
| STAR 润色 | -2 | 194 | AIFLOW |
| 简历评分（第一次） | -2 | 196 | AIFLOW（注册送 200 起） |

**主账号签到后终态**：+50 → 233、流水 11 条、按钮态「今日已签到 + NEXT CHECK-IN 明日 00:00 (UTC+8)」；同日 API 复打 `POST /api/tcoin/check-in` → 200 `{alreadyCheckedIn:true, balance:233}`；DB 断言 `tCoin=233 / txTotal=11 / checkins=1`——**不重复入账，幂等键 `checkin-{uid}-{yyyyMMdd}` 行为正确**。

**misc2 小号修复回归对账**：注册送 200 / 流水 0 → 离线失败尝试零入账 → 联网签到 +50 → 250、流水 1 条 → API 复打 `alreadyCheckedIn:true` → DB 终态 `tCoin=250 / txTotal=1 / checkins=1`。

## 三、S31-MISC-01 素材删除假成功（交回，不修）

**四重证据**：
1. **网络层**：`DELETE /api/career-assets/cmv5bkn46...` → **404 Not Found**（console 同步报错）；
2. **代码层**：`apps/web/src/app/api/career-assets/` 下只有 `route.ts`（GET/POST）与 `generate-resume/`，**不存在 `[id]` 动态路由**，全 api 目录 grep 无 career-assets DELETE 处理器；
3. **UI 层**：点击「删除资产」后卡片乐观移除、直接显示空态「还没有职业资产」，**无任何用户可见报错**（截图 assets-delete-404-ui-removes-1440-04.png）；
4. **DB 层**：删除点击后 `careerAsset count = 1` 不变，刷新页面素材复活、计数回到「全部 1」。

**交回理由**：根因是后端缺失带鉴权归属（session + ownership）的 DELETE 端点，属 API 功能补齐而非「文案/按钮/裁切/间距/简单状态」类简单修复，按 handoff 修复边界交回主会话。附带观察：删除无确认弹层、单击即删（S31-MISC-04 一并登记）。

## 四、S31-MISC-02 签到静默失败（已修 `f424796`）

- **修前**：断网点击「签到 +50」→ fetch 抛错被 `catch` 静默吞掉，页面无 toast/无文案/无状态变化，仅 console 可见 `ERR_INTERNET_DISCONNECTED`，按钮恢复可点（截图 tcoin-offline-checkin-silent-1440-01.png；网络面板 #57 FAILED）。任务要求「断网点签到有明确错误提示」不满足。
- **修复**（`f424796`，1 file +27/-15，lint-staged eslint+prettier 通过）：`apps/web/src/app/(dashboard)/tcoin/page.tsx` 新增 `checkInError` 状态；catch 分支与非 2xx 分支分别赋「签到失败，网络异常，请检查网络后重试」/「签到失败，请稍后重试」；签到按钮列内渲染 `role="alert"` 提示（容器结构对齐「今日已签到」徽章分支）；**成功路径、幂等键语义、余额逻辑零改动**。
- **回归链**：type-check ✅ → build ✅ → 重启 3100（新 BUILD_ID `Kz0lca2hlUy5hPfqoRCyn`，其余服务未动）→ misc2 小号离线点击 → 「签到失败，网络异常，请检查网络后重试」role=alert 显示、零入账（tcoin-offline-error-fixed-390-02.png）→ 联网点击 → +50 到账、徽章切换 → API 幂等复打 → DB 断言（见第二节）→ 390px 报错态零横向溢出（385/385）。
- **回归取径说明**：主账号当日已签到，UI 签到按钮被徽章替换、无法再触发，故按走查文档惯例（send-code→Redis 读码→complete-registration）注册 `e2e-misc2@resumeaix.test` 专用于修复前后回归；收尾已登出。

## 五、未测项（含邮件/设备权限）

| 项 | 状态 | 原因 |
|---|---|---|
| 邮箱变更 | 无此入口 | /profile 明确「邮箱不可修改」只读展示——不产生「缺授权未测」项，行为已如实登记 |
| 设备管理 | 无此模块 | /profile 未提供设备管理区块，无从测起 |
| 素材→简历生成成功路径 | 未测 | 6 份简历已过 5 份上限（含 LAYPDF 登记过的副本绕限产物），按红线不清理他任务测试资料；403 配额错误面板已实测（assets-generate-quota-error-1440-05.png）。解锁方式：删 1 份测试简历后单次点击 |
| vibe-chat 独立会话成功路径 | 未测（渠道交回） | S31-AIFLOW-01：BFF 直连 LLM 凭证漂移（DB ai_config 未配置 + .env 占位密钥），非 UI 缺陷；失败路径反馈正确、未扣币 |
| 头像上传/裁剪链路 | 未操作 | 控件在位（8 预设/上传/恢复默认），保持测试资料原状 |
| S31-MISC-01 删除路由 | 交回 | 见第三节 |

## 六、缺陷台账摘要

| 编号 | 状态 | 一句话 | 严重度 |
|---|---|---|---|
| S31-MISC-01 | 交回，不修 | 素材删除：DELETE 路由 404 + UI 乐观移除无报错 + DB 记录仍在 + 刷新复活 | 中 |
| S31-MISC-02 | 已修 `f424796` | 断网签到静默 → role=alert 中文提示 + misc2 全链回归 | 低 |
| S31-MISC-03 | 观察，不修 | /assets 无素材编辑功能（仅增/删，API 无 PUT/PATCH） | 信息 |
| S31-MISC-04 | 观察，不修 | 配额 403 文案「升级套餐」付费话术（与 S31-UPLD-01 同源共享层）；删除无确认单击即删 | 低/信息 |
| S31-MISC-05 | 观察，不修 | /vibe 无历史会话列表/新会话入口，仅 localStorage 单份草稿 | 信息 |

## 七、视口与状态证据

- 390px 四页全过（scrollWidth=clientWidth，385/385 口径）：/assets、/vibe、/profile、/tcoin；1440px 对照在案。
- 空态：assets 空素材库（FIG.ASSETS.EMPTY 插画+引导）、tcoin 暂无记录（PaperPushpin 插画+去签到引导，misc2 共 0 条）。
- 错误态：generate-resume 403 配额面板、tcoin 断网签到报错（修前静默/修后 alert）、vibe 500 气泡。
- 加载态：assets/tcoin 骨架屏在码（源码核对）。

## 八、截图绝对路径（均在 `C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/MISC/`）

1. `tcoin-baseline-1440-01.png` — 开工基线：余额 183 + 流水 10 条逐笔对账
2. `tcoin-offline-checkin-silent-1440-01.png` — S31-MISC-02 修前：离线签到静默无反馈
3. `tcoin-checkin-success-1440-02.png` — 主账号签到成功：+50、已签到徽章、流水 11 条
4. `tcoin-390-01.png` — /tcoin 390px 零溢出
5. `tcoin-empty-misc2-390-01.png` — misc2 空态（暂无记录 + 去签到引导）
6. `tcoin-offline-error-fixed-390-02.png` — S31-MISC-02 修后回归：离线报错 role=alert
7. `tcoin-misc2-final-1440-03.png` — misc2 终态：余额 250 + 已签到徽章
8. `assets-empty-1440-01.png` — 空素材库空态
9. `assets-create-1440-02.png` — 素材创建成功（卡片/计数 1；卡片仅删除按钮，S31-MISC-03 佐证）
10. `assets-filter-empty-1440-03.png` — 筛选空态文案（证书/奖项 0）
11. `assets-delete-404-ui-removes-1440-04.png` — S31-MISC-01 证据：删除后 UI 空态（DB 仍在）
12. `assets-generate-quota-error-1440-05.png` — generate-resume 403 配额错误面板（升级套餐话术）
13. `assets-390-06.png` — /assets 390px 零溢出
14. `vibe-390-01.png` — /vibe 390px 零溢出
15. `vibe-send-fail-1440-02.png` — vibe 一轮 500 失败气泡（含 AIFLOW 遗留草稿佐证持久化）
16. `profile-baseline-1440-01.png` — /profile 基线四卡
17. `profile-name-persist-1440-02.png` — 昵称加【E2E】MISC 后缀刷新后三处持久
18. `profile-pwd-mismatch-1440-03.png` — 密码两次不一致客户端拦截
19. `profile-pwd-wrongcurrent-1440-04.png` — 错误当前密码服务端提示（未真改密）
20. `profile-motion-toggle-on-1440-05.png` — 减少动画开启态
21. `profile-390-06.png` — /profile 390px 零溢出

## 九、自评与遗留

**验收标准逐条对照**：
1. 四块功能逐项登记（通过/失败/未测+原因+截图） ✅ —— 本报告第一节 + 走查文档 MISC 分区
2. 签到幂等（二次拦截）+ 断网失败信息证据 + 余额流水与 AIFLOW 终态对账 ✅ —— 第二节
3. 390px 四页全过 ✅ —— 第七节
4. 修复有 commit + 回归；台账闭环 ✅ —— `f424796` + `dd5a3ac`，S31-MISC-01~05 全登记
5. 报告落盘 ✅ —— 本文件 + ResumeAIX 仓库内副本

**口径**：本地通过、生产未测（按红线不连生产）。真实失败路径 2 处（vibe 500 渠道交回、misc2 离线签到）均为真实服务行为，非模拟；无「仅模拟通过」项。

**交接状态**：3100 运行于新 BUILD_ID `Kz0lca2hlUy5hPfqoRCyn`（3002/3003/PG/Redis 未动，收工 status-all 全绿）；misc2 会话已登出；素材库保留 1 条【E2E】MISC 素材（S31-MISC-01 证据，刻意不清理）；主 E2E 昵称「【E2E】Stage31 走查【E2E】MISC」、余额 233、当日已签到；ResumeAIX 仓库根截图残留 0（全部归档 audit 目录）；未 push 未部署。

**遗留（交回主会话/后续任务）**：S31-MISC-01 素材删除 DELETE 端点补齐（含鉴权归属）；配额文案「升级套餐」与 S31-UPLD-01 同源，待共享层定稿；素材编辑功能与 vibe 会话历史属产品迭代，登记待决策。
