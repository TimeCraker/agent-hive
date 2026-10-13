# FIXLEAK 报告 · 899↔900 边界 WebGL 泄漏（首修无效 → 插桩定位 → 单例复用修复）

日期 2026-10-11 · 分支 `codex/character-motion-m1`（未提交，等主控审查）· 预览 BUILD_ID `moWpK8aCqZQ9oK0jurkJO`（3108，PID 25080）

## 一、插桩结论（三个假设的证实/证伪）

工具：`portfolio-release-2026-10-10/fixui/leak-probe-stacks.mjs`（新建复制变体，不改产品代码：
init script 捕获 `getContext`/`createTexture` 调用栈 + `WEBGL_lose_context.loseContext` 实际触发
次数 + canvas 增删事件流；日志 `fixui/probe-full.log` / `fixui/probe-fixed.log`）。

**假设 1（isConnected 恒 true）——证伪。** 首修的 `forceContextLoss` 每次下向切换都真实执行
（loseCalls 与 899 下向切换数一致；栈：`Object.forceContextLoss ← eI(cleanup) ← React 被动 effect`）。
React 被动 effect 的 cleanup 在 commit（canvas 已摘除）之后运行，`isConnected === false` 成立。
context 层面首修是生效的——但它救不了 texturesLive。

**假设 2（泄漏不经 cleanup / 清理缺失）——机制上不成立，方向上成立。** cleanup 每次都完整执行
（原画纹理、geometry、material 全 dispose）。真实累积源是挂载/卸载抖动本身：每次上向切换
`new THREE.WebGLRenderer`（ctx +1，10 个 createTexture），每次 cleanup 只能删掉 9 个原画纹理。

**假设 3（上下文/纹理来源不止 renderer）——纹理一半成立。** context 唯一来源就是 renderer
（全站 `/` 仅 `art-renderer.ts` 一个 WebGL 调用点，栈证实）。纹理来源两类：
- 9 张原画（6 预载 + 3 懒加载）：**创建/销毁闭环，净零**；
- **4 张 three r184 内部占位纹理：`WebGLState` 构造时为 TEXTURE_2D / CUBE_MAP / 2D_ARRAY /
  3D 四个绑定目标各建一个 1px 纹理（chunk 列 33190/33243/33319/33380，源码 `G[...] = V(...)`），
  `renderer.dispose()` 从不 deleteTexture 它们** —— 每实例净 +4。

**稳态账（修复前）**：每轮 2 次挂载 ×（9+4）创建 − 2 次 cleanup × 9 删除 = **+8 纹理/轮**，
与 PERF 基线（5 轮 10→53）和主控 20 轮（10→173）完全吻合。

**主控 "+4 ctx/轮" 为测量假象**：`leak-check*.mjs` 在 ctor 循环里对
`HTMLCanvasElement.prototype.getContext` patch 了**两层**（第二次 wrap 第一次），每次真实调用
计数 +2。真实 context 创建 = +2/轮（2 次上向切换各 1 个），探针单层计数已复核。PERF 基线的
ctx 数同样是双计数。**但注意：即便真实 +2/轮，getContext 调用计数在本判据下也不可平台化——
必须让切换停止新建 renderer。**

## 二、修复（src/lib/character-motion/art-renderer.ts，净 +59/−10）

模块级 `rendererCache`（canvas+renderer 单例）跨挂载复用：

- **挂载**：缓存存在且 context 未死 → 收养——React 本次渲染的新 canvas 保持无 context 并
  `display:none`，把缓存 canvas 插回原位（`insertBefore(旧, 新)`，保持原 DOM 槽位/层级），
  `renderer.resetState()`；否则新建并写入缓存。同 canvas 场景（lab toggle）直接复用不换节点。
- **cleanup**：原画纹理/bitmap/geometry/material 照旧全量释放；**缓存实例不再 dispose**——下次
  切换收养而非重建，占位纹理与 context 从根上停止累积。脱离缓存的实例（仅 lost 路径）才
  `dispose()` + 原 `isConnected → forceContextLoss` 兜底（保留首修语义，作用于真死 context）。
- **lost**：先把死 context 移出缓存，cleanup 全量释放，下次挂载重建新对。
- 生命周期：单例随页面存活（路由离开 `/` 后闲置 1 个 context + 4 张 1px 占位，有界不增长；
  页面卸载自然回收）。

