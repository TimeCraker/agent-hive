# 任务 GLOBE：全球能力榜 Swiss 化

一句话任务：把 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench` 的 `site/src/components/GlobalLeaderboard.tsx`（257 行）视觉层重构为 agent-hive 同款 **Swiss Industrial Print**——去全部装饰图标改 mono 排名与文字标签，榜切换分段化，数据表格化呈现。

## 背景（已核实事实，勿重新考古）

- 技术栈：Vite 7 + React 19 + TS 5.7 + Tailwind v4。
- `GlobalLeaderboard`：全球模型能力与套餐参考视图——多榜数据（智能指数 / Agent 能力 / 性价比 / 订阅套餐，静态数据源在组件内或 `site/src/data/`）、榜间切换、「更新于」时间戳、数据来源说明（Artificial Analysis 等行业参考）；图标用了 lucide（Globe/Brain/Coins/CreditCard/Target/Crown/Trophy/Sparkles/Info）——这是全站装饰图标最密集的组件。
- **主控已落地设计契约**（commit ee89140）：`site/src/styles/globals.css` 已重写为 Swiss 令牌系统。
- 并行波次：SHELL/FORM/RESULT/BOARD 在改其他文件——**那些文件你绝对不碰**。数据文件（`site/src/data/`）只读不改。
- e2e 依赖：`button` 可见名含「能力榜」的导航（在 Sidebar/App，不在你文件内）；你组件内有文本「更新于」被 accessibility.spec 断言——保留。

## 视觉契约（先读这两份参照再动手）

1. `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css` —— 参照重点：`.statsband` 统计带、`.rowt` 行式列表、`.tab` 导航、`.sec>h2` 区块标题、`.chip` 徽章
2. `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\docs\design.md` —— 设计决策记录
3. 本仓契约 `site/src/styles/globals.css` —— token：`text-ink/ink-2/ink-3` `bg-paper/panel/panel-2` `border-line/line-2` `text-accent` `bg-accent` `text-ok/run/warn/bad/mute` `font-mono` `font-disp` + `.lbl-mono` `.st-dot` `.pulse-dot` `.hard-shadow` `.border-ink` `.tabular`

### Swiss 铁则（逐条自检）

1. **零圆角**；2. 单强调珊瑚（禁蓝紫渐变/gradient 文字/多强调）；3. 发丝线 + 结构墨线；4. 硬阴影 offset；5. 无 blur/半透明；6. **lucide import 全删**（Globe/Brain/Coins/CreditCard/Target/Crown/Trophy/Sparkles/Info 共 9 个——榜首标记用 mono「#1」大数字或珊瑚方点、来源说明用 `.lbl-mono` 标签、榜单图标改中文/英文文字标签）；7. mono 只用于数据/排名/分数/价格/模型名；8. 状态色即语义（不挪作装饰）；9. 动效 150–300ms；10. 禁内联色值。

## 步骤

1. 读参照文件 + `GlobalLeaderboard.tsx` + 它引用的数据文件（只读）。
2. **榜切换**：多榜切换改 agent-hive `.tab` 式——2px 墨底线 tabs（智能指数 / Agent 能力 / 性价比 / 订阅套餐，保持现有榜名文案），选中态 `text-ink` + 底线对齐，未选 `text-ink-2`；若是 select 下拉则改 tabs（键盘可达：button + aria-pressed 或保留原有 role 结构）
3. **数据呈现表格化**（参照 `.rowt` 行式列表 + 列对齐铁律——每列固定 flex-basis + `min-width:0` + 省略，宽度不随内容伸缩）：
   - 每行：排名（mono 600，榜首可 `text-accent`）/ 模型名（sans 600 + 厂商 `font-mono` 11px `text-ink-3`）/ 分数或价格列（右对齐 `font-mono` `.tabular`）/ 标记列（订阅制/免费等属性改 mono 描边小徽章）
   - 外框 `bg-panel` + `border-ink` + `.hard-shadow`；表头 `.lbl-mono` + 发丝线分隔
   - **避免三等列均分卡片网格**——用行式列表或不对称 bento（一主多辅）；若保留概览卡则用 statsband 式分段带
4. **头部信息区**：榜名 `font-disp` 标题 + 「更新于 <日期>」mono 小徽章（`bg-panel` 描边）+ 数据来源说明（`text-ink-2` 12px，含行业参考免责声明文案保留）
5. 移动端：tabs 横向滚动、表格列可折行或 `overflow-x-auto`，无横滚。
6. 自检 + 写报告。

## 红线

- **只改 1 个文件**：`site/src/components/GlobalLeaderboard.tsx`。不碰其他任何文件（数据文件只读）
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑零改动：数据、榜切换状态、排序（若有）全部原样；「更新于」文本保留
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 中你的文件零类型错误（他人文件并行报错可忽略，报告注明）
2. `npx eslint site/src/components/GlobalLeaderboard.tsx` 零 error
3. 自检：文件内 `rounded-` = 0、`gradient` = 0、`backdrop-blur` = 0、`lucide-react` = 0、内联色值 = 0
4. 「更新于」文本可见且语义不变
5. 榜切换后数据正确呈现（逻辑未动，报告说明确认方式）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\GLOBE-report.md`

模板：`# GLOBE 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 视觉结构说明`（榜切换/行结构/徽章体系描述）/ `## 自检结果` / `## 遗留与建议`
