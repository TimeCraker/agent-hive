# 任务 SHELL：coding-plan-bench 应用壳重构（masthead + sticky 导航 + 单列布局）

一句话任务：把 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench` 前端应用壳从「玻璃侧边栏 SPA」重构为 agent-hive（太木控制台）同款 **Swiss Industrial Print** 壳层——顶部 masthead + sticky 导航 tabs + 单列 wrap 布局，全站去侧边栏、去玻璃拟态、去主题切换。

## 背景（已核实事实，勿重新考古）

- 技术栈：Vite 7 + React 19 + TypeScript 5.7 + Tailwind CSS v4（`site/src`，入口 `site/src/main.tsx`）。
- **主控已落地设计契约**（commit ee89140）：`site/src/styles/globals.css` 已重写为 Swiss 令牌系统；`site/src/lib/theme.ts` 已固定单浅色主题（导出 `getTheme/initTheme/toggleTheme` 恒 light）；`site/public/theme-boot.js` 已中性化。你要在此基础上重构壳层组件。
- 本任务是并行波次之一，另有 FORM/RESULT/BOARD/GLOBE 任务并行改 `BenchForm.tsx`、`RunProgress.tsx`、`ResultCard.tsx`、`Leaderboard.tsx`、`Methodology.tsx`、`GlobalLeaderboard.tsx`、`TransportSelector.tsx`——**这些文件你绝对不碰**（App.tsx 里只消费它们的 props 接口，接口不变）。
- e2e 测试依赖语义锚点（见验收标准），视觉重构不得破坏。

## 视觉契约（先读这两份参照再动手）

1. `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css` —— 视觉世界参照（纸感底/墨层级/发丝线/零圆角/硬阴影）
2. `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\docs\design.md` —— 设计决策记录（Swiss Industrial Print 选型）
3. 本仓契约 `site/src/styles/globals.css` —— 可用 token：
   - Tailwind 原生类：`text-ink` `text-ink-2` `text-ink-3` `bg-paper` `bg-panel` `bg-panel-2` `border-line` `border-line-2` `text-accent` `bg-accent` `text-ok` `text-run` `text-warn` `text-bad` `text-mute` `font-mono` `font-disp`
   - 工具类：`.lbl-mono`（mono 大写宽字距小标签）`.st-dot`（8px 方点）`.pulse-dot`（脉冲圆点）`.hard-shadow`（3px 3px 0 offset 硬阴影）`.border-ink`（结构墨线）`.tabular`（等宽数字）

### Swiss 铁则（全部任务通用，逐条自检）

1. **零圆角**：清除全部 `rounded-*` 类
2. **单强调色**：珊瑚 `#A8513C`（`text-accent`/`bg-accent`）；禁止蓝紫渐变、禁止 gradient 文字、禁止第二强调色
3. 发丝线边框（`border-line`/`border-line-2`）+ 结构墨线（`.border-ink` 用于面板外框与导航底线）
4. 硬阴影 `.hard-shadow`（offset 阴影，无 blur 无发光）
5. 玻璃拟态废除：无 `backdrop-blur`、无半透明面
6. **图标库清退**：删除你名下文件全部 `lucide-react` import；用几何标记（`.st-dot`/`.pulse-dot`）、mono 文字标签、状态色文字替代
7. mono 字体只用于数据/数字/代号/时间/URL；中文正文系统 sans；展示标题 `font-disp`
8. 状态色即数据语义：`ok` 绿 / `run` 蓝 / `warn` 琥珀 / `bad` 红 / `mute` 灰——不挪作装饰
9. 动效 150–300ms、`var(--ease)` 缓动、只动 transform/opacity；悬浮态用背景/边色变化（panel→panel-2）
10. 组件内禁止内联 style 色值，颜色全部走 token 类

## 步骤

