# PERFB · 性能基线与瓶颈分析报告（只测不改码）

> 任务：在发布版 `eae5d8b` 上重建本地基线，归因手机首屏瀑布与桌面 CPU 热点，
> 有界复测 899↔900 边界，产出带数据的最小优化清单供主控裁决。
> **本任务未修改任何产品代码**（worktree 隔离测量，见 §1.3）。

## 1. 基线重建

### 1.1 环境记录

| 项 | 值 |
|---|---|
| SHA | `eae5d8b`（fix(home): 渲染器单例复用修复跨界泄漏） |
| BUILD_ID | `mkbaNdIn4CJAcZzNZVZc0`（worktree 干净构建） |
| 预览 | `http://localhost:3208/`（standalone，静态资源拷贝验证 200） |
| Chrome | 154.0.8037.98（系统 Chrome，Playwright 1.62.1 驱动） |
| CPU / GPU | AMD Ryzen 5 5600 / NVIDIA RTX 5060（ANGLE D3D11） |
| 内存 | 15.9 GB |
| 手机口径 | 390×844 DPR3 触摸，1.6Mbps↓/150ms RTT + CPU 4x（对齐 Lighthouse mobile） |
| 桌面口径 | 1440×900 DPR1，CPU 4x 慢滚 trace |
| Lighthouse | 13.4.0（mobile 默认预设 / desktop preset） |

### 1.2 与历史 PERF（4dbbbc7，本地 3108）对照

| 指标 | 历史 4dbbbc7 | 本次 eae5d8b | 判读 |
|---|---|---|---|
| LH mobile 分数 | 64 | **64 / 64 / 64** | 持平 |
| LH mobile LCP | 7112ms 中位 | **8377ms 中位**（8430/8377/7422） | 模拟值偏慢 ~1.2s，见 §2.3 双源口径 |
| LH mobile FCP | 4660ms | **4682ms 中位** | 持平 |
| LH mobile 字节 | 3.09MB / 45 请求 | **3.09MB / 45 请求** | 持平（3088187B → 3088222B） |
| LH desktop 分数 | 82 | **92 中位**（88/92/92） | 略好 |
| LH desktop LCP | 1707ms | **1288ms 中位**（1689/1288/1290） | 略好 |
| 桌面 cpu4x 主线程 | 92%（6158/6680ms） | **94.7 / 95.6 / 96.0%** | 持平（同为饱和态） |
| UpdateLayoutTree | 1258 次 / 3059ms | **857/912/872 次 / 2912-2955ms** | 持平 |

**结论**：eae5d8b 相对 4dbbbc7 无性能回退；移动端 LCP 问题原样存在（历史遗留「移动 LCP 字节型优化」确认未解）。

### 1.3 并行会话干扰与隔离（重要，影响测量可信度）

- 15:59:59 一并行会话在主仓 `my-portfolio/` 重新构建 `.next`（BUILD_ID 被覆盖），
  导致 3108 共享实例与我的首轮 desktop Lighthouse 数据作废（15 个 `/_next/static` 404）。
- 该会话同时占用了 3108 端口并杀死了我的后台服务，且主仓工作树带有未提交改动
  （`ArtDirectedPreview.tsx`、`navigation.ts`——非 eae5d8b 纯净代码）。
- **对策**：`git worktree` 检出 eae5d8b 至
  `portfolio-release-followup-2026-10-11/perfb/worktree-eae5d8b/`，独立构建、独立端口
  **3208**、独立 prisma 数据副本，全部测量在隔离实例完成。任务书指定 URL 为 3108，
  因共享冲突改为 3208，测量口径（同构建产物同机器同节流）不受影响。
- 残留风险：并行会话的浏览器/构建负载可能间歇占用 CPU。已通过 Lighthouse
  benchmarkIndex（mobile 1666–2320）与多轮中位数控制噪声；三轮间波动均在正常范围。

## 2. 手机首屏瀑布归因（重点）

