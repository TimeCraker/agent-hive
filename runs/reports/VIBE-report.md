# VIBE-report — /vibe 独立对话成功链路（S31-AIFLOW-01 · Stage31 Remediation #7）

日期：2026-10-13。仓库 ResumeAIX @ main，分支 main，不 push。Docs commit：`9dab91c`（台账/Spec/PLAN_LIST）。**零代码改动**——修法为向本地库注入渠道配置（任务书第 1 条的 DB ai_config 路径），无 fix 代码 commit。

## 结论

/vibe 独立会话从「必然 500」修复为真实可用：BFF 直连 LLM 的渠道按代码既有机制落入本地库 `site_configs.ai_config`（智谱 Coding Plan 端点 + glm-5.3-flash + 已授权 ZHIPU key，密钥直写 DB 零明文），六项验收全过（真实回复 200 ×2 轮含上下文保持、UI 气泡、免费零扣币对账、失败语义友好气泡可重试、无 cookie 401）；ai-service 与 vision 通道影响面核实为净零；鉴权/输入限制/计量语义全部保留。台账 S31-AIFLOW-01 交回 → 已修 ✅。

## 配置读取规则（代码级证据，用户指令第 1 问）

`apps/web/src/app/api/vibe-chat/route.ts` 的 `resolveVibeChannel()`：

| 项 | 解析顺序（先→后） | 修复前实际命中 |
|---|---|---|
| model | DB `ai_config.models.vibe.model` → `models.parsing.model` → env `AI_PARSING_MODEL` → `'deepseek-v4-flash'` | env `AI_PARSING_MODEL="deepseek-v4-flash"`（apps/web/.env） |
| apiKey | DB `ai_config.api.apiKey` → env `DEEPSEEK_API_KEY` → `OPENAI_API_KEY` | env DEEPSEEK_API_KEY（占位/漂移） |
| baseURL | DB `ai_config.api.baseUrl` → env `DEEPSEEK_BASE_URL` → `api.deepseek.com` | env DEEPSEEK_BASE_URL（DeepSeek 端点） |

- DB 读取走 `getConfig('ai_config', {})`（site-config.ts → `site_configs` 表，admin ai-config 路由同 key 可视管理）；解析结果 **60s 进程内缓存**（`_cached`，坏配置也会被缓存——失败态回归时等 70s 再测的原因）。
- **500 根因**：`site_configs` 表为空（实测 `SELECT` 0 行）→ `cfg={}` 全键落空 → env 占位凭证打 DeepSeek 端点 → 上游认证失败 → catch 兜底 `{error:'AI 服务异常'}` 500。与台账「凭证漂移→401→500」链路一致。
- **注入方式**：按路由注释「ai_config 优先，env 仅作 DB 不可用时退路」，走 DB 路径（既有机制正路）。一次性 node 脚本（`pg` 客户端，运行于仓库外 stage31-runtime）upsert `ai_config = {models:{vibe:{model:'glm-5.3-flash'}}, api:{baseUrl:'https://open.bigmodel.cn/api/coding/paas/v4', apiKey:<从 ~/.claude/zhipu.env 读取>}}`。密钥只在脚本内存中出现，DB 回读校验只打印端点/模型名/key 长度（49）。

## 影响面核实（为什么动共享 key 是安全的）

`site_configs.ai_config` 有两个读方：

1. **ai-service**（ai-client.ts `getAIConfig`，30s TTL）：DB 行存在时 `{...env.defaults, ...db}` 逐键合并，**DB 覆盖 env**。写入的 `api.baseUrl/apiKey` 与 start-ai.mjs 注入的 `ZHIPU_BASE_URL/ZHIPU_API_KEY` 值完全一致 → 净零变化；`models.vibe` 是 ai-service 未用键（其任务键为 parsing/rewrite/polish/hallucination/score/vision/design）→ 无副作用；vision 两键不在写入范围 → 通道不受影响。修复后 ai-service 全程 200 无异常日志。
2. **admin ai-config 路由**：GET 展示（key 掩码）、PATCH 整体覆盖（见「观察项」）。

