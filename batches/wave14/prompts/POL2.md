# 任务 POL2：表单与执行位置精致化——编号区段 + 字段规线 + 芯片排版

一句话任务：在 wave12 已完成的 Swiss 基础上对 `BenchForm.tsx` 与 `TransportSelector.tsx` 做**美术精致化**——把表单面板做出印刷表单的制式感：编号区段、规线对齐、芯片层级化。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19 + TS 5.7 + Tailwind v4。
- wave12 已落地：墨线面板 + hard-shadow、`.lbl-mono` 区块标题（`MODEL PRESET · 快选` / `REQUEST · 请求定义`）+ 发丝延伸线、协议分段控制（墨底纸字选中）、mono 描边快选芯片（选中珊瑚描边+底纹）、原生 select（Swiss 化）、墨底纸字主按钮（hover 珊瑚）。契约 `site/src/styles/globals.css` 已冻结（token 同 POL1）。
- 参照系：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css`。
- 并行波次：POL1/POL3/POL4/POL5 在改其他文件——**你绝对不碰**。

## 打磨方向（最小共识 + 你的发挥）

**铁则不变**（零圆角/单珊瑚/发丝线+墨线/硬阴影/无 blur 渐变图标/mono 只用于数据/动效只 transform+opacity）。

1. **编号区段制式**：区块标题升级为「编号 + 标题」——`01 · MODEL PRESET` / `02 · REQUEST`（编号 `text-accent font-mono font-bold`，标题保持 `.lbl-mono`）；延伸线保留
2. **字段规线对齐**：表单栅格严格化——label 行（sans 600 13px）+ 帮助文字（`text-ink-3` 11px）同一基线区；输入框统一高度（h-10）+ 内 padding 统一（px-3）；字段间距统一 8 的倍数；mono 字段（URL/model）与 sans 字段（label）字号分层清晰
3. **快选芯片层级化**：芯片内部两行制——上行渠道名 `font-mono text-[9.5px] tracking-[0.1em] uppercase text-ink-3`、下行模型名 12px 600（当前单行挤）；选中态珊瑚描边加粗到 1.5px；芯片间距收窄（gap-1.5）形成「铅字盘」阵列感
4. **主按钮升级**：高度加到 h-11、字重 700、右侧加 mono `↵` 回车提示符（纯文本字符，非图标）；hover 珊瑚底过渡 150ms
5. **TransportSelector 精修**：行 padding 节奏 16/20 → 14/24（更透气）；选中态右侧珊瑚方标改「8px 方块 + 2px 间隔细线」双元素；三行色轨（蓝/琥珀/绿）保持语义
6. **取样 select**：右侧原生箭头区域加 mono 千分位风格装饰线（`border-l border-line` 分隔）——纯 CSS，无图标

## EYE 批评吸收（美术总监批评全文：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\EYE-report.md`，可读）

以下条目必须落地（覆盖上文与之冲突的建议——CTA 颜色以此为准）：

1. **P0-5 CTA 珊瑚时刻 + 废态去泥**（本波最重要单条）：enabled 态 `bg-accent text-paper hover:bg-accent-deep active:translate-y-[1px]`（珊瑚实底，首屏即见色块）；disabled 态改描边废态 `bg-panel border border-line-2 text-ink-3 cursor-not-allowed`（删除 `opacity-40` 灰泥）；协议分段控制保持 `bg-ink` 墨底不变——墨块给次级切换、珊瑚给主 CTA，重量归位
2. **P1-6 Field hint 拉回 label 侧**：label 与 hint `flex items-baseline gap-2` 紧排（当前 justify-between 拉出 300px+ 空洞）；仅 Request URL 的长 hint 保留右对齐例外（`ml-auto`）
3. **P2-2 chips 双色**：chip 拆双 span——provider（如「智谱」）`text-ink-3` + model（如「GLM-5.3」）`text-ink`，同 11px mono（name 按首个空格拆分即可，不改 engine/models.ts）
4. **P2-3 琥珀可分性**：TransportSelector 代理行 warn 轨 3px→4px（宽度区分，不改色值）

## 红线

- **只改 2 文件**：`site/src/components/BenchForm.tsx`、`site/src/components/TransportSelector.tsx`。不碰 globals.css 与其他任何文件
- 不做 git 操作；不跑 npm install/uninstall；不起 dev server
- 业务逻辑零改动（FormValues/onRun/校验/芯片预填/selectOption 兼容）；**e2e 锚点一字不改**：radio「OpenAI」「Anthropic」「浏览器直连」「项目代理」「本地 App」、button「开始测速」「显示 Key」、label「取样」「Request URL（完整请求地址）」「Model」「API Key」、fieldset 结构
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误（他人并行报错可忽略，报告注明）
2. `npx eslint site/src/components/BenchForm.tsx site/src/components/TransportSelector.tsx` 零 error
3. 自检：两文件 `rounded-`=0、`gradient`=0、`backdrop-blur`=0、`lucide`=0、内联色值=0
4. e2e 锚点齐全（上述 radio/button/label/fieldset）
5. 报告说明编号区段与芯片两行制的最终结构

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\POL2-report.md`

模板：`# POL2 结果报告` / `## 结论一句话` / `## 改动文件清单` / `## 制式细节说明` / `## 自检结果` / `## 遗留与建议`
