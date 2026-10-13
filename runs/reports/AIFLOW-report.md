# AIFLOW 走查报告（Stage 31 · 第 5 项 AI 功能走查）

- **执行时间**：2026-10-12 19:22–20:36
- **仓库**：`C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main
- **HEAD**：开工 = 收工 = `7cd5933`（本任务零代码改动）；唯一产出 commit `c4051d4`（docs(stage31): 登记 AIFLOW 六类 AI 入口走查结果与台账）
- **环境**：3100 Web 预览 / 3002 ai-service / 3003 export-service / PG 5434（PGFIX 新库）/ Redis 6380，开工五项全绿；走查中途 ai-service 假死一次（见 §3），按 runbook 恢复后全程稳定
- **测试账号**：`e2e-stage31@resumeaix.test`（【E2E】Stage31 走查，uid `cmv54mckv000iuvmov992fzaj`）
- **测试简历**：【E2E】AIFLOW-AI功能走查，id `cmv567n5w0001uvj8bc7o7c91`（pipeline=design，经 BFF `POST /api/resumes` 正常业务写路径创建，全量合成人设含【E2E】标记；PGFIX 后旧简历已丢，按审计文档指引自建）

## 一、六类入口结论表

| # | 入口 | 端点 | 状态码 | 结果 | 扣币 | 截图路径（`C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/AIFLOW/`） |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 评分 | `POST /api/resumes/:id/score` | 200 | 真实AI通过：6/10 环形分 + 5 维度（完整性 2/2、专业性 1.5/2、量化 1.5/2、STAR 1/2、匹配潜力 1/2）+ 优劣势 + 「去修改经历」入口全渲染；summary 准确点出【E2E】占位标记 | -2（198→196） | score-result-first-1440-01.png、score-dimensions-1440-02.png |
| 2 | 润色 | `POST /api/resumes/:id/rewrite` | 200 | 真实AI通过：5 项建议（原文对照 + 可编辑建议框），每项带事实核对勾选 → 「采纳这项」→「应用已采纳修改」入口齐全；按走查范围只验入口存在未应用（建议语义四断言 EDIT 任务已覆盖） | -2（196→194） | polish-suggestions-1440-01.png |
| 3 | 策略 | `POST /api/resumes/:id/strategy` | 200 | 真实AI通过：技术研发方向 9 项建议列表渲染；AI 编造的「提升 75%」被系统自动标记「建议包含原文未出现的数字，请核实来源」——幻觉检测实测生效 | -3（193→190） | strategy-suggestions-1440-01.png |
| 4 | 岗位适配（JD 匹配） | `POST /api/resumes/:id/match` | 200 | 真实AI通过：78% 匹配度 + 12 项已匹配 + 缺口清单 + JD 术语解读 + 5 条优化建议；**保存 JD 与分析 → 刷新页面 → 仍在**（点击分析时先 PATCH 保存 targetJD 218 字服务端读回；刷新后 6 条 requirements 与 JD 输入框全文完整读回；DB `workflow.match` 带 contentHash+jdHash） | -2（191→189） | jd-match-result-1440-01.png、jd-match-stale-1440-02.png |
| 5 | 完整 Agent 四模式 | `POST /api/resumes/:id/vibe-chat` | 200 / **503** / 200 / 200 | 对话 ✅ 真实AI通过；计划 ❌ 503 真实失败路径通过（见 §3）；工坊 ✅ 重启后复验通过；Agent ✅ 自动修改真实落库（见下） | 对话 -2、计划 **0**、工坊 -2、Agent -2 | vibe-chat-mode-1440-01.png、vibe-plan-fail-1440-01.png、vibe-workshop-1440-01.png、vibe-agent-mode-1440-01.png |
| 6 | 会话入口 /vibe | `POST /api/vibe-chat` | **500** | 真实失败路径通过：用户消息回显正常 + 「抱歉，出了点问题，请再试一次。」气泡；**未扣币**。根因为渠道凭证漂移（见 §4 与台账 S31-AIFLOW-01），按红线定性渠道问题交回 | **0** | vibe-standalone-fail-1440-01.png |

Agent 模式补充：Agent 模式单轮指令「删除自我评价里的走查标记句子」返回「✅ 已自动完成 1 项修改」摘要 + 「撤销 Agent 操作（恢复 1 项修改）」按钮；DB 读回确认自我评价现值只剩核心句、走查标记已删——自动应用真实写入落库，非仅前端展示。

## 二、评分来源与过期标记（双证）

**评分来源 = 本份简历**：
1. **payload 佐证**：network 面板读取 `POST /:id/score` 请求体，content 与本份简历逐字段一致（甄测试 / 星洲大学 / 云梯科技 / 南麓数据 / 【E2E】标记全对应），无其他简历或未初始化内容混入。
2. **分数佐证**：修改自我评价一处后重新评分，得 5.5/10（≠ 首轮 6/10），分数随内容变化；且两轮 summary 均准确引用该简历特有内容（【E2E】占位标记、32%→41% 留存数据）。

**过期标记（Stage31 修复点）**：
- 改前状态行确认「分析对应当前内容」（归因前置证据）。
- 修改自我评价追加一句 → 2 秒防抖自动保存 PATCH 200 → 评分卡变「内容已改变，分析已过期。请重新评分。」、JD 匹配卡变「内容或岗位描述已改变，分析已过期。」（contentHash 独立比对，两卡分别生效）。
- **刷新页面后过期状态仍正确**（步骤 7 复验通过）：刷新 → AI 编辑 → 专项工具 → JD 匹配 tab，过期提示仍在、JD 输入框 218 字回填。
- DB 侧证据：`workflow.quality.contentHash` 与 `workflow.match.contentHash` 均保持旧值 `3e53626-`，不随内容变化——过期归因链路清晰。
- Agent 模式再次修改内容后，评分卡第三次正确切到过期态——机制稳定复现。

## 三、计划模式 503 与重启复验详情

- **现象**：编辑器内 Vibe 计划模式发送单轮消息后，`POST /:id/vibe-chat` 返回 503 Service Unavailable；UI 助力气泡显示「❌ 请求失败」；**流水无此笔扣币**（settle 语义：失败未结算，无需退币）。
- **根因取证**：ai-3002.log 显示该请求（req-h）进入后无响应完成日志；status-all 复核 3002 HTTP unreachable（pid 存活但假死）、3003 已死——ai-service 进程树挂起，BFF 断连返回 503。
- **恢复动作（runbook 在案）**：`taskkill //PID <ai-3002.pid> //T //F` 杀整棵树（tsx 父子双进程）→ CIM 拉起。`start-all-cim.ps1` 在本 shell 因 GBK 解码中文解析失败（runbook 已预警该坑），改用内联 `Invoke-CimMethod -ClassName Win32_Process -MethodName Create` 分别拉起 start-ai.mjs 与 start-export.mjs（防沙箱收割的定案方式）。15 秒后 status-all 五项全绿（ai 新 pid 8052、export 新 pid 24544）。
- **重启复验**：同端点（`POST /:id/vibe-chat`）工坊模式 200（33.4s，主编点评+计划卡+质询选项渲染）、Agent 模式 200（自动修改落库）；评分/策略链路也全程正常——假死问题确认为偶发环境事件，恢复彻底。
- **排误记录**：ai-3002.log 中一条 `coin_return_requests does not exist (P2021)` 经查为 PGFIX 重建完成前旧进程（pid 8708）打的历史日志；当前库 25 表全齐（含 coin_return_requests，tsx 直查 pg_tables 确认），非现存问题。
- **vibe-messages 伴随 500**：假死窗口内一次 `PATCH /:id/vibe-messages` 500（失败消息未落库）；服务恢复后对话/工坊/Agent 消息持久化均正常，属伴随性故障（台账 S31-AIFLOW-03）。

