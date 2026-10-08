# AUDIT 结果报告

- 任务：coding-plan-bench 前端 UI 重构（wave12 前五任务合入后）多模态视觉走查
- 日期：2026-10-07 16:39–16:50（本地）
- 对象：`C:/Users/TimeCraker/Desktop/my_workspace/coding-plan-bench`（Vite dev，实际端口 5174——5173 已被非本仓进程占用，未触碰）
- 方式：只读走查。Playwright（Edge 系统通道，reducedMotion=reduce）4 断点 × bench/global 双视图全页截图 + 计算样式全 DOM 清扫 + 横滚/sticky 探针。仓库内零写入。

## 结论一句话

Swiss Industrial Print 契约落地质量高：零圆角 / 单珊瑚强调 / 硬阴影 / 无玻璃拟态 / 无图标库残留五项铁则在全 DOM 计算样式层面零违例；唯一 P0 是 global 视图 375px 下 AA 口径 caption 一行不换行导致 159px 横向滚动。

## 截图清单

全部位于 `C:/Users/TimeCraker/AppData/Local/Temp/cpb-audit/`：

| 文件 | 断点 | 视图 | 像素 (W×H) | 说明 |
|---|---|---|---|---|
| `bench-375.png` | 375 | bench | 750×6774 | dsf2 全页 |
| `global-375.png` | 375 | global | **1068**×8128 | dsf2 全页；**宽 1068=534×2，全页截图宽度即横向溢出物证** |
| `bench-768.png` | 768 | bench | 1536×6204 | dsf2 全页 |
| `global-768.png` | 768 | global | 1536×4788 | dsf2 全页 |
| `bench-1024.png` | 1024 | bench | 1024×3069 | 全页 |
| `global-1024.png` | 1024 | global | 1024×2291 | 全页 |
| `bench-1440.png` | 1440 | bench | 1440×3021 | 全页 |
| `global-1440.png` | 1440 | global | 1440×2275 | 全页 |
| `texture-zoom.png` | 1440 | bench 局部 | 420×300 | 纸底/面板边细部 |
| `sticky-375-global.png` | 375 | global | 750×600 | 滚动 900px 后吸顶态 |
| `sticky-1440-bench.png` | 1440 | bench | 1440×260 | 滚动 700px 后吸顶态 |

辅助脚本（同目录）：`shoot.cjs`（8 张全页）、`probe.cjs`（global-375 超宽元素定位）、`style-sweep.cjs`（计算样式清扫 + texture-zoom）、`sticky.cjs`（sticky 探针）。

## 检查项判定表

