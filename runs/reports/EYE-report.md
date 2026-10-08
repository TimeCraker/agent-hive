# EYE 结果报告

- 任务：coding-plan-bench wave12 Swiss Industrial Print 重构 · 美术总监主观批评（只读）
- 输入：`cpb-audit/` 8 张主截图 + 3 张细部图（texture-zoom / sticky-1440-bench / sticky-375-global），全部逐张实读；源码对照 `site/src/styles/globals.css`（271 行契约）与 9 个组件、`agent-hive/app/public/theme.css`（286 行参照系）
- 红线遵守：仓库零字节写入。`git status --short` 输出仅 `M site/src/styles/globals.css`，为**会话开始前已存在**的改动（对话起始快照已记录），非本任务产生；本任务未写未删任何仓库文件。

## 结论一句话

**骨架已经是好的 Swiss，但血肉还没长开：全站最大字号只有 26px、最大的珊瑚色块只有 8×8px、硬阴影透明度低到物理上不可见——这是一套「印刷规距」学得很足、但「印刷海报的胆量」完全没有落地的版面；最大短板是「数据不英雄」：一个以数字为内容英雄的测速产品，把它的数字全部排成了 11–20px 的小字，能力榜 1440px 宽度下每行 60% 的中腔是纯空白。**

一句话药方：把字号对比拉到 10 倍（H1 44px、榜分 32px+）、把珊瑚从「小点」升级为「色块」（CTA 实底 + 榜单数据条）、把阴影从「看不见」改为「看得见或干脆没有」、把 36 行榜单从「名单」变成「柱状图墙」。

## 逐图观察

### bench-375（移动 · 测速台，750×6774）
- 首屏无悬念：H1 22px 两行 → 副文案 → 执行位置三条×双行文案，第一屏看不到任何超过 22px 的元素和任何珊瑚色块（只有 3px 轨与 8px 点）。
- 模型快选 chips 11 行换行占纵向 ~500px，是移动端最重的视觉块；chip 内中英混排（智谱 GLM-5.3）在 mono 栈下 CJK 发虚，整墙灰度均一、无主次。
- 「开始测速」以 40% 透明墨底呈现（disabled 首屏即灰泥块），旁边红色必填提示反而是页面第一屏最饱和的色。
- 亮点：方法学 01–05 挂号序号、示例行左 3px 绿轨、mono 数字右对齐 tabular，制式意识在线。

### bench-768（768 · 测速台，1536×4788）
- 表单进入双列（显示名/Model），但 Field 的 hint 右对齐到列远端，label 与 hint 之间拉开 300px+ 空档，形成「点线引导符被抽掉」的空洞。
- 协议分段控制选中态 bg-ink 实底反白——全页最重的墨块给了次级切换，而不是主 CTA，重量分配倒挂。
- NO DATA 空态盒（虚线 + mono 标签）制式正确但气力弱：border-line 太浅、居中一行字，浪费了一个可以做「印刷空态记号」的位置。
- 示例行数字 1.39s / 89.0 / 19.94s 与 892ms / 64.0 / 34.70s：同列单位混排（ms 与 s），右对齐下位数参差。

### bench-1024（1024 · 测速台，1024×2291）
- 版心全宽减 72px 边距，Request URL 输入框拉到 ~900px 宽——单行输入不需要这个长度，扫视线被拉长，表单显得空旷而非开阔。
- 方法学 65ch 列宽之外，右侧 ~350px 全空；面板本体 hairline 描边无阴影，与上方墨线面板形成正确的主次对比（这是全站少做对了的层级决策）。
- 执行位置三条 3px 语义轨（蓝/琥珀/绿）在此宽度下已开始难以分辨，琥珀 #A8761A 与 SecurityBanner 的珊瑚左轨色相几乎重合。

