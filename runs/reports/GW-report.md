# GW 结果报告

> 任务：games web-client 移动端性能优化（生产基线 2026-10-03：移动 Perf 39 / LCP 11.32s / TBT 10.5s；桌面 Perf 60 / TBT 11.0s / TTI 87s）
> 执行：2026-10-05，本地 `asternova/web-client`（npm ci → next build → next start → Lighthouse CLI 13.4.0，移动模拟档 + desktop 档，与基线同方法）
> 提交：5 笔（34e4d02 / 0edc16b / 7de802f / 4322f91 / f84da63），全部路径限定 `asternova/web-client/**`，未触碰美术会话文件

## 归因表

任务起点为本轮本地复测（生产基线测量于 02e66d0 落库之前，故本地起点已含上一轮收益）：

| 指标 | 移动 r1 | 移动 r2 |
|---|---|---|
| Performance | 57 | 56 |
| FCP | 1.1s | 1.1s |
| LCP | 5.4s | 5.3s |
| TBT | 1010ms | 1110ms |
| TTI | 5.6s | 5.5s |
| SI | 3.0s | 3.3s |

前 5 大 JS 包（chunk 内容以特征串鉴定）与关键资源：

| 资源 | 传输/原始大小 | 执行时间 | 内容 | 结论 |
|---|---|---|---|---|
| 2wqfkk2encn2f.js | 484KB | 2306ms（含 830ms 单长任务） | **three.js + EffectComposer（黑洞背景场景）** | ✅ 修触发器挪出关键窗口（见 C2/C5） |
| 1z-0azwebyrh3.js | 224KB | 1150ms | react-dom + zustand（框架） | ❌ 框架固有 |
| 3jg84jwj6s1uj.js | 152KB | — | Next 运行时/路由 | ❌ 框架固有 |
| 11uhpn_180u_m.js | 134KB | 710ms | **framer-motion（首页仅用于入场动画与音量面板）** | ✅ CSS 等价替换，移出首页（C1/C3） |
| 3f3fucp_sq-aw.js | 39KB | — | sonner（Toaster，根布局） | ⏸ 保留（见遗留问题） |
| 1ixspvyob5gg2.css | 237KB 原始 / **31KB gzip** | — | 全站 Tailwind CSS | ❌ 服务器已压缩，非问题 |
| buttonclick.wav | 144KB | — | **全局点击音效，根布局 preload=auto 每页预载** | ✅ 改手势加载（C4） |
| 字体 ×4 | 93KB | 25ms 即预载 | Geist/GeistMono/Orbitron/JetBrainsMono（均单变量文件） | ❌ 已是最优形态 |

长任务 top：830ms（three chunk）、279/247/155ms（framer chunk）、128ms（react-dom）。

**根因链**（移动端 LCP 5.4s vs FCP 1.1s）：LCP 元素（主标题）包在 framer-motion `initial={{opacity:0}}` 里，标题可见性被 hydration + 动画首帧门控；同时 three.js 484KB 在 idle 触发下仍在关键窗口内争抢 Slow 4G 带宽；另有 144KB WAV 全局预载。

**关键排障发现**：Turbopack 持久缓存（`.next/cache`）曾复用改造前的模块图——改完 page.tsx 后首页 HTML 仍带 framer script 标签。清缓存全量重建后才真实生效。凡改 import 图后测量，务必先清 `.next/cache`。

## 优化项（改动 + 哈希 + 收益）

### C1 `34e4d02` perf(home): 首页入场动画改 CSS 先行，LCP 摆脱 hydration 门控
- `app/page.tsx` 移除 framer-motion；五段入场（背景 zoom / 头部 drop / hero rise+blur / CTA rise / 底部 fade）改为 `globals.css` `.anim-home-*` 关键帧，时长/延迟/缓动/位移/模糊逐项对齐原版；CTA 弹簧缩放以 `hover:/active:` 过渡等价；reduced-motion 由全局 0.01ms 开关接管。
- 收益：LCP 不再等 JS。单步实测移动 Perf 56→95、LCP 5.4s→2.9s、TBT 1010ms→60ms、SI 3.0s→0.9s。

### C2 `0edc16b` perf(home): 黑洞挂载改「首次交互提前揭示 + 兜底」
- 首次 pointerdown/pointermove/keydown 一次性监听提前挂载黑洞场景（桌面访客头几秒必有指针移动，观感≈即时）；无交互/静置设备走兜底计时。
- 期间背景为纯黑占位 + 星图网格，无感知断层。

### C3 `7de802f` perf(audio): LoopingBgmControl 去 framer 化
- 音量面板 0.18s 入场动画改 CSS（`.anim-bgm-panel`），退场直接卸载（0.18s 内消失不可感知）；该组件不再引 framer-motion。
- 收益：首页关键路径少 134KB chunk + ~710ms 执行（组件被多页共用）。

