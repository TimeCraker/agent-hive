# 任务 TEST4：功能波终检 + 快照重生成 + verify（后置任务）

一句话任务：在 wave22 的 EYE3 与 FEAT 已全部验收后收尾——视觉快照按功能后 UI 重生成、`npm run verify` 除 check:clean（主控提交前结构性红）外全绿。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Playwright（系统 Edge）。
- wave22 改动面：Leaderboard 加「复制榜单」+「榜单/趋势」segmented 切换、新组件 TrendSpark（SVG 火花线）、新纯函数 `lib/boardShare.ts` + `tests/unit/boardShare.test.ts`、copy.ts 功能文案常量（主控落定）。
- 已知基建（勿重复修）：deploy-config TMP 重定向；快照「先删后生成」；lucide 已卸载。
- 既有 e2e 全保留（FEAT 红线保证）；若 leaderboard.spec 因新切换控件出现选择器歧义（如 getByRole('button') 多命中），修测试选择器使其精确化——语义不变。

## 步骤

1. `npx tsc --noEmit` + `npm run lint` 先行确认合流态。
2. 删 `tests/e2e/visual.spec.ts-snapshots/` 全部旧基线 → `npx playwright test tests/e2e/visual.spec.ts` 生成新基线（默认视图 = 榜单，含复制按钮与切换控件）。
3. `npm run verify` 全量。失败处理规则同前：测试侧直接修；组件小样式（≤5 行）直接修并报告；结构性问题报告 P0-P3 交主控。
4. 自检 + 写报告。

## 红线

- 只改：测试文件、快照产物、「≤5 行小样式修正」豁免。不碰 package.json / copy.ts / 组件结构
- 不做 git 操作；测试禁真实网络；不读密钥
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. 快照目录仅 3 张全新基线，无孤儿
2. verify 12/13 绿（唯 check:clean 结构性红，粘贴关键行留证）
3. e2e/a11y/responsive 全过（含 boardShare 新单测计入 test:unit）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\TEST4-report.md`

模板：`# TEST4 结果报告` / `## 结论一句话` / `## verify 全量结果表` / `## 修改清单` / `## 未修问题分级` / `## 自评`