### 2.1 冷/暖缓存指标（CDP 实测节流，各 3 轮）

| 口径 | FCP 中位 (spread) | LCP 中位 (spread) | 传输字节 | 请求数 |
|---|---|---|---|---|
| 冷缓存 | 1368ms (1000–1488) | **5548ms (5532–5572)** | 2048KB | 39 |
| 暖缓存 | 972ms (952–972) | 1436ms (1372–1444) | 5.4KB（-99.7%） | 39 |

冷缓存字节构成（cold-r1）：Image 1092KB + Font 509KB + Document 213KB + Script 228KB + 其他 6KB。
暖缓存复访体验良好，无需优化。

### 2.2 LCP 元素与加载链路（CDP PerformanceObserver）

LCP 候选演进（cold-r1，慢网真实节流）：

| 时刻 | 元素 | 面积 | 说明 |
|---|---|---|---|
| 1488ms | `H1`（reading-copy 内文本） | 8,832px² | 首个候选 |
| 2280ms | `IMG` hero-poster（`/_next/image` w=1200 **avif** 48.8KB） | 85,410px² | 首屏海报就绪 |
| **5532ms** | `IMG` **about-poster**（`/_next/image` w=1200 avif 52.3KB） | **85,800px²** | **最终 LCP** |

**核心事实：最终 LCP 元素是第二幕的 about-poster，不是首屏 hero-poster**——它比 hero 大
390px²（渲染面积微差），在 5.5s 才渲染完成，把 LCP 从 hero 的 2.28s 拖到 5.53s。
hero-poster 本身不是瓶颈（213ms 发起、下载 2028ms 即 2241ms 时刻完成，avif 协商把
320KB webp 压到 48.8KB）。

### 2.3 带宽竞争归因（CDP Network + Lighthouse network-requests 双源交叉）

冷加载时间线（相对首请求，1.6Mbps 独占带宽 ≈ 204KB/s）：

| 时刻 | 资源 | 字节 | LH 优先级 | 竞争角色 |
|---|---|---|---|---|
| 0ms | HTML（ISR） | 213KB | VeryHigh | 3.56s 完成下载 |
| 210ms | Anton+Fraunces×2（preload） | 50KB | High | ~500ms 完成，非阻塞 ✓ |
| 213ms | hero-poster avif w=1200 | 48.8KB | High | 2241ms 时刻完成下载 |
| 823ms | 16 个 Script chunk | 228KB | Low | 最慢 4786ms |
| 1046ms | **12 个 Noto Serif SC 切片** | **471KB** | **VeryHigh ×12** | 1.3–3.6s 挤占带宽 |
| 1392ms | about-poster avif w=1200（lazy） | 52.3KB | **Low** | **下载 4116ms**（5508ms 时刻完成）← LCP 元素 |
| 1393ms | **reading-v1 ai/software/hardware.webp** | **990KB** | Low | 7.4–8.9s，`unoptimized` 直出 |

三条竞争链（按伤害排序）：

1. **reading-v1 三张能力章配图 990KB**：第三幕内容，却因 Chrome 慢网 lazy 预取窗口
   （viewport 下方约 2500px 内）在 1393ms 就开始下载，与 LCP 元素抢整整 5s 的带宽。
   源码 `ReadingStory.tsx:111` `unoptimized` 直出（418/340/231KB 原图），不经优化器。
2. **LCP 元素自身优先级倒挂**：about-poster 是 lazy（Low），12 个 CJK 字体切片全部
   VeryHigh——LCP 图在带宽队列里排在 471KB 字体后面，52KB 的图用了 4116ms 下载
   （独占带宽只需 ~260ms）。
3. **12 个 CJK 字体切片**：`noto-serif-sc-600.css` 101 片 unicode-range 机制本身按需
   （只拉 12 片），加载机制健康，但 VeryHigh 优先级 × 471KB 在慢网首屏是最大的
   单一竞争者。`renderBlockingStatus=non-blocking`（swap 生效）不阻塞渲染，只抢带宽。

