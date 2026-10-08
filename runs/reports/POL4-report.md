# POL4 结果报告

- 任务：能力榜精致化——排名戏剧化 + 榜头制式 + 行内层级（POL4）
- 仓库：`coding-plan-bench` · 基线 wave12 Swiss 契约
- 日期：2026-10-07

## 结论一句话

能力榜完成「公报化」精致化：EYE 名下 6 条批评（P0-2/3/4、P1-5、P2-6、P3-7）与 7 条打磨方向全部落地——36 行榜单从「名单」变成「右端递减的印刷柱状图墙」，分数升英雄尺度（32px / #1 行 40px 珊瑚），v4.1 旧口径获显式分节带，tsc / eslint / build 三验证全绿，红线（2 文件、零 git 操作、e2e 锚点）零违反。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `site/src/components/GlobalLeaderboard.tsx` | 整组件美术精致化重写（业务逻辑零改动：fetch / 榜切换 / 字段消费口径原样） |
| `site/public/leaderboards.json` | intelligence 榜 items 第 24–36 条（数组 index 23–35，共 13 条）每条仅新增 `"section": "legacy-v41"` 字段；既有字段值 / 名称 / 顺序零改动（node 脚本核验：36 条中 13 条标记、首标记 index=23、value 榜同名条目未受影响） |

## 制式细节说明

**排名戏剧化（方向 1 + P0-3）**：前三名 rank `text-lg` → `text-2xl tracking-tighter`；#1 珊瑚 + 数字底部 3px 珊瑚短规线（`w-5`，absolute 不占布局）；#2/#3 墨 600；其余 `text-ink-2` 维持原尺度。

**分数英雄尺度（方向 2 + P0-3）**：主分数 `text-xl/lg` → `text-2xl md:text-[32px]`，#1 行 `md:text-[40px] text-accent`（`item.rank === 1` 业务口径判定不变）；plans 榜维持 plan 13px + model mono 10px。分数列宽 `basis-[92px]` → `basis-[84px] md:basis-[112px]`（容纳 4 位 Elo @32px 与 `$7.63` @40px 不溢出）。

**单位上移列头（P0-3 / EYE 微观排版）**：新增四段列头行（`# / MODEL / 数据条腔 / 分数单位`，与行结构同构对齐）；单位一次进列头——IQ 榜 `SCORE /100`、AG 榜 `ELO`、VAL 榜 `USD /TASK`、PLN 榜 `PLAN`；行内删除 `/100`、`Elo` 逐行重复（36 行 × 10px 单位噪音清零），全部走 `.lbl-mono`。

**行内数据条 / 柱状图墙（P0-2）**：主列与分数列之间插入弹性条——轨道 `h-[8px] bg-panel-2 border border-line`，fill 宽度按 `score / 本区段最大分` 归一（区段以 section 切换重置，legacy 旧口径独立归一）；#1 行 fill `bg-accent`、其余 `bg-ink`、legacy 区 `bg-line-2`；移动端条置于 name 行下方 `h-[6px] mt-1.5`。宽度为唯一内联 style（数据非色值）。plans 榜 Cursor score 0 → 空轨道，语义正确。

**新旧口径分节（P0-4）**：渲染遇 `section === "legacy-v41"` 且前条无标记时插分节带 li——`bg-paper` + 上下 2px 墨线 + `.lbl-mono「V4.1 存置区 · 旧口径 · 不与上列混排」`；legacy 行降档：name `text-ink-2`、数据条 fill `bg-line-2`。「第 24 名比第 1 名高分」的量纲误读从结构上消除。

**榜头制式（方向 3 + P1-5）**：头部包 `bg-panel-2 border-b border-line px-4 md:px-5 py-3.5` 头带（与表单 / 结果卡同制式）；「更新于 <date>」升级为「更新于 + `REV · <date>` mono 描边章」（REV 加粗墨色、日期次墨、描边 line-2）——「更新于」文本保留可见、语义不变（e2e 锚点）；右侧「非本机实测 · 互补参考」`.lbl-mono` 不动。

**行内层级（方向 4）**：name 行改 `items-baseline`（name 13.5px 600 与 vendor mono 11px 基线对齐，印刷表格惯例）；徽章 padding 已统一 `px-1.5 py-px`；note 行 11px `text-ink-3` 与 sub 行间距 `mt-0.5`（2px）。

