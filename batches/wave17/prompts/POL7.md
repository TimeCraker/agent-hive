# 任务 POL7：连接方式三方框卡 + 下载前置 + 表单减字

一句话任务：把 `TransportSelector.tsx` / `BenchForm.tsx` 按 owner 反馈重做——**三个连接选项改并排小方框卡**（一眼看懂本质区别）、「下载本地版」按钮前置显眼（不要灰色藏底）、「执行位置」更名「连接方式」、表单 hint 精简。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4；Swiss 契约 `site/src/styles/globals.css`（token 同 POL6：`text-ink/ink-2/ink-3` `bg-paper/panel/panel-2` `border-line/line-2` `text-accent` `bg-accent` `bg-ink text-paper` + `.lbl-mono` `.st-dot` `.hard-shadow`）。
- wave14 现状：三选项是竖排行式列表（owner：文字太多太密）；下载提示是底部灰色脚注（owner：**不如直接把下载放上面，点完直接下载**）。
- **主控已重写文案**（`copy.ts` 工作树中，禁改）：`TRANSPORT_COPY` 三项 label 已变——`浏览器直连` / `中转代理` / `本地软件`；keyPath/detail 全部砍成大白话短句；新增 `LOCAL_APP_DOWNLOAD = "下载本地版"` 常量；e2e 的 radio 断言主控已同步为 `/中转代理/`。
- 并行波次：POL6/8/9 + EYE2 在改其他文件——**你绝对不碰**。

## 改造指令

1. **三选项并排小方框卡**（md+ 三列 grid，375 纵排）：
   - 每卡：顶部 3px 语义色条（直连=run 蓝 / 中转=warn 琥珀 / 本地=ok 绿）+ label（sans 700 14px）+ 一句话本质（detail 砍到一行内，`text-[12px] text-ink-2 leading-snug`，超出一行截断 + title 全文）
   - 选中卡：`border-[1.5px] border-ink bg-panel-2` + 右上角 8px 珊瑚方点；未选：`border-line-2` hover `border-ink`
   - radio input 语义保留（opacity-0 占满卡面，可聚焦，focus 珊瑚环）；「需确认」类标注（中转）可用 mono 小徽 `需确认`
   - **keyPath 不再逐卡全展示**——默认只显示 detail 一句话；keyPath 信息合并进卡的第二行（也砍短显示）或 hover title。总目标：三卡并排时每卡可见文字 ≤ 3 行
2. **下载前置**：「本地软件」卡内直接放 `下载本地版` 按钮（`LOCAL_APP_DOWNLOAD`，mono 描边小方钮，href 用现有下载地址 target=\_blank rel=noreferrer）——非 Tauri 环境该卡可点下载；Tauri 环境内隐藏下载钮。底部灰色脚注（LOCAL_APP_HINT + 下载链接）删除或简化为一行
3. **「执行位置」→「连接方式」**：legend/标题全部更名（含注释顺带更新）；fieldset 语义不变
4. **表单减字**：
   - API Key hint「仅本次测速；去向见上方执行位置」→「只用于这一次测速」
   - 其他组件内硬编码 hint 逐条砍到 ≤ 12 字或删除（URL_FIELD_HINT 来自 copy.ts 已精简，直接渲染）
   - 快选芯片：保持两行制（provider + model），但选中态信息不加第三行
   - 必填提示（wave14 加的）保留但更短：「填完整再开测」
5. **编号区段**（01/02）保留；取样 select 与协议分段控制不动（wave14 版式）
6. 动效 150-300ms 只动 transform/opacity/color

## 红线

- **只改 2 文件**：`site/src/components/TransportSelector.tsx`、`site/src/components/BenchForm.tsx`。**copy.ts 禁改**；globals.css 禁改；`lib/transports/*` 禁改
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑零改动（FormValues/onRun/校验/芯片预填/select 兼容/consent 流）
- **e2e 锚点**：radio 可见名「浏览器直连」「中转代理」「本地软件」（来自 copy.ts，label 渲染一字不改）；button「开始测速」「显示 Key」；label「取样」「Request URL（完整请求地址）」「Model」「API Key」；fieldset + `transport-selector` testid 保留
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误（他人并行报错可忽略，报告注明）
2. `npx eslint site/src/components/TransportSelector.tsx site/src/components/BenchForm.tsx` 零 error
3. 自检：两文件 `rounded-`=0、`gradient`=0、`backdrop-blur`=0、`lucide`=0
4. e2e 锚点齐全（新 label 三项 + 按钮/label 组）
5. 三卡并排时每卡可见文字 ≤ 3 行（报告自证结构）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\POL7-report.md`

模板：`# POL7 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 结构说明`（三卡布局/下载前置/hint 清单）/ `## 自检结果` / `## 遗留与建议`
