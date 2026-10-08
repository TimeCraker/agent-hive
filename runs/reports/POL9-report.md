# POL9 结果报告

## 结论一句话

`GlobalLeaderboard.tsx` 单文件完成能力榜信息减法：榜名白话化（智能/实战/性价比/订阅）、tabs 改方框 segmented（墨底反白选中格）、行内 note 全量下线转 hover title、徽章与 sub 合并唯一次行——每行可见文字 ≤ 2 行；tsc / eslint / 自检全绿。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `site/src/components/GlobalLeaderboard.tsx` | 仅此一文件，4 处编辑（TABS 定义 / Row 行内布局 / renderMain intelligence 补 note / tabs 区块） |
| `agent-hive/runs/reports/POL9-report.md` | 本报告 |

未触碰：copy.ts、leaderboards.json、globals.css、并行波次文件（POL6/7/8、EYE2）。

## 结构说明

1. **榜名白话化**：TABS 收敛为 `{id, code, label}` 三字段——「智能 / 实战 / 性价比 / 订阅」均 ≤ 4 字，删除 `short` 字段，桌面移动共用一套名称（原 `hidden sm:inline` / `sm:hidden` 双套渲染删除）。
2. **方框 segmented**：tablist 外框 `border-[1.5px] border-ink bg-panel`；格间发丝分隔 `border-l border-line` 只画在两枚未选中格之间（贴墨底选中格的边界由色块自身成立，避免墨块边缘出现浅色毛边）；选中格 `bg-ink text-paper`、mono 短码转 `text-accent`、计数转 `text-paper/70`；未选中格 hover `bg-panel-2`；计数（`· 23`）保留格内 mono；底部 2px 墨线与珊瑚底线删除（segmented 自带框）。`role="tablist"` / `role="tab"` / `aria-selected` 语义原样保留。
3. **行内减量**：
   - note 不再整行展示，全文进 `<li title={note}>`（桌面移动同规，选 hover title 方案而非 12 字截断——零可见文字，减量最彻底）；
   - TypeTag / region / access 徽章从 name 行整体下沉次行（桌面移动统一，同屏密度下降）；
   - sub（「T1 档」等）与徽章合并为唯一次行，tier 信息保留；
   - name 行只留 name + vendor。原 `hidden sm:contents` + 双端两套渲染收敛为单一布局，代码同步变简。
4. **头部精简**：「更新于 REV」版戳与「非本机实测 · 互补参考」原样保留；`board.subtitle` 加 `truncate` 一行截断 + `title` 全文。
5. **wave14 制式不动**：分节带、柱状图墙、榜首 40px 大分、列头、区段归一、fetch/榜切换逻辑零改动；renderMain 仅 intelligence 分支补 `note` 透传（纯 hover 信息，无视觉变化，与 agent/value 行为一致）。
6. 动效仅 `transition-colors`（150ms 级 color 属性），未新增动画。

## 自检结果

| 检查 | 结果 |
|---|---|
| `npx tsc --noEmit` | exit 0，全仓零类型错误（并行波次文件也无报错，无需豁免说明） |
| `npx eslint site/src/components/GlobalLeaderboard.tsx` | exit 0，零 error 零 warning |
| `rounded-` / `gradient` / `backdrop-blur` / `lucide` | 0 / 0 / 0 / 0 |
| e2e 锚点 | 「更新于」在 L240、`role="tablist"` 在 L259、`role="tab"` 在 L270，均在位 |
| 四榜数据正确性（确认方式） | 静态确认：TABS 四 id（intelligence/agent/value/plans）与 `data[tab]` 取数、renderMain 各分支、区段归一逻辑逐行未动（diff 仅展示层）；受红线约束未起 dev server，建议验收方跑一次 `tests/e2e/accessibility.spec.ts` 佐证 |
| 每行可见文字行数 | 信息列 2 行（name+vendor 主行 + 徽章/sub 次行）；value/plans 右侧分数列原有两行紧凑 mono 数据（wave14 制式，保留范围） |

## 遗留与建议

- **note 移动端不可达**：触屏无 hover，note 信息在移动端完全隐藏（owner 明确要求减量，此为代价）；若日后要找回，可考虑点按展开或截断 12 字方案，属新决策。
- **subtitle 截断**：四榜 subtitle 均较长，桌面端在 segmented 右侧截断显示——已带 title 全文，如 owner 觉得仍显挤可整体移到列头下方独占一行（需新指令）。
- 智能榜 hover 现在可看到 note 里的定价/单任务成本信息（原本完全不可见），属顺带增强，如不想要可回退该一行透传。
