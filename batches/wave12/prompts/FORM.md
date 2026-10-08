# 任务 FORM：测速表单与执行位置选择器 Swiss 化

一句话任务：把 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench` 的 `site/src/components/BenchForm.tsx` 与 `site/src/components/TransportSelector.tsx` 视觉层重构为 agent-hive 同款 **Swiss Industrial Print**——零圆角零渐变零图标库，mono chip 快选 + 墨线面板 + 分段控制，全部表单语义与 e2e 锚点保留。

## 背景（已核实事实，勿重新考古）

- 技术栈：Vite 7 + React 19 + TS 5.7 + Tailwind v4。表单是本站核心交互：Request URL / API Key / model / 协议（Anthropic/OpenAI 二选一 radio）/ 取样数（1/3/5）/ 模型矩阵快选芯片（读 `engine/models.ts` 的渠道矩阵，点击预填 URL+model+协议，key 永不预填）。
- **主控已落地设计契约**（commit ee89140）：`site/src/styles/globals.css` 已重写为 Swiss 令牌系统，直接消费 token 类。
- 并行波次：SHELL 任务在改 App.tsx/Sidebar/SecurityBanner/main/index.html，RESULT/BOARD/GLOBE 任务在改其他组件——**那些文件你绝对不碰**。你只改表单交互视觉，不碰 hooks（`useBenchmarkRun`）与 transports 层。
- 模型快选芯片现有视觉是圆角胶囊；表单卡是 `rounded-2xl` 玻璃卡；图标用了 lucide（Play/Eye/EyeOff/Terminal/Zap 与 Download）——全部按铁则清退。

## 视觉契约（先读这两份参照再动手）

1. `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css` —— 视觉世界参照
2. `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\docs\design.md` —— 设计决策记录
3. 本仓契约 `site/src/styles/globals.css` —— 可用 token：
   - Tailwind 原生类：`text-ink` `text-ink-2` `text-ink-3` `bg-paper` `bg-panel` `bg-panel-2` `border-line` `border-line-2` `text-accent` `bg-accent` `text-ok` `text-run` `text-warn` `text-bad` `text-mute` `font-mono` `font-disp`
   - 工具类：`.lbl-mono` `.st-dot` `.pulse-dot` `.hard-shadow` `.border-ink` `.tabular`

### Swiss 铁则（逐条自检）

1. **零圆角**：清除全部 `rounded-*`
2. **单强调色**：珊瑚 `#A8513C`；禁止蓝紫渐变、gradient 文字、第二强调色
3. 发丝线（`border-line`/`border-line-2`）+ 结构墨线（`.border-ink` 面板外框）
4. 硬阴影 `.hard-shadow`（offset，无 blur 无发光）
5. 无 `backdrop-blur`、无半透明面
6. **lucide-react import 全删**：Play/Eye/EyeOff/Terminal/Zap/Download 等——用 mono 文字、几何标记替代（例：提交按钮纯文字「开始测速」；Key 显隐切换文字「显示 Key」↔「隐藏 Key」mono 小钮）
7. mono 只用于数据/URL/数字/代号/模型 ID；中文标签 sans
8. 状态色即语义，不挪作装饰
9. 动效 150–300ms `var(--ease)`，只动 transform/opacity；悬浮 panel→panel-2
10. 禁止内联 style 色值

## 步骤

1. 读参照文件 + 你的两个组件 + `engine/models.ts`（快选芯片数据源，只读）。
2. **TransportSelector 重构**：三个执行位置（浏览器直连/项目代理/本地 App）改为 agent-hive 式**行式选择列表**或紧凑分段控制：外框墨线 + panel 底；每行左侧 3px 状态色轨（直连=run 蓝、代理=warn 琥珀、本地=ok 绿）+ 名称（sans 600）+ Key 路径描述（`text-ink-2` 12px）+ 选中态 `bg-panel-2` + 右侧 mono「选中」标记或珊瑚方点；radio input 语义保留（视觉可隐藏但可聚焦，focus 环珊瑚）。不可用项（如非 Tauri 环境的本地 App）置灰 `text-mute` + 禁用态。
3. **BenchForm 重构**：
   - 表单面板：`bg-panel` + `border-ink` 外框（1.5–2px 墨线）+ `.hard-shadow`；区块间发丝线分隔；区块标题用 `.lbl-mono` + 右侧发丝延伸线（参照 agent-hive `.sec>h2`）
   - 模型矩阵快选芯片：mono 描边 chip（`border-line-2` + `font-mono` 11px），渠道名 + 模型名；选中/预填态珊瑚描边 + 珊瑚字 + `bg-accent/10` 底纹（对齐 agent-hive wavechip 语言）；hover 墨底纸字
   - 输入框：零圆角 + `border-line` + focus 珊瑚环（2px outline）；Request URL 与 model 用 `font-mono`；API Key 输入右侧显隐切换改文字钮
   - 协议选择（fieldset + radio「OpenAI」/「Anthropic」）：改**分段控制**——两格并排墨线外框，选中格墨底纸字（`bg-ink text-paper`），radio 语义保留
   - 取样数（1/3/5）：同样分段控制或 mono chip 组
   - 「开始测速」主按钮：墨底纸字大按钮（`bg-ink text-paper`，padding 充裕），hover 珊瑚底（`bg-accent`），active 下沉 1px；busy 态文字「测速中…」+ 禁用置灰
   - 校验错误提示：`text-bad` 12px + 左侧 2px 红轨
4. 移动端：分段控制可换行、表单字段纵向堆叠、无横滚。
5. 自检 + 写报告。

## 红线

- **只改 2 个文件**：`site/src/components/BenchForm.tsx`、`site/src/components/TransportSelector.tsx`。不碰其他任何文件
- 不做任何 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑零改动：FormValues 类型、onRun 回调签名、受控状态、校验规则、芯片预填逻辑全部原样
- **e2e 语义锚点保留**（一字不改）：radio 可见名「OpenAI」「Anthropic」「浏览器直连」「项目代理」「本地 App」；button「开始测速」「显示 Key」；fieldset 分组结构保留
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 中你的 2 文件零类型错误（他人文件并行报错可忽略，报告注明）
2. `npx eslint site/src/components/BenchForm.tsx site/src/components/TransportSelector.tsx` 零 error
3. 自检：两文件内 `rounded-` = 0、`gradient` = 0、`backdrop-blur` = 0、`lucide-react` = 0、内联色值 = 0
4. e2e 锚点齐全（上述 radio/button/fieldset）
5. 快选芯片仍能预填 URL/model/协议（逻辑未动，报告说明你如何确认的）

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FORM-report.md`

模板：`# FORM 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 视觉结构说明`（分段控制/chip/面板结构描述）/ `## 自检结果`（验收标准逐条 + 命令输出摘录）/ `## 遗留与建议`
