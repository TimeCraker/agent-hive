# COPY 任务报告：免费话术清理 + AI 失败退币措辞（第 8 项）+ 空圆点/悬空分隔符（小项 3）

日期：2026-10-13 ｜ 环境：本地 stage31 runtime（Web 3100 / AI 3002 / Export 3003 / PG 5434 / Redis 6380，收工时五项全绿）
开工 HEAD：`c004c12` ｜ 收工 HEAD：`2dd7ca2` ｜ 重建后 Web BUILD_ID `gRqg_RUTaKBL6Mw3CcRmN`

## 交付 commit（均未 push）

| commit | 内容 |
|---|---|
| `1c8b74c` | fix(plan): 限额提示改免费叙事，去除套餐/升级话术 / reword quota message to free-tier narrative |
| `4e3d16e` | fix(templates): 空成就不渲染圆点，空结束日期不悬空 / guard empty bullets and dangling date separators |
| （本条） | docs(stage31): Spec 两项状态 + 台账四行（UPLD-01/LAYPDF-07/09/MISC-04）+ PLAN_LIST 31.5.8/31.5.11 勾选 |

## 第 8 项：免费产品话术统一（S31-UPLD-01 + MISC-04 · COPY）

**改动**（`1c8b74c`，+1/-1）：文案源头 `apps/web/src/lib/plan.ts` `canCreateResume` 限额分支一句改净——

- 修前：`当前套餐最多存储 5 份简历，请删除不需要的简历或升级套餐`
- 修后：`免费版最多存储 ${limits.maxResumes} 份简历，请删除不需要的简历后重试`

一处源头覆盖全部三场景：`POST /api/resumes`（/upload 第 6 份）、`api/career-assets/generate-resume`（/assets 从素材生成）、以及第 5 项 QUOTA 待合入的创建副本闸（其验收 3 明确复用本文案源，合入即自动继承）。

**验收（重建后实测，证据 `ResumeAIX-stage31-audit/COPY/`）**：

| 断言 | 结果 |
|---|---|
| /upload 第 6 份：付费词 0 处 | ✅ 面板全文 `套餐|升级|付费|充值` 0 命中；新文案+「这次没有解析成功」面板+重新上传/改从零构建双出口不变（copy-upld-after-01；修前 copy-upld-before-01） |
| /assets 从素材生成：同上 | ✅ 错误横幅 0 付费词、新文案生效（copy-assets-after-02；修前 copy-assets-before-02） |
| 行为不变 | ✅ 仍 403（API 探针实测 `{"status":403}`）+ FIG.ERROR 面板/横幅 |
| 源码复扫：BFF/共享层限额文案付费词 | ✅ `升级套餐\|当前套餐` 全 apps/web/src 0 命中 |
| 引导语义 | ✅ 两场景均为「请删除不需要的简历后重试」 |

**全站付费词残余 13 文件 = 保留类（逐类说明）**：

- **admin 后台 7 文件**（admin/page、coin-stats、users、tcoin/OrdersReviewPanel、TransferReviewPanel、api/admin/tcoin/orders、api/admin/transfers）：历史收款订单核销与充值统计是真实历史业务（stage-20 拍板保留核销后台），按任务约定保留。
- **api/tcoin/recharge**：Stage 20 后前端入口已下架，API 保留兼容存量订单流（文件头注释在案）。
- **(dashboard)/tcoin/page.tsx「付费购买—不需要」**：领取方式对照表的第三行，值列明确「不需要」，是免费叙事的一部分，保留。
- **pricing/faq/pricing-teaser/structured-data**：「没有付费墙」「无需付费」等均为免费叙事正述，保留。
- **terms/content.ts**：服务变更/服务升级等通用法务措辞，保留。

**AI 失败措辞扫描（退币/返还 统一性）**：用户可见失败文案已全站统一「退币/返还积分」——coin-guard.ts（已返还/已登记自动重试/需管理员处理）、style-picker.tsx（失败按原扣币记录退币 / 不达标自动重试不另扣币）、vibe-chat-panel.tsx、design-pipeline.ts（全失败才退币，refund-{txid} 幂等）、tcoin 页消耗表（不达标自动退币）、terms（AI 失败时自动退币）。唯一「退款」字样出现在 terms 免责句「**不代表现金退款**」，该句是否定现金退款、与「T-Coin 非现金」叙事一致，保留不改。**结论：无需代码改动的已达标项，扫描清单在案。**

