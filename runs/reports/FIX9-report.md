# FIX9 结果报告

- 任务：SRC 折叠 + 存置区行降档 + tabs 渐隐（EYE2 P1-3 / P1-4 / P1-5 / P2-10 / P2-13）
- 对象：`coding-plan-bench/site/src/components/GlobalLeaderboard.tsx`（唯一改动文件，+137 / −52）
- 红线遵守：copy.ts / leaderboards.json / globals.css 零触碰；无 git 操作、无 dev server、无 npm install；业务逻辑（fetch / 榜切换 / 分节判定 / 区段归一）零改动

## 结论一句话

EYE2 五项全部落地单文件：500 字来源墙默认折叠成 1 行 summary（375 断点 17 行 → 1 行），存置区以「旧 NN 行号 + 24px 次级墨分数 + 扩写分节带」三重降档切断「61 分排在 58 分后面」的续排陷阱，免责语组件侧归零，tabs 溢出渐隐仅在真溢出且未滚到尽头时出现；tsc / eslint / vite build 三绿，关键 Tailwind 变体已在产物 CSS 中逐条核实。

## 改动清单

| # | 条目 | 位置（现行号） | 内容 |
|---|---|---|---|
| 1 | P1-3 SRC 折叠 | 389-420 | 来源块改原生 `<details>`（默认收起）。summary：`.lbl-mono`「数据来源与口径 · 6 源」+ 7px 珊瑚方点 + ＋/－ 记号（`group-open` 两 span 切换）；marker 以 `list-none` + `[&::-webkit-details-marker]:hidden` 去默认三角换方点 |
| 2 | P1-3 来源逐条 | 80-85, 402-412 | 新增 `sourceEntry()`：长串按 `·` 取首段、尾括注若只载日期/核验细节则剪去、日期独立成段；展开后 `flex flex-col gap-1` 每条一行「来源名 · 日期」，全文留 `title` 悬停 |
| 3 | P1-3 note 分段 | 415-417 | note 全文以 `text-ink-3` 10px 小字独立段呈现（发丝线与来源清单分隔），不再与来源 join 成墙；桌面宽度约 3 行 |
| 4 | P1-4 分节带扩写 | 71-74 | SECTION_LABELS：「旧版口径区（指数 v4.1 · 2026-08） · 不与上列混排」/「旧版口径区（GDPval v2 · 2026-08） · 不与上列混排」 |
| 5 | P1-4 行号制式 | 113-118, 336-341 | legacy 行号改「旧 01」–「旧 13」（11px mono `text-ink-3`，区内独立编号——map 内 while 回溯段首重排，不再续排主区 24-36） |
| 6 | P1-4 分数降档 | 220-223 | `renderMain(item, legacy)`：legacy 分数固定 `text-2xl`（24px，无 md 放大）+ `text-ink-2`，与灰数据条同重；`#1 珊瑚 40px` 戏剧化只在主区 |
| 7 | P1-5 免责删除 | 头带（原 251 行） | 「非本机实测 · 互补参考」lbl-mono 右标删除；hero/footer 两处归 FIX6 未动 |
| 8 | P2-13 tabs 渐隐 | 77, 168-186, 296-299 | `tabsRef` + `tabsFade` state + effect（依赖 `[data, tab]`，scroll/resize passive 监听）；`scrollWidth − clientWidth − scrollLeft > 1` 时挂 `mask-image: linear-gradient(to right, black 85%, transparent)`（含 Webkit 前缀），滚到尽头渐隐即退——「仅溢出时」成立 |
| 9 | P2-10 用词统一 | 全组件 | grep「存量区」= 0：组件本就无硬编码实例，SECTION_LABELS 维持「存置区」；副标题字符串来自 leaderboards.json（禁改，归主控） |
| 10 | 动效/锚点 | — | 新增动效为零（＋/－ 为 display 切换，无 transition）；「更新于」+ REV 章、`role="tablist"` / `role="tab"` / `aria-selected` 结构原样保留 |

