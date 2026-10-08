# 任务 POL4：能力榜精致化——排名戏剧化 + 榜头制式 + 行内层级

一句话任务：在 wave12 已完成的 Swiss 基础上对 `GlobalLeaderboard.tsx` 做**美术精致化**——让能力榜有「公报」气质：排名数字立得住、榜头有制式、行内信息层级清晰。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4。
- wave12 已落地（主控直改版本）：墨线面板 + hard-shadow、2px 墨底线 tabs（IQ/AG/VAL/PLN mono 短码 + 珊瑚选中底线）、行式列表（44px 排名列 + 240px 主列 + 92px 数值列）、mono 徽章体系（开源 ok 绿描边/国内珊瑚描边）。契约 `site/src/styles/globals.css` 已冻结（token：`text-ink/ink-2/ink-3` `bg-paper/panel/panel-2` `border-line/line-2` `text-accent` `bg-accent` `text-ok/run/warn/bad/mute` `font-mono` `font-disp` + `.lbl-mono` `.st-dot` `.hard-shadow` `.border-ink` `.tabular`）。
- 数据结构：`fetch(BASE_URL + leaderboards.json)` → 四榜（intelligence/agent/value/plans），字段 name/vendor/type/region/access/score/tier/cost/plan/model/note/rank；meta.updatedAt/sources/note。
- 参照系：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css`。
- 并行波次：POL1/POL2/POL3/POL5 在改其他文件——**你绝对不碰**。

## 打磨方向（最小共识 + 你的发挥）

**铁则不变**（零圆角/单珊瑚/发丝线+墨线/硬阴影/无 blur 渐变图标/mono 只用于数据/动效只 transform+opacity）。

1. **排名数字戏剧化**：前三名从 text-lg 放大到 **text-2xl**（`font-mono tabular tracking-tighter`）；#1 珊瑚 + 数字底部 3px 珊瑚短规线（20px 宽）；#2/#3 墨 600；其余 text-ink-2 不变
2. **分数列戏剧化**：主分数从 text-xl/lg 放大到 **text-2xl**（mono 700 tabular）；#1 分数珊瑚；单位后缀（`/100`、`Elo`）保持小字但右上对齐（`align-top`）；plans 榜的 plan 名保持 13px 但 model 行改 mono 10px `text-ink-3`
3. **榜头制式**：头部标题行加「版戳」——`更新于 <date>` 徽章升级为 `REV · <date>`（mono 描边章，`REV` 加粗）+ 右侧「非本机实测 · 互补参考」保持 `.lbl-mono`；标题 `font-disp` 保持
4. **行内层级精修**：主列名称 13.5px 600 + vendor mono 11px `text-ink-3` 的基线对齐；徽章（开源/国内/access）统一高度与 padding（`px-1.5 py-px` 统一）；note 行（agent/value 榜）11px `text-ink-3` 与 sub 行间距 2px
5. **tabs 精修**：tab 内 mono 短码（IQ/AG/VAL/PLN）改 `text-accent` 当选中时（未选 `text-ink-3`）；tab 间距 gap-1 → gap-2；底部 2px 墨线与选中珊瑚线重叠制式保持
6. **空/错/载态**：Skeleton 方块脉冲保持；错误态加 `.lbl-mono`「FETCH FAILED」+ 居中中文说明；加载态首行 tab 区保持可见
7. **来源脚注**：`数据来源：…` 保持 mono 10px，但前置 `SRC` 描边微章（`text-ink-3 border-line-2 px-1`）

## EYE 批评吸收（美术总监批评全文：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\EYE-report.md`，可读——你名下条目最多，P0-2/3/4 全在你这里）

以下条目必须落地（优先级最高）：

1. **P0-2 行内数据条（柱状图墙）**：主列与分数列之间插入弹性数据条——轨道 `h-[8px] bg-panel-2 border border-line`，fill 宽度按 `score / 本区段最大分` 归一；#1 行 fill `bg-accent`，其余 `bg-ink`；移动端条置于 name 行下方 `mt-1.5 h-[6px]`。36 行即形成右端递减的印刷柱状图墙，解决「1440 下每行 60% 空白 + 数据不英雄」
2. **P0-3 分数与 rank 升英雄尺度**：rank `text-lg` → `md:text-[22px]`；score `text-xl/lg` → `md:text-[32px]`、#1 行 `md:text-[40px] text-accent`；「/100」「Elo」单位移入列头/或保持单行右上（行内不再每行重复「/100」36 次——移列头 `SCORE /100`）
3. **P0-4 新旧口径分节**：intelligence 榜 rank 24–36 是 v4.1 存置区旧口径（分值量纲与 1–23 不可比）——**允许编辑 `site/public/leaderboards.json`，但仅限给 items 第 24–36 条每条加 `"section": "legacy-v41"` 字段（不动任何既有字段值）**；渲染遇 section 标记插入分节带：`lbl-mono「V4.1 存置区 · 旧口径 · 不与上列混排」+ 上下 2px 墨线`；legacy 行降档（name `text-ink-2`、数据条 fill `bg-line-2`）
4. **P1-5 榜头制式归一**：头部包 `bg-panel-2 border-b border-line px-4 md:px-5 py-3.5` 头带（与表单/结果卡同制式）
5. **P2-6 移动端标签收纳**：`sm:` 以下 TypeTag/MiniTag/access 并入 sub 行（与「T1 档」同行），name 行只留 name+vendor，行高回落 ~50px
6. **P3-7 tab 计数**：tabs 加 mono 计数（如 `IQ 综合智能 · 23`，`items.length` 现成），印刷目录感
7. rank 前三名 `text-2xl` 戏剧化与 #1 珊瑚短规线（上文方向）保留，与 P0-3 合并执行

## 红线

- **只改 2 文件**：`site/src/components/GlobalLeaderboard.tsx` + `site/public/leaderboards.json`（**仅允许新增 section 标记字段，禁改任何既有字段值/名称/顺序**）。不碰 globals.css 与其他任何文件
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑零改动（fetch/榜切换/字段消费口径）；**e2e 锚点一字不改**：文本「更新于」、`role="tablist"`/`role="tab"` 结构（若 wave12 版已有则保持 aria-label「榜单切换」）
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误（他人并行报错可忽略，报告注明）
2. `npx eslint site/src/components/GlobalLeaderboard.tsx` 零 error
3. 自检：文件 `rounded-`=0、`gradient`=0、`backdrop-blur`=0、`lucide`=0、内联色值=0
4. 「更新于」文本可见且语义不变
5. 375px 无横向滚动（subtitle span 已有 `min-w-0 max-w-full`，勿回退）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\POL4-report.md`

模板：`# POL4 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 制式细节说明` / `## 自检结果` / `## 遗留与建议`
