# 任务 TEST3：减法波测试适配 + 快照重生成 + verify（后置任务）

一句话任务：在 wave17 四个打磨任务（POL6-POL9）与 EYE2 已全部验收后收尾——视觉快照按减法后 UI 全量重生成、`npm run verify` 除 check:clean（主控提交前结构性红）外全绿。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4 + Playwright（系统 Edge）。
- wave17 改动面：文案大白话重写（copy.ts，主控落定：`项目代理`→`中转代理`、`本地 App`→`本地软件`、`APP_TITLE`→「可信测速台」、全部长句砍短；e2e 断言 benchmark-flow/copy-provenance 主控已同步）、方框 segmented 切换控件（nav/排序/榜切换）、三方框连接卡、方法学方格、能力榜榜名白话。
- 已知基建（勿重复修）：deploy-config 的 TMP 重定向；快照「先删后生成」；lucide 已卸载。
- e2e 锚点现状：radio「中转代理」等新 label 断言已由主控更新；POL8 可能动了「可比 N 条」附近文案——若 leaderboard.spec 相关断言失败，判断是「锚点文字变了」还是真回归：锚点变了 → 更新测试断言（保持语义：计数存在），真回归 → 报告分级。

## 步骤

1. `npx tsc --noEmit` + `npm run lint` 先行确认合流态。
2. 删 `tests/e2e/visual.spec.ts-snapshots/` 全部旧基线 → `npx playwright test tests/e2e/visual.spec.ts` 生成新基线。
3. `npm run verify` 全量。失败处理规则同前：测试侧问题直接修；组件小样式（≤5 行）直接修并报告；结构性问题报告 P0-P3 交主控。
4. 自检 + 写报告。

## 红线

- 只改：测试文件、快照产物、「≤5 行小样式修正」豁免。不碰 package.json / copy.ts（文案契约冻结）
- 不做 git 操作；测试禁真实网络；不读密钥
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. 快照目录仅 3 张全新基线，无孤儿
2. verify 12/13 绿（唯 check:clean 结构性红，粘贴关键行留证）
3. e2e/a11y/responsive 全过

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\TEST3-report.md`

模板：`# TEST3 结果报告` / `## 结论一句话` / `## verify 全量结果表` / `## 修改清单` / `## 未修问题分级` / `## 自评`
