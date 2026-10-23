# UNDO：修复 1+6——富文本撤销/重做双栈冲突 + 版本对比无 ID 条目假差异

## 任务一句话

修复 S31-EDIT-04（window useUndoRedo 与 Tiptap history 双栈同响应按键、onChange pushHistory 交叉污染导致多步撤销重做终态不可预期）与 S31-LAYPDF-02（version-diff.ts 对无 id 条目加侧别后缀导致左右键永不配对、同版本自比报差异），修完真实浏览器回归六场景。

## 共享背景

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。**开工三件事**：`git log --oneline -1` → `node C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/status-all.mjs` 五服务核对（挂了按 `docs/stages/stage-31-browser-audit.md` runbook 拉起；ai/export 重启用 CIM 脚本）→ 读 `docs/stages/stage-31-remediation.md`（本次 Spec，你的验收标准在第 1、6 项）+ 台账中 S31-EDIT-04 / S31-LAYPDF-02 两行（根因与证据详情）。
- 环境：E2E 账号 `e2e-stage31@resumeaix.test / E2eStage31!2026`；测试简历用 dashboard 新建【E2E】UNDO 前缀（或复用库中既有【E2E】简历）；改 web 代码后 rebuild+重启 3100（runbook 可抄：`pnpm --filter @resumeaix/web build` → 杀 3100 树 → `node start-web-3100.mjs`）。
- 浏览器 Playwright MCP 独占；截图存 `C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/UNDO/`（自建），关键截图必须自己读图目检。
- 修复纪律：一个缺陷一个 commit（中英文 Conventional，不 push）；修完 rebuild → 浏览器同条件前后对照；台账 S31-xx 行更新「已修+回归」，remediation Spec 对应项打勾；`pnpm --filter @resumeaix/web lint`+`type-check` 过；如改到有 vitest 的包（design-doc 等）跑其测试。
- **收尾纪律**：完成后最后一步用 Write 工具把报告写入 `C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/UNDO-report.md` 再结束。

## S31-EDIT-04 修复要求（用户指令原文要点）

- 检查 Tiptap history 与全局 resume-store（useUndoRedo/use-auto-save）的快捷键监听、历史记录结构、外部内容同步（setContent）三处交互。
- **明确撤销作用范围**：一次按键只触发一套历史；旧快照不得覆盖重做结果。建议方向（Spec 已记）：富文本聚焦时全局栈让位（或全局栈对富文本内容降级为段粒度），确立单一撤销权威——按实际代码结构选最小侵入方案。
- **保留**：顶栏撤销/重做按钮、其他字段（非富文本）的撤回能力、自动保存语义（撤销后服务器跟随客户端终态——这是 wave27 已验证的正确行为，别破坏）。
- 验证六场景（真实浏览器）：连续输入、格式变化（加粗/列表）、跨字段编辑（富文本↔普通字段）、AI 采纳后撤销、顶栏按钮操作、键盘 Ctrl+Z/Ctrl+Shift+Z（含大写 Z 形态——wave27 已修 key 大小写，别回归）。

## S31-LAYPDF-02 修复要求

- `version-diff.ts` 的 diffArray keyOf 对无 id 条目加 `_L`/`_R` 后缀导致左右键永不相等——修配对算法：不能简单去掉后缀（会引入重复分类条目互相覆盖错配）。
- 验证：同版本自比零差异；原件 vs 未修改副本零差异；技能条目增/删/改正确报差异；条目重排正确（不误报内容差异）；重复分类（同分类多条目）正确配对不串行。

## 红线

不动面试线与他人工作区改动（interview-helper/next-env.d.ts、scripts/eval-*）；不重做 UI 设计；不 push 不部署；零密钥；【E2E】测试数据。

## 验收标准

1. 六撤销场景终态全部可预期（每场景前后对照截图+断言记录）。
2. 版本对比五验证（自比/副本/增删改/重排/重复分类）全过，相同内容零差异有硬断言。
3. 两个独立 fix commit + rebuild 回归；lint/type-check 过；台账与 Spec 更新 commit。
4. 报告落盘 UNDO-report.md。