### bench-1440（桌面 · 测速台，1440×2275）
- 全页五块面板（执行位置/表单/榜单/方法学/页脚）等宽通铺、重量均等，没有一块获得版面特权——Swiss 的「非对称与主次」缺位，读感是「表单流水账」而非「版面设计」。
- H1 26px 与 masthead 字标 22px 几乎同大：页面标题与品牌字标打架，hero 名存实亡（源码自证：App.tsx:122 `text-[22px] md:text-[26px]`）。
- 面板右下「硬阴影」在 1:1 截图中不可感知（3px 3px 0 rgba(26,26,24,0.06) 在纸底上 ≈ 无）；面板边界完全依赖描边，材质层级只剩墨线粗细一维。

### global-375（移动 · 能力榜，1068×8128）
- 每行 name+vendor+type/region/access 标签折行成 3–4 行，行高膨胀到 ~65 CSS px；36 行下来「标签噪音」远大于「数据」。
- #1 行珊瑚 rank + 珊瑚分数是全榜唯一色彩时刻，方向正确但孤力难撑；02 行之后全是同灰度重复。
- 页脚数据来源长 URL 密排成灰块（横滚已修但视觉仍是噪团），与正文无排印区分（无悬挂缩进、无分条）。

### global-768（768 · 能力榜，1536×6204）
- **最严重的信息设计问题在本图暴露**：rank 01–23 分数 58→23（现行 AA 口径），rank 24 起分数跳回 61、60、59（v4.1 存置区旧口径），两种量纲在同一个连续编号列表里无缝相接，UI 无任何分节记号（源码自证：`leaderboards.json` intelligence.items 共 36 条平铺；GlobalLeaderboard.tsx 直接 `items.map` 单列表渲染）。读者会读出「第 24 名比第 1 名高 3 分」的谬误。
- 榜切换 tabs 的 IQ/AG/VAL/PLN mono 短码 + 珊瑚 2px 选中底线是全站最好的制式资产。
- 「/100」以 10px 重复 36 次，是典型的「每行都写单位」的表格坏习惯。

### global-1024（1024 · 能力榜，1024×3069）
- 行结构「rank | 名字+标签 | 分数」三段式在 1024 下中腔 ~300px，问题初显。
- 榜头「更新于 2026-10-06」mono 日期戳 + 右上 lbl-mono「非本机实测 · 互补参考」是正确的印刷记号，值得在测速台侧复制。

### global-1440（桌面 · 能力榜，1440×3021）
- **全项目最刺眼的单图**：36 行 × ~40px 的列表里，每行中部 ~60% 是纯空白（名字块实际内容 ~220px，分数列 92px，中间 ~700px 无一物）。一个数据榜在桌面端没有任何图形元素——无条、无点、无刻度尺。
- 分数 20px（`text-xl`）+ rank 18px：榜单的内容英雄以配角的字号登场。对照 agent-hive `.stat b` 38px、`.rc-code .code` 24px 的「数据即英雄」尺度，差距立见。
- 36 行同灰度重复到第 15 行之后即失去扫读锚点；top-3 之外无任何层级节奏（源码：仅 `i===0` 珊瑚、`i<3` 加重）。

### 细部补充
- **texture-zoom**：点阵纹理 α0.045 放大可辨、正常缩放下不可感——作为氛围可接受；但硬阴影同图证实不可见。fieldset legend 压线（执行位置标题骑在墨线上）是漂亮的标准印刷件制式。
- **sticky-1440-bench**：sticky nav 纸底不透明 + 2px 墨底线干净利落；选中 tab 底线是**语义蓝**（`h-0.5 bg-run`，Sidebar.tsx:266），与「珊瑚单强调」的契约叙事直接冲突——蓝点尚可辩解为 per-tab 语义（agent-hive 同构），蓝底线则是第二强调色实锤。
- **sticky-375-global**：移动端 rank 大号灰数字（~28px）与分数大号墨字（~26px）尺度感反而**优于桌面**——桌面端应该向移动端这个尺度看齐。

## 七维批评