### 2.4 双源口径说明（为什么 LH 报 8.4s 而 CDP 实测 5.5s）

- Lighthouse 13 simulate 模式：无节流加载 + 模拟推演，对慢网排队/优先级建模保守 → LCP 8.4s。
- CDP `Network.emulateNetworkConditions` 真实节流 → LCP 5.5s。
- 两者都是有效证据：**真实弱网用户体验区间 ≈ 5.5–8.4s**，优化目标以 CDP 实测为准
  （LH simulate 的分项归因如优先级仍然准确，本报告双源已交叉印证）。

## 3. 桌面 CPU 热点归因（CPU4x 慢滚 trace ×3 + hook 探针 ×1）

### 3.1 总量指标（3 轮一致）

| 轮 | 主线程利用率 | UpdateLayoutTree | ULT 占 trace |
|---|---|---|---|
| r1 | 94.7% | 857 次 / 2913ms | 44% |
| r2 | 95.6% | 912 次 / 2956ms | 44% |
| r3 | 96.0% | 872 次 / 2911ms | 44% |

滚动 6.7s 内 ULT **128–137 次/秒**（≈每帧 2.1 次样式重算）。关键结构：
**elementCount 中位数 = 1**（p95=273）——绝大多数是「单元素微型重算」被高频触发，
不是整树重算。FireAnimationFrame 1056 次（r1）/ FunctionCall `t@42rpt0hhr6qle.js`
2423ms（282 次，最大 57ms）为最大 JS 热点。

### 3.2 失效原因归因（invalidationTracking，3969–4199 条/轮）

| 失效源 | 次数(r1) | 说明 |
|---|---|---|
| `Inline CSS style declaration was mutated` | 1609 | 每帧 JS 写内联 style |
| ├─ `IMG.motion-band-front` | 273 | 角色图层位图变换 |
| ├─ `I.motion-progress-fill` | 208 | 滚动进度条 scaleX（`complete-motion.ts:69` 每帧写） |
| `Attribute`（元素属性变化） | 955 | 其中 `g.capability-hardware-layer` 402 次 |
| `Layout\|SVG changed` | 451 | SVG attribute 写入引发布局 |
| `Animation` | 219 | CSS/Web Animations 正常范围 |
| `story-chapter-mark` class | 100 | 幕标签 active 切换，低频正常 |

Layout 失效调用栈聚合：**`t@42rpt0hhr6qle.js:2` 697 次**居首（即 GSAP 渲染循环）。

### 3.3 hook 探针轮（同剧本，setAttribute/style/rAF 计数）

| 计数项 | 8.3s 内 | 折算 | 归属 |
|---|---|---|---|
| `g.transform` 写入 | **999** | 每帧 2.5 次 | GSAP SVG 图层变换（`art-renderer.ts`） |
| `g.data-svg-origin` | **499** | 每帧 1.2 次 | GSAP svgOrigin 缓存写入 |
| rAF 回调 | 801（6.6s） | **121/s** | **两套并行 rAF 循环**（60fps 只需 ~400） |
| `style.setProperty` | 446 | 每帧 ~1 | 内联样式（进度条等） |
| `A.aria-current` / `DIV.class` | 29 / 22 | 幕切换级 | 低频，正常 |
| `dataset.available` | 每帧写无值去重 | 小头 | `complete-motion.ts:71-72` |

### 3.4 归因结论

- **最大成本源**：GSAP timeline 驱动 SVG 图层（capability 三层 g + motion-band 角色层）
  每帧写 `transform` attribute（SVG attribute 走主线程样式+布局路径，无法合成器加速），
  叠加进度条/内联样式写入，形成每帧 2 次微型重算 × 全程 = 主线程 94–96% 饱和。
