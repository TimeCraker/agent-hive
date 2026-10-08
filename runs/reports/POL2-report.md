# POL2 结果报告

## 结论一句话

表单与执行位置两面板完成印刷制式精致化：编号区段（01/02 珊瑚 mono 序号）、字段规线统一（h-10/px-3/8px 栅格）、快选芯片单行双色拆分、主 CTA 换珊瑚实底+描边废态（EYE P0-5 落地），全部验收项绿。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `coding-plan-bench/site/src/components/BenchForm.tsx` | 编号区段制式、字段规线、芯片双色、select 装饰线、CTA 升级（仅样式，业务逻辑零改动） |
| `coding-plan-bench/site/src/components/TransportSelector.tsx` | 行距 14/24 节奏、warn 轨 4px、选中态双元素（仅样式） |

未触碰：globals.css、engine/、content/copy.ts 及其他任何文件（并行波次文件全部避开）。

## 制式细节说明

### 1. 编号区段最终结构（SecHead）

```
[01 ·]  [MODEL PRESET]  [快选 · 点击预填 URL 与模型，Key 不预填]  ————————（发丝延伸线）
 珊瑚      lbl-mono         11px ink-3 副注                     flex-1 bg-line-2
```

- 编号：`font-mono text-[10.5px] font-bold tracking-[0.16em] text-accent`，内容 `{num} ·`，`aria-hidden`（装饰记号，语义留给标签）
- 标签/副注/延伸线结构不变（wave12 已有）；两处调用升级为 `num="01" tag="MODEL PRESET"` 与 `num="02" tag="REQUEST"`
- 编号色采用任务共识的珊瑚（EYE P1-1 原建议 ink-3，以任务「最小共识」的 text-accent font-bold 为准——区段锚点需要比标签更强的第一眼层级）

### 2. 快选芯片最终结构——单行双 span 双色制（EYE P2-2 覆盖了任务原文的两行制）

任务原文建议「两行制（渠道名上/模型名下）」，但 EYE P2-2 明确「同 11px mono 单行拆双 span」，任务声明 EYE 条目覆盖冲突建议，故落地为**单行双色**：

```tsx
<button class="group … font-mono text-[11px] border">
  <span class="text-ink-3 group-hover:text-paper/70">{provider} </span>   // 渠道名，三级墨
  <span class="text-ink group-hover:text-paper">{model}</span>            // 模型名，油墨黑
</button>
```

- 拆分规则：`name` 按首个空格切片（`智谱 GLM-5.3` → `智谱` + `GLM-5.3`；`Kimi K3` → `Kimi` + `K3`；无空格 fallback 整名按 model 色），不改 engine/models.ts
- 选中态：`border-[1.5px] border-accent bg-accent/10`，model span 转 `text-accent`（渠道名保持 ink-3）——珊瑚三通道（描边+底纹+字色）同向强调
- hover 墨底反白时双 span 经 `group-hover` 换纸色（否则 text-ink 显式色不继承 hover 反白，会变黑字压墨底）
- 未选中描边保持 1px，选中加粗 1.5px（0.5px 尺寸差为选中强调，接受）
- gap-1.5 铅字盘阵列保持（wave12 已有）

### 3. 字段规线（Field + inputCls）

- 输入统一：`h-10 px-3`（固定高度替代 py-2.5 的字号耦合），select 同规格
- label 行：`flex items-baseline gap-2 mb-2`——hint 紧随 label（EYE P1-6，消除 justify-between 的 300px+ 空洞）；仅 Request URL 传 `hintEnd`（`ml-auto text-right` 例外，因 URL_FIELD_HINT 为长句）
- 间距 8px 栅格：字段栅格 gap-4（16）、区块间 space-y-6（24）、label→输入 mb-2（8）、label 行内 gap-2（8）

### 4. 主 CTA（EYE P0-5 落地，本波最重要单条）

- enabled：`bg-accent border-accent text-paper hard-shadow hover:bg-accent-deep active:translate-y-[1px]`——首屏即见珊瑚色块；高度 h-11、字重 700
- disabled：`bg-panel border-line-2 text-ink-3`——描边废态，删除原 `opacity-40` 灰泥；hard-shadow 同步撤除（平贴）
- busy（测速中）沿用 disabled 视觉；enabled 且非 busy 时右侧带 mono `↵` 回车提示符（纯文本，aria-hidden）
- 协议分段控制保持 `bg-ink` 墨底不动——墨块给次级切换、珊瑚给主 CTA，重量归位

### 5. 取样 select 箭头区（纯 CSS 制式记号）

`appearance-none` 后右侧叠 `border-l border-line` 发丝分隔线 + `w-1.5 h-1.5 border-r-[1.5px] border-b-[1.5px] rotate-45` 双边框 V 形——无图标、无内联色值，`pointer-events-none` 不挡点击。

### 6. TransportSelector 精修

- 行 padding：内容区 `px-4 py-3` → `px-6 py-3.5`（横向 24 透气），右侧标记区与底部提示 pr/px 同步 24 对齐
- 色轨：宽度并入 RAIL 常量——代理 warn 轨 `w-[4px]`、直连/本地保持 3px（EYE P2-3 宽度区分琥珀可分性，不改色值）
- 选中态右侧双元素：`w-2 h-2 bg-accent` 方标 + `ml-0.5 w-3 h-px bg-line-2` 间隔细线（2px 间隔）；三行色轨蓝/琥珀/绿语义不变

## 自检结果

| 检查 | 结果 |
|---|---|
| `npx tsc --noEmit` | ✅ 零输出（全仓绿，含并行波次在树上的 App/Leaderboard/ResultCard/RunProgress/SecurityBanner/Sidebar 改动，无类型冲突） |
| `npx eslint BenchForm.tsx TransportSelector.tsx` | ✅ 零 error 零 warning |
| `rounded-` / `gradient` / `backdrop-blur` / `lucide` / 内联色值（hex·rgb·rgba） | ✅ 两文件全部 0 处 |
| e2e 锚点 | ✅ radio「Anthropic」「OpenAI」（:89）、button「开始测速」(:230)「显示 Key」(:189/191)、label「取样」(:195/201 aria-label+label)「Request URL（完整请求地址）」(:163)「Model」（Field label prop）「API Key」(:174/180)、协议 fieldset(:69) + transport fieldset(:25) 结构完整；「浏览器直连/项目代理/本地 App」文案在未动的 copy.ts |
| 红线 | ✅ 仅改 2 文件；零 git 操作；零 npm/dev server；业务逻辑（FormValues/onRun/校验/预填/selectOption）未动 |

## 遗留与建议

1. **选中芯片 1px→1.5px 描边有 0.5px 内容偏移**：亚像素级、实际不可感知；若后续追求绝对盒模型稳定，可未选中态也统一 1.5px 描边（视觉略重）。
2. **EYE P3-4 的「整行 bg-ink 反白实验」未采纳**：任务指定选中态为「8px 方块 + 2px 间隔细线」双元素；反白实验留给后续波次可选。
3. **TransportSelector legend `px-2` 未动**：legend 压线制式（EYE 誉为「漂亮的标准印刷件制式」）刻意保留原样。
4. **珊瑚出现频次上升**（编号 + CTA + 选中芯片三处同屏）：符合 EYE「珊瑚从调料末升为版面器官」方向，但若美术总监复核认为编号抢 CTA 的戏，编号降回 ink-3 是一行改动（SecHead 内单类名）。
5. dev server 未起（红线），样式效果依赖 wave 复核截图轮做视觉确认。
