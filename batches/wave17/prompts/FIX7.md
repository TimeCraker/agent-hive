# 任务 FIX7：三卡去截断 + chips 厂商分组（EYE2 P0-1 / P1-6）

一句话任务：按 EYE2 密度体检报告（`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\EYE2-report.md`，可读）修 `TransportSelector.tsx`（P0：三卡文案全断点截断）与 `BenchForm.tsx`（P1：11 枚 chips 无分组参差）。

## 背景（已核实事实）

- **P0-1**：三连接卡的 detail/keyPath 行用 `truncate` 截断——768 断点 6 行全断、1024/1440 也有 5 处省略号；「Key 经谁中转/发给谁」恰是被截断的行，安全信息被藏（EYE2 有 clip 截图铁证）。
- **P1-6**：预填 chips 11 枚同权重平铺，行尾 8+3 / 5+5+1 参差，无分组无锚点。
- 文案源 `copy.ts`（主控契约，禁改）：detail ≤ 30 字、keyPath ≤ 30 字大白话。
- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`；Swiss 契约 `globals.css` 冻结；并行 FIX6/8/9 在改其他文件。

## 改造指令（EYE2 处方）

1. **P0-1 三卡去截断**（验收基准：**375/768/1024/1440 四断点三卡零省略号**）：
   - detail 与 keyPath 行去掉 `truncate`/`whitespace-nowrap`，允许自然换行（`leading-snug`），每行文字 ≤ 3 行显示
   - 三卡等高（grid items-stretch），卡内排版：语义色顶条 + label + detail（12px ink-2）+ keyPath（11px ink-3）；「需确认」徽标与下载钮照旧
   - `title` 属性保留全文（悬停冗余通道）
2. **P1-6 chips 按厂商分组**：
   - 读 `engine/models.ts` MODEL_MATRIX 找分组依据（name 首词=渠道名：智谱/火山方舟/百度/DeepSeek/Kimi 等；若有结构化渠道字段优先用）
   - 渲染：按渠道分组——组名 10px mono 上标（`text-ink-3 tracking-[0.14em]`）+ 组内 chips `gap-1.5`；组间 `gap-x-5 gap-y-2`
   - chip 本体保持两行制（provider ink-3 + model ink）；选中态珊瑚描边照旧
   - 若某渠道只有 1 枚 chip，同样处理（组名 + 单 chip）
3. 动效铁则照旧

## 红线

- **只改 2 文件**：`site/src/components/TransportSelector.tsx`、`site/src/components/BenchForm.tsx`。copy.ts/globals.css/engine 禁改（models.ts 只读）
- 不做 git 操作；不起 dev server；不跑 npm install
- e2e 锚点：radio「浏览器直连」「中转代理」「本地软件」、button「开始测速」「显示 Key」、label「取样」「Request URL（完整请求地址）」「Model」「API Key」、fieldset + `transport-selector` testid 保留
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误；eslint 两文件零 error
2. 两文件内 `truncate` 在卡文案行 = 0（chips 本体可保留 truncate——名称单行截断可接受）
3. chips 渲染含组名上标（报告描述分组结构与各组枚数）
4. e2e 锚点齐全

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FIX7-report.md`

模板：`# FIX7 结果报告` / `## 结论一句话` / `## 改动清单` / `## 三卡排版结构` / `## chips 分组结构` / `## 自检结果` / `## 遗留`