1. 读三份参照文件 + 你名下的 5 个文件：`site/src/App.tsx`、`site/src/components/Sidebar.tsx`、`site/src/components/SecurityBanner.tsx`、`site/src/main.tsx`、`site/index.html`。
2. **布局结构重构**（对齐 agent-hive 面板骨架）：
   - 删除左侧固定 Sidebar 与移动端顶部双导航——桌面/移动统一为同一顶部结构
   - **masthead 页首**：左侧几何 mark（16px 珊瑚方块 `bg-accent` + 内嵌 3px 纸色 inset，参照 agent-hive `.mark`）+ 字标堆叠（主行「Coding Plan Bench」`font-disp` 22px 700 `-0.03em`；副行 mono 10.5px `text-ink-3` 宽字距「CPB · 可信测速台」）+ 右侧 meta 徽章列（描边小徽章 mono 11px `bg-panel border-line-2`，内容如 `profile · cpb-standard@1`）
   - **sticky 导航**（`position:sticky; top:0`）：2px 墨底线下方 tabs（「测速台」「能力榜」），tab 结构参照 agent-hive `.tab`：未选 `text-ink-2`、选中 `text-ink` + 2px 选中色底线（负 margin 对齐 nav 底线）+ tab 前几何方点（`.st-dot`，测速台=run 蓝、能力榜=accent 珊瑚）；导航背景 `bg-paper`（不透明，遮住滚动内容）
   - **主体单列**：`max-w-[1240px] mx-auto` 水平 padding（桌面 36px / 移动 16px）——对齐 agent-hive `.wrap`
   - **背景装饰层全删**：`grid-bg` 网格层、两颗 drift 径向光斑、fixed 定位装饰 div 全部移除（纸感点阵纹理已在 body 上）
   - hero 紧凑区保留（`APP_TITLE`/`APP_SUBTITLE` 来自 `site/src/content/copy.ts`，文案不改），排版改 Swiss：h1 `font-disp` 加粗收紧，描述 `text-ink-2` 14px 行高 1.6 `max-w-2xl`
   - view 切换逻辑（bench/global）与全部 hooks/props 逻辑**原样保留**，只动视觉层
3. **主题切换清退**：Sidebar 的主题切换按钮删除；App.tsx 不再 import `toggleTheme`；`initTheme` 保留一次调用（或直接在 main.tsx 处理后从 App 删除）；`theme.ts` 文件保留不删（其他地方可能 import）
4. **GitHub 链接**：保留（a href 与 rel=noreferrer），视觉改 masthead 右侧或导航区的描边 mono 小徽章
5. **theme-boot.js 移除**：删文件 + 删 `site/index.html` 里的 `<script src="/theme-boot.js"></script>`（单主题无需防闪烁引导）
6. **SecurityBanner 重构**：panel 底 + 发丝线 + 左侧 3px 珊瑚色轨（信息横幅语言）；关闭按钮改 mono 描边小方钮（`关闭安全说明` 可见文本不变）；内部文字层级用 `text-ink-2`/`text-ink-3`
7. 移动端适配：masthead 字标可缩（18px）、meta 徽章换行、nav tabs 横向可滚动（`overflow-x-auto` 无横滚溢出）
8. 自检 + 写报告。

## 红线

- **只改你名下 5 个文件**（App.tsx / Sidebar.tsx / SecurityBanner.tsx / main.tsx / index.html + 删 theme-boot.js）。不碰：BenchForm/TransportSelector/RunProgress/ResultCard/Leaderboard/Methodology/GlobalLeaderboard/globals.css/theme.ts/copy.ts/engine/server/tests/package.json
- 不做任何 git 操作（add/commit 全禁止）——主控统一验收提交
- 不跑 `npm install/uninstall`（依赖已就绪；lucide 卸载由后置 TEST 任务统一做——你的文件删掉 import 即可，package.json 不动）
- 不起 dev server（端口会撞其他并行任务）
- 业务逻辑/数据流/props 接口零改动——纯视觉层
- **e2e 语义锚点保留**：`button` 可见名「能力榜」（以及「测速台」）、`link` 可见名含「GitHub」、SecurityBanner 的 `button`「关闭安全说明」——文字一字不改
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 中你名下文件零类型错误（他人文件并行中报错可忽略，报告注明即可）
2. `npx eslint site/src/App.tsx site/src/components/Sidebar.tsx site/src/components/SecurityBanner.tsx site/src/main.tsx` 零 error
3. 自检清单全过：你的文件内 `grep -c "rounded-"` = 0、`gradient` = 0、`backdrop-blur` = 0、`lucide-react` = 0、内联 `style={{` 色值 = 0
4. e2e 锚点三项齐全（能力榜 button / GitHub link / 关闭安全说明 button）
5. `data-testid` 与 `role` 结构不减少（原有 role 才保留，不新增义务）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\SHELL-report.md`

模板：`# SHELL 结果报告` / `## 结论一句话` / `## 改动文件清单`（每文件一句改了什么）/ `## 布局结构说明`（masthead/nav/wrap 最终结构描述）/ `## 自检结果`（验收标准逐条 + 命令输出摘录）/ `## 遗留与建议`