| # | 检查项 | 判定 | 依据（截图/探针） |
|---|---|---|---|
| 1 | 零圆角 | **PASS** | 计算样式清扫：bench/global 两视图全 DOM `border-radius≠0` 元素数 = **0**；8 张全页截图无一圆角（卡片/按钮/输入框/徽章/分段控件皆直角）。滚动条 thumb 亦 radius 0 |
| 2 | 单强调色 | **PASS** | 全 DOM `background-image` 含 gradient 的元素 = **0**（body 点阵 rad-gradient 除外，属纹理非装饰渐变）；无渐变文字。珊瑚 #A8513C 仅用于：active tab 下划线、榜单第 01 名序号与分数强调、下载/必填提示文字、安全横幅左线。语义色（测速台 run 蓝方点、示例区 ok 绿）均在契约语义色表内，无蓝紫、无第二品牌强调色 |
| 3 | 发丝线与墨线 | **PASS** | 墨结构线：masthead 下 `border-b-2` 墨线（8 张截图均见）、测一个模型/榜单面板深色外框；发丝线 #E4E3DA：表单分组线、榜单行分隔、preset 区内部分割。层级分明 |
| 4 | 硬阴影 | **PASS** | 全 DOM box-shadow 含 blur>0 的元素 = **0**；阴影均为 2/3/4px offset 无 blur（契约 --shadow-sm/md/lg）。截图无 glow、无软阴影 |
| 5 | 玻璃拟态残留 | **PASS** | 全 DOM `backdrop-filter≠none` 元素 = **0**；面板全部实底（panel #FDFDFC / panel-2 #F8F7F2），无半透明面 |
| 6 | 图标残留 | **PASS** | 未见任何 lucide 线性图标；标记语言 = 几何方点（tab 前 8px 方点、执行位置状态方块、榜单头珊瑚方块）+ 文字标签 + 原生 select 箭头。旁证：`package.json` 已无 lucide-react（并发会话 16:39 移除） |
| 7 | mono 纪律 | **PASS** | mono：TTFT/TPS/Total 数值、分数 58·/100、rank 01-36、T1/T2 档、`profile·cpb-standard@1`、Request URL、preset 型号、AA caption。sans：中文正文、字段标签、模型展示名（展示名 sans-bold + id/URL mono 两层级一致执行） |
| 8 | 点阵纸纹 | **PASS** | body computed = `radial-gradient(rgba(26,26,24,0.03) 1px)` / `26px 26px`；底色 rgb(243,242,237)。视觉上按契约「极淡」设计近不可感知（texture-zoom.png），见 P3-3 |
| 9 | 层级对比 | **PASS**（附 P3） | ink #1A1A18 对纸底 ≈ **15.5:1**（≥7 ✓）；次级 ink-2 #5F5D55 ≈ **5.9:1**（≥4.5 ✓）；三级墨 ink-3 #9B978C ≈ **2.6:1**，用于 10.5-11px 小标签偏弱 → P3-1 |
| 10 | 布局 | **FAIL（1/8）** | 7/8 断点×视图组合 `overflowX=0`；**global-375：scrollW 534 > clientW 375，横滚 159px** → P0-1。sticky 导航：375/1440 滚动后 `nav.sticky.top-0.z-[100]` 钉 top=0，无遮挡异常（sticky-*.png）。375 masthead 单行折叠合理（logo 左 / profile·GitHub chips 右 / tabs 次行）。375 global 子导航折两行无溢出（P3-2） |
| 11 | 空态/表单/榜单完成度 | **PASS** | NO DATA 空态（mono 徽标 + 提示行 + 虚线内框）四断点一致；表单 ≥768 双列 / 375 单列，标签-帮助文字两端对齐纪律统一；示例数据区绿左线 + 重活/删除按钮齐整；global 榜单行 rank/名称/chip/分数四段对齐，4/8dp 节奏无失衡 |

## 分级问题清单（P0-P3）

### P0（破功）

| # | 问题 | 定位 | 证据 | 建议 |
|---|---|---|---|---|
| P0-1 | global 视图 375px 横向滚动 159px（scrollW 534 / clientW 375），移动端需横拖才能看全 | 断点 375 × 视图 global × 榜单头部 AA 口径说明行；元素：`GlobalLeaderboard.tsx` 中 caption `<span>`（class 含 `font-mono text-[11px] text-ink-3 pb-2 shrink-0`，文本「AA Intelligence Index 现行口径 · rank 1-23 ·…」，实测宽 501px 不换行） | probe.cjs 探针 JSON + `global-375.png`（全页宽 1068=534×2 即物证） | 去掉 `shrink-0` 并允许 wrap（容器加 `flex-wrap` / 该 span 加 `min-w-0`），或 375 断点截断 + 省略号 + 完整文案移入 tooltip |

### P1（违反 Swiss 铁则）

无。圆角 / 渐变 / 玻璃拟态 / 图标残留 / 软阴影五项全 DOM 级清零（roundedCount=0、grads=[]、backdrop=[]、blurShadow=[]）。

### P2（对齐与间距瑕疵）

无（宁缺毋滥；最接近的候选——375 Key 须知横幅按钮簇偏密——归入 P3-4）。

### P3（打磨建议）

