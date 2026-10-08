# POL7 结果报告

## 结论一句话

TransportSelector 重做为三张并排小方框卡（md+ 三列 / 375 纵排），下载本地版按钮前置进「本地软件」卡，「执行位置」更名「连接方式」，BenchForm hint 全面减字；tsc 零错误、eslint 零 error、e2e 锚点全部保留。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `site/src/components/TransportSelector.tsx` | 整体重写：行式列表 → 三列方框卡；legend「执行位置（决定 Key 路径）」→「连接方式」；底部灰色脚注（LOCAL_APP_HINT + 下载链接）删除，下载钮前置进本地卡 |
| `site/src/components/BenchForm.tsx` | 三处减字：MODEL PRESET 副标、API Key hint、必填提示 |

未触碰：copy.ts、globals.css、lib/transports/*、e2e specs（均为并行波次管辖）。

## 结构说明

### 三卡布局

- 外层 `grid grid-cols-1 md:grid-cols-3 gap-2 p-2`（md+ 并排三列，375 单列纵排），fieldset + `transport-selector` testid 保留
- 每卡结构（可见文字恰好 3 行）：
  1. 顶部 3px 语义色条（直连=`bg-run` 蓝 / 中转=`bg-warn` 琥珀 / 本地=`bg-ok` 绿）
  2. label（`text-sm font-bold` = 14px/700）+ 中转卡附 `lbl-mono` 琥珀小徽「需确认」
  3. detail 一句话（`text-[12px] text-ink-2 leading-snug truncate`，超出截断）
  4. keyPath 砍短第三行（`text-[11px] text-ink-3 truncate`，全文进卡 title 悬停）
- 选中卡 `border-[1.5px] border-ink bg-panel-2` + 右上角 `st-dot bg-accent`（8px 珊瑚方点）；未选 `border-[1.5px] border-line-2` hover 变 `border-ink`（统一 1.5px 宽度避免选中时布局跳动）；不可用卡右上角 mono `N/A`
- radio `opacity-0 absolute inset-0` 占满卡面，可聚焦走全局珊瑚 focus 环；内容层 `pointer-events-none` 放行点击，仅下载钮 `pointer-events-auto` 自接事件

### 下载前置

- 「本地软件」卡在非 Tauri 环境第三行直接放 `下载本地版` 按钮（`LOCAL_APP_DOWNLOAD` 常量，mono 描边小方钮：`border-accent text-accent`，hover 实底珊瑚），href 沿用 releases 页、`target="_blank" rel="noreferrer"`
- Tauri 环境该卡可正常选中，隐藏下载钮、第三行恢复 keyPath 短显（条件 `!available.includes("tauri-local")`）
- 原 footer 的 LOCAL_APP_HINT 灰色脚注整体删除，`LOCAL_APP_HINT` import 一并移除

### hint 清单（BenchForm 减字）

| 位置 | 原文 | 现文 |
|---|---|---|
| MODEL PRESET 副标 | 快选 · 点击预填 URL 与模型，Key 不预填 | 点击预填，Key 不预填（10 字） |
| API Key hint | 仅本次测速；去向见上方执行位置 | 只用于这一次测速（8 字） |
| 必填提示 | Request URL / API Key / Model 为必填 | 填完整再开测（6 字） |
| 显示名 / Model / 取样 hint | 榜单展示，可留空 / 模型 ID / 多次取中位数 | 不变（均 ≤ 12 字） |
| Request URL hint | — | 直接渲染 copy.ts 的 URL_FIELD_HINT，本地不截改 |

快选芯片保持 provider + model 两段制、选中态不加第三行；取样 select 与协议分段控制零改动；01/02 编号区段保留；动效仅 `transition-colors duration-150`（color 属性）。

## 自检结果

| 项 | 结果 |
|---|---|
| `npx tsc --noEmit` | PASS——全仓 0 错误（含并行波次文件，无他人报错需备注） |
| `npx eslint` 两文件 | PASS——0 error / 0 warning |
| 红线 grep（rounded- / gradient / backdrop-blur / lucide） | 两文件均 0 命中 |
| e2e 锚点 | radio 名「浏览器直连」「中转代理」「本地软件」逐字来自 copy.ts label；button「开始测速」「显示 Key」、label「取样」「Request URL（完整请求地址）」「Model」「API Key」、fieldset + `transport-selector` testid 全保留 |
| e2e 特殊断言 | `copy-provenance.spec.ts:38` 要求 section 内含「不经过我们的任何服务器」——keyPath 以 CSS truncate 呈现，DOM textContent 完整，断言可过；body 含「本地」由本地卡 label + 下载钮双保险 |

## 遗留与建议

- `responsive.spec.ts:67` 测试标题字符串仍写「执行位置」（仅测试名，非 DOM 断言，不阻塞）；主控后续同步 e2e 时可顺带改标题措辞。
- 中转卡「需确认」徽标为组件内硬编码文案（copy.ts 禁改所致）；若 wave16 想收进 copy.ts 统一管理，加一条常量即可。
- 三卡在 375px 纵排时信息层级与桌面一致，未做移动端专门减行；如 owner 觉得纵排时 detail 截断可放宽为两行折行，改一行 className 即可。
