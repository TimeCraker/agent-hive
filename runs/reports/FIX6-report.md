# FIX6 结果报告

- 任务：EYE2 P1-5（免责去重）/ P2-12（横幅紧凑）/ P2-13（横幅语境）/ P2-14（hero meta 精简）
- 改动文件：`site/src/App.tsx`、`site/src/components/SecurityBanner.tsx`（仅此 2 个，红线遵守）
- 时间：2026-10-07

## 结论一句话

四条处方全部落地：免责计数 bench 3→2、global（App 边界）3→2，安全横幅仅在测速台视图渲染且说明句上限两行，hero meta 行只剩页码记号；tsc / eslint 双文件零错，e2e 锚点全部保留。

## 改动清单

### `site/src/App.tsx`

1. **P1-5 bench**：删 `FOOTER_BENCH` import 与 footer `<p>` 段落渲染（`site/src` 内 FOOTER_BENCH 引用归零，grep 实证；copy.ts 内常量定义属禁碰文件，未动）。
2. **P1-5 footer 收尾位**：colophon 收敛为单行制式记号——左段制式不变，右段随 view 切换：bench `数据仅存浏览器本地 · MMXXVI` / global `行业参考 · 非本机实测 · MMXXVI`。
3. **P2-14 + P1-5 global meta**：`heroConfig` 删除整个 `meta` 字段（bench「TTFT · TPS · TOTAL — 同条件三指标对比」与副标题重复；global「IQ · AG · VAL · PLN — 行业参考 · 非本机实测」中免责句与 hero desc 重复、四榜缩写在能力榜 tabs 已有）；meta 行改右对齐单页码记号 `BENCH — 01` / `GLOBAL — 02`。
4. **P2-13**：`<SecurityBanner active={view === "bench"} />`。

### `site/src/components/SecurityBanner.tsx`

1. **P2-13**：新增 `active: boolean` prop，`if (!active || !open) return null`。组件实例保持挂载——用户关闭横幅后切视图再切回，关闭状态保留（不会复活打扰）；global 视图 active=false，**零 DOM 渲染**。
2. **P2-12**：说明句 `line-clamp-2` 硬性上限两行（移动端不再折 3-4 行）+ `title={SECURITY_BANNER}` 保全文桌面可达 + `leading-[1.6]→[1.5]` 排版收紧。
3. 「下载本地版」链接与「关闭安全说明」按钮原样保留，动作簇独立于句子行（移动端 wrap 为第二行），可达性不变。

## 免责计数前后对照

grep 实证（渲染态计数，代码注释不计）：

### bench 视图「本地/浏览器存储」语义：3 → 2 ✓

| 位置 | 前 | 后 |
|---|---|---|
| footer mono 行「数据仅存浏览器本地 · MMXXVI」 | ✓ | ✓（保留收尾位） |
| FOOTER_BENCH `<p>` 段落（copy.ts:105-106） | ✓ | ✗ 已删渲染 |
| 方法学 05 格「成绩只存在你自己的浏览器里」（copy.ts:115，承载事实） | ✓ | ✓（禁碰，保留） |

hero 副标题（APP_SUBTITLE）与 SECURITY_BANNER 文案均不含该语义，不计入。

### global 视图「非本机实测/行业参考」语义（App.tsx 边界）：3 → 2 ✓

| 位置 | 前 | 后 |
|---|---|---|
| hero desc「行业参考数据，不是本机实测」 | ✓ | ✓（保留首次告知位） |
| hero meta「— 行业参考 · 非本机实测」 | ✓ | ✗ 已删 |
| footer `<p>`「能力榜为行业参考数据…非本机实测」 | ✓ | 并入 mono 行右段（1 处） |

`GlobalLeaderboard.tsx` 面板右标 + SRC 尾句（另 2 处）归 FIX9 边界，本轮未碰；global 视图最终 ≤2 的达标以 FIX9 落地为前提。

## 自检结果

1. **tsc**：`npx tsc --noEmit` 过滤 App.tsx / SecurityBanner.tsx 零输出（零类型错误；全仓 tsc 亦零错误输出）✓
2. **eslint**：`npx eslint site/src/App.tsx site/src/components/SecurityBanner.tsx` exit 0，零 error 零 warning ✓
3. **SecurityBanner global 零渲染**：实现方式为 prop 条件卸载（`active={view === "bench"}` + 组件内 `!active → return null`），view=global 时无任何 DOM 产出 ✓
4. **hero meta 无指标重复句**：`heroConfig` 无 meta 字段，meta 行 DOM 仅剩 `<span>{mark}</span>` ✓
5. **e2e 锚点静态核对**：button「测速台」「能力榜」、link「GitHub」在 Sidebar 未碰；button「关闭安全说明」保留且默认 bench 视图渲染（accessibility.spec.ts:38 在 `goto("/")` 默认视图断言，不受条件渲染影响）；FOOTER_BENCH 渲染删除——tests 目录 grep 零断言（复核与主控结论一致）✓
6. **动效铁则**：未新增/修改任何动画类，原 `anim-fade-in` / `anim-fade-up` 原样 ✓
7. **红线遵守**：仅改 2 文件；无 git 操作、无 dev server、无 npm install；globals.css / copy.ts / 其他组件未碰 ✓

## 遗留

- `copy.ts` 的 `FOOTER_BENCH` 常量成死文案（零引用），copy.ts 属禁碰文件未删；建议文案仓后续机会性清理。
- SecurityBanner 视图切回 bench 时 `anim-fade-in` 会重播一次短淡入（opacity 型、合规）；若观感闪可后续改条件 class 方案。
- global 视图全页免责总数待 FIX9（GlobalLeaderboard 右标/SRC 尾句）落地后方为最终定论。
- 未跑 Playwright e2e（红线禁 dev server）；渲染态计数基于源码静态分析 + grep 实证。
