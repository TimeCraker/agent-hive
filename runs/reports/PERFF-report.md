# PERFF · 性能最小优化实施报告（按主控批准清单执行）

> 任务：实施 P1（基础+条件进阶）/ P2 / P4（尝试项）/ P5，与 PERFB 完全同口径复测。
> **未 commit**（3 文件 +68/−6 留在工作树待主控审查），**未部署**。
> 预览：主仓 HEAD `9a443e6` 重建 3108（BUILD_ID `xd6pbOJ31WxxOxPE7uVn5`，静态拷贝验证过），
> 服务**仍在运行**供主控复验；停服命令 `taskkill /PID <netstat 查 3108> /F`。

## 0. 结论速览

| 项 | 状态 | 关键数字 |
|---|---|---|
| P1 基础（阻断三图预取） | ✅ 已上 | 冷加载静止阶段 reading-v1 请求 **39→36 中 0 个**；冷字节 **2048→1033KB（-49.6%）** |
| P1 进阶（三图走 avif） | ✅ 画质门槛通过后已上 | 同源 965.6→57.8KB（**-94.0%**），4x 放大目检+像素 diff 见 §3 |
| P2（优先级标注） | ✅ 已上 | hero preload/img、about-poster img 均带 fetchpriority=high（SSR HTML 验证）；hero avif 完成时刻 2241→1414ms |
| P4（合并双 rAF） | ⛔ **撤回**（前提不成立） | 归因证据见 §4：第二循环=ScrollTrigger 内建空回调 hack + PERFB 探针自计数 |
| P5（写入去重守卫） | ✅ 已上 | ULT 次数 **857/912/872 → 707/680/591（约 -20%）**，invalidation 3969-4199→3477 |
| LCP 目标 | ⛔ 未达 2.5-3s | 冷 LCP 5548→**5436ms（-2%）**；剩余差距结构化归因见 §6（approved 范围内已无杠杆） |

工程门禁：typecheck ✓ / lint ✓（改动文件 0 警告）/ 动作单测 **23/23** ✓ / 生产构建 ✓ /
功能回归 6/6 ✓（慢滚/快滚/反向/急停/中载操作，零 console/page error）/ 边界 20 轮 PASS /
CLS 全程 0 / 手机零桌面纹理保持。

## 1. 环境与口径

与 PERFB §1.1 一致：同机（Ryzen 5 5600 / RTX 5060 / 15.9GB）、系统 Chrome 154.0.8037.98
（Playwright 1.62.1 驱动）、手机口径 390×844 DPR3 触摸 + 1.6Mbps↓/150ms RTT + CPU 4x、
桌面口径 1440×900 CPU 4x 慢滚 6s 剧本（同 trace-cpu4x.mjs）。差异：本次在**主仓当前 HEAD**
（含 FIXUX 9a443e6）构建，端口 3108（任务书指定），非 PERFB 的隔离 worktree/3208。

## 2. 弱网复测（冷/暖 ×3 中位数）

| 指标 | PERFB 基线（eae5d8b） | PERFF 后（9a443e6+改动） | 判读 |
|---|---|---|---|
| 冷 FCP | 1368ms（1000-1488） | **1164ms**（1092-1348） | **-15%** |
| 冷 LCP | 5548ms（5532-5572） | **5436ms**（5432-5460） | -2%，见 §6 |
| 冷传输 | 2048KB / 39 请求 | **1033KB / 36 请求** | **-49.6%**；reading-v1 三图静止阶段 0 请求 |
| 暖 FCP | 972ms（952-972） | 1036ms（992-1036） | +6.6%，轮间 spread 与基线重叠，噪声级 |
| 暖 LCP | 1436ms（1372-1444） | 1484ms（1408-1504） | +3.3%，spread 重叠（1408-1444），噪声级，如实记录 |
| CLS | 0 | **0**（6 轮全 0） | 达标（≤0.1 且首屏大图未隐藏） |

冷加载剩余字节构成（cold-r1）：HTML 208KB + 字体 497KB（15 文件）+ 脚本 223KB + 图片
99KB + 其他 6KB。三图从 HTML 中消失（SSR 为占位 div），Lighthouse 无滚动口径下同样不再计入。

## 3. P1 进阶画质对照（门槛证据，已通过）

对照物 = 优化器实际产物：`/_next/image?url=…reading-v1/<name>.webp&w=640&q=75`，
Accept: image/avif（DPR3 手机从 srcset 实选宽度；优化器钳到原图宽）。

