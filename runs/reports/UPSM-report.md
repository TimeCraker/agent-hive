# UPSM 任务报告：断网保存中文提示（S31-UPLD-02）+ 零字节文件前后端拦截（S31-UPLD-03）

日期：2026-10-13 ｜ 环境：本地 stage31 runtime（Web 3100 / AI 3002 / Export 3003 / PG 5434 / Redis 6380，收工时五项全绿）
HEAD：`c004c12`（走查代码终态；Web BUILD_ID `tEsc-Rrm5esN6muLIT956`）

## 交付commit（均未 push）

| commit | 内容 |
|---|---|
| `6781953` | fix(upload): 断网保存显示中文网络提示而非英文原始错误 / show friendly Chinese message on offline save failure |
| `c2c2f91` | fix(upload): 空文件前后端双重拦截，不再产生无效解析记录 / reject zero-byte files on client and BFF parse route |
| `c004c12` | docs(stage31): 登记 UPSM 两项修复结论与台账 / record UPSM remediation results in ledger and spec |

## S31-UPLD-02：断网保存中文提示

**改动**（`apps/web/src/components/upload/upload-workspace.tsx` handleSave catch，+10/-1）：
catch 分支识别网络类错误（`TypeError` 或 message 匹配 `failed to fetch / network error / load failed / internet disconnected`）→ 中文兜底「保存失败：网络异常，修改已保留在本页，请检查网络后重试。」；其余业务错误维持原 `err.message`（本地校验与服务端中文提示不受影响）。

**验收（同条件前后对照，简历 cmv59aeab000juvj8xtvrkxv8 核对页，Playwright setOffline）**：

| 断言 | 修前（BUILD Ta2NXP7…） | 修后（BUILD tEsc-Rrm…） |
|---|---|---|
| 断网点保存提示 | 红色英文「Failed to fetch」裸露（before-01 截图） | 「保存失败：网络异常，修改已保留在本页，请检查网络后重试。」，0 处英文原文（after-01 截图） |
| 输入保留 / 停留本页 | 保留 | 程序化断言：手机号 13900139000 保留、URL 不变 |
| 恢复网络重试 | 成功（前对照链路，DB 读回 13800138000） | 成功，DB 读回 `content.basicInfo.phone = "13900139000"` 一致 |
| 校验类中文提示不回归 | — | 非法邮箱保存仍显示「邮箱格式不正确，请修改基本信息后重试保存。」（after-03 截图），验证后已改回原值并保存 |

## S31-UPLD-03：零字节文件前后端拦截

**改动**（`c2c2f91`，+16/-1）：
1. 前端 `file-upload.tsx`：`validateAndSelect`（移动端 input 路径）与 `onDrop`（桌面点击+拖拽路径）双入口补 `size === 0` 拦截，提示「文件为空 — 请检查后重新选择文件」。
2. 同 commit 含一处必要修正：错误条显示优先级 `dropError || localError`——0B 拦截残留的 localError 会遮蔽后续 .exe/20MB 拒绝文案，修正后连续负例切换文案各自正确。
3. 服务端 BFF `api/resumes/[id]/parse/route.ts`：`file.size === 0` → 400 `{"error":"文件为空，请检查后重新上传"}`，不再转发下游产生必然失败的解析。

**验收（修后新 build 实测）**：

| 用例 | 结果 |
|---|---|
| 0B TXT / 0B PDF / 0B PNG（点击选择） | 三例均拦「文件为空 — 请检查后重新选择文件」，network 断言 **0 POST** |
| 0B TXT（DataTransfer 拖拽路径） | 同样拦截，0 POST |
| .exe / 20MB PDF 回归 | 「暂不支持该格式…」「文件不能超过 10MB…」文案与零请求行为不变（含 0B→exe→20MB 连续切换） |
| 服务端直连绕过（带 cookie 直发 0B 文件到 parse 路由） | **400** `文件为空，请检查后重新上传` |
| 正常小文件上传回归（e2e-upld-base.txt 2181B） | 通过：`POST /api/resumes` + `POST …/parse` 两步正常，解析完成进核对页（after-normal 截图） |
| DB 断言 | 负例全程零创建零 FAILED（5 = 4 原有 + 1 正常上传）；测试件已删，E2E 账号恢复 4 份 |

## 现场与配额说明

- E2E 账号开工时 6 份简历（5 份上限触顶）：删除 2 份此前走查自建的「(副本)」测试件（【E2E】LAYPDF-版式多页 (副本)、【E2E】EDIT-n2 (副本)）腾名额，符合「删除只删自建测试件」红线；其余【E2E】简历未动。
- 0B 测试文件与查询脚本均在系统临时目录，已删除；截图 7 张归档 `ResumeAIX-stage31-audit/UPSM/`（before 1 / after 6）。
- 遗留观察（不属本任务）：`canCreateResume` 403 文案仍含「升级套餐」字样，属 Spec 小项 8（QUOTA）范围，未动。

## 验证汇总

- `pnpm --filter @resumeaix/web type-check` ✅ 零错误；改动文件 `eslint` ✅ exit 0；lint-staged（prettier+eslint）随 commit 全过。
- 台账 `stage-31-browser-audit.md` S31-UPLD-02/03 两行已更新「已修 ✅ + commit + 回归结论」；Spec `stage-31-remediation.md` 小项 9/10 状态改「已完成」并逐条登记验收证据。
- 未 push；面试线与他人工作区改动未触碰（interview-helper/next-env.d.ts、scripts/eval-* 为开工前既有改动，保持原样）。