| # | 建议 | 定位 | 证据 |
|---|---|---|---|
| P3-1 | 三级墨 #9B978C 用于 10.5-11px 小标签（MODEL PRESET/REQUEST 等 lbl-mono、T1/T2 档、AA caption）对比 ≈2.6:1，低于 WCAG AA 4.5:1；caption 承载口径说明信息，建议升到 ink-2 或 ≥3:1 | 全断点 bench/global 小标签区域 | bench-1440.png / global-768.png |
| P3-2 | 375 global 子导航（IQ/AG/VAL/PLN）折两行，无溢出但折行处下划线基线与行距略挤 | 375 × global × 榜单子导航 | global-375.png 顶部 |
| P3-3 | 点阵纹理 α0.03 实渲染近乎不可感知，纸感主要靠色温传达；契约自洽，如需可感知纸纹可试 α0.04-0.05（owner 拍板） | body 背景 | texture-zoom.png |
| P3-4 | 375 bench 顶部 Key 须知横幅：四行说明文字与「下载本地版 / 关闭安全说明」按钮簇同排，375 下右上角偏密，可改为按钮簇换行独立一行 | 375 × bench × 安全横幅 | bench-375.png 顶部 |

## 自评

- **证据强度**：五项铁则不是目测而是全 DOM 计算样式清零（roundedCount/grads/blurShadow/backdrop 四路清扫，两视图各跑一遍）；横滚有 scrollWidth 数值 + 超宽元素探针 + 全页截图宽度三重印证；sticky 有滚动后 getBoundingClientRect 验证。视觉判断基于 11 张 PNG。
- **覆盖局限**：未覆盖交互态（hover/focus/运行中 progress 态）、Anthropic↔OpenAI 切换后表单差异、安全说明展开弹层（只读审计不发起真实测速）；mono 纪律为抽样式 + 截图目验，未逐元素穷举。
- **仓库零改动留证**（红线）：
  - 审计对仓库的全部操作 = `git status/diff`（读）、文件读取、`npm run dev`（只读服务，已停止）。无 install / build / test / 写删。
  - 起点 status（16:39，16 项）→ 终点 status（16:50，21 项）差异 = 5 项：`package.json`、`package-lock.json`（16:39:08 被并发会话移除 lucide-react 依赖）、`workbench-1440-light.png`、`workbench-1440-reduce.png`、`workbench-375-light.png`（16:40:31-36 被并发会话重新生成）。**均非本审计所为**——我未运行过任何 install/uninstall、playwright test、build；`site/dist/` 16:38 后的新构建产物（gitignore 内）同理。审计期间存在并行会话在同一工作树作业（图标清理收尾 + e2e 快照重生成），site/ 源码自 16:18 未变，截图有效。
  - 终点 `git status --short`（2026-10-07 16:50:26）：

```text
 M package-lock.json
 M package.json
 M site/index.html
 D site/public/theme-boot.js
 M site/src/App.tsx
 M site/src/components/BenchForm.tsx
 M site/src/components/GlobalLeaderboard.tsx
 M site/src/components/Leaderboard.tsx
 M site/src/components/Methodology.tsx
 M site/src/components/ResultCard.tsx
 M site/src/components/RunProgress.tsx
 M site/src/components/SecurityBanner.tsx
 M site/src/components/Sidebar.tsx
 M site/src/components/TransportSelector.tsx
 M site/src/main.tsx
 M tests/e2e/visual.spec.ts
 D tests/e2e/visual.spec.ts-snapshots/workbench-1440-dark.png
 M tests/e2e/visual.spec.ts-snapshots/workbench-1440-light.png
 M tests/e2e/visual.spec.ts-snapshots/workbench-1440-reduce.png
 D tests/e2e/visual.spec.ts-snapshots/workbench-375-dark.png
 M tests/e2e/visual.spec.ts-snapshots/workbench-375-light.png
```

  注：此清单为审计开始前即存在的在途改动（wave12 后续工作）+ 并发会话中途落盘的 5 项，非审计产物。审计全程 diff 哈希变化（dae4b19→1543c8e）完全由上述并发写入解释，本审计零贡献。
- **服务痕迹**：自起 Vite dev 落 5174（5173 被非本仓进程占用），审计结束已停止；未触碰 5173。