## 四、/vibe 独立会话 500 失败路径

- **现象**：/vibe 页发送一条合成经历消息，`POST /api/vibe-chat` 500；UI 用户消息回显正常、失败气泡「抱歉，出了点问题，请再试一次。」渲染正确；**未扣币**。
- **根因（静态+DB 取证）**：该端点由 BFF **直连 LLM**（不经过 3002），凭证读取顺序为 DB `ai_config`（vibe → parsing 兜底）→ `.env`（`DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL`）。实测：`prisma.siteConfig` 查 `ai_config` **NOT SET**；`.env` 为占位密钥 → 上游认证失败「模型返回空」→ 500。route 源码注释自证这是 Stage27 线上已知的「凭证漂移 → 401→500」同构链路。
- **重试决策**：根因为确定性凭证缺失，重试必然复现 500，无取证价值（且守单次调用原则），未重试。
- **对照说明**：编辑器内 Vibe 四模式走 `/:id/vibe-chat` → ai-service（智谱渠道由 start-ai.mjs 注入进程环境，PREP 已验证）故正常；独立会话链路不经过 3002，两个入口渠道配置源不同——这正是「文本渠道就绪但独立会话失败」的原因。
- **定性**：渠道配置问题（红线交回类），非 UI 失败；UI 反馈与计量行为均正确。