**tabs 精修（方向 5 + P3-7）**：gap-1 → gap-2；选中态 mono 短码（IQ/AG/VAL/PLN）转 `text-accent`、未选 `text-ink-3`；每 tab 加 mono 计数「· N」（`items.length`，IQ·36 / AG·14 / VAL·28 / PLN·10），印刷目录感；`role="tablist"` / `role="tab"` / `aria-label="榜单切换"` / 2px 墨底线压珊瑚选中线制式原样。

**移动端标签收纳（P2-6）**：`sm:` 以下 TypeTag / region / access 并入 sub 收纳行（与「T0 档」等 sub 同行 `mt-1`），name 行只留 name + vendor——实现用 `hidden sm:contents`（桌面标签直展参与 name 行 wrap，移动隐藏由收纳行渲染，零克隆）；name 行保留 `flex-wrap` 防 sm 窄区间截断。

**空 / 错 / 载态（方向 6）**：Skeleton 保持 6 行脉冲、新增数据条腔占位（`hidden sm:block flex-1 h-[8px]`）与放大分数块（h-8）；错误态升级 `.lbl-mono「FETCH FAILED」` + 居中中文「榜单数据加载失败」；加载态 tabs 区（含 tablist 结构）始终可见可交互。

**来源脚注（方向 7）**：`数据来源：…` 保持 mono 10px，前置 `SRC` 描边微章（`text-ink-3 border-line-2 px-1`，`self-start` 悬挂对齐）。

## 自检结果

| 检查项 | 结果 |
|---|---|
| `npx tsc --noEmit`（全仓） | **0 错误**（exit 0，含并行波次文件在内全绿，无「他人报错」需豁免） |
| `npx eslint site/src/components/GlobalLeaderboard.tsx` | **0 error / 0 warning**（exit 0） |
| `npx vite build`（附加验证） | 通过，66 modules，CSS 30.8KB；`sm:contents` / `md:text-[40px]` / `border-y-2` 等新类名均实编入 CSS（fixed-string 抽查 8/8 命中）；产物 `site/dist` 验后已删 |
| 文件内 `rounded-` | 0 |
| 文件内 `gradient`（不计注释） | 0 |
| 文件内 `backdrop-blur` | 0 |
| 文件内 `lucide` | 0 |
| 文件内联色值（hex / rgb） | 0（唯一 `style` 为数据条宽度百分比） |
| e2e 锚点「更新于」 | 在（渲染文本可见，语义不变） |
| e2e 锚点 `role="tablist"` / `role="tab"` / `aria-label="榜单切换"` | 各 1 处，原样 |
| `leaderboards.json` 既有字段 | 值 / 名称 / 顺序零改动（仅新增 section 字段 ×13） |
| 375px 横向滚动 | 静态结构论证无溢出：数据条移动端在 `min-w-0` 主列内 w-full、REV 章 nowrap 处于 flex-wrap 头带内可换行、tablist 溢出走容器内 `overflow-x-auto`、长文本 truncate 链完整、subtitle `min-w-0 max-w-full` 未回退；未起 dev server（红线），建议合并后跑一次 `test:responsive` 实测兜底 |
| 改动边界 | `git status` 名下仅 2 目标文件；并行波次文件（App / BenchForm / Leaderboard 等 11 个 M）与 globals.css 未触碰 |

## 遗留与建议

1. **agent / value 榜的存量区未获分节**：agent 榜 rank 4+（GDPval v2 旧口径）与 value 榜 rank 19+（v4.1 时代）同样存在口径混排，但任务红线只授权 intelligence 榜加标记。分节带渲染逻辑是通用的（任意榜遇 section 标记即触发）——后续只需给这两榜数据补 `"section"` 字段，零组件改动即可生效。**建议下波次补数据**。
2. **agent 榜数据条区辨度低**：Elo 1494–1846 按 `score/区段max` 归一后 fill 集中在 81%–100%（任务口径为绝对归一）。若美术总监希望柱状差异更戏剧化，可改区间归一（`(score-min)/(max-min)`），一行改动，属口径决策待拍板。
3. **tab 计数未含 watchlist**：agent 榜计数 14 为主榜 items 数，watchlist 4 条观察区未计（任务口径「items.length 现成」如此）。若要显观察区规模可后续在 AG tab 加 `+4` 记号。
4. **建议合并后回归**：`test:e2e` 与 `test:responsive` 涉及本组件锚点与 375px 断言，四波次合并后统一跑一次（本波次红线禁 dev server，未能实机复验折行）。
