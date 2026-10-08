# 任务 TEST2：打磨波测试适配——快照重生成 + verify 全绿（后置任务）

一句话任务：在 wave14 五个打磨任务（POL1-POL5）已全部验收后，完成收尾——视觉快照按打磨后 UI 全量重生成、`npm run verify` 除 check:clean（主控提交前结构性红）外全绿。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4 + Playwright（系统 Edge）。
- wave12 已完成 Swiss 重构并提交（commit 88afb90），verify 13/13 曾全绿（含 check:clean）。
- wave14 打磨改了视觉层（字号/间距/制式记号），**语义锚点全部保留**——e2e（accessibility/benchmark-flow/copy-provenance/leaderboard/responsive）预期绿；视觉快照必然全变。
- 已知基建（wave12 TEST 任务落定，勿重复修）：`tests/config/deploy-config.test.ts` 的 TMP 重定向到 `.vite/esbuild-tmp`（Windows EPERM 绕道）；visual.spec.ts 已是 light-only；快照刷新须「先删后生成」（`--update-snapshots` 容差内不重写）；lucide 已卸载。
- 点阵纹理已加深（α 0.032→0.045，主控契约改动，随本波提交）。

## 步骤

1. `npx tsc --noEmit` + `npm run lint` 先行确认合流态干净。
2. 删除 `tests/e2e/visual.spec.ts-snapshots/` 全部旧基线 → `npx playwright test tests/e2e/visual.spec.ts` 生成新基线（config 的 webServer 方式照旧）。
3. `npm run verify` 全量跑。若有失败：
   - 测试文件自身问题（选择器/快照名/时序）→ 直接修
   - 组件级小样式问题（≤5 行：间距/字号微调溢出、对比度）→ 直接修并报告列明
   - 组件结构性问题 → 不修，报告 P0-P3 分级交主控
4. 确认 verify 结果：除 `check:clean`（工作树含未提交改动，结构性红）外 12 阶段全绿。
5. 自检 + 写报告。

## 红线

- 只改：测试文件、快照产物、上述「≤5 行小样式修正」豁免。不碰 package.json（无依赖变更）
- 不做 git 操作——主控统一验收提交
- 不读取/输出任何密钥；测试禁真实网络
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. 快照目录仅 3 张全新基线（1440/375 light + 1440 reduce），无孤儿
2. verify 12/13 绿（唯 check:clean 结构性红，报告粘贴关键行留证）
3. e2e/a11y/responsive 全过（锚点未破的实证）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\TEST2-report.md`

模板：`# TEST2 结果报告` / `## 结论一句话` / `## verify 全量结果表` / `## 修改清单` / `## 未修问题分级（P0-P3）` / `## 自评`
