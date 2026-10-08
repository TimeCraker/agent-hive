# 任务 POL6：导航方框 segmented + hero/横幅减法

一句话任务：把 `App.tsx` / `Sidebar.tsx` / `SecurityBanner.tsx` 按 owner 反馈做减法与方框化——**nav 切换按钮改「正方形框框」segmented control**（owner 原话点名）、hero 大字精简、安全横幅一行制。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4；Swiss Industrial Print（契约 `site/src/styles/globals.css`：token `text-ink/ink-2/ink-3` `bg-paper/panel/panel-2` `border-line/line-2` `text-accent` `bg-accent` `bg-ink text-paper` 语义色 + `.lbl-mono` `.hard-shadow` `.tabular`）。
- wave14 现状：nav 是 2px 墨底线 tabs（owner 不满意：**切换按钮要做成正方形框框的那种**）；hero 已 52px 大字。
- **主控已重写文案**（工作树中，勿改 copy.ts）：`APP_TITLE` 现为「可信测速台」四字（hero 直接消费，52px 正合适）；`SECURITY_BANNER` 已砍成一句。
- 并行波次：POL7/8/9 + EYE2 在改其他文件——**你绝对不碰**。

## 改造指令

1. **nav 改方框 segmented control**（owner 点名）：
   - sticky nav 区：tabs（测速台/能力榜）从「底线式」改为**墨线外框分格 segmented**——外框 `border-[1.5px] border-ink`、格间 `border-l border-line-2` 发丝分隔；选中格 `bg-ink text-paper`（墨底纸字）；未选 `text-ink-2 hover:text-ink hover:bg-panel-2`
   - tab 前几何方点保留（选中格内方点改 `bg-paper` 反白或珊瑚）
   - nav 底部的 2px 墨底线可以保留（结构线）或去掉（segmented 自带框）——二选一，页面更简者优先；sticky 背景仍 `bg-paper` 不透明
   - 移动端：segmented 两格等宽撑满或内容自适应，44px 触达
2. **hero 减法**：h1 继续消费 `APP_TITLE`（已是「可信测速台」）；描述 `APP_SUBTITLE` 一行截断两行内（`max-w-[60ch]`）；hero 底 hairline + 视图记号（`BENCH — 01`/`GLOBAL — 02`）保留
3. **global 视图 hero 文案白话化**（App.tsx 内硬编码，改文案）：
   - title: `全球模型榜`
   - desc: `全世界模型谁强、谁划算——行业参考数据，不是本机实测。想测自己的，切回「测速台」。`
4. **SecurityBanner 一行制**：`SECURITY_BANNER`（已是一句）单行呈现：左 3px 珊瑚轨 + 一句话（`text-[13px] text-ink-2`）+ 右侧「下载本地版」链接（`LOCAL_APP_DOWNLOAD` 常量 + 原下载 href）与「关闭安全说明」钮（mono 小方钮）——移动端可折两行但不再多行堆叠
5. **masthead 不动**（wave14 版式保留），只做 nav/hero/banner 三处
6. 全部动效 150-300ms `var(--ease)` 只动 transform/opacity/color

## 红线

- **只改 3 文件**：`site/src/App.tsx`、`site/src/components/Sidebar.tsx`、`site/src/components/SecurityBanner.tsx`。**copy.ts 禁改**（主控契约）；globals.css 禁改；其他组件禁碰
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- **e2e 锚点一字不改**：button「测速台」「能力榜」、link 含「GitHub」、button「关闭安全说明」、FOOTER_BENCH 原文渲染
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误（他人并行报错可忽略，报告注明）
2. `npx eslint site/src/App.tsx site/src/components/Sidebar.tsx site/src/components/SecurityBanner.tsx` 零 error
3. 自检：名下文件 `rounded-`=0、`gradient`=0、`backdrop-blur`=0、`lucide`=0
4. e2e 锚点四项齐全
5. 报告附 segmented 最终结构描述（外框/分格/选中态）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\POL6-report.md`

模板：`# POL6 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 结构说明` / `## 自检结果` / `## 遗留与建议`