```diff
+let rendererCache: { canvas: HTMLCanvasElement; renderer: THREE.WebGLRenderer } | null = null;
 const reactCanvas = root.querySelector<HTMLCanvasElement>(".motion-character")!;
+const cached = rendererCache && !rendererCache.renderer.getContext().isContextLost() ? rendererCache : null;
 let canvas = reactCanvas; let renderer;
 if (!cached) { renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:false, powerPreference:"high-performance"}); rendererCache = {canvas, renderer}; }
 else { renderer = cached.renderer;
+  if (cached.canvas !== reactCanvas) { reactCanvas.style.display="none"; canvas=cached.canvas; canvas.style.display=""; reactCanvas.parentElement!.insertBefore(canvas, reactCanvas); }
+  renderer.resetState(); }
 // cleanup 内：
-    renderer.dispose();
+    if (rendererCache?.renderer !== renderer) { renderer.dispose(); if (!canvas.isConnected) renderer.forceContextLoss(); }
 // lost 内：
+    if (rendererCache?.renderer === renderer) rendererCache = null;
```

演出语义零改动（时间线/ScrollTrigger/章节锚点均为每挂载重建，与原先一致）；act3 引言抬升
CSS（`motion.css`，`top: min(89.2%, calc(50dvh + 50% - 3.7cqw - 110px))`）为 FIXUI 遗留同批验证。

## 三、20 轮 leak-check 前后对照（leak-check-20.mjs，判据脚本未改动）

| 指标 | 修复前（主控实测） | 修复后（本次） | 判定 |
|---|---|---|---|
| texturesLive | 10 → 173（+8/轮，线性） | 10 ↔ 13 锯齿，**max 13** | ✅ 平台 |
| webglContexts | 82（双计数；真实 +2/轮） | **2**（双计数 = 真实恒 1） | ✅ 平台 |
| 章节跳转（jumps） | +3/轮（懒加载不回收） | +3 后随 cleanup −3，跨轮净 0 | ✅ 零增长 |
| 可见性（visibility） | 同 boundary 累积 | 恒定无变化 | ✅ 零增长 |
| 滚动停启（scrollresume） | 累积 | 10↔13 锯齿净 0 | ✅ 零增长 |
| domNodes | 385 恒定 | 385→386（隐藏备用 canvas +1，有界） | ✅ |
| canvases | 1 | 2（收养 canvas + 隐藏 React canvas） | ✅ 有界 |
| pinSpacers | 1 | 1 | ✅ |
| jsHeapMB | 11.3→13.9 | 12.2↔28 GC 锯齿，非单调 | ✅ |

曲线抽样（每 4 个快照取 1，全程 81 个快矩恒定）：round1~20 visibility 均 tex 10 / ctx 2。
插桩复核（probe-fixed.log）：8 次边界切换 getContext **零新增**、loseCalls **0**（无需强丢）。

## 四、补拍帧（fixui/，2026-10-11 13:38-13:39）

- `act3-desktop-after.png`：动态模式第 3 幕定格——WebGL 角色正常渲染（证明收养 renderer 工作正常）；
  引言「爆裂吧现实…」与底部「03 · 创作世界」caption 无叠压（CSS 抬升生效）。
- `act2-mobile-after.png`：390×844 DPR3 静态阅读第 2 幕落定——chapter=1、标签「02 / 06 · 关于我」、
  进度点 02 实心。
- 其余五幕桌面抽查（capture-after.mjs 自动叠压扫描）：act1~6 `contentOverlaps=0
  decorativeOverlaps=0`，caption 全部正常显示。

## 五、回归

- `pnpm run typecheck` ✅；`pnpm run lint` 0 error（69 warning 为既有存量，与本次改动无关，stash 对照核实）
- toggle 回归（repro-toggle.mjs）：动态→静态→章 3→动态 **2ms** 重激活、pageerrors=[]（复用红利：无需重建探测）
- verify-home-completion **20/20 PASS**（桌面六幕导航/目录/对话框/hash 重载/静态↔动态、1366/1920/850/768/390/320
  视口、reduced-motion、config/lab 入口、legacy 锚点、移动分栏、素材下载失败兜底）
- 证据输出：`fixui/regression/`（20 项 verification.json + 截图）

## 六、运维备注

- 重建流程踩点：**先停 3108（dev.db EBUSY）→ `pnpm build` → 拷 `.next/static` 到
  `.next/standalone/.next/static` → 再启服务**（服务先于拷贝启动会 404 全部 chunk，MIME text/plain）。
  prisma/data 已备份至 `fixui/db-backup/fixleak-1011/`。
- 主控复测建议沿用 `leak-check-20.mjs` 原样（判据兼容：双计数下平台化依旧可见）；若要修
  双计数，只改 fixui 副本，勿动 PERF 目录。
- 现行 3108 = 修复版（PID 25080）；机器休眠红线期间所有长测均在活动会话内完成。
