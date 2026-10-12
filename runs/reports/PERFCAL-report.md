# PERFCAL · 性能测试口径修正 + 线上真节流复测

日期：2026-10-12 · 只读线上，未部署，未改产品代码 · 证据：
`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-closeout-2026-10-12/perfcal/`

## 结论

1. **口径缺陷确认**：旧 `regress2/raf-health.mjs` 只在元数据写 `cpuRate: 4`（raf-health.mjs:82），
   从未创建 CDP session、从未调用 `Emulation.setCPUThrottlingRate`——"CPU4x P95 4.6ms /
   零停顿"是**未节流 headless 样本被误标**（其 avgFps 211 远超任何物理帧率，即为铁证）。
   已写更正说明 `perfcal/CORRECTION.md`；旧原始数据保留不删，不再作为 CPU4x 验收结论引用。
2. **真节流复测（桌面）**：CPU4x 真降速下 12s 慢滚三轮，rAF P95 中位 **34.8ms**（旧误标值
   4.6ms 的 7.6 倍），零 >100ms 停顿、零 >50ms 长任务——健康结论方向不变，但数值量级必须
   以本轮为准。主线程 busy ~90%、布局重算 ~5.3s/12.6s，CPU 预算紧张（线上尚无 ce0fc0c 绘制优化）。
3. **真节流复测（手机冷加载）**：LCP 中位 **1876ms**（范围 1752–3716），FCP 中位 1328ms，
   CLS 0；与独立复核（LCP 4756/1924/1916ms，中位 1924）形态一致：多数轮 ~1.8s，偶发一轮
   3.7–4.8s 波动。波动样本存在，"每次都在 1.8s 完成"不成立。
4. **测得版本**：线上 BUILD_ID `nwHF9XWOcBX14YFXX9fCN`（= 7bee441，**不含** ce0fc0c）。
   本轮全部数据测的是线上现状；ce0fc0c 部署后需 VERIFY3 复测终版，两版数据不得混用。

## 桌面压力：CPU4x 真节流三轮（1440×900，12s 0→1 慢滚）

口径：`Emulation.setCPUThrottlingRate({rate:4})` 经 CDP 真实生效；每轮预热至 9 张姿态纹理
就位并重置指标后测量；网络不节流；analytics beacon 以 204 应答。剧本与旧 raf-health 相同。

| 轮 | rAF P95 | rAF max | >100ms 停顿 | >50ms 间隙 | 主线程 busy | 布局重算 | 提交帧(Commit) | 长任务 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 36.0ms | 52.8ms | 0 | 2 | 90.3% | 3023 次 / 5255.8ms | 948 | 0 |
| 2 | 34.8ms | 55.3ms | 0 | 1 | 89.9% | 3238 次 / 5307.3ms | 1004 | 0 |
| 3 | 33.3ms | 52.0ms | 0 | 1 | 89.3% | 3129 次 / 5261.3ms | 981 | 0 |
| **中位** | **34.8ms** | **52.8ms** | **0** | **1** | **89.9%** | **5261.3ms** | **981** | **0** |

动作系统自报：drawCpuP95 中位 12ms、frameP95 中位 33.8ms、绘制增量中位 857、9 纹理、
结束进度 1.0、无 motionError、零 console 错误。

**帧率口径（必读）**：
- **rAF 回调速度 ≠ 显示帧率**。本轮剧本 tick 节奏折算 ~72.8fps——这只是 headless 无垂直
  同步下 rAF 派发的节奏，不是屏幕刷新率。
- headless trace 不产生 DrawFrame/BeginFrame 合成器事件，**提交帧以 trace `Commit` 计**
  （主线程向合成器提交新图层树，DevTools 帧轨道口径；与同流水线 Layerize/PrePaint 计数
  947–1004 完全互证）：中位 981 帧 / 12.6s ≈ **77.7fps 产出帧**。该值仍是实验室产出帧率，
  不是物理显示帧率。
- 全页 `FireAnimationFrame` 中位 2844 次 ≈ 剧本 tick 的 3.3 倍：页面存在多个 rAF 消费者
  （滚动剧本、动作系统、背景动画），与此前 rAF 归因探针的结论一致。