## 数字化验收对照（Spec 第 7 项）

| # | 验收标准 | 结果 |
|---|---|---|
| 1 | `POST /api/vibe-chat` 200 + 非空真实回复 | ✅ network #140 → 200，回复为 glm-5.3-flash 真实输出（结构化整理了消息中的星尘科技/前端工程师/2年/React/ECharts，非模拟非兜底句） |
| 2 | UI 渲染 AI 回复气泡；用户消息回显 | ✅ 读图目检 vibe-success-round1-1440-01.png：深红右栏用户气泡 + 浅色左栏 AI 气泡 |
| 3 | 计量对账（免费则 0 扣币） | ✅ vibe 全链（路由+页面）无 T-Coin 调用 = 免费设计；两轮后余额 195 不动、`coin_transactions` 17 笔基线无新笔（末笔仍是 DESIGN 任务 designGenerate）；失败轮同样零扣币 |
| 4 | 连续 2 轮上下文保持 | ✅ 第 2 轮问「我刚才说我上家公司叫什么名字？做了多久？」→ 回复准确引用「星尘科技有限公司 / 2 年 / 前端工程师」（network #141 → 200，截图 round2-context-1440-02） |
| 5 | 失败语义回归 | ✅ DB 端点临时改 `http://127.0.0.1:9/v1`（等 70s 过 60s 配置缓存）→ 500 +「抱歉，出了点问题，请再试一次。」气泡 + 用户消息保留 + 不白屏（截图 fail-channel-broken-1440-03）；**测后立即脚本恢复**，再等 70s → 重试 200 成功且延续此前上下文（network #144，截图 success-recovered-1440-04），会话可重试 |
| 6（附加） | 鉴权 | ✅ 无 cookie curl POST → 401 `{"error":"未登录"}`；malformed body 同样 401（鉴权先于 body 解析） |

证据目录：`C:/Users/TimeCraker/AppData/Local/ResumeAIX/ResumeAIX-stage31-audit/VIBE/`（4 截图）。

## 保留项核对（任务书第 2 条）

- **鉴权**：`requireSession()` 前置于一切（401 分支在配置解析之前）——未动。
- **输入限制**：现状为「非空校验 + loading 单飞行防重」，前后端均无长度/频率限制（route.ts 仅校验 `messages` 为数组）——本次未改动即保留现状，如实登记。
- **计量**：vibe 设计免费（无扣币代码），保持免费，对账见验收 3。

## 观察项（记录不修）

1. **admin 表单会抹掉 vibe 渠道**：admin ai-config 的 `DEFAULT_CONFIG` 无 `models.vibe` 键且 PATCH 整体覆盖 `ai_config`——admin 后台一次保存会把 `models.vibe` 抹掉（vibe 回落 parsing 兜底链；apiKey 因掩码保留逻辑不动）。如需 admin 可视管理 vibe 渠道，应给 admin 表单补 vibe 键（属功能迭代非缺陷修复）。
2. **DB ai_config 成为共同主配置**：本次写入后 ai-service 的渠道也以 DB 为准（DB 覆盖 env）。未来换 key 时若只更新 start-ai.mjs 的 env 注入，会被 DB 旧值遮蔽——换 key 需同步更新 DB（或届时给 admin 表单补 vibe 键后统一走 admin）。
3. 端点为智谱 Coding Plan（`open.bigmodel.cn/api/coding/paas/v4`），与 ai-service 走查用渠道同源；glm-5.3-flash 非流式直调无需 `thinking` 开关，实测正常返回。

## 现场还原

- 渠道配置保留在本地库（任务书明确允许，后续任务复用）；失败态的错误端点已脚本恢复为正确值（回读校验 base_url/model/key_len 全对）。
- E2E 账号余额 195、流水 17 笔与开工基线一致；/vibe 页草稿（本轮对话，【E2E】前缀）留存在浏览器 localStorage，属产品正常草稿行为。
- 五服务全绿（status-all 复测）；无临时脚本/空目录残留（Temp 与 runtime 目录均清理）。
- 密钥零输出零提交：报告/commit/日志只有变量名与长度，无明文。
