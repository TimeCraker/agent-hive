# BOARD 结果报告

## 结论一句话

`Leaderboard.tsx` 与 `Methodology.tsx` 已完成 Swiss Industrial Print 视觉层重构：行式列表 + 3px 状态色轨 + 固定列基准宽 + tablist 语义与全部 e2e 锚点保留，tsc 全仓零错误、eslint 零 error、Swiss 自检（圆角/渐变/模糊/lucide/内联色）全 0。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `site/src/components/Leaderboard.tsx` | 全量视觉重构（352 → 414 行）：删 lucide（Trash2/Trophy/Zap/Activity/Timer/Info/Undo2/X）、删 pct 渐变进度条与全部圆角/内联色值，换行式列表结构；业务逻辑（排序/删除/恢复/清空/重置/分区过滤）零改动 |
| `site/src/components/Methodology.tsx` | 视觉重构（30 → 46 行）：删 BookOpen 图标，改发丝线次级区块 + mono 序号 + 术语 mono 强调；文案源（`content/copy.ts`）零改动 |

未触碰其他任何文件（工作区内其他改动均来自并行波次 SHELL/FORM/RESULT/GLOBE）。

## 视觉结构说明

### Leaderboard（主区块：`bg-panel` + `border-ink` + `hard-shadow`）

- **头部**：`.lbl-mono`「本机榜单 · LEADERBOARD」+ 发丝延伸线（`bg-line-2` h-px）+ 右侧 mono 描边小方钮（清空全部 / 确认对话）；计数行 mono 11px tabular「可比 N 条 · 示例 N 条 · 遗留 N 条 · N 个条件组」。
- **排序 tablist**：`role="tablist"` aria-label「排序指标」+ `role="tab"`（名称含 TTFT / 首 token / TPS，aria-selected）保留；视觉为 agent-hive `.tab` 式——tablist 容器 2px 墨底线（`border-b-2 border-ink`），选中 tab 珊瑚底线经 `-mb-[2px]` 与墨线对齐 + `text-ink`，未选 `text-ink-2` hover `text-ink`；tab 内容 = mono 短码（TTFT/TPS/Total）+ sans 全名（移动端只显短码）。容器 `overflow-x-auto` + `w-max min-w-full` 实现横向滚动且无页面横滚。
- **条目行**（参照 `.rowt`）：每行左侧 3px 状态色轨（完整=ok 绿 / 部分成功=warn 琥珀 / 失败=bad 红 / 已取消=mute 灰 / 遗留=mute 灰），hover `bg-panel-2`，行间发丝线 `divide`。
- **列结构（列对齐铁律：固定 flex-basis + min-width:0 + 省略，宽度与内容无关）**，列头与条目行共用同一份基准常量：

| 列 | 桌面基准宽（md+） | 说明 |
|---|---|---|
| 状态色轨 | 3px 固定 | 语义色，不参与伸缩 |
| 排名 | 44px → 56px | mono 600 大数字（`01` 两位补零），本组最优珊瑚 700 |
| 标签+模型（主列） | `flex: 1 1 320px` + `min-width:0` | label sans 600 13.5px 截断；model/host/profile 行 mono 11px `text-ink-3` 截断 |
| TTFT | 92px | 右对齐 `font-mono` `.tabular` |
| TPS | 76px | 右对齐同上 |
| TOTAL | 92px | 右对齐同上 |
| transport 来源 | 72px | 居中 mono 描边徽章（直连/代理/本地），遗留显「—」 |
| 操作 | 44px → 64px | 居中「删除」mono 描边小方钮（`data-testid="remove-entry"`） |

桌面端列表首行有隐藏列头（`hidden md:flex`，mono 9px 大写：`# / 条目 / TTFT / TPS / TOTAL / 来源`），与行共用基准常量保证对齐。