| 图 | 原始 webp | 实际服务 avif | 字节 | 逐像素差（8bit） | >8 差像素 | >32 差像素 |
|---|---|---|---|---|---|---|
| ai | 407.9KB | 27.4KB | -93% | 均值 2.74 / 最大 103 | 10.03% | 0.34% |
| software | 225.4KB | 12.9KB | -94% | 均值 1.31 / 最大 69 | 2.76% | 0.07% |
| hardware | 332.3KB | 17.5KB | -95% | 均值 1.93 / 最大 85 | 6.21% | 0.19% |
| 合计 | 965.6KB | **57.8KB** | **-94.0%** | — | — | — |

放大目检（4x 中心裁切 + 全图并排，证据 `avif-compare/*-crop4x.png`/`*-side-by-side.png`，
双模型独立审 + 本人复核）：正常查看尺寸下无可辨差异；4x 下可见极细线轻微柔化与高对比
边缘微弱振铃（任何有损重压缩的预期形态），无色带、无色偏、无块效应。**判定：可接受，
进阶版本落地**（同时保留基础版的挂载阻断——两者叠加：滚动到第三幕时也只拉 57.8KB）。

## 4. P4：撤回，附归因证据（raf-attribution.json）

PERFB 前提「页面渲染循环 + GSAP ticker 双 rAF 循环」**不成立**，三层证据：

1. **调用栈归因**（本探针给每个 rAF 调用抓栈，PERFB 探针只计数无栈）：
   - 空闲态 443.5 rAF/s = 两路各 220/s：`t@42rpt…js`（gsap ticker，驱动 draw）+
     `e@23lct…js:34320`。后者经源码比对 = **ScrollTrigger 内建 `_rafBugFix`**
     （`function e(){return eP&&requestAnimationFrame(e)}()`，GSAP 为 Firefox 重绘平滑
     故意保留的空回调循环，Enable 即启动，无公开配置可关）。
   - 页面自己的渲染循环只有一套：art-renderer.ts / renderer.ts 均已 `gsap.ticker.add(draw)`。
2. **PERFB 的 121 rAF/s 复刻**：1145 次/6.67s = ticker 419 + rafBugFix 419 + **探针自己的
   滚动驱动循环 296**（`frame@eval`，PERFB hook 探针把测量剧本计进了页面循环）。
3. **成本实测**：rafBugFix 是每帧一个空回调（微秒级），删除它远低于 3% 收益门槛；
   patch 供应商内部换来的维护成本大于收益。CPU4x 复测主线程 95.8/98.3/97.7%（基线
   94.7/95.6/96.0%）持平，佐证此类改动无可见收益。

**处置：不实施任何代码改动（无物可撤），归因修正写回本报告。**

## 5. 桌面 CPU4x 慢滚 ×3（P5 效果 + 回归）

| 轮 | 主线程利用率 | UpdateLayoutTree | 长任务(>50ms) |
|---|---|---|---|
| 基线 r1-r3 | 94.7/95.6/96.0% | 857/912/872 次（2912-2955ms） | max ≈115ms |
| 后 r1-r3 | 95.8/98.3/97.7% | **707/680/591 次**（2907-3019ms） | 47-48 个，max 117.8-156.6ms |

- ULT **次数 -20%**、invalidation 事件 3969-4199 → 3477：P5 帧级守卫跳过了冻结帧上的
  dataset/style 写入。util 与 ULT 总毫秒持平——符合预期，主导成本在 P3 范围
  （GSAP SVG transform 每帧写，主控已延后为独立专项）。
- 长任务 max 略升（115→157ms）在轮间波动内（本机 r1-r3 自身 117.8-156.6），判噪声；
  剧本行为回归全绿（见 §7），不构成回归证据。

## 6. 剩余差距如实记录（LCP 为何停在 5.4s）

冷加载管道已无可剔除的大块（reading-v1 已出局），**传输地板成立**：
1033KB ÷ 204.8KB/s ≈ 5.04s 串行 + 首帧绘制 ≈ 5.4s。逐项：

1. **字体 497KB VeryHigh ×15**（CJK 切片机制按需，主控已裁决不动）是最大单一竞争者，
   最后一片 5024ms 才落地。
2. **HTML 208KB**（ISR 产物）流到 4161ms（瘦身已否决）。
3. **脚本 223KB** 至 5393ms。
4. **LCP 元素 about-poster 本身**：移动端它在首屏内（390×220px），但 lazy 发现于
   1504ms——fetchpriority=high 只能改排队权重，改不了发现时刻，其 52KB 到 5408ms 才落地。
   hero-poster 因 preload 提前发现+高优，完成时刻 2241→**1414ms**（P2 的可见收益）。

**下一个杠杆（超出本任务批准范围，仅列供裁决，未实施）**：about-poster 升级
`priority`（eager+preload，发现时刻 1504→~210ms，预判 LCP ~4-4.5s；代价：桌面动效模式下
会多预载一张 1200w avif ~50KB，需按 media 限定）。再往下只剩字体装载策略（已否决）。

