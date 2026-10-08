# 任务 POL3：结果呈现精致化——统计带大数字戏剧化 + 单位上标 + 状态语义强化

一句话任务：在 wave12 已完成的 Swiss 基础上对 `RunProgress.tsx` 与 `ResultCard.tsx` 做**美术精致化**——把结果英雄卡做成页面的「数据主角」：大数字戏剧化、单位排版制式化、样本明细表格化精修。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4。
- wave12 已落地：三段统计带（34/36px mono 数字 + 3px 状态色条 + `.lbl-mono` 标签）、分段进度条（10px 槽位 + 语义色）、consent 琥珀左轨面板、mono 样本明细表。契约 `site/src/styles/globals.css` 已冻结（token 同 POL1）。
- 参照系：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css`（重点 `.statsband`：38px mono + 3px 底条）。
- 并行波次：POL1/POL2/POL4/POL5 在改其他文件——**你绝对不碰**。

## 打磨方向（最小共识 + 你的发挥）

**铁则不变**（零圆角/单珊瑚/发丝线+墨线/硬阴影/无 blur 渐变图标/mono 只用于数据/动效只 transform+opacity）。

1. **统计带大数字戏剧化**：三指标数字从 34/36px 放大到 **44–52px**（`font-mono font-semibold tabular tracking-tighter`，行高 1）；单位上标化——`ms` / `tok/s` / `s` 缩为 40% 字号置于数字右上（`text-sm align-top text-ink-3`），像印刷数据的单位制式；3px 状态色条加宽到 4px
2. **指标标签双段式**：`.lbl-mono` 标签（TTFT/TPS/TOTAL）+ 中文小注（首 token 延迟/每秒输出/端到端）11px `text-ink-3`——两行层级
3. **状态行制式化**：状态词改「章」语言——mono 大写（COMPLETE/PARTIAL/FAILED/CANCELLED）+ `.st-dot` 方点 + 状态色描边小框（`border` 当前状态色 + `text-` 当前状态色），像印刷表格的校对章
4. **样本明细表精修**：表头 `.lbl-mono` + 双 hairline（表头上下各 1px）；行高统一 py-2；样本序号两位补零（`S01`–`S05` mono）；数值列右对齐 tabular；状态列窄徽章
5. **进度条精修**：槽位间 hairline 分隔保留；右侧计数 `n/N` 改 `SAMPLE 02/03` mono 制式 + `text-ink-2`；面板头 `.pulse-dot` 与状态标签基线对齐
6. **consent 面板**：琥珀左轨 3→4px；标题前加 `.lbl-mono`「CONSENT · 代理确认」eyebrow；按钮组等高（h-10）
7. **空值诚实制式**：TPS 无 usage 时 `—` 放大对齐数字基线（同字号 mono `text-ink-3`），不缩不藏

## EYE 批评吸收（美术总监批评全文：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\EYE-report.md`，可读）

以下条目必须落地：

1. **P1-3 面板描边统一**：ResultCard 外框 `border border-ink` → `border-[1.5px] border-ink`（与表单/能力榜同重；hard-shadow-lg 保留）
2. **P2-1 列内单位恒定**：主控已给 `site/src/lib/format.ts` 的 `fmtMs` 加单位策略参数（`fmtMs(x, "ms" | "s" | "auto")`，默认 auto 向后兼容）——TTFT 相关展示恒 `fmtMs(x,"ms")`、Total 恒 `fmtMs(x,"s")`，同列不再 ms/s 混排
3. **P3-3 统计带尺度**：三指标大数字至少 38px（对齐 agent-hive `.stat b`；上文 44-52px 为上限自由发挥，不低于 38）
4. **「/单位」上标制式**：`ms`/`tok/s`/`s` 以约 40% 字号 `align-top` 置数字右上（印刷数据单位制式）

## 红线

- **只改 2 文件**：`site/src/components/RunProgress.tsx`、`site/src/components/ResultCard.tsx`。不碰 globals.css 与其他任何文件
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑零改动（phase 状态机/consent 流/cancel/countUp/四态判定）；**e2e 锚点一字不改**：button「取消」、含「同意」按钮、`data-testid="proxy-consent"` 及其他既有 testid
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误（他人并行报错可忽略，报告注明）
2. `npx eslint site/src/components/RunProgress.tsx site/src/components/ResultCard.tsx` 零 error
3. 自检：两文件 `rounded-`=0、`gradient`=0、`backdrop-blur`=0、`lucide`=0、内联色值=0
4. e2e 锚点齐全（取消/同意/proxy-consent）
5. 四状态视觉可区分（状态色 + 文字双通道）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\POL3-report.md`

模板：`# POL3 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 制式细节说明`（大数字/单位上标/状态章/明细表结构）/ `## 自检结果` / `## 遗留与建议`
