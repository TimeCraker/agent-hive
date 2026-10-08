# FIX7 结果报告

- 任务：EYE2 P0-1（三卡去截断）+ P1-6（chips 厂商分组）
- 改动文件：`site/src/components/TransportSelector.tsx`、`site/src/components/BenchForm.tsx`（仅此 2 文件）
- 完成时间：2026-10-07

## 结论一句话

三连接卡 detail/keyPath 全部去掉 truncate 自然换行（代码层面已不可能出现省略号，四断点推算均 ≤ 2 行），11 枚预填 chips 按 name 首词归为 5 个渠道组（智谱 4 / 火山方舟 2 / 百度千帆 3 / DeepSeek 1 / Kimi 1），每组带 10px mono 上标组名锚点；tsc / eslint 自文件零错误，e2e 锚点全数保留。

## 改动清单

### TransportSelector.tsx（P0-1，4 处编辑）

1. 头部注释更新：去掉「截断，全文在 title」旧约，改记 EYE2 P0-1 契约（Key 去向是安全事实，四断点零省略号）
2. 三卡 grid 加 `items-stretch`（显式等高契约；grid 默认 stretch，声明以明示）
3. label 行去 `truncate`（文案 ≤ 5 字永不折行，pr-5 让位右上角徽标保留）
4. detail 行（12px）与 keyPath 行（11px）各去 `truncate`，`leading-snug` 自然换行；keyPath 注释同步更新

### BenchForm.tsx（P1-6，3 处编辑）

1. import 增 `type ModelTarget`
2. 模块顶层新增分组逻辑：`VENDOR_ALIAS`（「百度」→「百度千帆」同端点归一）+ `PRESET_GROUPS`（IIFE 按 name 首词分组，Map 保插入序，常量级只算一次）
3. 快选区渲染重构：平铺 `MODEL_MATRIX.map` → `PRESET_GROUPS.map` 两层嵌套（组名上标 + 组内 chips）；chip 本体（key/title/onClick/双色/选中珊瑚描边/动效）逐字未动

## 三卡排版结构

```
grid grid-cols-1 md:grid-cols-3 items-stretch gap-2 p-2
└─ <label> 卡（radio 视觉隐藏占满整卡）
   ├─ 3px 语义色顶条（直连=run / 中转=warn / 本地=ok）
   └─ 内容列（pointer-events-none）
      ├─ label 行：sm bold ink +「需确认」徽标（仅中转卡）
      ├─ detail：12px ink-2，leading-snug 自然换行（≤ 2 行）
      └─ keyPath：11px ink-3，leading-snug 自然换行（≤ 2 行）
         └─ 例外：本地卡网页态此位改放「下载本地版」珊瑚描边钮（前置显眼，照旧）
```

- `title` 属性保留全文（悬停冗余通道，43 行未动）
- active 珊瑚点 / N/A 徽标 / disabled 灰态照旧
- 零省略号论证：文案行已无 truncate / line-clamp / overflow 截断类，CSS 层不可能产生省略号；文案 ≤ 31 字，最窄场景 768 三列卡（内容宽约 220px，12px 中文 ≈ 18 字/行）detail ≤ 2 行、keyPath ≤ 2 行，375 单卡全宽更宽松——均在「≤ 3 行」上限内

## chips 分组结构

分组依据：MODEL_MATRIX 无结构化渠道字段，按 name 首词归组；「百度」与「百度千帆」同 qianfan 端点，经 `VENDOR_ALIAS` 归一组。

| 组名 | 枚数 | chips |
|---|---|---|
| 智谱 | 4 | GLM-5.3 / GLM-5.3-Flash / GLM-5.3-FlashX / GLM-5.2 |
| 火山方舟 | 2 | GLM-5.3 / GLM-5.2 |
| 百度千帆 | 3 | GLM-5.3 / DeepSeek-V4.1-Flash / GLM-5.2 |
| DeepSeek | 1 | V4.1-Flash（官方） |
| Kimi | 1 | K3 |

- 版式：外层 `flex flex-wrap gap-x-5 gap-y-2`（组间）；每组 `flex flex-col gap-1.5` = 组名 + 组内 `flex flex-wrap gap-1.5`
- 组名上标：`font-mono text-[10px] tracking-[0.14em] text-ink-3`，`aria-hidden`（视觉锚点；渠道信息已内嵌 chip 双色首段，读屏逐 chip 读全名不重复）
- 单 chip 组（DeepSeek / Kimi）同样组名 + 单 chip，未做特殊合并
- chip 本体保持双色制（provider ink-3 + model ink / 选中珊瑚描边 bg-accent/10）、title 提示、hover 反白动效，逐字未动

## 自检结果

| 检查 | 结果 |
|---|---|
| `npx tsc --noEmit` | 两目标文件零错误（输出仅 App.tsx 3 错，属并行 FIX 波次中途态，见遗留） |
| `npx eslint` 两文件 | 零输出零 error，exit 0 |
| grep `truncate` | TransportSelector 0 处（原 3 处全去）；BenchForm 0 处（chips 本体原本即无） |
| 分组逻辑 node 等价验证 | 智谱 x4 / 火山方舟 x2 / 百度千帆 x3 / DeepSeek x1 / Kimi x1，total 11，与 MODEL_MATRIX 一致无丢项 |
| e2e 锚点 grep | fieldset + `transport-selector` testid ✓；radio 三名（copy.label 未动）✓；「开始测速」✓；「显示 Key」（aria-label + 文本）✓；「取样」（Field label + aria-label）✓；「Request URL（完整请求地址）」✓；`label="Model"` ✓；「API Key」✓ |
| 红线 | 只改 2 文件；copy.ts / globals.css / engine 零触碰（models.ts 仅 import 只读）；无 git 操作、无 dev server、无 npm install |

## 遗留

1. **四断点截图验收未做**：红线禁起 dev server，零省略号结论基于「截断类 class 全部移除」的代码事实 + 文案长度×断点宽度推算；建议下一轮 EYE 复查时以 375/768/1024/1440 实拍确认（预期全过，因 CSS 已无产生省略号的机制）。
2. **App.tsx 存在 3 个既有 tsc 错误**（`active` prop 缺失 / `meta` 属性 / `FOOTER_BENCH` 未导入），属并行 FIX6/8/9 波次的进行中状态，非本任务引入、未越界修——请对应波次自查收口。
3. 组名与 chip 内 provider 双色首段在视觉上重复呈现渠道名（如「智谱」组内 chip 仍显示「智谱 GLM-5.3」）——遵任务指令「chip 本体保持照旧」未动；若后续觉得冗余，可在下一轮把 chip 内 provider 段摘除，属一行级微调。
