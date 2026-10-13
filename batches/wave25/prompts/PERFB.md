# PERFB · 性能基线与瓶颈分析（只测不改码）

## 背景（复核 R4 + 任务书 §三）
历史 PERF 数据针对**本地 3108 + 旧 SHA 4dbbbc7**：手机模拟慢网 LCP 中位 7.113s / FCP 4.660s /
3.09MB；桌面 CPU4x rAF P95 41ms、主线程 92%、样式重算为最大 CPU 成本。这些**不是**发布版
eae5d8b 的线上性能验收。任务书：不能仅凭 TBT 低断言「纯带宽问题」。

## 任务（本任务不改任何产品代码）
### 1. 重建本地基线（当前 SHA eae5d8b）
- 预览可能已停：备份 prisma/data → 停 3108 归属进程 → `pnpm build` → 拷 `.next/static` 到
  standalone → 再启服务（顺序错会 404 chunk）
- 记录环境：SHA、BUILD_ID、Chrome 版本、视口/DPR、CPU/GPU、节流参数

### 2. 手机首屏瀑布归因（重点）
- 冷/暖缓存各 ≥3 轮（全新上下文=冷）：记录 LCP/FCP/字节/请求数中位数与波动
- **资源瀑布逐项**：首屏图片（hero-poster 等）的尺寸/格式/优先级（fetchpriority? preload?）、
  字体 15 个 0.49MB 的加载顺序与阻塞、关键 CSS、懒加载竞争（是否与 LCP 图抢带宽）
- 明确 LCP 元素是什么、其加载链路、可压缩空间（当前字节 vs 合理目标）
- 用 CDP Network + Lighthouse network-requests 双源交叉，不只看汇总分

### 3. 桌面 CPU 热点归因
- CPU4x 下慢滚 trace ≥3 轮：样式重算（UpdateLayoutTree ~52%）的**具体来源**——
  高频 dataset 写入（每帧 setAttribute？）、非当前幕的更新、隐藏页面循环、重复布局计算
- 列出 top 热点：函数/选择器/元素定位 + 每帧成本，评估哪些是可最小优化的（如降频写、
  仅可见幕更新）vs 哪些收益小不值得动

### 4. 899↔900 边界有界复测
- 当前 SHA 上 ≥6 轮（用**去重后真实对象数**，不重复 getContext 双计数错误；
  可参考复核的 checks.json 方法）

### 5. 产出
**带数据的最小优化清单**：每项含 现状数据 → 改法 → 预期收益 → 风险/是否会动认可美术。
排序后交主控裁决哪些进 PERFF。不实施任何代码改动。

## 环境
PLAYWRIGHT_MODULE=C:/Users/TimeCraker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright
CHROME_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe；PREVIEW_URL=http://localhost:3108/
证据：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-followup-2026-10-11/perfb/`

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PERFB-report.md`。