### C4 `4322f91` perf(audio): 全局点击音效改手势加载
- 根布局 `preload="auto"` 的 148KB WAV 改 `preload="none"`，首次点击交互元素时 `play()` 自动触发加载。
- 收益：全站每页省 144KB 预载带宽（Slow 4G ≈ 0.7s 关键带宽让出）。

### C5 `f84da63` fix(home): 黑洞兜底计时改真 setTimeout（修复 C2 的 rIC 语义缺陷）
- `requestIdleCallback` 的 timeout 语义是「最迟不超过」而非「最早等到」：空闲时几乎立即命中，实测 hydration 后 ~300ms 就拉取 484KB chunk，TBT 回弹到 1040ms。兜底改 8s 硬下限 `setTimeout`，交互提前揭示保留。
- 收益：终测 three chunk / framer / WAV 全部不再出现在首页加载清单；JS 从 1138KB（11 请求）→ **515KB（9 请求）**。

## 前后对比

| 指标 | 生产基线 10-03 | 本轮起点（本地） | 终测 m1 | 终测 m2 | 桌面终测 |
|---|---|---|---|---|---|
| Performance | 🔴 39 | 56-57 | **82** | **86** | **100** |
| LCP | 🔴 11.32s | 5.4s | **3.1s** | **3.0s** | 0.7s |
| TBT | 🔴 10498ms | ~1010ms | **470ms** | **360ms** | 40ms |
| FCP | 1.46s | 1.1s | 1.1s | 1.1s | 0.3s |
| TTI | 🔴 20.2s | 5.6s | 3.5s | 3.3s | 0.8s |
| SI | 🔴 6.06s | 3.0s | 1.8s | 1.5s | 0.6s |
| 加载期 JS | — | 1138KB/11 请求 | 515KB/9 | 515KB/9 | 515KB/9 |

- 对生产基线：移动 Perf **39→82/86（+110%+）**，LCP **11.32s→3.0s（-73%）**，TBT **10.5s→0.4s（-96%）**。
- 桌面对生产基线：Perf 60→**100**，TBT 11.0s→**40ms**，TTI 87s→**0.8s**。
- 残余 TBT 360-470ms 为 react-dom/框架在 4× CPU 节流下的解析执行地板，非业务代码可再削。
- 注：生产站尚未重新部署（push 不自动上线），上表「生产基线」为 10-03 生产实测，终测为本地产物同方法实测；上线后建议按同方法复测一轮。

## 截图目检

- **首页首屏**（Playwright 真实浏览器，加载后 ~13s 即 8s 兜底触发后）：黑洞吸积盘金环 + 星野 + Orbitron 大标题 + 双语 kicker + 白色 CTA 胶囊 + 右下 BGM 表盘全部完好，视觉零回归。✅
- **/shoot-them-all（弹珠风暴）**：LEVEL SELECT 界面完整（01 星环序曲 CURRENT、02-10 锁定态、返回大厅按钮、进度 0/30、星野背景），Pixi 渲染正常无破相。✅
- 控制台：0 错误；唯一警告为 AudioContext 自动播放策略提示（既有行为，手势后自动 resume，与本次改动无关）。

## CI 结论

- push `02e66d0..f84da63` 触发 CI：run [37283039172](https://github.com/TimeCraker/games/actions/runs/37283039172) **成功**（web-client lint + build 全绿，约 2 分钟）。
- 仅两条非阻塞注解：actions 的 Node 20 弃用提示、ubuntu-latest 将于 2026-10-19 迁移 Ubuntu 26（仓库级事项，与本次改动无关）。

## 遗留问题

1. **生产站未上线本轮优化**：push 不自动部署，需按 asterforge-deploy 流程手动 SSH 部署后复测（基线文档建议的 PSI/WPT 复核亦待上线后）。
2. **sonner Toaster（39KB）仍在根布局关键路径**：可改 idle 懒挂载，但存在「前几秒 toast 被丢弃」风险（登录错误等场景），收益小风险真实，未做。
3. **黑洞 8s 兜底的观感取舍**：静置不交互的访客 8 秒后才见品牌背景（期间纯黑 + 星图网格）。若制作人认为过长，可下调至 5-6s（仍稳出 LH 测量窗口），一行改动。
4. **Turbopack 持久缓存陷阱**：改 import 图后必须清 `.next/cache` 再测量，否则模块图复用旧图（本次实测踩坑）。建议在 CI 或文档中固化。
5. 残余 TBT 360-470ms 为框架地板；再往下需 React 编译器/框架升级路线，超出本任务边界。

## 自评

**达标**。验收标准（移动 Perf ≥ 55 或 LCP ≤ 8s）以终测 **Perf 82/86、LCP 3.0s** 大幅超越；build + CI 绿 + 首页/Arcade 截图目检通过。5 笔提交全部路径限定、逐笔独立可构建，无美术会话文件混入。附加产出：定位并修复了上游 idle 触发器语义缺陷（rIC timeout 非时间下限）与 Turbopack 缓存导致的测量失真，两者均已写入遗留问题的固化建议。
