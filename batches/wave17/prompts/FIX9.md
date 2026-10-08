# 任务 FIX9：SRC 折叠 + 存置区行降档 + tabs 渐隐（EYE2 P1-3 / P1-4 / P2-10 / P2-13）

一句话任务：按 EYE2 密度体检报告（`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\EYE2-report.md`，可读）修 `GlobalLeaderboard.tsx`——来源注释墙改折叠、存置区「61 分排在 58 分后面」的续排陷阱、免责语组件侧去重、tabs 溢出渐隐。

## 背景（已核实事实）

- **P1-3**：`sources.join(" · ") + meta.note` 渲染成 500+ 字 mono 单段（375 断点 12 行），来源清单与口径规则混写——全站最大文字墙。
- **P1-4**：存置区行号续排 24-36 且 legacy 分数与主区同字号同墨色（61 > 榜首 58），灰数据条配黑分数自相矛盾，扫读必混。
- **P2-10**：副标题「存量区」vs 分节带「存置区」用词不一致（副标题来自 leaderboards.json——**json 禁改，主控另行处理**；你只在渲染侧统一：若组件内有硬编码「存量区」改「存置区」）。
- **P2-13**：375 下 tabs 溢出无提示。
- EYE2 P1-5 组件侧免责：面板右标「非本机实测 · 互补参考」与 SRC 尾句「行业参考数据，非本机实测。」删除（App.tsx 的 hero/footer 两处保留，归 FIX6）。
- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`；Swiss 契约 `globals.css` 冻结；copy.ts / leaderboards.json 禁改；并行 FIX6/7/8 在改其他文件。

## 改造指令（EYE2 处方）

1. **P1-3 SRC 折叠**：来源块改原生 `<details>`（默认收起）——`<summary>` 用 `.lbl-mono`「数据来源与口径 · N 源」+ 珊瑚小方点；展开后：来源逐条一行（`flex flex-col gap-1`，每条「来源名 · 日期」从 sources 数组拆出，长串按 `·` 智能截取首段），note 以 ≤3 行 `text-ink-3` 小字呈现全文（不再 join 成墙）；details marker 用 CSS 去默认三角换方点
2. **P1-4 存置区降档**：
   - legacy 行（section 标记行）行号改「旧 NN」制式（`旧 01`–`旧 13`，mono，`text-ink-3`）
   - legacy 分数降档：`text-ink-2` + 字号缩到 24px 左右（与灰数据条一致），#1 珊瑚戏剧化只在主区
   - 分节带标签扩写：「旧版口径区（指数 v4.1 · 2026-08） · 不与上列混排」；GDPval 带同理（「旧版口径区（GDPval v2 · 2026-08） · 不与上列混排」）——SECTION_LABELS 常量更新
3. **P1-5 组件侧免责删除**：面板头部右侧「非本机实测 · 互补参考」lbl-mono 删除；SRC 尾句若含免责重复改留一处（折叠内保留即可）
4. **P2-13 tabs 渐隐**：tabs 容器右缘加渐隐提示（`mask-image: linear-gradient(to right, black 85%, transparent)` 或伪元素渐隐覆盖 + `pointer-events-none`），仅溢出时视觉提示
5. 动效铁则照旧；「更新于」文本保留

## 红线

- **只改 1 文件**：`site/src/components/GlobalLeaderboard.tsx`。copy.ts / leaderboards.json / globals.css 禁改
- 不做 git 操作；不起 dev server；不跑 npm install
- 业务逻辑零改动（fetch/榜切换/分节渲染/归一）；e2e 锚点：「更新于」、tablist/tab 结构保留
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误；eslint 零 error
2. 默认渲染（未展开 details）页面无 500 字墙（报告附折叠前后行数对照）
3. legacy 行：行号「旧 NN」+ 分数 24px ink-2（报告说明实现）
4. 面板头部无「非本机实测」重复（grep 组件 = 0，折叠内允许）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FIX9-report.md`

模板：`# FIX9 结果报告` / `## 结论一句话` / `## 改动清单` / `## 折叠结构与存置区降档说明` / `## 自检结果` / `## 遗留`