- **未见**「隐藏页面死循环」「非当前幕持续更新」证据：capability 层 402 次失效
  集中在其滚动窗内；invalidation 分布与剧本一致。
- **双 rAF 循环**（121 rAF/s）是次要可收敛项。

## 4. 899↔900 边界有界复测（8 轮）

口径：复核 `checks.json` 的 `Set` 去重法（context 对象去重计数，texture create/delete
配对），**修正了历史 leak-check.mjs 的 getContext 双层 patch 重复计数**（其 webglContexts
22 实为 11）。视口 899↔900 每轮跨越一次，等 `.motion-stage[data-loaded=true` 后采样：

| 轮 | contexts（去重） | textures（存活） | canvases | DOM | heap MB | mode |
|---|---|---|---|---|---|---|
| 1–8 | **1 / 1 / 1 / 1 / 1 / 1 / 1 / 1** | **10 ×8** | 2 | 386 恒定 | 12.0–12.4 | six-act-story |

**判定：PASS**。contexts 全程恒 1，textures 极差 0（历史 FIXLEAK 验收为 10↔13 锯齿，
本次更稳），DOM 节点与 heap 均无增长。eae5d8b 的渲染器单例修复在 8 轮压测下零泄漏。

## 5. 最小优化清单（按预期收益排序，供 PERFF 裁决，本次未实施）

> 原则：不动认可美术的视觉输出；每项给出验证口径。预期收益以 CDP 冷缓存 LCP
> 5548ms、桌面主线程 94–96% 为基线。

### P1 · 阻断 reading-v1 三图慢网预取（mobile LCP，收益最大、风险最低）

- **现状**：ai/software/hardware.webp 共 990KB（`ReadingStory.tsx:111` `unoptimized`
  直出），第三幕内容在冷加载 1393ms 即开始下载，与 LCP 元素竞争 5s 带宽。
- **改法**：三图改为 IntersectionObserver 挂载（或 `fetchpriority="low"` + 收窄预取）；
  进阶：去掉 `unoptimized` 走 next/image avif（约可再省 60–70% 字节，需验收画质）。
- **预期**：about-poster 下载窗从 4116ms 缩至 ~1.5s 内，冷缓存 LCP 5548→**约 3000ms（-45%）**；
  首屏字节 2048KB→约 1100KB。
- **风险**：滚动到第三幕时图片需现场加载（暖缓存无感；可保留渐显兜底）。
  **不动美术**（同图源）。

### P2 · LCP 元素优先级修正（mobile LCP，与 P1 叠加）

- **现状**：最终 LCP 元素 about-poster 是 lazy Low 优先级，排在 471KB VeryHigh 字体之后。
- **改法**：about-poster 显式 `fetchpriority="high"`（或 JS 预取 fetch→blob 提前）；
  同时给 hero-poster preload 补 `fetchpriority="high"`（当前 priority 生成 preload 无
  fetchpriority 标注，仅 High）。
- **预期**：与 P1 叠加后 LCP 进入 2.5–3s 区间；单独实施约 -15%。
- **风险**：几乎为零（纯优先级声明）。**不动美术**。

### P3 · 桌面 GSAP SVG transform 降频/换轨（CPU，收益大但触碰动效实现层）

- **现状**：`g.transform` 每帧 2.5 次写（999 次/8.3s）+ svgOrigin 499 次，主线程
  94–96% 饱和，ULT 占 44%；移动端 CPU4x 同样受益（同代码路径）。
- **改法**（三选一，按侵入度递增）：
  a. GSAP 配置 `force3D`/CSS transform 切换（SVG g 改 CSS `transform`+`will-change`
     走合成器，视觉等价）；
  b. 降频：变换幅度小于阈值时跳过写入（脏检查）；
  c. 只更新可见幕的图层（本已部分成立，见 §3.4）。