## 五、重复请求保护（3 连点）

- 场景：评分卡过期态下，对「重新分析 · 2 T-Coin」按钮在同一事件批内连续 click 3 次（`btn.click(); btn.click(); btn.click()`）。
- 结果：network 过滤 `/score` 仅 **1 个** POST 请求；流水仅新增 **1 笔** -2（191→189）。
- 机制：组件 `inFlight` ref 同步置位 + 按钮 `disabled={loading}` 双保险，首次 handler 同步挡掉后续两次。
- 结论：无双扣币证据，防重复保护通过。

**评分缓存语义（如实记录）**：评分**无服务端缓存**——`/api/ai/score` 每次直调 LLM；UI 以「重新分析 · 2 T-Coin」明码标价按钮呈现，不自动扣币、无静默重复计费；手点再评真实扣 2 币并得新分数，行为与标价一致，登记为预期语义而非缺陷。

## 六、扣币对账全表（期初 200 → 期末 183）

| 时间（UTC，2026-10-12） | 类型 | 币 | 功能 | 余额 | 对应调用 |
| --- | --- | --- | --- | --- | --- |
| 11:31:44 | DEDUCTION | -2 | score | 198 | 首次评分（6/10） |
| 11:34:23 | DEDUCTION | -2 | polish | 196 | 润色（5 项建议） |
| 11:36:00 | DEDUCTION | -3 | strategy | 193 | 策略（9 项建议） |
| 11:37:54 | DEDUCTION | -2 | ats | 191 | JD 匹配（78%） |
| 11:44:22 | DEDUCTION | -2 | score | 189 | 改内容后再评（5.5/10；3 连点仅此 1 笔） |
| 11:48:11 | DEDUCTION | -2 | vibe_resume | 187 | Agent·对话模式 |
| 12:26:18 | DEDUCTION | -2 | vibe_resume | 185 | Agent·工坊模式 |
| 12:28:22 | DEDUCTION | -2 | vibe_resume | 183 | Agent·Agent 模式 |

- 合计 **8 笔 DEDUCTION 共 -17 币，0 退币**；两笔失败（计划 503、独立会话 500）均未扣币，与「失败退币」语义自洽（未扣即无需退）。
- 每笔流水与真实调用一一对应，无多扣、无重复扣。
- 总消耗 17 币，控制在签到赠送 50 币额度内（红线达标）；未领取每日签到，保持纯走查口径。
- 截图：基线 `tcoin-baseline-1440-01.png`（余额 200、流水 0 条）、终态 `tcoin-final-1440-02.png`（余额 183，读图目检一致）。

## 七、视口检查

- **390px**（390×844）：基础编辑态 / AI 面板态 / 专项工具态三态 `main.scrollWidth = clientWidth = 390`，零横向溢出；评分卡 2×2 工具格、文字完整换行、5.5/10 分数环、底部 tab 导航完整（截图读图目检通过）。
- **1440px 对照**：评分卡与 AI 面板布局正常，无裁切。

## 八、缺陷台账（S31-AIFLOW 三项，均不修）