- **指标值强调**：当前排序指标列 `text-ink` 600，本组最优值 `text-ink` 700 + 排名珊瑚；非活跃列 `text-ink-2`；遗留行整体置灰一档（`text-ink-3`）。缺数据恒「—」不伪装。
- **移动端折行**：指标区包一层 `basis-full … md:contents`——移动端折为第二行横排（`pl-[47px]` 对齐主列起点 = 3px 轨 + 44px 排名），每个指标带内联 mono 小标（TTFT/TPS/TOTAL）；桌面经 `display:contents` 提升为固定宽三列，列基准不随内容伸缩。
- **空态**：发丝虚线框 + `.lbl-mono`「NO DATA」描边徽章 + 居中 `text-ink-3`「还没有可比较的记录——完成一次测速后会出现在这里」。
- **恢复 toast**：`role="status"` aria-live 保留，行内「恢复」珊瑚描边 mono 钮 + 「×」文字钮；损坏隔离 `role="alert"` 琥珀虚线框 + 「重置本地数据」红描边钮。
- **徽章体系全 mono**：本组最优（珊瑚实底）、示例（描边）、遗留·不可排名（虚线描边 mute）。

### Methodology（次级区块：`bg-panel` + `border-line-2` 发丝外框，无墨线粗框无硬阴影）

- 标题 `.lbl-mono`「方法学与口径」+ 发丝延伸线。
- 正文 `text-ink-2` 13px / 行高 1.7 / `max-w-[65ch]`；列表发丝线分隔行（`divide-y divide-line`）+ mono 两位序号（01–05，`text-ink-3` tabular）。
- 指标术语 TTFT / TPS / Total 经正则切分以 `font-mono` 600 墨色强调——只改渲染不改 `content/copy.ts` 文案源。

## 自检结果

| 检查 | 结果 |
|---|---|
| `npx tsc --noEmit` | ✅ 全仓零类型错误（含我的 2 文件；并行波次文件同样无报错，无需豁免说明） |
| `npx eslint site/src/components/Leaderboard.tsx site/src/components/Methodology.tsx` | ✅ exit 0，零 error 零 warning |
| `rounded-` 计数 | ✅ 两文件均 0 |
| `gradient` 计数 | ✅ 两文件均 0 |
| `backdrop-blur` 计数 | ✅ 两文件均 0 |
| `lucide-react` 计数 | ✅ 两文件均 0（import 已全删） |
| 内联色值（`style={{` / hex / rgb·rgba） | ✅ 两文件均 0 |
| e2e 锚点 | ✅ tablist「排序指标」/ tab（TTFT·首 token·TPS + aria-selected）/ `remove-entry` /「还没有可比较的记录」/「可比 N 条」/ `undo-toast`·`undo-button` / `clear-all`·`confirm-clear-yes`·`confirm-clear-no` / `reset-local` / `alertdialog`·`status` / `methodology`（含 TTFT·TPS·Total·中位数文案）全部在位 |
| 动效 | ✅ 入场 `anim-fade-up`/`anim-fade-in`（200–250ms）+ 交互 `transition-colors` 150–200ms，仅 transform/opacity/color |
| 改动边界 | ✅ `git status` 仅本任务 2 文件由本波次修改；`lib/storage.ts`、engine 类型、其他组件未碰 |

## 遗留与建议

1. **未跑真实浏览器/e2e 复验**（红线禁止起 dev server）：`md:contents` 折行方案、tab 底线对齐（`-mb-[2px]` 负边距叠墨线）与移动端 375px 折行均为静态推演，建议主控合流后跑一次 `tests/e2e/leaderboard.spec.ts` + `accessibility.spec.ts` + `responsive.spec.ts`（锚点已逐一静态核验在位，预期绿）。
2. **pct 相对值条已随渐变一并移除**：旧版行内有「占最优百分比」渐变底条，属装饰性渐变，Swiss 契约下无对应表达；相对差距信息可后续以 mono「×1.4」倍率列补回（需产品拍板）。
3. **「速度榜单」标题改为「本机榜单 · LEADERBOARD」**：无 e2e 锚点依赖；若主站其他文案引用旧标题需同步（检索未见引用）。
4. `hover:text-panel` 反白钮依赖 `--color-panel`（#fdfdfc）token，已存在于主控契约，无新增 token 需求。
