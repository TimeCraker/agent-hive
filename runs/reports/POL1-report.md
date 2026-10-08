# POL1 结果报告

## 结论一句话

壳层四件套（masthead / hero / 节奏 / colophon）全部按 EYE 具体值落地：版心顶规线 + 版号戳 + 52px display 级 hero + hairline 视图记号行 + 双行 colophon + nav 选中底线珊瑚化，tsc / eslint / 红线自检 / e2e 锚点全绿，零越界文件。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `site/src/App.tsx` | hero 升 display 级 + hairline 规线记号行；bench 主列 space-y-6→space-y-8；footer 改双行 colophon |
| `site/src/components/Sidebar.tsx` | masthead 加 2px 版心顶规线；副行加 EST. 2026；profile 徽章→EDITION · 2026-10 版号戳；nav 选中底线 `${n.dot}`→`bg-accent` |
| `site/src/components/SecurityBanner.tsx` | 左轨 3px→4px；加 `.lbl-mono` eyebrow「SECURITY · KEY 路径」；「下载本地版」从文字链接改 mono 描边小方钮，双钮统一 hover 墨反白 |
| `site/index.html` | **未改**（顶规线用 CSS border 实现，无需动） |

并行波次文件（BenchForm / Leaderboard / RunProgress / TransportSelector / format.ts / globals.css）均未触碰，git status 已核验。

## 制式细节说明（含前后对照）

### 1. masthead（Sidebar.tsx）

- **顶规线**：`<header>` 加 `border-t-2 border-ink`——2px 墨线横贯 1240 版心顶端，与 header 内容同容器对齐，即印刷版面顶线；pt 由 24/32px 收至 20/24px 让规线与字标成组。移动端规线随版心容器天然不丢。
- **版号戳**：`profile · cpb-standard@1` → `EDITION · 2026-10`（固定字符串，不做动态日期）。profile 记号没有丢——移入 footer colophon 第一行（`PROFILE CPB-STANDARD@1`），masthead 管版次、colophon 管口径，各司其职。GitHub 徽章原样保留。
- **副行**：`CPB · 可信测速台` → `CPB · 可信测速台 · EST. 2026`，tracking 0.14em→0.12em（EYE P3-1）。
- **nav 选中底线**：由 per-tab 色条（测速台为语义蓝 `bg-run`）统一改 `bg-accent`——消除「第二强调色」实锤；tab 前方点保留 per-tab 语义色（agent-hive 同构）。

### 2. hero（App.tsx）

- **h1**：`text-[22px] md:text-[26px]` → `text-[30px] md:text-[44px] lg:text-[52px] leading-[1.05] tracking-[-0.035em]`（EYE P0-1 原值）。375 起步 30px（≈text-3xl），bench 标题在 343px 可用宽内自然断行不溢出（CJK 任意断点 + leading 1.05 双行）；与 masthead 字标 22px 拉开 1.4–2.4× 级差，hero 重新成为首屏视觉锚。
- **副标题**：`text-sm max-w-2xl` → `text-[15px] md:text-base max-w-[60ch]`，mt-2.5→mt-3。
- **规线记号行**（新增，EYE P0-1 + P3-2 合并）：hero 段落底部 `border-t border-line` hairline，行内 flex 两端——左 `lbl-mono` 指标口径（bench：`TTFT · TPS · TOTAL — 同条件三指标对比`；global：`IQ · AG · VAL · PLN — 行业参考 · 非本机实测`，复用能力榜既有短码体系），右 `lbl-mono` 视图页码 `BENCH — 01` / `GLOBAL — 02` 随 view 切换（`key={view}` 动画同帧重放）。
- **节奏**：hero section `pt-7 pb-7` → `pt-8 pb-5`——hairline 与首面板收紧成「版面头部」整体；bench 主列 `space-y-6`→`space-y-8` 统一 8 倍数节奏；footer `mt-4`→`mt-10` 给收尾记号让出留白。

### 3. footer colophon（App.tsx）

- 单行 11.5px 说明 → 双行制式：
  - 第一行：左 `lbl-mono` `CPB · SWISS INDUSTRIAL PRINT · PROFILE CPB-STANDARD@1`，右 `数据仅存浏览器本地 · MMXXVI`（EYE P1-2 值 + 任务的罗马年记号合并，右串 `whitespace-nowrap`）；
  - 第二行：hairline 分隔后 `font-mono text-[10.5px]` 口径说明——bench 为 FOOTER_BENCH 原文一字未动，global 保留原「行业参考数据」句；
  - 顶边 `border-t border-line` hairline；flex-wrap + gap-y 保证 375 折行不丢字。
- 中文长句（FOOTER_BENCH）不加宽字距（0.16em uppercase 对 CJK 长句过松），制式记号行（第一行）全 `.lbl-mono` 化——mono 10.5px 底线统一，字距按中英文职责分层。

### 4. SecurityBanner

- 左轨 `border-l-[3px]` → `border-l-[4px]`；
- 正文上方加 eyebrow `<p class="lbl-mono">SECURITY · KEY 路径</p>`，正文 SECURITY_BANNER 原文不动；
- 「下载本地版」由 `text-accent hover:underline` 文字链接改为与关闭钮同制的 mono 描边小方钮（`border border-line-2 px-2.5 py-1 font-mono text-[11px] font-semibold`），双钮统一 `hover:border-ink hover:bg-ink hover:text-paper` 墨反白（EYE P3-6），同 padding 天然同高；移动端「下载本地版」仍 `hidden sm:inline-flex`，44px 触达基线由全局 CSS 兜底。

## 自检结果

| 项 | 结果 |
|---|---|
| `npx tsc --noEmit` | **零输出**——全项目零类型错误（含并行波次文件当前状态，无他人错误需忽略） |
| `npx eslint` 三文件 | **零输出**——零 error 零 warning |
| 禁用样式 grep（rounded- / gradient / backdrop-blur / lucide / `#hex` / `rgba(`） | 三文件 **0 匹配**（exit=1） |
| e2e 锚点 | 「测速台」×3、「能力榜」×2、link 含「GitHub」×2、button「关闭安全说明」（aria-label + 文本）、FOOTER_BENCH 原文引用——全部在位 |
| 改动边界 | `git status` 名下仅 App.tsx / Sidebar.tsx / SecurityBanner.tsx 三 M；globals.css 与其他组件的 M 均为并行波次所改，本任务未触碰 |
| 红线：git 操作 / npm install / dev server | 均未执行 |

## 遗留与建议

1. **视觉复验未做**（红线禁 dev server）：建议 wave 收口后统一截图复验两处断点行为——375 下 hero 30px 断行位置（bench 标题「·」处断行是否难看，若难看可加 `text-wrap: balance`，属 globals 之外的组件级 style，需另批）与 colophon 第一行折行后右串落位。
2. **`EDITION · 2026-10` 为硬编码**：按任务要求固定字符串；若日后 profile 升版，colophon 的 `CPB-STANDARD@1` 与版号戳需同步人工更新（两处已在报告中列出对应关系）。
3. **hero 记号行的 global 短码 `IQ · AG · VAL · PLN`** 引用了能力榜 tab 短码体系，若 POL4 改动 GlobalLeaderboard 短码命名，此行需联动（当前无冲突）。
4. **error 面板左轨仍 3px**（App.tsx `border-l-[3px] border-l-bad`）：语义轨宽度未纳入本波打磨清单，未动；若全站语义轨统一 4px，建议下一波与 TransportSelector 三轨一并处理。
