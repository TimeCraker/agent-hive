# PERF · 性能与高刷采样报告（六幕主页发布候选）

- **日期**: 2026-10-11（独占时段内完成，采样期间未并行构建/其他重负载）
- **对象**: `http://localhost:3108/`（本地 standalone 预览，PID 18588 `node server.js`，分支 `codex/character-motion-m1`，HEAD 4dbbbc7；六幕章节锚点与 art-directed manifest 均在服务中核验）
- **覆盖**: 总任务书 §10 弱网缓存 + §11 性能；线上（HTTPS 域名）部分不在本次本地阶段范围
- **证据根目录**: `C:\Users\TimeCraker\Desktop\my_workspace\portfolio-release-2026-10-10\perf\`（下文所有相对路径基于此）
- **仓库状态**: 采样全程未修改 `my-portfolio` 任何源码（结束前 `git status` 干净）；未 commit、未部署、未重启 3108

## 0. 结论速览

| # | 结论 | 依据 |
|---|---|---|
| 1 | 流动性与上轮基线持平，无退化；60Hz 预算超标率 <1% | §A，15 轮采样中位数 |
| 2 | **发现 1 个真实缺陷**：899↔900 模式边界切换每往返泄漏 +4 WebGL 纹理 +2 上下文（线性累积） | §A4 leak-check，5 轮压力 |
| 3 | CPU 瓶颈已定位：样式重算 UpdateLayoutTree 占主线程 ~52%；4x 降速下主线程 92% 饱和 | §A3 Chrome trace 线程归因 |
| 4 | Lighthouse 桌面 82 / 移动 64；LCP 桌面 1.71s ✓、移动慢网 7.11s（超 2.5s 目标，字节+带宽决定，非 JS 阻塞） | §B，各 3 轮中位 |
| 5 | 弱网 1s 即有完整定格画面与文字（无白屏/无 spinner）；暖缓存传输字节 -99%；四类失败注入均可读降级不崩溃；全场景 0 个 404；CLS ≈0 | §C |
| 6 | 移动端 0 姿态/0 manifest 请求，仅 reading-v1 轻量素材（单张 ≤409KB） | §C6 |
| 7 | 物理高刷（120/144Hz）、真机 GPU/触摸屏、真实 INP **全部未测**，仅列待真机确认项，不以 headless rAF 冒充 | §D 诚实性声明 |

## 1. 环境记录

| 项 | 值 |
|---|---|
| CPU / 内存 | AMD Ryzen 5 5600（6C/12T）/ 15.9 GB，台式机（节电模式不适用） |
| 浏览器 | Chrome 154.0.8037.98 headless（new），WebGL 渲染器 `ANGLE (NVIDIA GeForce RTX 5060, Direct3D11)` —— 非 SwiftShader（trace/desktop-norm-summary.json `gpuInfo`） |
| 视口 | 桌面 1440×900 @DPR1；移动 390×844 @DPR3 + isMobile/hasTouch（真 CDP 触摸事件） |
| 采样层次 | rAF（页面回调）/ GSAP ticker（驱动全部绘制）/ WebGL draw（JS 提交耗时 = `__characterMotion.report().drawCpuP95Ms`）/ 物理显示（**未验证**，headless 合成器无 vsync 约束：BeginFrame 间隔中位 2.64ms） |
| 帧预算 | 60Hz=16.67ms，120Hz=8.33ms，144Hz=6.94ms |

## 2. 证据清单（相对 `perf/`）

| 目录 | 内容 |
|---|---|
| `fluidity/` | `measure-fluidity-release.mjs`（发布专用变体，输出改向证据目录，未触碰既有 home-fluidity-v1 证据）；15 轮原始 JSON+截图 `r*-desktop-cold|desktop-warm|desktop-cold-cpu4x|mobile-cold|mobile-warm*`；`summary.json` 聚合；`wheel-latency.json` 滚轮时延；`aggregate.mjs` |
| `trace/` | `trace-release.mjs`、`analyze-trace.mjs`；`desktop-norm-*`、`desktop-cpu4x-*`、`mobile-scroll-*`（raw/summary/threads 三件套） |
| `leak/` | `leak-check.mjs`、`leak-check.json`（5 轮逐步快照）、`leak-verdict.json` |
| `lighthouse/` | `lh-desktop-1..3.json`、`lh-mobile-1..3.json`、`lh-summary.json`、`desktop|mobile-final-screenshot.jpg` |
| `weaknet/` | `weaknet-checks.mjs`、`weaknet-results.json`、`wn*.jpg`（时间轴与失败注入截图） |

## A. 流动性采样（§11）

**方法**：与基线 `docs/design/character-homepage/home-fluidity-v1/after.json` 完全同构（同一 6s 三角正反滚 / 同一 12 组 CDP 触摸划动 / 同一等待条件），每场景 3 轮取中位；headless rAF 未锁帧（桌面区间中位 4.6ms ≈ 217Hz 调度能力），**不构成物理刷新率证据**。

### A1. 中位数汇总（`fluidity/summary.json`）

| 场景（轮数） | rAF 中位 | rAF p95 | rAF p99 | >16.67ms | >33ms | 长任务 | ticker 观测 FPS / 绘制 FPS | draw CPU p95 | 纹理数 | FCP/LCP | 资源/字节 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 桌面冷（3） | 4.6ms | 9.1ms | 13.8ms | 10/≈1160 (0.9%) | 5 | 0 | 162.1 / 160.2 | 2.0ms | 9 | 332/696ms | 52 · 8.48MB |
| 桌面暖（3） | 4.6ms | 9.1ms | 18.1ms | 12 | 3 | 0 | 164.4 / 162.5 | 2.1ms | 9 | 80/80ms | 52 · 5.33MB* |
| 桌面冷+CPU4x（3） | 9.1ms | **41.0ms** | 63.6ms | 121 (10.4%) | 65 | 7（计 479ms） | 61.6 / 58.9 | 13.0ms | 9 | 520/520ms | 52 · 8.48MB |
| 手机冷（3，触摸+CPU4x） | 4.6ms | 9.1ms | 9.2ms | 7 | 1 | 0 | —（静态阅读模式，无 ticker） | — | — | 784/836ms | 43 · 2.89MB |
| 手机暖（3） | 4.6ms | 9.1ms | 9.2ms | 3 | 0 | 0 | — | — | — | 300/300ms | 43 · 1.90MB* |

\* 暖缓存字节为同上下文二次导航的累计值，缓存收益详见 §C2（净传输 -99%）。

- **与基线对比**：桌面 rAF p95 9.1→9.1ms、over33 3→5、drawCpuP95 1.7→2.0ms；手机 p95 9.1→9.1ms。判：**无整体帧间隔退化**，差异在轮间噪声量级。
- **触摸输入→下一帧 rAF**（手机，CPU4x，页面事件时间戳法，不含合成器/显示）：中位 31.2ms / p95 37.4ms（3 轮一致 31.2/32.2）。
- **滚轮输入→下一帧 rAF**（桌面，无节流，CDP mouseWheel 真事件，`fluidity/wheel-latency.json`）：3 轮中位 9.7–12.0ms / p95 17.3–24.9ms。
- 120Hz 预算视角：桌面冷 >8.33ms 占 181/1160 ≈ 15.6% —— 仅说明该 headless 环境下约 1/6 样本超出 120Hz 单帧预算，**不可外推为真机 120Hz 掉帧结论**。

### A2. 采样层次明细（不得互相冒充）

1. **rAF**：A1 表全部为页面 rAF 回调间隔（measure 脚本注入的独立探针）。
2. **GSAP ticker**：桌面六幕的**唯一**绘制循环（`src/lib/character-motion/art-renderer.ts` `gsap.ticker.add(draw)`），其间隔即 `ticker 观测 FPS` 列；手机静态模式无 ticker。
3. **WebGL draw**：JS 提交耗时 `drawCpuP95Ms` 2.0ms（每次 renderer.render 计时，仅主线程提交，非 GPU 时间）；GPU 进程侧 GPUTask 平均 0.54ms/个。
4. **物理显示**：**未验证**。headless 合成器 BeginFrame 间隔中位 2.64ms（无 vsync），列「待真机确认」。

### A3. Chrome Performance trace 线程归因（6.6s 滚动窗口）

| 阶段（主线程） | 桌面正常 | 桌面 CPU4x | 手机（静态+CPU4x） |
|---|---|---|---|
| 主线程忙碌 / 占用率 | 3759ms / **57%** | 6158ms / **92%** | 1282ms / 26% |
| UpdateLayoutTree（样式重算） | 1941.5ms（4151 次，max 9.1ms） | 3059.2ms（1258 次，**max 93.1ms**） | 119.6ms（357 次） |
| Layout | 24.8ms | 64.8ms | 21.5ms |
| Paint | 33.9ms | 87.0ms | 31.5ms |
| Layerize / Commit | 119.5 / 94.6ms | 198.6 / 156.2ms | 20.4 / 229.1ms |
| 主线程长任务(>50ms) | **0**（max RunTask 21.7ms） | **8 个**（51.7–115.7ms，集中在中后段） | 0 |
| 栅格（worker 线程） | RasterTask 4426 次 686.8ms | — | — |
| GPU 进程 | GPUTask 4005 个 2159.8ms（max 62.3ms，2 个大项出现在滚动起点 ≈ 首批姿态纹理上传） | — | — |

**瓶颈结论**：样式重算占主线程忙碌的 ~52%（正常）/ ~50%（4x），是最大单项 CPU 成本——由 GSAP 每 tick 对多元素写内联样式 + 进度数据集写入驱动；Layout/Paint 合计 <120ms 可忽略。CPU 4x 下该成本使主线程 92% 饱和并出现 51–116ms 长任务（对应 rAF p95 41ms）。**最小修复方向（仅建议，未实施）**：降低每 tick 样式写入面（例如把不参与过渡的属性改为 CSS 变量批量提交 / 减少同时动画元素数）；正常 1x 条件下无用户可见卡顿证据，是否值得动由你拍板。

### A4. WebGL 纹理有界性与泄漏（`leak/leak-check.json`，5 轮压力）

| 压力类型 | 结果 |
|---|---|
| 章节正反跳转（6 锚点 × 正反 × 5 轮） | `textureCount` 恒 ≤9，**零增长** ✓ |
| 899↔1440 边界往返（每轮 2 次桌面↔移动切换） | 存活纹理 10→18→26→34→42→50（**+8/轮，线性**）；WebGL 上下文 2→22（**+4/轮**）；有删除发生（+15/轮）但净增不减 |
| 可见性切换 / 滚动停-启 | 无增长 ✓ |
| DOM / canvas / pin-spacer | 385 / 1 / 1 恒定 ✓ |
| JS 堆 | 12→24MB，轮间 12.1→16.5→19.8→14.3 波动，非单调但趋势向上（与上下文累积一致） |

- **定性**：真实缺陷，非崩溃型。Chrome WebGL 上下文上限约 16/页，计数达 22 说明旧上下文已被浏览器强制回收，页面靠 `webglcontextlost → cleanup → fallback` 静态兜底未崩，每轮后 motion 仍正常重挂。真实用户反复跨 900px 边界（旋转屏幕/拖窗口）会持续累积直至被强制降级到静态演出。
- **最小修复建议（报告，不自行改码）**：`art-renderer.ts` 的 `cleanup()` 在 `renderer.dispose()` 后补 `renderer.forceContextLoss()` 促使上下文立即归还（或跨模式切换复用同一 canvas/上下文）；同时核查 +4/往返的未释放纹理对象（three.js 实例内部纹理）。修复后以本脚本复测判据：往返 20 轮存活纹理/上下文数趋于平台值。

## B. Lighthouse（每模式 3 轮，`lighthouse/lh-summary.json`）

| 指标（中位） | 桌面（preset=desktop，无节流） | 移动（模拟 MotoG，slow 4G ≈1.6Mbps/150ms RTT + 4x CPU —— 与 §10 慢网同型参数） |
|---|---|---|
| Performance 分 | 82（轮值 73/87/82，波动来自本地服务与图片优化缓存时机） | 64（三轮全 64） |
| FCP | 390ms | 4660ms |
| LCP | **1707ms ✓**（<2.5s） | **7113ms**（超 2.5s 目标） |
| CLS | 0.00014 ✓ | 0 ✓ |
| TBT | 205ms | 30.5ms |
| Speed Index | 1858ms | 4660ms |
| TTFB | 12ms | 13ms |
| 字节 / 请求 | 6.22MB（字体 15 个 0.49MB、图片 9 个 3.09MB、姿态 Fetch 10 个 1.7MB） | 3.09MB（图片 12 个 2.03MB、Fetch 4 个 0MB —— 无姿态） |

- **移动 LCP 7.1s 归因**：FCP 本身 4.66s——首个内容渲染就被 1.6Mbps 带宽 + 3MB 首屏字节拖住；TBT 仅 30ms 排除 JS 阻塞。属带宽/字节型，优化方向在首屏图片体积与优先级，不在动画。
- 首屏截图证据：`lighthouse/desktop|mobile-final-screenshot.jpg`；资源瀑布在 `lh-*-1.json` 的 `network-requests` audit。
- 0 个 404（两模式三轮）；`unused-javascript` 最大项 90KB（chunk `1_58k97rmk9qc.js`）。
- **不以分数当动画验收；无 INP 真实数据，不以 TBT 假称 INP 通过。**

## C. 弱网与缓存（§10，`weaknet/weaknet-results.json`）

**实录参数**：延迟 150ms、下行 209715 B/s（=1.6Mbps）、上行 41943 B/s、CPU 4x；对照组「普通」为无节流冷载。冷缓存 = 全新浏览器上下文；暖缓存 = 同上下文二次导航。

### C1. 慢网冷载（桌面，全新上下文）
- FCP 1344ms / LCP 3300ms / CLS 0.0001；**1s 定格截图 = 完整海报画面 + 全部标题导航文字，无白屏、无 spinner**（截图 `wn1-slowcold-t1s.jpg`，另存 t2.5/t4/t6/t10s 全时间轴；经视觉模型核验）；23.1s 才到完全演出载入（姿态逐张渐进）；45 请求 2.95MB；**0 个 ≥400**。
- 普通冷载对照：FCP/LCP 104/108ms。

### C2. 冷 vs 暖（同上下文重载）
| | 冷 | 暖 |
|---|---|---|
| FCP / LCP | 1344 / 3300ms | **504 / 504ms** |
| 净传输 | 2948KB | **23KB（-99.2%）** |
| 请求 | 45 | 44（其中 32 个缓存命中 transferSize=0） |
| 图片 | 8 个全量下载 | 无整图重下（总传输 23KB 为字节级证据；个别走了小体积再验证） |

### C3. 加载中交互 / 深链（慢网）
- 加载中快滚到底 + 倒滚回顶：全程可读、CLS 0、无横向溢出。**观察项（交 MOTION 矩阵复核，非 perf 结论）**：完全载入后 scrollY 归 0，加载中的滚动位置未保留。
- 深链 `/#chapter-game`：hash 保留、落定 `act=asternova`（targetProgress 0.82）、内容可读、0 个 4xx、FCP 1284/LCP 3484ms。附带现象：桌面动态模式 DOM 中无 `#chapter-game` 节点（`querySelector` 为 null，章节节点仅静态模式渲染），导航同步走数据层完成——功能正确，记录备查。

