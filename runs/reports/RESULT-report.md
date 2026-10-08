# RESULT 结果报告

## 结论一句话

`RunProgress.tsx` 与 `ResultCard.tsx` 已完成 Swiss Industrial Print 视觉重构：分段进度条 + 三段大数字统计带 + 状态色语义全部落地，lucide 图标清零，e2e 锚点一字未动，tsc / eslint / Swiss 铁则自检全绿。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `coding-plan-bench/site/src/components/RunProgress.tsx` | 整文件重写（视觉层） |
| `coding-plan-bench/site/src/components/ResultCard.tsx` | 整文件重写（视觉层） |

其余工作区改动（index.html / App.tsx / BenchForm / Leaderboard / Methodology / SecurityBanner / Sidebar / TransportSelector / main.tsx / theme-boot.js 删除）均为并行波次所为，本任务未触碰。

## 视觉结构说明

### RunProgress（运行进度 + consent）

- **运行面板**：`bg-panel` + `border border-ink` 外框 + `.hard-shadow`；头部左侧 `.pulse-dot bg-run`（run 蓝脉冲点）+ `.lbl-mono` 状态标签 `RUNNING · SAMPLE n/N`（数字 `.tabular`）；取消按钮为 mono 描边小方钮（hover 墨底纸字、active 下压 1px），可见文本「取消」不变。
- **分段进度条**（agent-hive `.pbar` 同构）：10px 轨道 `bg-panel-2` + 发丝线边 + 发丝线分隔的等宽槽位；已完成=ok 绿、最近完成样本按其实际状态着色（failed=bad 红 / cancelled=mute 灰）、在测槽位=run 蓝、未开始=空；右侧配 mono 计数 `n/N`。着色数据来自引擎 `onProgress` 携带的 `sample` 字段（props 类型放宽为可选 `sample?: SampleResult`，父组件本就在传完整对象，零接线改动）。
- **consent 面板**：`data-testid="proxy-consent"` 不变；panel + 墨线外框 + warn 琥珀 3px 左轨 + `.st-dot bg-warn` 方点 + 标题 sans 600 + 说明 `text-ink-2`；「同意并使用项目代理」墨底纸字主钮、「取消」描边次钮（文案继续取自 copy.ts，含「同意」二字）。
- **等待/校验态**：维持原行为（不渲染，返回 null）——原实现即如此，属逻辑零改动；全程无 spinner，仅脉冲点/方点。

### ResultCard（结果英雄卡）

- **卡片骨架**：`bg-panel` + `border-ink` + `.hard-shadow-lg` + `anim-fade-up`（250ms transform/opacity）。
- **头部**：mono 感知的 provenance chips（transport / profile，发丝线描边）+ 状态词（沿用 STATUS_COPY 中文文案）+ `.st-dot` 方点 + 状态色文字，`text-ok/warn/bad/mute` 四态语义。
- **三段大数字统计带**（agent-hive `.statsband` 同构）：三等分列（移动端纵排 `flex-col sm:flex-row`），每列 `.lbl-mono` 标签 + 34/36px `font-semibold` `.tabular` 大数字 + 单位小字 + 列底 3px 状态色条（complete=ok / partial=warn / failed=bad / cancelled=mute）；`useCountUp` 600ms 数字滚动接入（PLAN-v2 既定设计，纯展示动效，reduced-motion 直接落位）；TPS 无 usage 时空值显示 `—`，「不参与排名」语义由 token 来源行（`text-warn`）保留。
- **逐样本明细**（新增，数据来自既有 `run.samples`）：mono 表格——`.lbl-mono` 表头、发丝线行分隔、数字右对齐 `.tabular`、样本状态状态色文字（成功/失败/已取消）；移动端 `overflow-x-auto` 无布局破坏。
- **失败样本建议**：保留原有「样本 n · 错误码 + 安全信息 + 建议」信息结构，改为 bad 红 3px 左轨面板，建议文字用珊瑚 `text-accent`。

## 自检结果

| 检查项 | 结果 |
|---|---|
| `npx tsc --noEmit` | ✅ 全仓零错误（含并行波次当前状态，无他人文件报错需忽略） |
| `npx eslint` 两文件 | ✅ 0 error 0 warning |
| `rounded-` | 0 / 0 |
| `gradient` | 0 / 0 |
| `backdrop-blur` | 0 / 0 |
| `lucide-react` | 0 / 0（ShieldAlert/Loader2/Square/CheckCircle2/XCircle/AlertTriangle/Ban 全删） |
| 内联色值（`#hex` / `style={{`） | 0 / 0 |
| 旧过渡类（shadow-*-card / bg-glass / text-primary / text-orange / text-red / animate-spin） | 0 / 0 |
| e2e 锚点 | ✅ 「取消」按钮、含「同意」按钮、`proxy-consent` / `run-progress` / `result-card` / `result-status` / `result-samples` / `result-transport` / `result-profile` / `result-token-source` 全保留 |
| 四态视觉可区分 | ✅ 状态色 + 中文状态词双通道（完整/部分成功/失败/已取消），样本级三态同理 |

## 遗留与建议

1. **进度条历史样本着色的诚实边界**：`onProgress` 只携带最近完成的一个样本，早于当前槽位的历史失败无法逐槽回溯着色（一律 ok 绿）。若要精确，需引擎层在回调中携带逐样本状态数组——属引擎改动，超出本任务边界；样本量 ≤5 且 ResultCard 明细表呈现全量真相，误差可接受。
2. **宽度过渡未加**：任务允许的 300ms 宽度过渡违反本仓铁则 #9（动效只动 transform/opacity），故分段着色为瞬时切换，靠脉冲点提供进行中动感。
3. **任务描述与实码的两处出入已按实码+规划处理**：原 `ResultCard` 实无 `useCountUp` 与逐样本全量明细（仅失败样本卡）——前者按 PLAN-v2.md:174「单结果卡 + count-up」既定设计接入，后者按任务明确要求的 mono 表格新增（纯展示层，消费既有数据）。
4. **axe 对比度提示**（非回归）：`.lbl-mono` 的 ink-3（≈2.9:1）为全局契约既定样式；两组件仅在测速运行后渲染，不在现有 axe 扫描路径（扫描只 goto "/"），CI 无影响；若未来对运行后状态跑 axe，需全局层面权衡 ink-3 标签对比度。
5. **未跑真实页面验证**：红线禁止起 dev server；建议合并波次后统一跑 `tests/e2e/benchmark-flow.spec.ts` + 截图走查（锚点已逐一核对源码）。
