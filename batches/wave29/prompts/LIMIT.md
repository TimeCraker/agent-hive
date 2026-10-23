# LIMIT · 素材生成原子数量限制（S32-LIMIT）

## 权威 Spec
`docs/stages/stage-32-remediation.md` §32-3（先读）。

## 现状（已核实）
`apps/web/src/app/api/career-assets/generate-resume/route.ts`：
- :4 `import { canCreateResume } from '@/lib/plan'`
- :17 预检查 `const { allowed, reason } = await canCreateResume(...)`
- :53 AI 调用后**裸** `prisma.resume.create` ——并发窗口可越过上限
- 原子闸门已存在：`apps/web/src/lib/plan.ts` `createResumeWithinLimit`
  （SELECT FOR UPDATE + count + create 同事务，触顶抛 ResumeLimitExceededError → 调用方转 403）
- 已接闸门的参考实现：`apps/web/src/app/api/resumes/route.ts`、`resumes/[id]/version/route.ts`

## 修复要求
1. 保留 AI 调用前的 `canCreateResume` 快速预检查（省模型调用）
2. **最终入库改为 `createResumeWithinLimit`**：AI 生成内容完成后再进闸门事务；
   **事务内不得有外部 AI/网络调用**（不长期持锁）
3. 触顶时：与普通创建同文案口径的 403 反馈、**不落库、无假成功**；
   AI 已消耗的计量保持现有规则（如实记录行为，不偷偷退币也不重复扣）
4. 检查该路由现有响应形态，保持前端兼容（前端若需微调提示文案同步，查调用方）

## 验证
1. **并发可控测试**（先测逻辑，不耗模型调用）：模拟「素材生成 vs 普通创建 vs 副本创建」
   三方同时触顶（把测试账号简历数加到上限-1，并发 3 请求，断言：最终恰好达上限、
   无超额记录、触顶方收到准确 403 文案）——用本地 PG + 真实路由（可临时把 AI 步骤
   stub/复用已有 mock 手法；或构造直接打到闸门层的等价并发测试），测试脚本存证据目录
2. **真实前端成功链路一次**：正式页面素材生成 → 成功保存（避免浪费模型调用，一次即止）
3. 触顶后文案与无多余记录复查（DB count 断言）
4. type-check + lint 过；相关既有测试不回归

## 红线
- 不碰 registry.ts（另一并行任务在改）；不动 plan.ts 闸门本身（除非发现其缺陷——
  发现了就记录报告交主控裁决，不自行改）
- 不 push 不部署；测试用本地 PG；不清库

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\LIMIT-report.md`。
证据：`C:/Users/TimeCraker/Desktop/my_workspace/ResumeAIX-stage32/LIMIT/`