### C4. 失败注入（仅本浏览器 route 拦截 + 慢网）
| 注入 | 结果（截图 + 视觉核验） |
|---|---|
| 单张姿态 pose-02 失败 | 文字全部可读、无遮罩、无破图图标、布局完整、未崩溃；模式保持 six-act-story。人物是否显示两次视觉分析结论不一致（一次不可见/一次可见且正常），DOM 证据 imagesLoaded 2/7——**确定项为优雅降级可读**；注意 9s 快照本身处于慢网未载完状态 |
| `/_next/image` 优化全失败 | 导航/标题/alt 文字全可读、布局不破；主视觉区 ~90% 空白 + 小破图图标；演出模式不受影响（姿态走原始 webp 直链不经优化器） |
| 晚载 JS chunk `36yc77lpegfi6.js` 失败 | 完整回退 static 静态模式（scrollHeight 6709），全部正文可读 ✓ |
| 载入 2.5s 时断网 | **非白屏**：完整主视觉 + 文字 + 「正在准备画面」提示（视觉核验；DOM 探针 `textVisible:false` 为假阴性，其 h1 选择器在该阶段不适用，以截图为准）；恢复网络 + 刷新后完整六幕回归 ✓ |

### C5. 静态资源与布局稳定
- 全部场景（LH×6 轮 + 弱网×7 场景 + 深链）**0 个 404/≥400**；CSS/JS/字体/图片全绿。
- 懒加载顶开布局：全场景 CLS ≤0.0001，无横向溢出。

