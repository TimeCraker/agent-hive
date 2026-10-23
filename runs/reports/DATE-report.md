# S32-DATE 日期兜底事实修正报告

**状态：完成** · 2026-10-15 · commit `7a8b884`（ResumeAIX main，未 push 按红线）

## 结论

`getDateRangeText` 不再把「缺结束日且未标记在职」渲染成「至今」。仅 `isCurrent === true` 显式标记展示「至今」（含在读未来结束日期语义）；未标记缺尾只显开始日期（无分隔符无「至今」）；日期全空返回空串。预览 / 分享 / PDF 三出口真机验证一致。

## 改动（scope 分组）

| 文件 | 改动 |
|---|---|
| `apps/web/src/components/templates/registry.ts` | `getDateRangeText` 语义修正 + S31-LAYPDF-07 注释更新为 S32-DATE 语义 |
| `apps/web/src/components/editor/guided-resume-desk.tsx` | 投递检查清单「核对」按钮为缺尾条目追加「· 缺结束日期」标注（既有 checklist 机制轻量挂入，`resumeDateIssues` 本已计该情形为待检查，只补了原因可读性） |
| `apps/web/__tests__/registry-date-range.test.ts` | 新建：10 用例（四分支 + 空白串 / 只有 end / 未来在读 / `=== true` 严格判定 / 分隔符参数） |
| `apps/web/package.json` | 新增 `"test": "vitest run"`（node-linker=hoisted，vitest 3.2.7 全 workspace 可 resolve，未动 lockfile） |
| `docs/stages/stage-32-remediation.md` / `stage-32-verification.md` | 32-2 打勾（1/4）+ 建立验证记录 |

**编辑检查挂入说明**（spec 第 3 条）：走「已有 checklist 机制则挂入」路径，非不扩项——挂入点为 UI 标注，未改 `resumeDateIssues` 返回结构（design-doc 既有测试 `closeout.test.ts` 不受影响）。

## 验证（数字）

- **分支回归**：vitest 10/10 通过；type-check 通过；lint 0 error（1 条存量 warning，位于本次未触碰的 restore effect，改动前已在）
- **三出口一致性**（3100 五服务栈，legacy 线测试简历，work/edu/project 各一条 `2020-01 / null / false` + 3 条对照）：
  - 编辑器预览（DOM TreeWalker）：三条缺尾均裸显 `2020-01`；`isCurrent=true` → `2021-03 - 至今`；齐全 `2018-01 - 2019-12`；在读 `2023-09 - 2026-06` 原样
  - 分享页（SSR HTML + 视觉目检）：同上，「至今」全文仅 1 次（isCurrent 条目）
  - PDF（真实 /api/export/pdf → export-service）：pdftotext 悬空模式 `2020-01 - ` 0 命中（旧逻辑必产出）；页面图目检「至今」仅 isCurrent 条目
- **编辑检查实证**：「3 条日期需要检查」+「核对 缺尾日期公司 · 缺结束日期」等三按钮；对照条目不计入
- BUILD_ID 更新 `5J2vBM44pQNaRLOIGBW8i`（修复后 build 重启 3100 验证）

**PDF 中文说明**：pdftotext 提不出中文「至今」二字系 32-4（legacy PDF 中文文字层）已知问题、非本任务范畴；本任务以 ASCII 分隔符反向证明（旧逻辑必产出 `2020-01 - `，实测 0 命中）+ 视觉目检替代。

## 证据

`C:/Users/TimeCraker/Desktop/my_workspace/ResumeAIX-stage32/DATE/`：share-page.png（分享页全页）、editor-checklist.png（检查清单挂入）、editor-pdf-preview.png（PDF 页面图）、export.pdf（真实导出件）。

## 环境与清理

- 本地栈按 runbook 启动（PG/Redis/Web3100/AI/Export 五绿）；测试简历 `s32date0001testresume00001`（misc2 名下）验证后已删，DB 恢复 8 份原终态；仓内截图残留已清
- 红线遵守：未碰 generate-resume 路由 / plan.ts（工作区中该文件改动属并行 32-3 任务，未混入提交）；未动视觉/导出配置；未 push 未部署；未改面试线

## 剩余风险

- 存量数据中 `endDate='至今'`（文字）的条目：渲染为 `start - 至今`，表现与既往一致（resumeDateIssues 亦有同款兼容），无回归
- design 线渲染走 AI 生成设计稿，不经 `getDateRangeText`，本次修正只覆盖 legacy 12 模板三出口（与缺陷定位一致）
