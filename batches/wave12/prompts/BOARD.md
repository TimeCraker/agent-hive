# 任务 BOARD：本机榜单与方法学 Swiss 化

一句话任务：把 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench` 的 `site/src/components/Leaderboard.tsx` 与 `site/src/components/Methodology.tsx` 视觉层重构为 agent-hive 同款 **Swiss Industrial Print**——行式列表 + 状态色轨 + tablist 语义保留 + mono 数字列。

## 背景（已核实事实，勿重新考古）

- 技术栈：Vite 7 + React 19 + TS 5.7 + Tailwind v4。
- `Leaderboard`（352 行，本站最重组件）：localStorage 榜单（schema v2）——排序 tablist「排序指标」（TTFT/TPS/Total，`role="tab"`）、条目行（label/model/指标/transport 来源）、`data-testid="remove-entry"` 删除、恢复（Undo）、清空、重置本地数据、遗留数据「遗留·不可排名」标记、空态文案「还没有可比较的记录」、可比计数「可比 N 条」；图标用了 lucide（Trash2/Trophy/Zap/Activity/Timer/Info/Undo2/X）。
- `Methodology`：方法学与口径说明区块（TTFT/TPS/Total 口径、profile 锁定条件）；图标 BookOpen。
- **主控已落地设计契约**（commit ee89140）：`site/src/styles/globals.css` 已重写为 Swiss 令牌系统。
- 并行波次：SHELL/FORM/RESULT/GLOBE 在改其他文件——**那些文件你绝对不碰**。`site/src/lib/storage.ts` 与 engine 类型不动。

## 视觉契约（先读这两份参照再动手）

1. `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css` —— 参照重点：`.rowt` 行式任务行（左 3px 状态轨 + 列固定宽 + hover panel-2）、`.tab` 导航 tab、`.sec>h2` 区块标题、`.arch` 归档折叠区
2. `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\docs\design.md` —— 设计决策记录（注意「列对齐铁律」：多行卡片的每一列用固定 flex-basis + `min-width:0` + 内容省略，宽度由基准决定、与内容无关）
3. 本仓契约 `site/src/styles/globals.css` —— token：`text-ink/ink-2/ink-3` `bg-paper/panel/panel-2` `border-line/line-2` `text-accent` `bg-accent` `text-ok/run/warn/bad/mute` `font-mono` `font-disp` + `.lbl-mono` `.st-dot` `.pulse-dot` `.hard-shadow` `.border-ink` `.tabular`

### Swiss 铁则（逐条自检）

1. **零圆角**；2. 单强调珊瑚；3. 发丝线 + 结构墨线；4. 硬阴影 offset；5. 无 blur/半透明；6. **lucide import 全删**（Trash2/Trophy/Zap/Activity/Timer/Info/Undo2/X/BookOpen——删除操作用 mono 文字钮「删除」、恢复用「恢复」、 trophy 排名用 mono 大数字、transport 来源用 mono 小徽章）；7. mono 只用于数据/数字/排名/时间/模型 ID；8. 状态色即语义；9. 动效 150–300ms；10. 禁内联色值。

## 步骤

1. 读参照文件 + 你的两个组件。
2. **Leaderboard 重构**：
   - 外框：`bg-panel` + `border-ink` + `.hard-shadow`；区块标题 `.lbl-mono`（如「本机榜单 · LEADERBOARD」）+ 发丝延伸线 + 右侧操作（清空/重置改 mono 描边小方钮）
   - **排序 tablist**：`role="tablist"` aria-label「排序指标」与 `role="tab"`（名称含 TTFT / TPS）保留，视觉改 agent-hive `.tab` 式——2px 墨底线、选中态底线对齐 + `text-ink`、未选 `text-ink-2`；tab 键盘导航（roving tabindex / 方向键）若现有实现已有则保留
   - **条目行式列表**（参照 `.rowt`）：每行左侧 3px 状态色轨（完整=ok / 部分成功=warn / 失败=bad / 已取消=mute / 遗留=mute）；列结构（每列固定 flex-basis + `min-width:0` + 省略号，**宽度不随内容伸缩**）：排名（mono 600）/ 标签+模型（主列，label sans 600 + model `font-mono` 11px `text-ink-3`）/ 三指标数字（右对齐 `font-mono` `.tabular`，最优值 `text-ink` 700、其余 `text-ink-2`）/ transport 来源徽章（mono 描边小徽章：直连/代理/本地）/ 操作列（删除钮 mono 描边，`data-testid="remove-entry"` 保留）
   - 空态：居中 `text-ink-3`「还没有可比较的记录」+ `.lbl-mono` 装饰性标签（如「NO DATA」）
   - 计数行：mono「可比 N 条」保留原文案
   - 恢复（Undo）交互保留：删除后行内或 toast 式「恢复」mono 钮
   - 遗留数据：行置灰 + mono「遗留·不可排名」描边徽章
3. **Methodology 重构**：`bg-panel` + 发丝线外框（次级区块，不用墨线粗框）；标题 `.lbl-mono`「方法学与口径」+ 延伸线；正文 `text-ink-2` 13px 行高 1.7 `max-w-[65ch]`；指标术语（TTFT/TPS/Total）用 `font-mono` + 珊瑚或墨色强调；列表用发丝线分隔行或左轨
4. 移动端：条目行可折行（主列 100% 后指标横排），tab 可横向滚动，无横滚。
5. 自检 + 写报告。

## 红线

- **只改 2 个文件**：`site/src/components/Leaderboard.tsx`、`site/src/components/Methodology.tsx`。不碰其他任何文件
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑零改动：排序算法、localStorage 读写（`lib/storage.ts` 接口）、删除/恢复/清空/重置行为全部原样
- **e2e 锚点保留**：`role="tablist"` aria-label「排序指标」、`role="tab"` 名称含「TTFT」「首 token」「TPS」（保持现有 tab 文案）、`data-testid="remove-entry"`、文本「还没有可比较的记录」「可比 N 条」（N 动态）
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 中你的 2 文件零类型错误（他人文件并行报错可忽略，报告注明）
2. `npx eslint site/src/components/Leaderboard.tsx site/src/components/Methodology.tsx` 零 error
3. 自检：两文件 `rounded-` = 0、`gradient` = 0、`backdrop-blur` = 0、`lucide-react` = 0、内联色值 = 0
4. e2e 锚点齐全（tablist/tabs/remove-entry/空态/可比计数）
5. 列宽不随内容伸缩（固定 flex-basis + min-width:0 + 省略）——报告说明各列基准宽

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\BOARD-report.md`

模板：`# BOARD 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 视觉结构说明`（列结构/基准宽说明）/ `## 自检结果` / `## 遗留与建议`