### 1. 视觉层级与戏剧性 —— **不及格边缘，最优先修复**
- 现状：全站字号档 10.5 / 11 / 12 / 13 / 13.5 / 15 / 18 / 20 / 22 / 26 px，结果卡统计带 34/36px（跑完后才出现）。首屏最大字 26px，最大对比 26:10.5 ≈ 2.5×。
- 问题：Swiss 印刷的立身之本是极端字号对比（海报 100pt+ 对 8pt 注，10× 级差）；当前页面用 2.5× 的对比排出了一个「放大的名片」而不是「被设计的版面」。hero 自废武功（App.tsx:119 注释自述「紧凑价值说明取代营销大 Hero」——工具前置没错，但紧凑 ≠ 无戏剧性；瑞士版式恰恰是「用一条巨大标题完成全部营销」的流派）。数字是本产品的内容英雄，却全程 11–20px。
- 改法：H1 升 display 级 `md:text-[44px] lg:text-[52px]`、`tracking-[-0.035em]`、`leading-[1.05]`，副标题升 `text-[15px] md:text-base` 拉开级差；能力榜分数 `text-xl`→`md:text-[32px]`（#1 行 `md:text-[40px]`），rank `text-lg`→`md:text-[22px]`；结果卡统计带 34/36→38px 对齐 agent-hive。目标：首屏存在一个不滚动就能看到的最重元素（大标题或分数墙）。

### 2. 印刷制式细节 —— **已有底子，缺版面级记号**
- 现状（做对了的）：legend 压线、lbl-mono+发丝延伸线、profile@1 版本徽章、更新于日期戳、方法学 01–05 挂号、2px 墨线 nav、IQ/AG/VAL/PLN 短码。
- 缺失：① 主区块无编号——执行位置/测一个模型/本机榜单/方法学四大块没有 `01 / 02 / 03 / 04` mono 序号（编号系统只在方法学内部 5 条上，杀鸡用了牛刀的倒置）；② 无 colophon——页脚只有一行 11.5px 说明，印刷品的收尾记号（版本·构建·口径指纹·「数据仅存本地」声明）缺位；③ 测速台侧无日期戳（能力榜有「更新于」，本机榜单没有「最近测速于」）；④ masthead 与 hero 之间无规线衔接，hero 直接浮在纸上。
- 改法：SecHead/legend 加 `01 /`–`04 /` 前缀（lbl-mono 同款）；页脚改双行 colophon（左：`CPB · SWISS INDUSTRIAL PRINT · PROFILE CPB-STANDARD@1`，右：`数据仅存浏览器本地 · 最近测速 —`，10.5px lbl-mono，上方 hairline）；hero 底加 hairline + 右对齐 mono 视图记号（`BENCH — 01` / `GLOBAL — 02`）。

### 3. 留白与密度 —— **桌面过疏、移动过密，两端都没设计**
- 现状：4/8 节奏基本成立（间距值全部落在 Tailwind 4px 栅格）；但桌面 1240 版心内所有面板 100% 通铺，URL 输入框 ~900px、表单行高 60px+、方法学 65ch 外右半空腔；移动端首屏被 chips 墙 + 执行位置双行文案吃掉，能力榜行内标签折 3–4 行。
- 问题：留白只有在「有内容对比」时才高级——全页等宽通铺的留白不是留白，是「没排」。1440 的测速台 2275px 高度里信息密度与 375 屏几乎相同，桌面端没有获得任何额外的信息组织。
- 改法：表单区 md+ 双栏化（左：MODEL PRESET + REQUEST；右：API Key + 取样 + CTA 收口，形成 F 型扫视终点）；方法学 `md:grid-cols-2 gap-x-8`（65ch 移到列内）；执行位置 md+ 三条改并置三列（各带 3px 顶轨），移动维持堆叠；能力榜中腔用 P0-2 的数据条填充（留白问题随图形化自动消解）。

