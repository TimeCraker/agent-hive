# 任务 AUDIT：多模态视觉走查——四断点双视图截图分级（后置任务，只读审计）

一句话任务：在 coding-plan-bench 前端 UI 重构（wave12 前五个任务）已合入后，用浏览器截图做**只读视觉走查**——375/768/1024/1440 四断点 × bench/global 双视图逐屏对照 agent-hive Swiss Industrial Print 规范，产出 P0-P3 分级清单与截图证据。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`：Vite 7 + React 19；`npm run dev` 起本地服务（localhost:5173，Vite proxy `/api` → 8787 可不管，走查不测速）。
- UI 已重构为 **Swiss Industrial Print**：设计契约 `site/src/styles/globals.css`；视觉参照系 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\app\public\theme.css` + `docs\design.md`（纸感底 #F3F2ED 点阵纹理 / 油墨黑 #1A1A18 / 单珊瑚强调 #A8513C / 发丝线 #E4E3DA / 零圆角 / 硬阴影 3px 3px 0 offset / mono 只用于数据）。
- 你是**多模态验收视角**：只看、只截、只写报告，不改任何代码。

## 步骤

1. 起服务：后台起 `npm run dev`（或 `npm run build` + `npm run preview`，任选稳定者），等 ready。
2. 写一个临时 Playwright 截图脚本（Node，放 `$env:TEMP\cpb-audit\` 下，**不放仓库内**）：对 375/768/1024/1440 四视口 × 两视图（`/` 与切换到「能力榜」后的状态——点击导航「能力榜」按钮再截）全页截图，存 `$env:TEMP\cpb-audit\*.png`。reducedMotion reduce 模拟保证稳定。
3. **逐屏走查**（用你的看图能力读截图），检查项逐条判定 PASS/FAIL：
   - 零圆角：任何卡片/按钮/输入框/徽章出现圆角即 FAIL
   - 单强调色：出现蓝紫渐变、gradient 文字、第二强调色即 FAIL；珊瑚 #A8513C 只作强调
   - 发丝线与墨线：面板外框应为深墨结构线，内部分区发丝线
   - 硬阴影：offset 阴影无 blur 发光；出现 glow/大范围软阴影即 FAIL
   - 玻璃拟态残留：半透明面/backdrop 模糊即 FAIL
   - 图标残留：lucide 线性图标风格残留即 FAIL（几何方点/文字标签是对的）
   - mono 纪律：数字/代号/URL 等宽；中文正文非 mono
   - 点阵纸纹：body 背景应有极淡点阵纹理
   - 层级对比：正文 #1A1A18 对纸底 ≥7:1；次级文字可读
   - 布局：断点下无横向滚动、无元素溢出、导航 sticky 正常、移动端 masthead 折叠合理
   - 空态/表单/榜单区域的视觉完成度（对齐/间距 4/8dp 节奏）
4. 汇总分级：P0=破功（样式崩坏/不可用/横滚）、P1=违反 Swiss 铁则（圆角/渐变/图标残留）、P2=对齐与间距瑕疵、P3=打磨建议。每条附断点+视图+截图文件名。
5. 关闭 dev 服务进程，写报告。

## 红线

- **零代码改动**：仓库内一个字节都不写不删（git status 必须干净——报告里附 `git status --short` 输出为证）
- 截图与脚本只落 `$env:TEMP\cpb-audit\`
- 不跑 npm install；不起第二个服务占 5173 端口之外的变更
- 不读取任何密钥/env 值
- Windows 11 + PowerShell

## 验收标准

1. 截图 ≥8 张（4 断点 × 2 视图）全部存在且可读
2. 检查项 11 条逐条有判定（PASS/FAIL + 依据截图）
3. P0-P3 分级清单每条含定位信息（断点/视图/区域）
4. `git status --short` 空输出留证

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AUDIT-report.md`

模板：`# AUDIT 结果报告` / `## 结论一句话` / `## 截图清单`（文件名 × 断点 × 视图，绝对路径）/ `## 检查项判定表`（11 条 PASS/FAIL）/ `## 分级问题清单（P0-P3）` / `## 自评`
