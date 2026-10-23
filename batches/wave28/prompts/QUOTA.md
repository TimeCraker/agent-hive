# QUOTA：修复 5——创建副本绕过数量上限→与创建入口一致（含并发）

## 任务一句话

让 `POST /api/resumes/[id]/version`（创建副本）与 POST /api/resumes 使用一致的数量上限规则，并发请求不绕过，同时完整保留副本的全部复制语义。

## 共享背景

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。**开工三件事**：`git log --oneline -1` → `node C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/status-all.mjs` → 读 `docs/stages/stage-31-remediation.md`（第 5 项）+ 台账 S31-LAYPDF-01 行（现场：version 路由无 plan/maxResumes 校验，5 份触顶后副本仍成功落第 6 份）。
- 环境：E2E 账号；rebuild 见 runbook；浏览器独占；截图 `.../ResumeAIX-stage31-audit/QUOTA/`（自建）+读图目检。配额测试会创建多份简历——**结束前清理自建的超出件**（保留 ≤5 份【E2E】资料供后续任务）。
- 修复纪律：commit 中英文不 push；rebuild 前后对照；台账+Spec 更新；lint/type-check 过。**收尾纪律**：最后 Write 报告 `.../runs/reports/QUOTA-report.md`。

## 修复要求（用户指令原文要点）

1. **一致规则**：version 路由加与创建路由同款的 plan/maxResumes 数量校验（读两处现有实现，抽共用或对齐逻辑）；触顶返回同款错误码与文案（文案若仍是付费话术，以 COPY 任务后的现状为准/或用免费叙事——如 COPY 未完成则用中性文案「已达存储上限」）。
2. **并发安全**：检查-创建窗口内并发请求不得重复绕过——评估现有创建路由的并发策略（事务/原子计数/唯一约束），副本路由用同款或更强方案；用两并发请求实测（Promise.all 或双 tab 快速双击）验证只成功一份或均被正确处理，无第 N+1 份落库。
3. **保留副本语义**（wave27 已验证的正确行为，不得破坏）：内容 JSON 一致、pipeline 继承、版式 templateId、岗位 targetJD 逐字、副本 version=源+1、parentId=源 id、status DRAFT、设计稿版本链独立。
4. **不改额度政策**：5 份上限数值不动，只堵绕过。

## 验证场景（真实浏览器+DB 双证）

- 未触顶：副本成功 + 八项语义断言（快速回归 wave27 口径）。
- 触顶（5 份）：创建被拦（正确错误提示）；副本也被拦（前后对照）。
- 并发：触顶边缘两并发副本请求 → 无超额落库（DB count 断言）。
- 顶限删除一份后：可再创建（限制可恢复）。

## 红线

不动面试线与他人改动；不 push；零密钥；【E2E】数据；结束清理超额测试件。

## 验收标准

1. 触顶后副本被拦有前后对照截图+API/DB 证据；并发无绕过有 DB count 断言。
2. 副本八项语义回归全过。
3. fix commit + 台账/Spec 更新；lint/type-check 过。
4. 报告落盘 QUOTA-report.md。