### 4. 色彩时刻 —— **珊瑚被降级成了「调料末」**
- 现状：珊瑚出现在 mark、nav 点/底线、banner 轨、panel 方标、选中点、#1 rank/分数、本组最优 chip、CTA hover、focus ring——共 10+ 处，但全部 ≤12px 的点、3px 轨、描边字。语义绿/蓝/琥珀只在 3px 轨、状态文字与结果卡 3px 底条上。
- 问题：① 首屏（idle 态）没有一个 ≥40px 的珊瑚色块——CTA 在最重要的位置上以 40% 灰泥态示人（`disabled:opacity-40`），珊瑚只在 hover 后出现，而截图证明大多数时刻用户看到的是废态；② 对照 agent-hive：太木印章是 44px 红底字块、统计带 3px 彩轨压 38px 数字——那边色彩是「版面器官」，这边只是「别针」；③ 琥珀 #A8761A 与珊瑚 #A8513C 同为暖褐调，3px 轨宽下肉眼不可分（bench-1024 中项目代理轨与 SecurityBanner 轨几乎同色）；④ sticky nav 选中底线用语义蓝，违反自家「珊瑚唯一强调」契约。
- 改法：CTA enabled `bg-accent`（hover `bg-accent-deep`），让首屏有一个明确珊瑚色块；能力榜数据条 #1 行 `bg-accent` 填充 = 第二个大珊瑚时刻；warn 轨加宽至 4px 并向黄移相（#B8860B 系）或改「琥珀描边+淡琥珀底」双通道；nav 选中底线统一 `bg-accent`，蓝点保留作 tab 语义即可。

### 5. 微观排版 —— **制度健全，执行走样**
- 现状：lbl-mono 10.5px/0.16em 大写规整；tabular-nums 全数据覆盖；rank `padStart(2,"0")`；标题 -0.03em。制度是对的。
- 问题：① `fmtMs` 同列混排单位（892ms vs 1.39s vs 34.70s，format.ts:392-395），右对齐下位数参差，tabular 承诺被单位打碎；② 「/100」每行重复 36 次是表格排版大忌（单位进列头，一次）；③ chips 单一 `text-ink-2` 把「智谱」与「GLM-5.3」排成同灰度，mono 栈 CJK 发虚后整 chip 糊成一团；④ 榜单列头 9px（Leaderboard.tsx:278 `text-[9px]`）低于印刷下限，与 10.5px lbl-mono 体系脱节。
- 改法：`fmtMs` 加单位策略参数（TTFT 列恒 ms、Total 列恒 s 两位小数），列内单位唯一；「/100」移入分数列头（`SCORE /100`），行内只留数字；chip 拆双 span（provider `text-ink-3` + model `text-ink`）；列头 9px→10px 并入 lbl-mono 体系。

### 6. 材质与质感 —— **阴影名存实亡，墨线层级还有一处分裂**
- 现状：点阵 26px/α0.045；墨线 1px（本机榜单、结果卡）/ 1.5px（执行位置、表单、能力榜）/ 2px（nav、tablist）三级；硬阴影 3px3px0 @α0.06、lg @α0.09。
- 问题：① α0.06 的硬阴影在纸底（#f3f2ed vs 墨 #1a1a18 混合后 ≈ #eae9e4）与纸底自身（#f3f2ed）之间 ΔE 小于人眼阈值——texture-zoom 与 1440 全页图双重证实不可见。「存在但不被看见」是材质层最差解：既有 DOM 成本又无视觉回报；② 面板描边分裂：本机榜单 `border`（1px）与执行位置/表单/能力榜 `border-[1.5px]`（Leaderboard.tsx:104 vs BenchForm.tsx:60）——同为主面板两种重量，1.5px 是「不存在的 CSS 默认值」，说明 1px 是漏改而非设计；③ 零圆角铁律唯一例外是 pulse-dot 圆点（7px 圆）——作为「活信号」的反差记号成立，但契约里没写，属无据可依的例外。
- 改法：阴影二选一——(a) 加重到可感知：`hard-shadow: 4px 4px 0 rgba(26,26,24,0.16)`、lg `0.22`（推荐，保留印刷_offset 隐喻）；(b) 全部移除走纯规线（更激进更统一）。主面板描边统一 1.5px；契约注释补一句「圆形 = live 信号专用形」。

