# CPB: 模型测速台多端架构质量体检

## 任务目标
对 `coding-plan-bench`（模型测速台，线上 coding-plan-bench.pages.dev，三端架构：Cloudflare Pages + Workers + Tauri）执行全套质量门回归与干净度审计。

## 执行步骤
1. 进入工作目录 `coding-plan-bench`，执行 `git status` 确认工作树状态。
2. 运行类型检查：执行 `npm run typecheck`（`tsc --noEmit`）。
3. 运行单元测试套件：执行 `npm run test:unit`（`vitest run`）。
4. 运行干净度审计：执行 `npm run check:clean`，确认无未追踪或多余产物残留。
5. 检查构建流程：执行 `npm run build`（验证 Vite 与前端打包正常）。
6. 将体检事实与自评结论整文件覆盖写入报告。

## 红线约束
- 只读体检与质量门验证，不擅自修改前端业务组件或代理规则；
- 严禁产生未追踪产物遗留；
- 若测试异常，忠实记录数字事实，不编造 PASS。

## 验收标准
- 单元测试通过数与耗时明确；
- 类型检查与前端打包通过；
- 生成完整的自包含体检报告。

## 报告要求
覆盖写入文件路径：
`waves/wave30/reports/CPB-report.md`
报告包含：
1. 项目概况与检查时间
2. 单测与集成测试执行结果
3. TypeScript 类型检查与 Vite 打包状态
4. 三端架构（Web / Worker / Tauri）资产一致性评估
5. 自评结论（是否达标）
