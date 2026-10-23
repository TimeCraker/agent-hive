# QUOTA-report — 修复 5：创建副本绕过数量上限（S31-LAYPDF-01）

日期：2026-10-13。Spec：`docs/stages/stage-31-remediation.md` 第 5 项。Commit：`9daa146`（fix）+ `0b2f630`（docs）。**未 push**（按红线）。

## 结论

`POST /api/resumes/[id]/version`（创建副本）此前全文无 plan/maxResumes 校验，5 份触顶后可无限复制绕过存储上限。现与 `POST /api/resumes` 共用同一个**事务内原子名额闸门**，并发请求无法绕过；副本全部复制语义（wave27 口径）零回归。

## 修复内容（4 文件，+113/−61）

| 文件 | 改动 |
|---|---|
| `apps/web/src/lib/plan.ts` | 新增 `createResumeWithinLimit(userId, create)`：`prisma.$transaction` 内先 `SELECT id FROM users WHERE id=$1 FOR UPDATE`（行锁串行化同一用户的校验-创建窗口）→ 事务内读 plan + `resume.count` → 触顶抛 `ResumeLimitExceededError`（事务回滚）；`resumeLimitMessage()` 文案单源（免费叙事，与第 8 项 COPY 同源）。`getUserPlan` 加可选 `tx` 参数 |
| `apps/web/src/app/api/resumes/[id]/version/route.ts` | 全部 clone 逻辑迁入闸门回调；触顶 catch 转 403 `{error: reason}`。副本版本语义逐字段原样保留（v+1 / parentId / content / pipeline / templateId / targetJD / jdKeywords / targetPosition / workflow / status DRAFT / 活跃设计稿链克隆） |
| `apps/web/src/app/api/resumes/route.ts` | 从「check-then-create（本身有竞态窗口）」迁移到同一事务闸门；触顶同样 403。顺序变化：Zod 校验先于配额（非法 body 满额时 403→400，语义更准；合法 body 行为不变） |
| `apps/web/src/components/dashboard/resume-list.tsx` | `handleCopy` 非 200 时解析响应体并 `toast.error(data.error)`——触顶显示配额文案，不再一律「创建副本失败，请重试」；成功路径不变 |

`canCreateResume`（/assets 生成简历仍用）保持原样未动——不在本项范围（见「边界」）。

## 验收对照（Spec 4 条）

1. **触顶拦截** ✅ 5/5 满额：UI 创建副本 → 确认层 → `POST …/version` **403** `{error:"免费版最多存储 5 份简历，请删除不需要的简历后重试"}`；toast 显示同款配额文案（0 付费词：升级套餐/付费/充值/套餐 均 0 命中）；卡片列表保持「5 份职业档案」；DB total=5。前后对照截图 `QUOTA/quota-before-5cards-1440-01.png` → `QUOTA/quota-after-blocked-copy-quota-toast-1440-03.png`（网络面板另证 403 + body）。
2. **未触顶语义** ✅ 4/5 时 UI 创建副本 201（toast「已创建副本」，`QUOTA/quota-under-cap-copy-success-toast-1440-05.png`），八项语义 DB 断言全过：content JSON 等值（jsonb `=`）、pipeline=design 继承、templateId 等值（双侧 null）、targetJD 等值（双侧未设，`IS NOT DISTINCT FROM`）、version=2=源+1、parentId=源 id、status=DRAFT、设计稿版本链独立（副本独立 resume_designs 行：独立 id / resumeId=副本 / version=1 / isActive=true / themeId+html+styleBrief+meta 克隆一致；源链未动）。注：jdKeywords 源行 SQL NULL → 副本 `[]`，系 Prisma 标量列表（`String[]`）读空归一化，域级一致，非本修复引入。
3. **文案与免费叙事一致** ✅ 403 文案与 COPY 修复后 `canCreateResume` 同一 `resumeLimitMessage` 源；付费词 4 项 grep 0 命中。
4. **创建路由回归** ✅ 合法 body 第 6 份 `POST /api/resumes` → 403 同码同文案（走新闸门）。

## 并发实测（核心）

| 场景 | 修前（基线复现） | 修后 |
|---|---|---|
| 触顶单发副本（5/5） | 201 落第 6 份（audit 台账口径复现） | 403，DB=5 |
| 触顶双并发（5/5） | **双双 201**（5→7，竞态实锤，测试件已删） | 双 403，DB=5 |
| **边缘双并发（4/5）** | — | **恰 1×201 + 1×403**，DB=5、副本恰 1 份，无第 N+1 份落库 |
| 顶限删除一份后再创建 | — | 删 200 → 再创建 201，限制可恢复 |

修前双并发证据：两条 `(副本)` 行 version=2、parentId=源 id（createdAt 15ms 与 2s 间隔各一），证明检查-创建窗口真实可穿透；修后由行锁把同用户名额校验+创建串行化，第二事务在锁释放后重新计数，必然看到最新值。

## 实现注记

- 首版用 `pg_advisory_xact_lock(hashtext(userId))`：Prisma `$queryRaw` 无法反序列化 void 返回列（`P2010 Failed to deserialize column of type 'void'`）→ 500。改为用户行 `SELECT … FOR UPDATE`：同为事务级串行化原语，返回真实列无此问题，单锁单序无死锁面。
- UI toast 截图曾三次扑空：sonner v2 入场是 CSS transition（opacity 0→1, 400ms），浏览器后台标签页渲染节流会冻结 transition 在起点（computed opacity 0、animation none）。`page.bringToFront()` 后正常。**产品代码无此问题**（真实前台用户不受影响），纯测试环境现象。

## 验证与静态检查

- `pnpm --filter @resumeaix/web type-check` ✅ 过；touched 4 文件 eslint 0 error（未跑全量 `pnpm lint`，存量 error 与本任务无关，避免归因混淆）。
- 重建：`pnpm --filter @resumeaix/web build` ×2（advisory-lock 版与 FOR UPDATE 版），Web 3100 重启验证（BUILD_ID `Bz7uy0HFaYkUus-v2scdI` → `m7UyM9…` → 终态 `aNqtgj3l3PHHbDRkYW9Oo`）。真机 UI + API + DB 三证齐全。

## 测试资料与副作用（已全部还原）

- 全程 E2E 账号 `e2e-stage31@resumeaix.test`，未动他人改动与其账号数据。
- 修前基线复现产生的 3 份绕过副本：已删（200×3）。
- 设计稿链克隆分支需活跃设计稿，账号内 0 条（PG 重建遗留），在源简历临时插入合成夹具 `e2equota-fix-0001`（v1 active），测试完删除，源简历恢复原状（设计稿 0 行）。
- 未触顶场景需腾名额：`【E2E】EDIT-n2` 暂寄 admin 名下，测毕还原，admin 名下 0 残留。
- 终态断言：E2E 账号 5 份原件与开工清单逐一相同、resume_designs 0 行、T-Coin 231 全程未动。
- 临时文件：DB 查询助手在系统临时目录（`%TEMP%/quota-db.mjs`），仓库内无残留（MCP 截图临时落盘已清理）。

## 边界与未动（报备）

- `/assets` 从素材生成简历的配额检查（`career-assets/generate-resume` → `canCreateResume`）仍是 check-then-create，与本闸门存在同类竞态窗口——audit 未登记该项、Spec 未授权，**未动**；后续如要收敛，把该路由迁到 `createResumeWithinLimit` 即可（文案/错误码已同源）。
- `next-env.d.ts`、`scripts/eval-*` 为他人既有改动，未触碰。
- 未 push、未部署；面试线零改动。
