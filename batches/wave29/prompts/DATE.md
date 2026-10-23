# DATE · 日期兜底事实修正（S32-DATE）

## 权威 Spec
`docs/stages/stage-32-remediation.md` §32-2（先读）。当前缺陷在
`apps/web/src/components/templates/registry.ts` 的 `getDateRangeText`：
`if (isCurrent || !end)` 把「缺结束日且未标记在职」渲染成「至今」；日期全空也出「至今」。

## 修复要求
1. **仅 `isCurrent === true` 显式标记**时展示「至今」
2. 未标记且缺结束日 → **只展示开始日期**（无分隔符、无至今）
3. 日期全空 → 空串（不虚构任何日期）
4. 保留：明确结束日期原样；合理未来结束日期（在读语义，isCurrent=true 路径）；模板分隔符风格参数
5. 编辑检查提示补充结束日期：查编辑器既有 checklist/校验机制，可挂入则挂（轻量），
   无则**记录为不扩项**（写进报告，不新建大机制）
6. 同步更新该函数上方的 S31-LAYPDF-07 注释（说明 S32 修正语义）

## 验证
1. **分支回归测试**：四分支（isCurrent+无end / 无isCurrent+无end / 全空 / 全有）+ 边界
  （空白串、只有 end 无 start）——放进既有测试文件体系（查 registry 相关既有测试位置；
   无则新建 `apps/web/__tests__` 或项目惯用位置，跑法以 package.json 为准）
2. **三出口一致性**：预览（编辑器）、分享页、PDF——工作/教育/项目三类各造一条
   `startDate=2020-01, endDate=null, isCurrent=false` 数据，三出口均显示「2020-01」无「至今」
3. 本地验证环境：3100 五服务（`node C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/status-all.mjs`
   先查状态；需要时按 browser-audit 的启停 runbook）——若 PDF/分享链路依赖 export-service，
   保持既有本地栈；Playwright 正式页面截图目检（截图存证据目录）
4. `pnpm --filter @resumeaix/web type-check` + `lint` 过

## 红线
- 不碰 generate-resume 路由 / plan.ts（另一并行任务在改）
- 不动视觉/导出配置；不 push 不部署；不改面试线

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\DATE-report.md`。
证据：`C:/Users/TimeCraker/Desktop/my_workspace/ResumeAIX-stage32/DATE/`