**面试线扫描（红线不动，只登记）**：`apps/interview-helper` 命中 2 文件——jd-presets.ts 4 处均为 JD 领域词（知识付费/付费率行业描述，非产品付费触点）；sessions/route.ts:61「T-Coin 余额不足，请充值」属面试线配额文案，措辞与简历线退币叙事不同源，留给面试线负责人定夺（本任务红线不动面试线）。

## 小项 3：空圆点与悬空分隔符（S31-LAYPDF-07/09 · COPY）

**改动**（`4e3d16e`，12 文件，忽略行尾后 +165/-91）：

1. `registry.ts` 新增两个渲染防御纯函数：
   - `getDateRangeText(start, end, isCurrent?, separator='-')`：空 endDate 且非 isCurrent → 兜底「至今」，不再产出「2016-07 -」悬空短横线；separator 可传 `—` 保留 elegant 版式。
   - `getValidAchievements(list)`：过滤空串/纯空白成就；全空则整组不渲染 ul。
2. 12 个模板文件统一接入（11 独立模板 + template-sections 共用件，classic/minimal 经 sections 间接覆盖）：36 处日期区间 + 22 处成就列表。

**验证（四形态 E2E 简历 `cmv6au79l0009uv5gz0rm8iyy`【E2E】COPY-渲染边缘四形态，前后对照）**：

| 断言 | 修前（BUILD tEsc…） | 修后（BUILD gRqg…） |
|---|---|---|
| 空 endDate 非在职悬空「-」 | 预览/分享 DOM 断言 3 处（edu/work/proj 各一） | **0 处**，渲染「2016-07 - 至今」「2019-01 - 至今」（PDF page1 目检同） |
| 空字符串成就空 bullet | DOM 断言 3 个（work 2 + proj 1） | **0 个**，有效成果 bullet 渲染不变 |
| 「至今」在职语义 | 「2024-01 - 至今」✅ | 不变 ✅（hasZhiJin=true） |
| 未来毕业日期（在读 2027-06） | 「2023-09 - 2027-06」✅ | 不变 ✅（hasFuture=true） |
| 正常双日期回归 | 2020-03 - 2023-08 / 2021-05 - 2022-06 | 逐字不变（视觉零改动口径） |
| elegant「—」传参路径 | — | 切版式实测：`2023-09 — 2027-06` 正常、`2016-07 — 至今` 兜底、悬空 0/空 bullet 0，验后切回经典 |

三处表面 × 前后截图：预览（copy-render-before/after-03）、分享页（-05，验后 visibility 已回 PRIVATE 且 curl 404 复验）、PDF 导出（-04，投递检查「生成实际 PDF 预览」canvas 目检）。

## 技术检查与边界说明

- `pnpm --filter @resumeaix/web type-check` ✅ 过；touched 文件（plan.ts、templates/ 目录）eslint 0 error。未跑全量 `pnpm lint`（存量 error 与本任务无关，避免归因混淆）。
- `4e3d16e` 中 template-modern/sidebar 两文件出现整文件行尾规范化（仓内历史 CRLF → prettier `endOfLine: lf` 规范），由 lint-staged prettier --write 产生；`git diff --ignore-cr-at-eol` 复核真实改动 +165/-91，内容等价。
- 测试资料：新增【E2E】简历 1 份（账号 5/5 满额状态即第 8 项触发条件），分享终态已关（PRIVATE）；本任务测试上传探针仅前端 DataTransfer 注入，**未产生任何简历创建/解析记录**（第 6 份被 403 拒绝），DB 无新增脏数据。E2E 账号 T-Coin 余额 231（全程未动币）。
- 未动：面试线、他人改动（interview-helper/next-env.d.ts、scripts/eval-* 保持原状）、额度政策本身（PLAN_LIMITS 数值未改）。