### 7. 一致性 —— **五种面板头部、两种按钮语言、两端品质不齐**
- 现状：面板头部五种制式并存——BenchForm（方标+disp 标题+panel-2 头带+底线）、ResultCard（状态+panel-2 头带）、GlobalLeaderboard（方标+标题，无头带无边线）、TransportSelector（legend 压线）、Leaderboard/Methodology（lbl-mono+延伸线）。小钮两种 hover——`BTN_NEUTRAL` hover 墨底反白 vs SecurityBanner 关闭钮 hover 仅 bg-panel-2。桌面/移动品质：移动端 rank/分数尺度反而大于桌面（sticky-375-global vs global-1440），44px 触达、横滚已修，基础工程合格。
- 问题：同类面板不同头、同职按钮不同 hover，制式语言没收敛，「像被设计过」的感觉正是被这种不统一磨掉的。
- 改法：头部归两类——主面板（表单/两榜/结果卡）= 珊瑚方标 + disp 标题 + `bg-panel-2` 头带 + 底 hairline；次面板（方法学/本机榜单头部）= lbl-mono + 延伸线。GlobalLeaderboard 头部补 `bg-panel-2 border-b border-line`。全部 mono 小钮统一 hover 墨反白。

## 分级打磨清单（P0–P3）

> 定位格式：组件（文件）· 断点。所有建议值基于现有 token 体系（--color-* / lbl-mono / hard-shadow），不引入新依赖。

### P0 —— 显著提升观感的必改项

- **P0-1 Hero 升 display 级**
  定位：App.tsx:122 hero `<h1>` · 全端。
  现状：`text-[22px] md:text-[26px]`，与 masthead 字标（22px）同大，hero 无戏剧性。
  改法：`text-[30px] md:text-[44px] lg:text-[52px] leading-[1.05] tracking-[-0.035em]`；副标题 `text-sm`→`text-[15px] md:text-base max-w-[60ch]`；hero 段落底部加 hairline + 右对齐 mono 视图记号（`BENCH — 01` / `GLOBAL — 02`）。

- **P0-2 能力榜行内数据条（柱状图墙）**
  定位：GlobalLeaderboard.tsx:52-84 `Row` · 全端（重点 md+）。
  现状：1440 下每行中部 ~60% 纯空白，36 行零图形。
  改法：主列与分数列之间插入弹性数据条：`h-[8px] bg-panel-2 border border-line` 轨道，fill 宽度按 `score / boardMax` 归一；#1 行 fill `bg-accent`，其余 `bg-ink`；移动端条置于 name 行下方 `mt-1.5 h-[6px]`。36 行即形成右端递减的印刷柱状图墙，中腔空白与「数据不英雄」一并解决。

- **P0-3 分数与 rank 升英雄尺度**
  定位：GlobalLeaderboard.tsx:61（rank `text-lg`）、126（score `text-xl`）· 全端。
  现状：rank 18px / score 20px + 「/100」10px ×36 行。
  改法：rank `md:text-[22px]`；score `md:text-[32px]`、#1 行 `md:text-[40px] text-accent`；「/100」移入分数列头（列头行加 `SCORE /100` lbl-mono），行内删除。移动端维持现 sticky 图中已有的大尺度（26px+），两端取齐。

- **P0-4 能力榜新旧口径分节**
  定位：GlobalLeaderboard.tsx:232-237 渲染循环 + `leaderboards.json` intelligence.items · 全端。
  现状：现行 AA 口径（rank 1–23，分值 58→23）与 v4.1 存置区旧口径（rank 24–36，分值 61→43）平铺在同一个连续编号列表，量纲切换无任何视觉分节，产生「24 名比 1 名高分」的误读。
  改法：数据侧给 items 24–36 加 `section: "legacy-v41"` 标记；渲染时遇标记插入分节带：`lbl-mono「V4.1 存置区 · 旧口径 · 不与上列混排」+ 上下 2px 墨线 + 灰度降档（legacy 行 name `text-ink-2`、数据条 fill `bg-line-2`）`。

