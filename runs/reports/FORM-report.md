# FORM 结果报告

## 结论一句话

BenchForm 与 TransportSelector 已完成 Swiss Industrial Print 视觉重构：零圆角、零图标库、墨线面板 + 硬阴影 + 珊瑚单强调，全部表单语义与 e2e 锚点逐字保留，tsc / eslint 双零错误。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `site/src/components/BenchForm.tsx` | 整文件视觉层重写（逻辑零改动） |
| `site/src/components/TransportSelector.tsx` | 整文件视觉层重写（逻辑零改动） |

未触碰其他任何文件（工作区内 App.tsx / Sidebar.tsx / SecurityBanner.tsx / index.html / main.tsx 的改动来自并行的 SHELL 波次）。

## 视觉结构说明

**TransportSelector — 行式选择列表（agent-hive `.rowt` 同构）**
- 面板：`bg-panel` + `border-[1.5px] border-ink` 墨线外框 + `.hard-shadow`；legend `bg-panel px-2` 浮于顶边框（印刷制式 fieldset）
- 三行全宽选项，发丝线 `border-line` 分隔；每行左侧 **3px 语义色轨**：直连 `bg-run` 蓝 / 代理 `bg-warn` 琥珀 / 本地 `bg-ok` 绿（数据语义，非装饰）
- 行内容：名称 sans 600 13px + Key 路径描述 `text-ink-2` 12px；选中态 `bg-panel-2` + 右侧 **8px 珊瑚方标**（`.st-dot` 几何语言）；不可用项 `text-mute` 置灰 + 右侧 mono `N/A`
- radio `absolute inset-0 opacity-0` 占满整行——可聚焦且全局 `:focus-visible` 珊瑚环自然包裹整行；`disabled` / `onChange` 语义原样
- 下载提示（非 Tauri 环境）：`border-t border-line` 分隔的 mono 10.5px 脚注 + `↓` 字形（替代 Download 图标）+ 珊瑚下划线链接

**BenchForm — 墨线面板 + 分节表单**
- 面板：`bg-panel` + `border-[1.5px] border-ink` + `.hard-shadow`；头部 `bg-panel-2` 色带（8px 珊瑚方标 + 标题 + 协议分段控制），发丝线分节
- 区块标题 `.lbl-mono` 大写 mono + sans 中文副标 + 右侧 `h-px bg-line-2` 发丝延伸线（agent-hive `.sec>h2::after` 同构）：`MODEL PRESET · 快选` / `REQUEST · 请求定义`
- **协议分段控制**：两格并排 `border border-ink` 墨线外框、格间发丝线；选中格 `bg-ink text-paper` 墨底纸字；radio 隐藏占格、fieldset + sr-only legend「协议」保留
- **快选芯片**：mono 11px 描边 chip（`border-line-2`），选中态珊瑚描边 + 珊瑚字 + `bg-accent/10` 底纹（wavechip 语言）；未选中 hover 墨底纸字；原 `m.color` 内联色全部移除（单强调铁则）
- **输入框**：零圆角 `border-line` + focus `border-accent` + 全局珊瑚 focus 环；Request URL 与 Model 加 `font-mono`
- **API Key 显隐**：Eye/EyeOff 图标 → mono 文字钮「显示 Key」↔「隐藏 Key」（`bg-panel-2` 描边小钮，hover 墨底纸字），aria-label 原样
- **取样**：保留 `<select>`（见遗留说明），Swiss 化描边
- **主按钮**：`bg-ink text-paper` 墨底纸字 + `.hard-shadow`，hover `bg-accent` 珊瑚底，`active:translate-y-[1px]` 下沉；busy 态「测速中…」+ `disabled:opacity-40` 置灰
- **必填提示**：按钮旁 `text-bad` 12px + 左侧 2px 红轨（「Request URL / API Key / Model 为必填」），条件与按钮 disabled 同源，纯展示无新状态
- 移动端：字段网格 `grid-cols-1` 纵向堆叠、芯片 `flex-wrap`、头部 `flex-wrap`，无横滚

## 自检结果

**1. tsc** `npx tsc --noEmit` → exit 0，全项目零类型错误（含我的 2 文件；并行波次文件当时也无报错）

**2. eslint** `npx eslint site/src/components/BenchForm.tsx site/src/components/TransportSelector.tsx` → exit 0，零 error 零 warning

**3. 铁则 grep 自检**（两文件合计）：

| 模式 | 计数 |
|---|---|
| `rounded-` | 0 |
| `gradient` | 0 |
| `backdrop-blur` | 0 |
| `lucide-react` | 0 |
| `style={{`（内联 style） | 0 |
| 十六进制色值 | 0 |

（`text-[11px]` 等任意值命中均为字号/宽度，非色值；动效统一 `duration-150 ease-(--ease)`，仅 color/transform）

**4. e2e 锚点**（grep 核对 + tests/e2e/*.spec.ts 反查）：
- radio 可见名「OpenAI」「Anthropic」✓（`BenchForm.tsx` 分段控制 label 文本）
- 「浏览器直连」「项目代理」「本地 App」✓（`copy.label` 渲染，radio 隐式关联在 label 内，`getByRole("radio", { name: /项目代理/ })` 可命中）
- button「开始测速」「测速中…」✓、「显示 Key」/「隐藏 Key」（aria-label）✓
- fieldset 结构：协议组 fieldset + sr-only legend（accessibility.spec.ts:96-100 断言 fieldset 含 radio OpenAI）✓；transport-selector `data-testid` ✓
- `getByLabel` 锚点：「Request URL（完整请求地址）」「Model」「API Key」「取样」的 label 包裹结构原样

**5. 芯片预填逻辑确认**：归一化 diff（去缩进比对全部 onChange/onClick/setV/set/checked/disabled/value/name/type/aria 行）显示芯片 onClick（预填 label + `fullRequestUrl(endpoint, protocol)` + model + protocol，Key 不预填）与原版逐字一致；唯一语义等价差异是 `disabled={busy || !v.requestUrl || !v.apiKey || !v.model}` 提取为 `incomplete` 变量（同一表达式，供按钮与必填提示共用）；`fullRequestUrl` 导出、`FormValues`、`onRun` 签名、submit 守卫均未动。

## 遗留与建议

1. **取样未改分段控制（有意偏离任务步骤 3）**：`tests/e2e/leaderboard.spec.ts:64` 与 `benchmark-flow.spec.ts:135` 实际调用 `getByLabel("取样").selectOption("3")`——`selectOption` 只对真实 `<select>` 生效，改 radio 分段控制会直接打断 e2e。已改为 Swiss 化原生 select（零圆角 + 发丝描边 + focus 珊瑚）。若后续想统一为分段控制，需同步改这两个 spec 的取样交互行。
2. **校验错误提示为新增派生 UI**：原组件没有任何错误提示文案（靠 `required` + 按钮 disabled）。按任务「text-bad + 2px 红轨」规格补了纯展示性必填提示，条件复用 disabled 同源表达式，未引入新状态。如认为多余可一行删除。
3. **未做浏览器视觉复验**：红线禁起 dev server。建议 SHELL/RESULT 波次合并后跑一次 `tests/e2e` 全量 + 375px 视觉快照，确认快选芯片换行与分段控制在移动端的表现。
4. 快选芯片文字沿用 `m.name`（如「智谱 GLM-5.3」，本身即渠道名 + 模型名）；`m.color` 字段自本改动起在本组件不再消费（engine/models.ts 未动，runner 侧不受影响）。