## 折叠结构与存置区降档说明

**折叠前后行数对照**（mono 10px 实测字宽估算：CJK≈10px / ASCII≈6.05px，内宽 = 断点 − 面板左右 padding − 边框）：

| 断点 | 旧墙（join 单段 790 字符） | 新默认（summary 13 字符） |
|---|---|---|
| 375 | 17 行 | **1 行** |
| 768 | 8 行 | **1 行** |
| 1024 | 6 行 | **1 行** |
| 1440 | 5 行 | **1 行** |

展开后为结构化两层：6 条来源逐行（`sourceEntry` 实测输出——`Artificial Analysis 排行榜（SSR 全量） · 2026-10-06`、`GDPval-AA v2 Elo · 2026-08-04`、`各平台官方定价页 · 2026-10-05` 等，每行 ≤ 约 40 字符）+ note 全文小字段。免责语「行业参考数据，非本机实测。」系 note 首句（json 禁改），现只存在于折叠内，符合「折叠内允许」。

**存置区降档三重保险**：① 分节带标签扩写为「旧版口径区（指数 v4.1 · 2026-08） · 不与上列混排」，口径版本与期次显式；② 行号从续排 `24-36` 改为区内独立 `旧 01-旧 13`，11px 三级墨与主区 20-32px 大数字彻底断开视觉连续；③ 分数从 md 32px 墨黑降为恒 24px `text-ink-2`，与 `bg-line-2` 灰数据条同重——「灰条配黑分」的自相矛盾消除，61 不再压过榜首 58。数据侧 rank 字段（24-36）未动，纯渲染侧重编号。

## 自检结果

| 检查 | 命令 | 结果 |
|---|---|---|
| 类型 | `npx tsc --noEmit`（仓库根，tsconfig include 含 `site/src`） | exit 0，零错误 |
| Lint | `npx eslint site/src/components/GlobalLeaderboard.tsx` | exit 0，零输出 |
| 构建 | `npx vite build` | 成功（996ms） |
| 变体编译 | 产物 CSS grep | `.group-open\:hidden/inline`（＋/－ 切换）、`list-style:none`、`::-webkit-details-marker` 三条规则均在 |
| 免责 grep | `grep -c 非本机实测` 组件 | 0 ✓（折叠内 note 为 json 数据非组件文案） |
| 用词 grep | `grep -c 存量区` 组件 | 0 ✓ |
| e2e 锚点 | 「更新于」/ tablist / tab 结构 | 保留 ✓（三个 e2e spec 无全局榜内部锚点，`旧版记录`/`开始测速` 属本机榜） |
| 改动边界 | `git diff --stat` + `git status` | 仅本文件 +137/−52；其余 13 个 M 文件均为并行波次（会话起始即 M）；`dist/` 为 gitignore 构建产物未入树 |

过程注记：tsc 曾在 `site/` 子目录误跑（该层无 tsconfig），已回仓库根用 manifest 正规命令复验排除假绿。

## 遗留

1. **P2-10 json 侧**：副标题「尾部 v4.1 存量区」字样在 `leaderboards.json` 各榜 subtitle 字段，json 禁改——渲染侧已无任何硬编码，json 文案归主控后续处理。
2. **tabs 渐隐像素复验**：溢出检测为 JS 方案（纯 CSS 无法做到「仅溢出时」显示），375 下四 tab 大概率触发，但按红线未起 dev server 做像素级复验，建议下轮 EYE 截图确认渐隐观感与 1.5px 墨边框在 mask 下的表现。
3. **details 展开动效**：原生 open/close 无过渡，本次按最小实现未加展开动画（如需须 keyframes + grid-rows 技巧另立任务）；已加的交互零 transition，不违反动效铁则。
4. **「T0-T4 档」legend（P2-9）** 与 **P1-5 的 hero/footer 侧收敛（FIX6）** 不在本任务范围，未动。
