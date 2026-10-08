# 任务 RESULT：运行进度与结果卡 Swiss 化

一句话任务：把 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench` 的 `site/src/components/RunProgress.tsx` 与 `site/src/components/ResultCard.tsx` 视觉层重构为 agent-hive 同款 **Swiss Industrial Print**——分段进度条 + 三段大数字统计带 + 状态色语义，进度/取消/同意锚点保留。

## 背景（已核实事实，勿重新考古）

- 技术栈：Vite 7 + React 19 + TS 5.7 + Tailwind v4。
- `RunProgress`：测速运行中的进度面板——phase 状态机（validating/running/awaiting-consent）、样本进度（第 n/N 个）、consent 确认对话（`data-testid="proxy-consent"`，含「同意」按钮与拒绝）、取消按钮；图标用了 lucide（ShieldAlert/Loader2/Square）。
- `ResultCard`：单次结果英雄卡——status 四态（complete/partial/failed/cancelled）、三指标（TTFT/TPS/Total）、逐样本明细、`useCountUp` 数字滚动；图标用了 lucide（CheckCircle2/XCircle/AlertTriangle/Ban）。
- **主控已落地设计契约**（commit ee89140）：`site/src/styles/globals.css` 已重写为 Swiss 令牌系统。
- 并行波次：SHELL/FORM/BOARD/GLOBE 在改其他文件——**那些文件你绝对不碰**。hooks（`useBenchmarkRun`/`useCountUp`）与 engine 类型不动。

## 视觉契约（先读这两份参照再动手）

1. `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css` —— 视觉世界参照（重点看 `.statsband` 统计带、`.pbar` 分段进度条、`.rowt` 行式列表）
2. `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\docs\design.md` —— 设计决策记录
3. 本仓契约 `site/src/styles/globals.css` —— token：`text-ink/ink-2/ink-3` `bg-paper/panel/panel-2` `border-line/line-2` `text-accent` `bg-accent` `text-ok/run/warn/bad/mute` `font-mono` `font-disp` + `.lbl-mono` `.st-dot` `.pulse-dot` `.hard-shadow` `.border-ink` `.tabular`

### Swiss 铁则（逐条自检）

1. **零圆角**（清全部 `rounded-*`）；2. 单强调珊瑚；3. 发丝线 + 结构墨线；4. 硬阴影 offset；5. 无 blur/半透明；6. **lucide import 全删**（ShieldAlert/Loader2/Square/CheckCircle2/XCircle/AlertTriangle/Ban——用 `.pulse-dot` 脉冲点、`.st-dot` 方点、状态色文字替代）；7. mono 只用于数据/数字/时间；8. 状态色即语义；9. 动效 150–300ms `var(--ease)` 只动 transform/opacity；10. 禁内联色值。

## 步骤

1. 读参照文件 + 你的两个组件 + `site/src/lib/useCountUp.ts`（只读，了解数字滚动接口）。
2. **RunProgress 重构**：
   - 面板：`bg-panel` + `border-ink` 外框 + `.hard-shadow`；运行中头部左侧 `.pulse-dot`（run 蓝）+ mono 状态标签（如 `RUNNING · SAMPLE 2/3`，`.lbl-mono` 风格）
   - **分段进度条**：参照 agent-hive `.pbar`——10px 高轨道（`bg-panel-2` + 发丝线边）内分段填充：已完成样本=ok 绿、当前样本=run 蓝（可加 300ms 宽度过渡）、失败=bad 红；旁配 mono 数字 `n/N`（`.tabular`）
   - consent 对话（awaiting-consent）：`data-testid="proxy-consent"` 容器改 panel + warn 琥珀左轨 3px + 标题 sans 600 + 说明 `text-ink-2`；按钮组：「同意」墨底纸字主钮 / 拒绝描边次钮（可见文本含「同意」二字不变）
   - 取消按钮：mono 描边小方钮（hover 墨底纸字），可见文本「取消」不变
   - phase 等待/校验态：mono 标签 + 方点，不转圈（无 spinner 图标）
3. **ResultCard 重构**：
   - **三段大数字统计带**：参照 agent-hive `.statsband`——墨线外框 + 三等分列（TTFT / TPS / Total），每列：大数字 `font-mono` 34–38px 600 `.tabular` + 单位小字 + 标签行（`.lbl-mono`）+ 列底 3px 状态色条（complete=ok / partial=warn / failed=bad / cancelled=mute）
   - 状态行：卡片头部 mono 状态词（COMPLETE/PARTIAL/FAILED/CANCELLED 英文大写 mono 或中文「完整/部分/失败/已取消」均可，保持原有文案语言）+ 对应状态色 `.st-dot` 方点；TPS 无 usage 数据时的空值显示 `—`（不参与排名的语义保留）
   - 逐样本明细：mono 表格（发丝线行分隔、右对齐数字 `.tabular`、表头 `.lbl-mono`）；样本状态用状态色文字标记
   - `useCountUp` 数字滚动保留（动效符合 transform/opacity 原则的不动它，只改外观）
4. 移动端：统计带三列纵排或横向滚动、明细表无横滚（可用 `overflow-x-auto`）。
5. 自检 + 写报告。

## 红线

- **只改 2 个文件**：`site/src/components/RunProgress.tsx`、`site/src/components/ResultCard.tsx`。不碰其他任何文件
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑零改动：phase 状态机、consent 流（grant/decline 回调）、cancel 回调、四态判定、countUp——只动视觉层
- **e2e 锚点保留**：button 可见名「取消」、含「同意」的按钮、`data-testid="proxy-consent"` 容器——一字不改
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 中你的 2 文件零类型错误（他人文件并行报错可忽略，报告注明）
2. `npx eslint site/src/components/RunProgress.tsx site/src/components/ResultCard.tsx` 零 error
3. 自检：两文件 `rounded-` = 0、`gradient` = 0、`backdrop-blur` = 0、`lucide-react` = 0、内联色值 = 0
4. e2e 锚点齐全（取消/同意/proxy-consent testid）
5. 四状态（complete/partial/failed/cancelled）视觉可区分（状态色 + 文字双通道，不只靠颜色）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\RESULT-report.md`

模板：`# RESULT 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 视觉结构说明` / `## 自检结果` / `## 遗留与建议`