- **预期**：ULT 857→约 300 次内，主线程 94%→**70–80%**，滚动长任务（max 115ms）显著缩短。
- **风险**：**触碰认可美术的实现路径**（视觉输出必须逐帧对照不变，需 AUDITL 式像素
  验收 + 六幕矩阵回归）。属「实现等价替换」，不改视觉设计。

### P4 · 合并双 rAF 循环（CPU，小收益低风险）

- **现状**：121 rAF/s（两套循环：页面渲染循环 + GSAP ticker），60Hz 只需 ~60/s。
- **改法**：统一到 GSAP ticker 或单一 rAF 分发器。
- **预期**：每帧省一次回调调度+样例采集，主线程 -3~5%。
- **风险**：动效时序需回归验证；不动美术。

### P5 · 每帧写入的值去重（CPU，微小收益）

- **现状**：`dataset.available`（`complete-motion.ts:71-72`）每帧 setAttribute 无值比较；
  `game/gameCopy` 的 gsap.set 无 previousClose 式去重（同文件 44-46 行）。
- **改法**：加值比较守卫（同 previousClose 模式）。
- **预期**：每帧省 2-4 次属性写，ULT 总量 -5% 内。
- **风险**：零。不动美术。

### 不建议动（评估后收益小或有风险）

- **CJK 字体切片**：unicode-range 按需机制健康（101 片只拉 12 片），swap 非阻塞；
  降优先级无标准手段，删切片会破首屏中文渲染。留给 P1/P2 间接缓解（字节腾出后
  字体占比自然下降）。
- **desktop 资源总量 6.08MB**（pose 图 15 张等）：desktop 无慢网瓶颈（LCP 1.29s /
  score 92），压缩 pose 图有画质风险且收益场景不存在。
- **HTML 213KB**：ISR 产物，含内联样式/预渲染内容；瘦身收益 <100ms，不动。

## 6. 证据清单

全部位于 `C:\Users\TimeCraker\Desktop\my_workspace\portfolio-release-followup-2026-10-11\perfb\`：

| 文件 | 内容 |
|---|---|
| `weaknet-cdp.json` | 手机瀑布 6 轮全量（冷/暖×3，含每请求瀑布、LCP 历史、renderBlocking） |
| `lighthouse-3208/lh-mobile-1..3.json`、`lh-desktop-4..6.json` | LH 六轮原始报告（干净基线） |
| `lighthouse/`（3108 旧轮） | 首轮数据：mobile 3 轮有效作废存档、desktop 6 轮因并行构建污染已归档 `dead-server-archived/` |
| `cpu4x-r{1,2,3}-raw.json` + `-analysis.json` | 桌面 CPU4x trace 原始+分析（线程归因/invalidation/热点） |
| `cpu4x-r1-hooks-raw.json` + `cpu4x-meta-hooks.json` | hook 探针轮（setAttribute/rAF 计数） |
| `boundary-899-900.json` | 899↔900 八轮复测全数据 |
| `worktree-eae5d8b/` | 隔离测量用 worktree（含独立构建 `mkbaNdIn4CJAcZzNZVZc0`） |
| `dev.db.bak-eae5d8b` | 测量前 prisma 数据备份 |
| `html/home-desktop.html` | 首页 HTML 抓样（preload 声明证据） |

## 7. 验收口径与限制

- 测量服务 `http://localhost:3208` 为 eae5d8b 干净构建（worktree 检出、独立 BUILD_ID、
  chunk 200 逐项验证、DB 接口正常）；**未在 3108 完成测量**（并行会话占用，见 §1.3）。
- 冷/暖各 3 轮 + 边界 8 轮 + trace 3+1 轮 + LH 6 轮，全部达到任务书下限；三轮间
  波动（LCP 冷缓存 spread 40ms、util spread 1.3pp）表明数据稳定。
- Headless Chrome 模拟节流非物理弱网；未覆盖真实 Android 设备（与 PRODUI §10 未测项
  口径一致）。GPU 信息（RTX 5060/D3D11）已记录，headless 合成器行为不作为物理显示证据。
