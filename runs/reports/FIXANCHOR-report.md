# FIXANCHOR · 发布前缺陷修复批次报告

- **分支**：`codex/character-motion-m1`（8302135 之上，工作区干净起手）
- **结论**：3 项缺陷全部修复。修复前复现 8/17 PASS → 修复后 **17/17 PASS**；既有回归 `verify-home-completion.mjs` **20/20 PASS**；`pnpm run typecheck` / `pnpm run lint` 全过（0 error，69 条为存量 warning，改动文件单独 lint 零发现）。
- **未 commit**（待主控审查）、未部署。改动共 4 个文件：3 改 + 1 新增，+43/−3 行（另新文件 ~100 行）。
- 预览：3108 已重建重启，**PID 18588**，BUILD_ID `9b7_vBZIZG4VlavGrSsJi`，日志 `%TEMP%\portfolio-preview-3108\server.log`。

## 测试资产（可复跑）

- 复现/验证脚本：`%TEMP%\fixanchor\repro.mjs`（`node repro.mjs <base> <label>`，借用 MOTION 报告复现手法：6.2 用 `addInitScript` 使 getContext 对 webgl/webgl2 返回 null；6.1 用同文档 hash goto + goBack；A2 矩阵测 `/#projects /#services /#vote /#contact` 落点 top ±10px 且 hash 保持，含暖缓存/直接访问/详情页返回）
- 诊断脚本：`d2probe.mjs`（落点漂移采样）、`d3probe*.mjs`（hashchange 挂载时序）；截图 `d1-before.png` / `d1-after2.png`；`dev.db` 备份 ×2

---

## 缺陷 1【高】WebGL 初始化失败降级不完整（MOTION §6.2）

### 根因结论（实测确证）
`mountArtMotion`（`src/lib/character-motion/art-renderer.ts:26`）在创建 WebGLRenderer **之前**就命令式写入 `root.dataset.active = "true"`。`new THREE.WebGLRenderer()` 因 getContext 返回 null 抛出后，`ArtDirectedPreview` 的 catch 调 `setActive(false)`——但 React 前后两次提交的 prop 均为 `"false"`（false→false），diff 判定无变化**永不回写 DOM**，命令式写入的 `"true"` 残留。CSS `.character-motion-lab[data-active="true"] .motion-static { display: none }`（motion.css:423）随之隐藏 ReadingStory → 六幕全 0×0、文档高度塌成单屏 900px。运行中丢失路径不受影响（此前 active=true 已被 React 提交，setActive(false) 触发 true→false 回写）——与 MOTION「仅初始化失败路径塌陷」的观察完全吻合。

### 改动
`src/components/character-motion/ArtDirectedPreview.tsx` catch 块 +4 行：在 `setActive(false)` 前显式 `element.dataset.active = "false"`（置于 `!disposed && version === generation` 守卫内，避免旧 generation 的 catch 清掉新成功挂载的标记）。失败后 `setReviewing(false)` 触发 mount 重跑走静态分支，与运行中丢失收敛到同一 fallback 渲染路径。

### 验证输出
- 修复前（3108 旧构建）：`{"scrollHeight":900,"dataActive":"true","motionError":"Error creating WebGL context.","toggle":"动态浏览↗","sections":[["chapter-hero",0],…全 0]}`
- 修复后：`{"scrollHeight":6709,"dataActive":"false","motionError":"Error creating WebGL context.","toggle":"动态浏览↗","sections":[["chapter-hero",838],["chapter-about",876],["chapter-capabilities",1137],["chapter-resume",1092],["chapter-game",1529],["chapter-contact",810]],"scrollable":true}` —— 多幕可读可滚、按钮态与已认可的首图失败降级路径一致、0 pageerror。

## 缺陷 2【P1】旧根锚点跳转落点错位（UIUX A2）

### 根因结论（三层叠加，实测确证；主控两嫌疑复核结论见下）
1. **hash 改写的真凶**：任务书称「/explore 自身无 scrollspy（已确认）」——**不成立**。`/explore` 渲染的 `Navbar` 无条件调用 `useActiveChapter()`（Navbar.tsx:41），其 IntersectionObserver 在 `useActiveChapter.ts:72-74` 把 hash `replaceState` 成路过的区块（这就是 UIUX 报告说的「hash 被 scrollspy 改写」）。
2. **落点偏移主因**：`html { scroll-behavior: smooth }`（globals.css:185）把跨文档 hash 导航变成动画；动画目标是**内容展开前的快照**——上方字体/懒图稳定后目标被推走。实测 `d2probe`：我方瞬时落定 top=92 后，浏览器原生平滑滚动在其后完成（scrollY 8492→8223），把视口拖回旧目标 → 均匀 +81px 漂移。
3. **次要真凶**：alias 深链归一化——`#vote` 是 contact 章节的 alias，scrollspy 即使落点正确也会把 `#vote` 改写成 `#contact`（直接访问亦然，修复前 `D2-direct-#vote: {"hash":"#contact"}` 复证）。
4. 主控次嫌疑（六幕页 mount 时 `replaceState('#chapter-hero')` 抢跑）**排除**：该写入只在 `toggle()`/`navigateChapter()` 用户动作内；legacy 重定向 effect（:111）声明序先于 mount effect，全部 `/#<legacy>` 实测均带原 hash 到达 /explore，「`/` 侧 legacy 判断优先」无需改动即成立。

