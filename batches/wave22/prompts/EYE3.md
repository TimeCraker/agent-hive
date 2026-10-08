# 任务 EYE3：运行态视觉复验——mock 全链路截图走查（只读审计）

一句话任务：idle 态页面已两轮验收，但 **RunProgress（测速中）与 ResultCard（结果英雄卡）只有跑测速才出现**，从未被美术走查——你用 mock SSE 驱动完整流程，截图这些运行态界面并做美术批评。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Swiss Industrial Print 单浅色（契约 `site/src/styles/globals.css`；设计规范 `site/design-system/MASTER.md` v3——先读它，按它的反模式清单查）。
- 运行态组件：`RunProgress.tsx`（分段进度条 + RUNNING · SAMPLE n/N + consent 琥珀面板 + 取消）、`ResultCard.tsx`（≥38px 三段统计带 + 单位上标 + 状态章 + S01-S05 样本明细 mono 表 + 失败建议面板）。
- **mock 素材现成**：`tests/e2e/benchmark-flow.spec.ts` 里已有完整的 mock 方案（`tests/fixtures/sse/` 的 SSE 帧构造 + `page.route` 拦截 `/api/bench` 或直连 URL）——照抄它的 mock 手法，**不需要真实 key、不发真实网络**。
- 站点起法：`npm run dev` 起空闲端口（5173 被占则 5174/5175；**审完关掉**）。

## 步骤

1. 读 MASTER.md v3 + RunProgress/ResultCard 源码 + benchmark-flow.spec 的 mock 段。
2. 写临时 Playwright 脚本（落 `$env:TEMP\cpb-eye3\`，**不放仓库**）：mock 一次 3 样本成功测速（样本间隔几秒，制造「测速中」可截状态）+ 依 mock 数据断言到达以下状态并逐个截图：
   - 运行中（进度条 2/3 + LIVE 脉冲）
   - consent 面板（切中转代理触发）
   - 结果卡·完整（三段统计带 + 明细表）
   - 结果卡·部分成功或失败态（mock 一帧错误，验证状态章与建议面板）
   - 断点 375 / 768 / 1440（viewport 切换重跑或 resize 后重截）
3. 逐张按 MASTER.md 反模式清单 + Swiss 铁则走查（零圆角/单珊瑚/发丝线/硬阴影/mono 纪律/对比度/密度——运行态特有：进度条语义色、统计带单位上标对齐、明细表列头、consent 琥珀面板层级）。
4. 产出 P0-P2 分级清单（每条：定位 + 现状 + 具体改法）；无问题则明确「已达标」并给证据。
5. 关服务，写报告。

## 红线

- **零仓库改动**（起止 `git status --short` 对比留证；脚本/截图只落 `$env:TEMP\cpb-eye3\`）
- 无真实网络、无真实 key（全 mock）；不跑 npm install；不碰 5173 既有进程
- Windows 11 + PowerShell

## 验收标准

1. 运行态截图 ≥ 8 张（≥4 状态 × ≥2 断点）且逐一有评
2. MASTER.md 反模式清单逐条有判定
3. P0-P2 每条含定位+现状+改法
4. 起止 git status 一致留证

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\EYE3-report.md`

模板：`# EYE3 结果报告` / `## 结论一句话` / `## 截图清单` / `## 逐状态走查` / `## 分级清单（P0-P2）` / `## 自评`
