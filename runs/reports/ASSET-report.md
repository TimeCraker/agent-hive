# ASSET 任务报告 — 素材删除假成功→真删除 + 素材生成简历成功路径

日期：2026-10-13。分支 main，fix commit `1a5620d`（不 push）。结论：**全项通过，无阻塞**。

## 修复内容

1. **后端**：新增 `apps/web/src/app/api/career-assets/[id]/route.ts` — `DELETE`：`requireSession()` 401 → `findUnique` 404「素材不存在」→ 归属校验 403「无权删除此素材」→ `prisma.careerAsset.delete` 真实删除 → `{success:true}`。照 `resumes/[id]` + `api-auth.ts` 既有口径（`params: Promise<{id}>`）。
2. **前端**：`(dashboard)/assets/page.tsx` `handleDelete` 重写 — `window.confirm` 确认（同 upload-workspace 既有模式）→ fetch 后检查 `res.ok` → **成功才移除**；失败/断网保留卡片 + role=alert 中文横幅（新增 `deleteError`，样式同 genError）；删除中禁用该卡按钮（`deletingId`）防重复提交。

## 验证结果（真实浏览器 + API/DB 双证）

环境：rebuild 后 Web 3100 BUILD_ID `Bz7uy0HFaYkUus-v2scdI`；账号 A=`e2e-stage31@resumeaix.test`，账号 B=`e2e-misc2@resumeaix.test`（未新注册，B 直接复用小号）。四路径：

| # | 路径 | 操作 | 结果 | DB 断言 |
|---|---|---|---|---|
| 1 | 正常删除 | UI 删【E2E】ASSET-1（confirm 接受） | DELETE **200**，卡片移除、计数 3→2，刷新不复活 | count 3→2，行 `cmv6c01ig…yzga` 消失 |
| 2 | 越权 | B 会话 fetch 删 A 的 MISC 素材 | **403**「无权删除此素材」 | A 素材完好，全表不变 |
| 3 | 不存在 | 删已删除 id（API + 陈旧标签页 UI 双测） | API **404**「素材不存在」；UI 横幅「素材不存在」+ 卡片保留，0 误报成功 | 全表不变 |
| 3b | 未登录 | 无 cookie curl | **401**「未登录」 | — |
| 4 | 断网 | `setOffline(true)` 删 ASSET-2 → 恢复重试 | 断网：`ERR_INTERNET_DISCONNECTED`、中文横幅「网络异常，删除失败，请检查网络后重试」、卡片保留；重试：**200**、移除 | 断网时未删；重试后 2→1 |

前端确认/失败/成功三态前后对照截图 7 张（读图目检过）：`C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/ASSET/`（01 before / 02 刷新不复活 / 03 断网保留 / 04 MISC 删除空态 / 05 404 保留 / 06 B 生成前 / 07 编辑器成功页）。

## 验收标准逐条对照（Spec 第 4 项）

1. ✅ 本人素材 DELETE 200 + DB count −1（证据上表 #1）
2. ✅ 刷新不复活、计数同步（#1 + 截图 02）
3. ✅ 未登录 401；非本人 403/404 与既有归属口径一致（#2/#3）
4. ✅ 断网失败：错误提示、卡片保留、0 次乐观移除（#4 + 截图 03）
5. ✅ 走查保留的【E2E】MISC 证据素材（`cmv5bkn46…r8hi`）UI 真实删除，确认弹层 → 200 → 空态，全表 career_assets 归零（截图 04）

## 素材生成简历成功路径（wave27 未测项，附加实测）

主号 A 配额 5/5 触顶（5 份均为其他任务证据件，按红线不删），改走小号 B（配额 0/5）：UI 建 2 条【E2E】合成素材 → 「从素材生成简历」**单次真实 AI 调用** → 201 跳编辑器 `/resume/cmv6chnyg0009uvpc9cusmey9`。DB：title「前端工程师简历」、pipeline=design、status=REVIEWING、B 简历 0→1、素材保留 2 条；扣币 **0**（B 余额 250、流水仅历史签到一笔，公测免费叙事一致）；预览真实渲染整合内容（P95 820ms→260ms、Redis / React·ECharts 标签）。console 仅 1 条 design 404 噪音 = 既有 S31-PUB-02（范围外，不属本任务）。

## 质量门与残留

- `pnpm --filter @resumeaix/web type-check` ✅；touched 文件 eslint 0 error（lint-staged commit 时再次全过）。
- 文档：Spec 第 4 项状态已更、进度 7/11；台账 S31-MISC-01 行改「已修 ✅」+ commit；PLAN_LIST 31.5.4 勾选 + 统计同步。
- 数据残留：A 素材 0（验收 5 终态）；B 素材 2 条 + 简历 1 份（新建【E2E】件，保留作 VFINAL 成功路径证据）。
- 工作区他人残留（interview-helper/next-env.d.ts、scripts/eval-*）未动、未混入提交。

## 剩余风险

- 5xx 服务错误路径未单测（断网路径已覆盖前端失败分支同一代码路径；后端 5xx 行为由 Next.js 兜底）。
- B 的 1 份生成简历占其配额 1/5，不影响他任务（主号配额未动）。