- **P0-5 CTA 珊瑚时刻 + 废态去泥**
  定位：BenchForm.tsx:203 提交按钮 · 全端。
  现状：enabled `bg-ink`（珊瑚只在 hover）；disabled `opacity-40` 呈灰泥块，是首屏默认所见。
  改法：enabled `bg-accent text-paper hover:bg-accent-deep active:translate-y-[1px]`；disabled 改描边废态 `bg-panel border border-line-2 text-ink-3 cursor-not-allowed`（去 opacity）。协议分段保持 `bg-ink` 实底不动——墨块让给次级、珊瑚给主 CTA，重量归位。

### P1 —— 制式细节升级

- **P1-1 主区块编号 01–04**
  定位：TransportSelector legend / BenchForm 头部 / Leaderboard 头部 / Methodology 头部。
  现状：四大主块无编号；编号系统只用在方法学内部 5 条上。
  改法：各块标题前加 mono 序号 `01 /`–`04 /`（lbl-mono 同尺寸 `text-ink-3`），能力榜侧以既有 IQ/AG/VAL/PLN 短码为对应编号体系。

- **P1-2 Colophon 页脚**
  定位：App.tsx:185-189 footer。
  现状：单行 11.5px ink-3 说明，无收尾记号。
  改法：双行 colophon——第一行 hairline 分隔后左 `CPB · SWISS INDUSTRIAL PRINT · PROFILE CPB-STANDARD@1` 右 `数据仅存浏览器本地`；第二行保留现说明文案；全行 lbl-mono 化 10.5px/0.14em。

- **P1-3 面板描边统一 1.5px**
  定位：Leaderboard.tsx:104 `border border-ink`、ResultCard.tsx:52 `border border-ink`。
  现状：与 TransportSelector/BenchForm/GlobalLeaderboard 的 `border-[1.5px]` 分裂。
  改法：两处改 `border-[1.5px] border-ink hard-shadow`（ResultCard 已有 hard-shadow-lg 保留）。

- **P1-4 硬阴影加重至可感知**
  定位：globals.css:51-54、238-243（--shadow-sm/md/lg、hard-shadow/hard-shadow-lg）。
  现状：α0.05/0.06/0.09，截图证实视觉不可见。
  改法：`sm 2px 2px 0 rgba(26,26,24,0.12)` / `md 3px 3px 0 rgba(26,26,24,0.16)` / `lg 4px 4px 0 rgba(26,26,24,0.22)`；同步 hard-shadow 系列。若嫌重则整体删除走纯规线——但不维持现状。

- **P1-5 面板头部制式归一**
  定位：GlobalLeaderboard.tsx:179-194 头部。
  现状：无头带无边线，与 BenchForm/ResultCard 的 panel-2 头带制式不一致。
  改法：包一层 `bg-panel-2 border-b border-line px-4 md:px-5 py-3.5`，其余内容不动；Leaderboard 头部维持 lbl-mono 式（次级定位）。

- **P1-6 Field hint 拉回 label 侧**
  定位：BenchForm.tsx:240-242 Field。
  现状：hint `justify-between` 推到列远端，与 label 间 300px+ 空档。
  改法：`flex items-baseline gap-2`（hint 紧随 label），hint 过长时（URL_FIELD_HINT）保持右对齐例外——加 `ml-auto` 仅用于该字段。

- **P1-7 方法学桌面双栏**
  定位：Methodology.tsx:162 `max-w-[65ch]` 单列。
  现状：桌面右半空腔。
  改法：`md:columns-2 md:gap-8` 或 `md:grid md:grid-cols-2 md:gap-x-8`，`divide-y` 改为列内行分隔；65ch 限制移至列内。

### P2 —— 节奏与微调

