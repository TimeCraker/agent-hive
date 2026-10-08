# 任务 EYE：美术总监之眼——coding-plan-bench Swiss 重构后主观批评（只读）

一句话任务：以资深 UI 美术总监视角，对 coding-plan-bench wave12 重构后的多断点截图做**主观美术批评**，产出可直接执行的 P0-P3 打磨清单——owner 已表态「美术还不够满意」，你的批评要毒辣、具体、可落地。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench` 前端已重构为 **Swiss Industrial Print**（参照 agent-hive 太木控制台）：纸感底 #F3F2ED + 点阵纹理、油墨黑 #1A1A18、珊瑚单强调 #A8513C、发丝线 #E4E3DA/#D0CFC5、结构墨线、零圆角、硬阴影 3px 3px 0 offset、mono 只用于数据（JetBrains Mono 栈）、图标库已清退（几何方点 + 文字标签）。
- 现成截图（wave12 AUDIT 产出，reduced-motion 全页）：`C:\Users\TimeCraker\AppData\Local\Temp\cpb-audit\` 下 8 张：`bench-{375,768,1024,1440}.png` 与 `global-{375,768,1024,1440}.png`，另有 `texture-zoom.png`（细部）与 `sticky-*.png`。
- 截图后已有三处小修（不影响整体方向评判）：① global 视图 375px 横滚已修；② 三级墨 ink-3 已加深 #9b978c→#6f6b61（对比度修复）；③ 榜单删除钮触控区已扩到 44px。
- 设计契约在 `site/src/styles/globals.css`；组件在 `site/src/components/`（App/Sidebar=Masthead/SecurityBanner/BenchForm/TransportSelector/RunProgress/ResultCard/Leaderboard/Methodology/GlobalLeaderboard）。
- 视觉参照系（风格基准）：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css`。

## 步骤

1. 逐张细读 8 张截图（用你的多模态能力，不要凭空想象）。
2. 从以下维度做专业批评（每维度给出「现状 → 问题 → 具体改法」）：
   - **视觉层级与戏剧性**：Swiss 印刷靠极端字号对比立住版面——当前页面的大小对比是否足够立得住？哪些数字/标题应该放大到什么程度？hero 区是否平庸？
   - **印刷制式细节**：页眉规线、版号/日期戳、栏间距节奏、区块编号（01/02/03）、colophon 页脚——当前缺哪些让页面「像被设计过」的制式记号？
   - **留白与密度**：哪里挤、哪里空得不高级？4/8dp 节奏是否处处成立？
   - **色彩时刻**：珊瑚强调是否用得太吝啬或太散？状态色（蓝/绿/琥珀）作为数据语义是否被充分运用（agent-hive 的统计带/进度条是彩色活跃的）？
   - **微观排版**：字距（大标题收紧/小标签放宽）、行高、对齐线的严格性、数字排版（tabular、位数补零、单位处理）。
   - **材质与质感**：纸纹感知度、墨线粗细层级（当前只有 1px/1.5px/2px）、硬阴影的分量是否到位。
   - **一致性**：组件间的制式语言是否统一（同类元素同样式）？桌面与移动端的品质是否同等？
3. 产出**分级打磨清单**：P0=显著提升观感的必改项、P1=制式细节升级、P2=节奏与微调、P3=锦上添花。每条必须含：元素定位（组件+断点）、现状描述、具体改法（含建议的具体值：字号/字距/颜色/边框/间距）。
4. 写报告。

## 红线

- **零代码改动**（仓库内一个字节不写不删；`git status --short` 空输出留证）
- 只读截图与源码；不起服务；不跑 npm；截图不搬运
- 批评对事不对人：每条负面评价必须配可执行改法
- Windows 11 + PowerShell

## 验收标准

1. 8 张截图逐一有评（报告注明每张的关键观察）
2. 七个批评维度全覆盖
3. P0-P3 清单每条含定位+现状+具体改法（含建议值）
4. `git status --short` 空输出留证

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\EYE-report.md`

模板：`# EYE 结果报告` / `## 结论一句话`（整体美术水平评价 + 最大短板） / `## 逐图观察`（8 张各 2-4 行） / `## 七维批评` / `## 分级打磨清单（P0-P3）` / `## 自评`