### C6. 移动端素材纪律
Lighthouse 移动三轮网络请求：**0 个姿态请求、0 个 manifest 请求**（桌面同法测得 6 姿态）；最重资源为 `reading-v1/ai.webp` 409KB 等 reading-v1 轻量素材 ✓。

### C7. 本次未覆盖（需线上/发布阶段补）
- 旧标签页跨部署继续滚动（需部署发生后的线上验证）；
- 真实 4G 空口 / 运营商劣化链路（本地模拟仅形状等效）。

## D. 诚实性声明（未测项，不计入通过统计）

1. **物理高刷**：60/120/144Hz 真机单帧预算未验证；headless rAF/ticker/合成器间隔均无 vsync 约束（rAF 中位 4.6ms、BeginFrame 中位 2.64ms），本文全部帧数据只代表调度与 CPU/GPU 提交能力。不宣称「稳定 120FPS」。
2. **真实设备**：无真实 Android Chrome / iOS Safari / WebKit；手机结论基于 Chromium CDP 触摸 + 4x CPU + DPR3 模拟。
3. **INP**：无真实交互延迟数据，未用 TBT 替代宣称。
4. 未人为锁帧、未删减任何已认可美术、未关闭动作换分。
5. Lighthouse 分数未用作动画验收依据。

## E. 遗留问题清单（按严重度）

| 级别 | 问题 | 建议 | 状态 |
|---|---|---|---|
| 中 | 模式边界切换 WebGL 纹理/上下文线性泄漏（§A4），长期反复切换会触发强制降级到静态演出 | `cleanup()` 补 `renderer.forceContextLoss()` 或复用上下文；以 leak-check.mjs 复测 | 已定位并给最小修复建议，**未改码**（红线） |
| 低 | 移动慢网 LCP 7.1s 超 2.5s（字节+带宽型，TBT 30ms 排除 JS） | 首屏图片体积/优先级优化（如首屏 reading 图 preload 或进一步压缩）；收益 vs 美术质量你拍板 | 仅建议 |
| 低 | CPU 受限设备（4x 模拟）rAF p95 41ms、8 个长任务，根因样式重算 | 见 §A3 修复方向 | 仅建议 |
| 观察 | 加载中滚动位置在完全载入后归 0；桌面动态模式无 `#chapter-*` DOM 节点 | 交 MOTION/UIUX 矩阵定性 | 已记录现象 |

—— 采样期间独占时段未并行重负载；全程零仓库改动、零部署、3108 进程未受扰动（结束时仍为 PID 18588，HTTP 200）。
