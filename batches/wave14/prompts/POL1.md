# 任务 POL1：壳层精致化——masthead 制式 + hero 排版 + 区块节奏 + footer colophon

一句话任务：在 wave12 已完成的 Swiss Industrial Print 壳层基础上做**美术精致化**——owner 反馈「美术还不够满意」，你要把页面从「合格的 Swiss 转换」提升到「有印刷制式感的成熟设计」。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4。
- wave12 已落地：masthead（珊瑚方块 mark + 字标堆叠 + meta 徽章列）、sticky 导航（2px 墨底线 tabs + 方点）、1240px 单列 wrap、单浅色主题、图标清退。设计契约 `site/src/styles/globals.css`（token：`text-ink/ink-2/ink-3` `bg-paper/panel/panel-2` `border-line/line-2` `text-accent` `bg-accent` `text-ok/run/warn/bad/mute` `font-mono` `font-disp` + `.lbl-mono` `.st-dot` `.pulse-dot` `.hard-shadow` `.border-ink` `.tabular`）。
- 参照系：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css`（agent-hive 太木控制台——本风格的母本）。
- 并行波次：POL2/POL3/POL4/POL5 在改其他组件文件——**你绝对不碰**。

## 打磨方向（最小共识 + 你的发挥）

**铁则不变**：零圆角、单珊瑚强调、发丝线+墨线、硬阴影、无 blur/渐变/图标库、mono 只用于数据、状态色即语义、动效只 transform/opacity。**本轮加严**：每个视觉决定要问「印刷品会这样做吗？」——制式感来自规线、编号、字号极端对比、严格对齐，不来自装饰。

1. **masthead 制式升级**：
   - 顶部加一条 2px 墨色顶规线（页面最顶端，印刷版面顶线）
   - meta 徽章列改「版号戳」语言：`EDITION · 2026-10`（mono 描边章）+ GitHub 徽章；日期部分可用固定字符串（不做动态日期）
   - 字标副行改双段式：`CPB · 可信测速台` 保持，可加 mono 分隔点与字距微调（letter-spacing .12em）
2. **hero 排版戏剧化**（Swiss 的立身之本是极端字号对比）：
   - h1：`font-disp` 从 text-xl/2xl 放大到 **text-3xl md:text-4xl**，`tracking-tighter leading-none`；文案继续用 copy.ts 的 APP_TITLE（不改文案）
   - 描述行下加一条 hairline + mono 元数据行（如 `TTFT · TPS · TOTAL — 同条件三指标对比`，自拟但克制，中文为主）
   - global 视图 hero 同等升级（该文案在 App.tsx 内）
3. **区块节奏统一**：main 区 space-y 与面板间距统一到 8 的倍数节奏（如 space-y-8）；hero 与首面板间距收紧形成版面头部整体感
4. **footer colophon 化**（印刷版权页风格）：发丝线顶边 + 三段式 mono 11px：左「CODING PLAN BENCH」· 中「KEY 不出本机 · 数据在 localStorage」类核心承诺（沿用 FOOTER_BENCH 文案，不改文字）· 右「SWISS INDUSTRIAL PRINT · MMXXVI」
5. **SecurityBanner 精修**：左轨从 3px 到 4px、标题行 `.lbl-mono`「SECURITY · KEY 路径」eyebrow、按钮簇 mono 小方钮统一高度
6. **移动端**：masthead 折叠后规线与徽章不丢；hero 大字在 375 不溢出（text-3xl 起步）

## EYE 批评吸收（美术总监批评全文：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\EYE-report.md`，可读）

以下条目必须落地（与上文方向合并执行）：

1. **P0-1 Hero 升 display 级**（具体值）：h1 `text-[30px] md:text-[44px] lg:text-[52px] leading-[1.05] tracking-[-0.035em]`；副标题 `text-[15px] md:text-base max-w-[60ch]`；hero 段落底部加 hairline + 右对齐 mono 视图记号（`BENCH — 01` / `GLOBAL — 02`，随 view 切换）
2. **nav 选中底线改珊瑚**：当前选中 tab 底线是语义蓝 `bg-run`（EYE 实锤「第二强调色」）——改 `bg-accent`；tab 前蓝方点保留（per-tab 语义，agent-hive 同构）
3. **P1-2 colophon 双行制式**（具体值）：第一行 hairline 分隔后左 `CPB · SWISS INDUSTRIAL PRINT · PROFILE CPB-STANDARD@1` 右 `数据仅存浏览器本地`；第二行保留 FOOTER_BENCH 原文；全行 lbl-mono 化 10.5px
4. **P3-1 masthead 副行**：`CPB · 可信测速台 · EST. 2026`（mono，字距 .12em）
5. **P3-6 SecurityBanner 关闭钮 hover**：`hover:bg-ink hover:text-paper hover:border-ink`（对齐全站小钮墨反白语言）
6. CTA 珊瑚化由 POL2 负责，你不管；hero/版面须保证首屏有一个视觉锚（大标题即锚）

## 红线

- **只改 4 文件**：`site/src/App.tsx`、`site/src/components/Sidebar.tsx`、`site/src/components/SecurityBanner.tsx`、`site/index.html`（如需）。不碰 globals.css（契约已冻结）与其他组件
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑/数据流/props 零改动；**e2e 锚点一字不改**：button「测速台」「能力榜」、link 含「GitHub」、button「关闭安全说明」、FOOTER_BENCH 文案原文
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误（他人并行文件报错可忽略，报告注明）
2. `npx eslint site/src/App.tsx site/src/components/Sidebar.tsx site/src/components/SecurityBanner.tsx` 零 error
3. 自检：名下文件 `rounded-`=0、`gradient`=0、`backdrop-blur`=0、`lucide`=0、内联色值=0
4. e2e 锚点三项齐全 + FOOTER_BENCH 原文在位
5. 报告附：改动前后关键结构对照（masthead/hero/footer 三处）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\POL1-report.md`

模板：`# POL1 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 制式细节说明`（顶规线/版号戳/hero 字号/colophon 落地描述）/ `## 自检结果` / `## 遗留与建议`
