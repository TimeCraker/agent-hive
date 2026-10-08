# 任务 TEST：测试适配 + 卸载 lucide + 视觉快照重生成 + 全量 verify（后置任务）

一句话任务：在 coding-plan-bench 前端 UI 重构（wave12 SHELL/FORM/RESULT/BOARD/GLOBE 五任务）已全部验收合入后，完成收尾工程化——visual.spec.ts 收敛单 light 主题、全量视觉快照重生成、卸载 lucide-react 依赖、`npm run verify` 全绿。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4 + Playwright（默认系统 Edge）。
- UI 已重构为 **Swiss Industrial Print 单浅色主题**（设计契约在 `site/src/styles/globals.css`，参照 agent-hive `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css`）：双主题已移除（`site/src/lib/theme.ts` 恒 light、`theme-boot.js` 已删或中性化）、lucide 图标已从全部组件清退（但 `package.json` 仍声明依赖，等你卸载）。
- `tests/e2e/visual.spec.ts` 现状：`for (const scheme of ["light", "dark"])` 双循环截图（1440/375 × light/dark）+ 一个 reduce 稳定性测试；暗色已不存在，dark 分支必然失效。
- 其余 e2e（accessibility/benchmark-flow/copy-provenance/leaderboard/responsive）依赖语义锚点（role/可见文本/testid），UI 重构已保留锚点——若有个别失败多为快照/时序问题。
- 质量命令全部真实存在：`npm run typecheck / lint / test:unit / test:integration / test:security / test:e2e / test:a11y / test:responsive / test:visual / build / verify`（verify 串行全部 + check:bundle ≤100KB 门禁 + check:clean）。

## 步骤

1. **visual.spec.ts 收敛**：删除 dark 分支——只保留 light：1440 与 375 两截图（文件名保持 `workbench-1440-light.png` / `workbench-375-light.png` 或统一去后缀，reduce 稳定性测试保留）；`page.emulateMedia({ colorScheme: "light" })` 可保留（防系统偏好差异）。
2. **旧快照清理**：删除 `tests/e2e/` 下的旧 `-dark` 快照与全部过期快照文件（找到 playwright 快照实际存放目录，可能在 `tests/e2e/*.png` 或配置的 snapshotDir——先读 `playwright.config.ts` 确认）。
3. **快照重生成**：`npx playwright test tests/e2e/visual.spec.ts --update-snapshots`（需要先 `npm run build` + preview 或依赖 config 的 webServer——按 config 现有方式跑）。
4. **卸载 lucide-react**：`npm uninstall lucide-react`（更新 package.json + package-lock.json）。先 `grep -r "lucide-react" site/src` 确认零引用再卸载。
5. **全量 verify**：`npm run verify`。若有失败：
   - 测试文件自身问题（选择器过时/快照名不对）→ 直接修
   - 组件级小样式问题（≤5 行改动：漏删 rounded-*/残留 lucide 类/对比度微调）→ 直接修并在报告列明
   - 组件级结构性问题 → **不修**，报告 P0-P3 分级列出交主控裁决
6. 自检 + 写报告。

## 红线

- 只改：`tests/e2e/visual.spec.ts`（必要时其他测试文件的过时断言）、快照产物、`package.json`/`package-lock.json`（仅 lucide 卸载）、以及上述「≤5 行小样式修正」豁免
- 不做任何 git 操作——主控统一验收提交
- 不改业务逻辑、engine、server、组件结构（小样式豁免除外）
- 密钥红线：不读取/输出任何 env 密钥；测试均禁真实网络（setup/no-network.ts 已强制）
- Windows 11 + PowerShell；China 网络重试 ≤2（npm registry 失败换源重试一次可接受）

## 验收标准

1. `grep -r "lucide-react" site/ package.json` 零命中
2. `npm run verify` 退出码 0（typecheck→lint→全部测试→build→check:bundle/check:clean 串行全绿）
3. `tests/e2e/` 无孤儿 dark 快照文件
4. verify 输出摘要留证（报告粘贴关键行）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\TEST-report.md`

模板：`# TEST 结果报告` / `## 结论一句话` / `## verify 全量结果`（各阶段 pass/fail 表）/ `## 修改清单`（文件 × 理由）/ `## 未修问题分级（P0-P3）` / `## 自评`