- **P2-1 单位列内统一**：`lib/format.ts` fmtMs 加策略参数；TTFT 列恒 ms（`1390ms`）、Total 列恒 s（`19.94s`），列内不再 ms/s 混排。定位：Leaderboard/ResultCard/示例数据。
- **P2-2 chips 双色**：BenchForm.tsx:122 chip 拆 `provider`（text-ink-3）+ `model`（text-ink）双 span，同 11px mono。需 MODEL_MATRIX 拆 name 字段或正则首段。
- **P2-3 琥珀/珊瑚可分性**：warn 轨 `w-[3px]`→`w-[4px]`，或 warn #A8761A 向黄移相至 #B08214；琥珀语义文字色不动。
- **P2-4 榜单列头 9px→10px**：Leaderboard.tsx:278 `text-[9px]`→`text-[10px]`，并入 lbl-mono 体系（0.14em→0.16em）。
- **P2-5 NO DATA 空态升格**：Leaderboard.tsx:219-222 虚线 `border-line`→`border-line-2`，NO DATA chip 改珊瑚描边 `border-accent text-accent`，下方补 mono 引导 `RUN #001 · 待产生`。
- **P2-6 移动端能力榜行标签收纳**：GlobalLeaderboard Row 在 `sm:` 以下把 TypeTag/MiniTag/access 并入 sub 行（与「T1 档」同行），name 行只留 name+vendor，行高回落 ~50px。
- **P2-7 点阵纹理微调**：globals.css:68-69 α0.045→0.04、26px→24px；配合 P1-4 阴影加重后纸/版对比更清晰。

### P3 —— 锦上添花

- **P3-1 masthead 日期戳**：Sidebar.tsx:226 副行改 `CPB · 可信测速台 · EST. 2026` 或加构建日期 mono 记号。
- **P3-2 视图页码记号**：hero 右下 `BENCH — 01` / `GLOBAL — 02` 随 view 切换（与 P0-1 hairline 同一工单）。
- **P3-3 结果卡统计带 38px**：ResultCard.tsx:211 `text-[34px] md:text-[36px]`→`text-[36px] md:text-[38px]`，对齐 agent-hive `.stat b`。
- **P3-4 选中 transport 强化**：TransportSelector.tsx:73 选中点 `w-2 h-2 bg-accent`→`w-2.5 h-2.5` + 行左 2px 墨边线，或试整行 `bg-ink text-paper` 反白实验。
- **P3-5 圆形记号入契**：globals.css 契约注释补「圆形 = live 信号专用形（pulse-dot 唯一）」，把现存唯一例外合法化。
- **P3-6 小钮 hover 统一**：SecurityBanner.tsx:124 关闭钮 hover 改 `hover:bg-ink hover:text-paper hover:border-ink`（对齐 BTN_NEUTRAL 语言）。
- **P3-7 榜 tab 计数**：GlobalLeaderboard tabs 加 mono 计数 `IQ 综合智能 · 23`（items.length 现成），强化印刷目录感。

## 自评

- **覆盖**：8 张主图逐一有评（另附 3 张细部图观察）；七个维度全部落达，每维含「现状→问题→具体改法」；清单 27 条（P0×5 / P1×7 / P2×7 / P3×8）全部含组件定位 + 断点 + 建议值。
- **证据强度**：所有「现状」均有截图或源码行号双重支撑（字号、透明度、描边宽度、数据结构均从源码实读核实，非目测臆断）；agent-hive 参照系的对比基于其 theme.css 实读（38px 统计数字、印章色块、0.032 纹理）。
- **局限**：① 截图为 reduced-motion 静态全页，动效（count-up 600ms、fade-up、pulse）未评价；② hover/焦点态未实机验证，P0-5 的珊瑚 CTA 与 P2-3 的移相建议未做对比度复算（#B08214 于纸底 ≈3.2:1，仅适用于 3px 轨等非文字用途，文字场景维持现值）；③ P1-7 双栏、P2-6 标签收纳涉及断点行为变化，落地时需在 768/375 复验折行。
- **一句话总评**：这套重构把「Swiss 的纪律」做完了八成，下一步是把「Swiss 的夸张」做进来——纪律让人尊敬，夸张让人记住。