- 主线程 ~90% busy 但零 longtask（>50ms PerformanceObserver 口径）：任务被 rAF 分片切成
  <50ms 碎片，这是设计预期，不是测量矛盾。

## 手机冷加载：复核同口径三轮（390×844 DPR3 touch + CPU4x + 1.6Mbps/150ms + 禁缓存）

首屏观察期不滚动（记录 scrollY=0 佐证）；每轮全新 context + `Network.setCacheDisabled`；
LCP 元素三轮一致：`/_next/image?url=%2Fcharacter-motion%2Fabout-poster.webp&w=1200&q=75`（85800B）。

| 轮 | FCP | LCP | CLS |
|---|---:|---:|---:|
| 1 | 1676ms | 3716ms | 0 |
| 2 | 1328ms | 1876ms | 0 |
| 3 | 1316ms | 1752ms | 0 |
| **中位（范围）** | **1328 (1316–1676)** | **1876 (1752–3716)** | **0** |

**与独立复核分开呈现，不混算**（复核：portfolio-review-followup-2026-10-11/REVIEW.md，
同口径、同日不同批次）：

| 批次 | LCP 三轮 | LCP 中位 | FCP 三轮 | FCP 中位 | CLS |
|---|---|---:|---|---:|---:|
| 本轮 PERFCAL（10-12） | 3716 / 1876 / 1752 | 1876 | 1676 / 1328 / 1316 | 1328 | 0 |
| 独立复核（10-11） | 4756 / 1924 / 1916 | 1924 | 1656 / 1232 / 1260 | 1260 | 0 |

两批次形态一致：多数轮 ~1.8s，各有一次 3.7s / 4.8s 波动轮；波动入口均为 about-poster
图片链路，值得后续用瀑布定位，但本轮不扩大范围。

## Lighthouse（模拟节流，单列）

交接附带 Lighthouse 数据：**手机 63 分 / LCP 6559ms，桌面 68 分 / LCP 2939ms**（模拟节流，
Lab 口径）。与上文 CDP 实际节流数据**分属两种测法，不得互相覆盖**：不能用 1.8s 实测覆盖
Lighthouse 6559ms，也不能用 Lighthouse 否定实测。复核报告（REVIEW.md）同此结论。

## 未测（无设备，不冒充）

真实 Android Chrome、iOS Safari、触摸惯性滚动、横竖屏旋转、物理 120/144Hz 高刷显示——
均**未测**。上述全部结论仅覆盖 headless 桌面 Chrome 的实验室口径。

## 环境

- 线上：`https://asterforge.top/`，BUILD_ID `nwHF9XWOcBX14YFXX9fCN`（SHA 7bee441，
  不含 ce0fc0c；RSC payload `"b"` 字段唯一匹配提取）
- Chrome 154.0.8037.98 headless（Playwright 1.62.1 驱动，系统 Chrome）
- GPU：ANGLE (NVIDIA GeForce RTX 5060, D3D11) / WebGL 2.0；CPU：AMD Ryzen 5 5600
- 视口：桌面 1440×900@1x；手机 390×844@DPR3 isMobile+hasTouch
- 节流：CPU `Emulation.setCPUThrottlingRate rate=4`（两剧本均真实调用）；手机另加
  150ms RTT / 204800B/s 下行 / 86016B/s 上行 + 缓存禁用

## 产物清单（perfcal/）

| 文件 | 内容 |
|---|---|
| `cpu4x-desktop.mjs` | 桌面真节流慢滚脚本（修正后的口径载体） |
| `cpu4x-desktop.json` | 桌面三轮汇总 + 环境 + 中位数 |
| `cpu4x-desktop-r{1,2,3}.trace.json.gz` | 每轮完整 trace（含 Commit/布局/主线程事件） |
| `reanalyze-desktop.mjs` | 从已存 trace 补算 Commit/rAF 触发指标（未重测） |
| `cold-mobile.mjs` | 手机冷加载复核口径脚本 |
| `cold-mobile.json` | 手机三轮汇总 + 中位数/范围 + LCP 归因 |
| `CORRECTION.md` | 旧 4.6ms 数据口径更正说明 |

旧目录 `portfolio-release-followup-2026-10-11/regress2/` 一字未动。