## 7. 功能回归（regression.json，全绿）

- **手机（390×844）**：静止 3 占位/0 图/0 reading-v1 请求/0 桌面纹理（art-directed-v1 零下载保持）；
  滚动接近第三幕 → 3 图挂载并走 `/_next/image` avif 全部加载完成；**占位→图交换
  article 盒零位移、CLS=0**；快滚/反向/急停/回顶后图完整、模式正确。
- **桌面（1440×900 六幕动效）**：滚到尾 displayed=1；反向回落 0.3 与 target 精确一致；
  远跳+急停后 displayed=target（scrub 缓冲正确收敛）；纹理 9 张稳定；全程零 JS 错误。

## 8. 实施 diff 摘要（3 文件，+68/−6，未提交）

- `src/components/character-motion/ReadingStory.tsx`
  - 新增 `DeferredCapabilityArt`：IntersectionObserver `rootMargin:"400px 0px"` 挂载三张
    能力图；未挂载时渲染**同 class 占位 div**（CSS 定高 200/160px，交换零 CLS）。
    400px 依据实测布局（手机首图 top=1367px，844 视口 + 400 = 1244 < 1367，留 123px 安全边；
    初版 800px 曾在无滚动时误挂载，已修正并复测）。
  - 三图去掉 `unoptimized`，走优化器 avif + `sizes="(max-width:399px) 40vw,(max-width:899px) 45vw,28vw"`。
  - hero-poster 补 `fetchPriority="high"`（经 Next ImagePreload 路径，preload 链与 img 均生效，
    SSR HTML 已验证）；about-poster 显式 `fetchPriority="high"`。
- `src/lib/character-motion/complete-motion.ts` + `art-renderer.ts`：createCompleteMotion
  增加 viewport 参数与**帧级 key 守卫**（`progress/width/height` 变化才执行，模式对齐
  works-motion 既有 previousKey）。任务书的「previousClose 值比较」在帧粒度实现的原因：
  works-motion 与 complete-motion 同帧双写 game/gameCopy/link 层，逐写值比较会在
  works-motion 重写后放行过期值（视觉回退）；帧级 key 与双写者的活跃条件（均为
  p/width/height 的函数）精确同构，可证明安全。首帧哨兵值保证挂载即执行。

## 9. 899↔900 边界 20 轮（最终候选判据，Set 去重口径）

| 轮 1-20 | contexts | textures | DOM | heap |
|---|---|---|---|---|
| 全部 | **1（恒定）** | **10（极差 0）** | 386 恒定 | 11→14MB 平台 + 周期 GC 锯齿（25↔13），非线性增长 |

**判定：PASS**（强于 PERFB 8 轮口径；渲染器单例在 20 轮压测下零泄漏）。

## 10. 证据清单

`C:\Users\TimeCraker\Desktop\my_workspace\portfolio-release-followup-2026-10-11\perff\`：

| 文件 | 内容 |
|---|---|
| `weaknet-cdp.json` | 弱网 6 轮全量（冷/暖×3 瀑布+LCP 历史） |
| `cpu4x-r{1,2,3}-raw/-analysis.json` | 桌面 trace 原始+分析（util/ULT/长任务/invalidation） |
| `boundary-899-900.json` | 边界 20 轮全量遥测 |
| `raf-attribution.json` | P4 归因探针（rAF 调用栈计数，idle+sweep 复刻） |
| `avif-compare/`（summary.json + 9 PNG + 3 served.bin） | 画质对照：像素 diff 汇总、并排图、4x 裁切、实服务字节 |
| `layout-offsets.json` / `layout-offsets.mjs` | 三视口布局实测（rootMargin 依据） |
| `regression.json` / `regression-perff.mjs` | 手机+桌面回归全量断言 |
| `*.mjs`（weaknet/boundary/trace/analyze 复制自 perfb，端口改 3108） | 可复跑口径 |
| `server-3108.log` | 预览服务日志 |

## 11. 验收口径与限制

- 全部测量在 3108 单实例串行执行（无并行会话干扰；PERFB §1.3 的教训）。
- 暖缓存中位 +3.3%/+6.6% 的波动为轮间噪声（spread 与基线重叠），已如实记录，不主张改善。
- Headless 模拟节流非物理弱网（与 PERFB §7 同限）；未跑 Lighthouse（任务口径为 CDP 实测）；
  `test:ui` 未跑（13 视口扫描器与本改动无关，真页面核对已由 regression 覆盖）。
- avif 画质判定含主观成分，4x 放大证据已归档，美术终审权在用户。
