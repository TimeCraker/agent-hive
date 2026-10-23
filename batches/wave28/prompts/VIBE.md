# VIBE：修复 7——/vibe 独立自由对话成功链路

## 任务一句话

查明 /vibe（BFF 直连 LLM 的独立会话）的渠道配置读取规则，用已授权的本地智谱渠道完成真实回复验收，保留鉴权/输入限制/计量，密钥零暴露。

## 共享背景

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。**开工三件事**：`git log --oneline -1` → `node C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/status-all.mjs` → 读 `docs/stages/stage-31-remediation.md`（第 7 项）+ 台账 S31-AIFLOW-01 行（现场：BFF 直连 LLM 不经 3002，DB ai_config 未配置 + .env 占位密钥 → 500；两次复测失败态均正确、未扣币）。
- **配置读取规则先查清**（用户指令原文）：读 apps/web 的 vibe-chat 路由/BFF 代码，确认它从哪读渠道（DB ai_config？env？ai-gateway？），当前为什么 500（上游认证失败的精确日志/响应）。
- **可用的授权渠道**：`~/.claude/zhipu.env` 的智谱 key（仅变量名 ZHIPU_API_KEY，值不打印）+ Coding Plan 端点 `https://open.bigmodel.cn/api/coding/paas/v4`，模型 glm-5.3-flash 系已实测可用（ai-service 的 start-ai.mjs 就是这么注入的，可参考其映射方式）。
- 环境：E2E 账号；浏览器独占；截图 `.../ResumeAIX-stage31-audit/VIBE/`（自建）+读图目检。
- 修复纪律：commit 中英文不 push；台账+Spec 更新；lint/type-check 过。**收尾纪律**：最后 Write 报告 `.../runs/reports/VIBE-report.md`。

## 修复要求（用户指令原文要点）

1. **最小侵入**：优先走既有配置机制——若 vibe 读 DB ai_config：向本地库 ai_config 写入 vibe 渠道配置（端点/模型名/密钥——密钥经脚本写入 DB，**不在日志/报告/commit 出现明文**；admin 后台 ai-config 模块也可管理，走查文档有提权口径）；若 vibe 读 env：给 3100 的 web 进程注入（参考 start-ai.mjs 的 env 注入模式，新建/改 start-web 注入脚本，仓库外运行时目录）。
2. **保留**：鉴权（未登录不能调）、输入限制（长度/频率既有规则）、计量规则（如有扣币语义保持——vibe 当前免费则保持免费）。
3. **不改生产配置**：一切只动本地隔离库/本地进程 env。
4. 若确有配置阻塞（如代码硬编码了不支持的渠道形态）：记录具体阻塞原因与所需决策，做最小代码修复使其可配置（这属于合理修复而非关闭校验）。

## 验证场景

- 真实成功：登录 → /vibe 发一条合成问题 → 真实回复渲染（截图+network 200+响应内容断言）；多轮一次（上下文保持）。
- 失败态回归：渠道临时断开（停 ai 相关进程或改错端点——**测完立即恢复**）→ 明确错误提示、不扣币、会话可重试。
- 鉴权：未登录 curl /api/vibe-chat → 401。
- 计量：流水核对（免费则零扣币断言）。

## 红线

密钥零输出零提交（DB 写入用脚本、报告只说「已配置」）；不动生产；不 push；【E2E】数据；测试完恢复现场（渠道配置保留在本地库是允许的——后续任务还要用）。

## 验收标准

1. 配置读取规则结论（代码级证据）+ 注入方式说明（零密钥暴露）。
2. 真实回复成功截图+断言；失败态/鉴权/计量回归通过。
3. fix/配置 commit（如改代码）+ 台账/Spec 更新；lint/type-check 过。
4. 报告落盘 VIBE-report.md。