### 改动
- **新增 `src/components/ui/AnchorSettle.tsx`**（client 空渲染组件，挂进 `/explore`）：取 mount 时 hash 目标 → 锁 `<html data-anchor-lock>` → 等 `document.fonts.ready`（≤800ms）→ 等目标上方未完成图片 `decode()`（≤1200ms）→ **等原生平滑滚动静止**（scrollY 连续 6 帧不变，≤1s——修掉第 2 层漂移的关键）→ `scrollIntoView({behavior:"instant"})` 落定（scroll-margin-top 92px 由 globals.css 既有规则提供）→ 一帧后复落 → 解锁。期间 wheel/touchstart 即取消（不夺用户滚动）。
- **`src/app/explore/page.tsx`**：`<Navbar />` 后挂 `<AnchorSettle />`（+3 行）。
- **`src/hooks/useActiveChapter.ts`**：hash 同步加两道豁免——锚点锁期间不改写（修第 1 层）；当前 hash 解析（`resolveAnchorId`）到本章节时保持原样（修第 3 层，`#vote`/`#hardware` 深链可分享）。

### 验证输出（A2 矩阵，±10px 且 hash 保持）
| 用例 | 修复前 | 修复后 |
|---|---|---|
| `/#projects` 重定向 | hash→`#rag-demo`，top=1491 | hash=`#projects`，**top=92** |
| `/#services` 重定向 | top=173 | hash=`#services`，**top=92** |
| `/#vote` 重定向 | hash→`#projects`，top=1305 | hash=`#vote`，**top=92** |
| `/#contact` 重定向 | top=780 | hash=`#contact`，**top=92** |
| 暖缓存二访 `/#vote` | hash→`#projects` | hash=`#vote`，top=92 |
| 直接访问 ×4（含 `#vote`） | `#vote` 被改写 `#contact` | ×4 全 hash 保持，top=92 |
| 详情页返回（`/.game-nav-back`→`/#projects`） | hash→`#rag-demo`，top=1491 | hash=`#projects`，top=92 |
| pageerror | 0 | 0 |

## 缺陷 3【中】动态模式同文档 hash 导航不响应（MOTION §6.1）

### 根因结论
与任务书一致：hashchange 监听（jumpToHash）仅在静态阅读（`active=false`）挂载。新增对照发现一个**测试时序坑**（非产品缺陷）：`dataset.active="true"` 由 mountArtMotion 命令式写入，早于 React 提交 active=true effects 一拍——事件若在监听器挂载前发出则永久错过。MOTION 复现脚本 waitForFunction 恰好踩进这个窗口（复现脚本已补 800ms 稳定等待；真实用户路径无影响）。

### 改动
`ArtDirectedPreview.tsx` 新增 +26 行 effect（`[presentation, active, stopPlayback]`）：动态模式挂 hashchange 监听，按 hash 找 chapter → `stopPlayback()` → `syncStoryChapter` → 用 `__characterMotion.report()` 的 scrollStart/End × chapter.progress 瞬时滚动（复用 navigateChapter 等价逻辑；地址栏/前进后退用 instant 保证确定性）。

### 验证输出
- 修复前：`{"before":{"chapter":"0","scrollY":0},"after":{"hash":"#chapter-about","chapter":"0","scrollY":0}}`
- 修复后：forward `{"hash":"#chapter-about","chapter":"1","scrollY":2503}`；goBack `{"hash":"#chapter-hero","chapter":"0"}`；MCP 有头浏览器内地址栏式改 hash（`#chapter-game`）→ `chapter:"4", scrollY:10580`；静态模式回归 D4 PASS（chapter 4 / top 88）。

---

## 重建与验证环境
- 重建两次（第一次修 D1/D3 初版 + D2 落定；第二次加原生平滑滚动静止等待）：备份 `standalone/prisma/data/dev.db` → 停本项目 3108 进程（每次 netstat+CIM 核实：3104→29828→18588 均为 `node.exe server.js`、BUILD_ID 对应本仓 standalone）→ `pnpm build`（exit 0）→ 补拷 `.next/static` / `.env` / `prisma/data` → 隐式重启 3108。现 PID **18588**，BUILD_ID `9b7_vBZIZG4VlavGrSsJi`，`/`、`/explore` 均 200。
- 回归：`verify-home-completion.mjs`（PREVIEW_URL=3108）20/20，覆盖六幕导航/目录键盘/多视口/reduce-motion/旧根锚点兼容/首图失败降级/noindex 等。

## 剩余风险与边界
- `/explore` 页内同文档 hash 跳转（Navbar 章节链接）不经过 AnchorSettle（其 effect 仅 mount 一次）——沿用原生平滑滚动，页面已稳定时本就精确，属既有行为非回归；跨文档/直达/返回路径（A2 验收范围）全覆盖。
- `data-anchor-lock` 为瞬态（最坏 ~3s 自动解除），仅 `useActiveChapter` 读取；`AnchorSettle` 对无 hash / hash 目标不存在时零行为。
- 动态模式 hashchange 用 instant 滚动（与 UI 章节按钮的 smooth 有意区分：地址栏/历史导航要确定性落点）。
- 3108 现跑本批次构建，供主控复核；push 后仍需按部署手册手动上线（本批次未部署）。