| 编号 | 定性 | 页面/操作 | 现象 | 根因 | 交回/观察理由 |
| --- | --- | --- | --- | --- | --- |
| S31-AIFLOW-01 | **渠道配置，交回主会话** | /vibe 独立会话 · 发送一条消息 | POST /api/vibe-chat 500「抱歉，出了点问题，请再试一次。」；用户消息回显正常、未扣币 | BFF 直连 LLM（不经过 3002），DB `ai_config` 未配置 + `.env` DEEPSEEK 凭证为占位 → 上游认证失败「模型返回空」（Stage27 已知凭证漂移链路同构） | 向 DB 写入 vibe 渠道配置属渠道/配置类红线，超出走查边界；修复后需补测 1 次成功路径。截图 vibe-standalone-fail-1440-01.png |
| S31-AIFLOW-02 | 观察，环境已自愈 | 编辑器内 Vibe 计划模式 · 发送一条消息 | 一次 503「❌ 请求失败」，未扣币 | ai-service 进程树假死（请求进入后无响应完成日志、HTTP 不通），BFF 断连 503；runbook 已知偶发 | 按 runbook 杀树 + CIM 重启后，同端点工坊/Agent 复验 200，恢复彻底；长期建议主会话纳入服务守护方案。截图 vibe-plan-fail-1440-01.png |
| S31-AIFLOW-03 | 观察，伴随性 | 编辑器内 Vibe 对话持久化 · 计划失败后自动保存失败消息 | 伴随假死窗口 `PATCH /:id/vibe-messages` 一次 500（失败消息未落库） | 伴随 S31-AIFLOW-02 假死窗口的瞬时写失败，非独立缺陷 | 服务恢复后对话/工坊/Agent 消息持久化均正常，已自愈，无需单独处理 |

## 九、修复 / 零修改说明

- **修复 commit：无**。本轮六类入口的 UI 反馈（成功渲染、失败提示、按钮禁用、过期标记、防重复）全部正确，未出现「可直接修复」边界内的简单 UI 缺陷（按钮不可达、文案错误、样式裁切等）。
- **零代码改动**：HEAD 开工 = 收工 = `7cd5933`；唯一 commit `c4051d4` 为走查文档登记（docs(stage31)），不含任何代码变更。
- **独占文件零触碰**：`resume-score-card.tsx` 及 handoff 独占清单全程未修改，相关观察只记台账。
- **PG 僵尸进程禁区未进入**：重启仅按 runbook 杀 ai/export 进程树（taskkill /T + CIM 拉起），未触碰 PG。
- **红线遵守**：每入口 1 次真实调用 + 必要的失败取证（独立会话未重试——确定性根因，重试无取证价值）；不碰面试线；不 push 不部署；零密钥（DB ai_config 查询时 key 脱敏、请求体仅含 content 无凭证字段）；测试资产全部【E2E】合成人设，无真实用户数据。

## 十、自评与遗留

**验收标准对照（handoff 第 5 项，5/5 达成）**：
1. 六类入口 100% 有登记行：4 真实AI通过 + 2 真实失败+反馈正确，各带状态码与截图 ✅
2. 评分来源 = 本份简历（payload + 分数变化双佐证）；过期标记改后+刷新后均正确；JD 与分析刷新仍在（UI+DB 双证）✅
3. 每笔扣币与 /tcoin 流水一一对应（前后截图）✅
4. 重复点击无双扣币证据（3 连点 → 1 请求 → 1 笔扣币）✅
5. 报告落盘 ✅（本文件；仓库内登记见 ResumeAIX `docs/stages/stage-31-browser-audit.md` AIFLOW 分区，commit `c4051d4`）

**遗留（按优先级）**：
1. **独立会话成功路径未测**（渠道配置原因）：主会话向 DB `ai_config` 写入 vibe 渠道后，建议补测 1 次单轮成功调用。
2. **评分无缓存**为现行语义（明码标价、不自动扣）；如产品希望「同内容短时间再评不重复扣币」，需主会话决策后实现。
3. **ai-service 假死**为 Stage31 走查期第二次出现（runbook 记录「已知偶发」），长期建议纳入服务守护/自动拉起方案；S31-AIFLOW-03 的伴随写失败将随之自然消除。
4. 401 场景退币路径本轮未被触发（两笔失败均发生在扣币前的校验/结算环节），退币链路的前次验证记录见 `docs/stages/stage-31-verification.md`（401 时准确退币、余额恢复）。

**口径**：本地通过、生产未测；独立会话成功路径未测（渠道原因）。

**证据目录**：`C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/AIFLOW/`（16 张截图，全部读图目检）：tcoin-baseline-1440-01、score-result-first-1440-01、score-dimensions-1440-02、score-stale-1440-03、score-1440-contrast-04、score-390-01、polish-suggestions-1440-01、strategy-suggestions-1440-01、jd-match-result-1440-01、jd-match-stale-1440-02、vibe-chat-mode-1440-01、vibe-plan-fail-1440-01、vibe-workshop-1440-01、vibe-agent-mode-1440-01、vibe-standalone-fail-1440-01、tcoin-final-1440-02。
