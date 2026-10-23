# ASSET：修复 4——素材删除假成功→真删除 + 素材生成简历成功路径

## 任务一句话

补齐 career-assets 删除接口（登录+归属校验）、前端响应检查与删除确认，验证删除/越权/不存在/断网四路径，并实测素材生成简历的成功路径。

## 共享背景

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。**开工三件事**：`git log --oneline -1` → `node C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/status-all.mjs` → 读 `docs/stages/stage-31-remediation.md`（第 4 项）+ 台账 S31-MISC-01 行（四重证据：无 DELETE 路由 404、前端乐观移除、刷新复活、DB 不变）。
- 环境：E2E 账号；配额注意（5 份上限，测试前查库中【E2E】简历数，必要时清理自建件）；rebuild 见 runbook；浏览器独占；截图 `.../ResumeAIX-stage31-audit/ASSET/`（自建）+读图目检。
- 参考：既有 career-assets 路由的鉴权写法（`api-auth.ts` session+ownership 模式，照同款）；简历 CRUD 的归属校验模式。
- 修复纪律：commit 中英文不 push；rebuild 前后对照；台账+Spec 更新；lint/type-check 过。**收尾纪律**：最后 Write 报告 `.../runs/reports/ASSET-report.md`。

## 修复要求（用户指令原文要点）

1. **后端**：`DELETE /api/career-assets/[id]` 补齐——登录校验 + **归属校验**（只能删自己的素材，他人素材 403/404 按既有模式）；不存在 404；成功 200/204 并真实删除 DB 行。
2. **前端**：删除按钮加**确认**（沿用项目现有确认交互模式）；请求后检查响应——失败时**保留卡片并明确提示**（不乐观移除）；成功后移除。
3. **验证四路径**（真实浏览器+API/DB 双证）：
   - 正常删除：成功 → **刷新后仍消失**（DB 行删除）。
   - 越权：账号 B（可新注册【E2E】ASSET2 子账号，验证码走 Redis 读码流程见 runbook）删除账号 A 的素材 → 被拒。
   - 不存在：DELETE 已删除的 id → 404，UI 不误报成功。
   - 断网：setOffline 后删除 → 失败提示、卡片保留、恢复后可重试。
4. **素材生成简历成功路径**（wave27 未测项）：从素材库走「生成简历」入口（若配额允许）→ 真实走通生成→编辑器；若配额触顶，清理自建件后重试；AI 调用遵守单次原则。

## 红线

不动面试线与他人改动；不 push；零密钥；【E2E】数据；不删他人/stage25 之外的历史数据（DB 只删自建测试素材）。

## 验收标准

1. DELETE 接口存在且四路径行为正确（API 状态码+DB 断言记录）。
2. 前端确认+失败保留+成功移除的前后对照截图。
3. 素材生成简历成功路径实测结论（或明确阻塞原因）。
4. fix commits + 台账/Spec 更新；lint/type-check 过。
5. 报告落盘 ASSET-report.md。
