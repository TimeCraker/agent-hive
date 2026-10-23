# DESIGN：修复 2——设计稿生成 S4_NON_TEXT 根修 + 真实成功全链

## 任务一句话

定位并修复设计稿生成的 S4_NON_TEXT 误判（正确区分缺失可选值/合法文本/非法对象值），在不关闭校验的前提下让真实生成成功，并走通生成→迭代→换版式→版本恢复→分享→设计稿 PDF 的完整成功链。

## 共享背景

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。**开工三件事**：`git log --oneline -1` → `node C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/status-all.mjs` → 读 `docs/stages/stage-31-remediation.md`（第 2 项）+ 台账 S31-LAYPDF-10 行（现场：AI 绑定 basicInfo.phone 被判 S4_NON_TEXT，3 轮重试全败，8 币扣后全额返还；失败处理本身正确）。
- **关键提示（用户指令原文）**：「basicInfo.phone 是合法字段，不能直接认定为 AI 幻觉；当前空值也可能触发该错误」——先读 `packages/design-doc` 的槽位约定与 S4 校验实现、设计稿生成 prompt（packages/ai-prompts）与 ai-service 设计稿链路，搞清楚：槽位 schema 里 phone 的类型定义是什么、AI 返回什么形态、S4 校验把什么判成了 NON_TEXT、空值走哪条分支。**很可能是槽位类型定义过窄（如只认 string 非空）或对空值/缺省的合法形态处理不当**。
- 环境：AI 文本渠道真实可用（智谱 glm-5.3 系经 start-ai.mjs 注入）；E2E 账号（T-Coin 余额走查文档/页面查看，生成 8 币/次——**总消耗控制在签到+现有余额内，生成类调用 ≤6 次**：修复验证 1-2 次 + 成功链各环节）；rebuild 见 runbook（若改 ai-service/design-doc 记得按 runbook 重启 3002）；浏览器独占；截图 `.../ResumeAIX-stage31-audit/DESIGN/`（自建）+读图目检。
- 修复纪律：commit 中英文不 push；修复→rebuild/重启→真实浏览器回归；台账+Spec 更新；受影响包（design-doc/ai-prompts/ai-service）lint+type-check+（design-doc 有 vitest）测试全过，**校验逻辑改动补测试用例**。**收尾纪律**：最后 Write 报告 `.../runs/reports/DESIGN-report.md`。

## 修复要求（用户指令原文要点）

1. **不能关闭校验让生成通过**——安全与事实校验保持：非法对象值照拦，缺失可选值与合法文本放行。
2. 正确分类三形态：缺失的可选值（如用户没填 phone → 绑定为空/跳过均合法）、合法文本（phone 有值 → 正常绑定）、非法对象值（AI 返回对象 → 拦截）。
3. 若 AI 侧 prompt 诱导了错误绑定形态：收紧 prompt 槽位约束（明确「phone 为文本槽，无值时不绑定」）+ 校验侧宽容合法形态，两头修。

## 成功链验证（修完后真实走通）

生成（工坊入口，真实 AI 成功返回设计稿）→ 迭代（一次 follow-up 生成）→ 换版式 → 版本选择/恢复（恢复后内容版式正确）→ 分享（公开可访问含设计稿渲染）→ **设计稿 PDF 导出**（可打开、文字可复制、无编辑标记）。每环节截图+断言。失败容错路径（渠道断开时退币/提示）做一次断网验证保持不回归。

## 红线

不动面试线与他人改动；不 push；不批量生成烧币（≤6 次生成类调用）；零密钥（start-ai.mjs 已封装注入，勿打印 env）；【E2E】数据。

## 验收标准

1. S4_NON_TEXT 根因定位有代码级证据（槽位定义/AI 返回形态/校验分支三者对上）；三形态分类正确（单测或 API 级断言）。
2. 真实生成成功 + 全链六环节通过（截图+断言）；失败容错一次回归。
3. fix commits（含测试）+ 台账/Spec 更新；受影响包 lint/type-check/test 过。
4. 报告落盘 DESIGN-report.md（含 T-Coin 消耗对账）。
