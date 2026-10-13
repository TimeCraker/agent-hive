# PERFF2 · about-poster 发现时刻前移（主控裁决批准项实施）

> 任务：把 LCP 元素 about-poster 的发现时刻从 lazy 的 ~1504ms 前移到 HTML 解析期，
> 预载限定手机断点（桌面零浪费），同口径复测 + 回归。**未 commit**（4 文件留在
> 工作树：PERFF 的 3 文件 + 本次 CharacterHome.tsx），**未部署**。
> 预览：3108 重建（BUILD_ID `Don5E1OWxMEwZz2Nw0EHC`），服务运行中，
> 停服 `taskkill /PID <netstat 查 3108> /F`。

## 0. 结论

| 项 | 结果 |
|---|---|
| **冷 LCP** | 5436 → **1828ms**（中位，1760-1828，**-66.4%**）——优于判定线 4.6s，也优于预判区间 4-4.5s |
| 发现时刻 | about-poster 请求发起 **229.9ms**（PERFF 1504ms），单请求 52.3KB，img 处理时缓存命中零重复 |
| 冷 FCP / 请求 | 1168ms / 36 个——与 PERFF（1164/36）持平，无代价 |
| 冷字节 | 1058KB（+25KB：HTML 双 srcset 序列化 ~5.6KB + 字体/脚本传输轮间波动，请求结构不变） |
| 暖 LCP | 1484 → 1036ms（3 轮 992-1064，顺带改善，无退化） |
| CLS | **0**（弱网 6 轮全 0） |
| 桌面浪费 | **0 字节**：桌面口径冷加载 3 轮，about-poster 请求 0、模式=motion |
| 工程门禁 | typecheck ✓ / lint（改动文件 0 警告）✓ / 动作单测 **23/23** ✓ |
| 回归 | 手机延迟挂载/零桌面纹理/CLS=0 ✓；桌面六幕滚到尾 endDisplayed=1、反向回落 0.3 精确、急停收敛、纹理 9 ✓；899↔900 边界 3 轮 contexts 恒 1、textures 极差 0 ✓ |

**判定：采纳**（LCP 1828 ≤ 4.6s，且 CLS=0、桌面零浪费，无任何回归信号）。

## 1. 实施（1 文件，+24 行）

`src/components/character-motion/CharacterHome.tsx`：ring preload 旁新增一条
media 限定的响应式图片预载——`rel="preload" as="image" imageSrcSet=<与 img
逐字一致的 8 档 srcset> imageSizes="100vw" media="(max-width: 899px)"
fetchPriority="high"`。**img 本身不动**（保持 lazy + fetchPriority=high）。

与任务书设想的 `priority`/eager 手法的差异及理由：ReadingStory 在 SSR HTML 里
常驻（桌面动效要等 hydration 后才卸载它），img 若改 eager，桌面 preload scanner
会在卸载前就发起 1920w avif（~80-100KB）——media 限定 preload + lazy img 的组合
才是「手机前移 + 桌面零浪费」的干净解：手机字节提前进缓存、img 按原时序处理时
直接命中；桌面 media 不匹配零请求、lazy 图卸载前不加载。

### 踩坑记录（React 19 RSC hoisting 的非显然行为）

初版只给 `imageSrcSet` 不给 `href`：SSR 输出中该 link **降级到 body 原位**
（HTML 流 1/3 处，发现时刻打折）。归因：React RSC 的 preload 资源指令路径要求
`if (as && href)`（react-dom-server 源码 L dispatcher），imageSrcSet-only 的
link 无法指令化。**补 href（w=1200）后走通**：`fetchPriority=high` →
`highImagePreloads` → hoist 到 head 早期（实测 offset=858，3 字体之后、hero
preload 之前）；序列化时 imageSrcSet 优先、href 不进最终标记（head 里两份同
URL link 由浏览器去重，与 ring preload 现状同构）。

## 2. 同口径复测（PERFF §1 环境：3108 / 390×844 DPR3 触摸 / 1.6Mbps↓+150ms RTT / CPU 4x / Chrome 154，同 weaknet-cdp.mjs）

| 指标 | PERFF 后 | PERFF2 后 | 判读 |
|---|---|---|---|
| 冷 FCP | 1164ms（1092-1348） | **1168ms**（1156-1312） | 持平 |
| 冷 LCP | 5436ms（5432-5460） | **1828ms**（1760-1828） | **-66.4%** |
| 冷传输 | 1033KB / 36 请求 | 1058KB / 36 请求 | +25KB，结构不变（§0） |
| 暖 FCP | 1036ms（992-1036） | 1036ms（992-1064） | 持平 |
| 暖 LCP | 1484ms（1408-1504） | **1036ms**（992-1064） | -30% |
| CLS | 0 | **0** | 达标 |

LCP 1828ms 构成（cold-r1 瀑布）：preload 229.9ms 发现 → 52.3KB 在高优队列
（与 hero/字体并排）传输完成 → lazy img ~1.5s 被布局后处理、**缓存命中零二次
请求** → 解码绘制。LCP 元素 URL 确认为 `w=1200&q=75`（DPR3 实选档），
与预载一致。

## 3. 回归与边界

- **regression-perff.mjs**（全绿）：手机静止 3 占位/0 图/0 reading-v1/0 桌面纹理；
  接近第三幕挂载完成；占位→图交换 CLS=0。桌面六幕 scrollRange 至尾 displayed=1；
  反向回落 settled=target=0.3；急停后 displayed=target=0.42、纹理 9；零
  console/page error。
- **boundary-899-900.mjs**（3 轮，任务口径）：contexts **恒 1**、textures 恒 10
  （极差 0）、DOM 388 恒定、heap 0 增长，PASS。
- **desktop-zero-waste.mjs**（新增探针，3 轮）：桌面 1440×900 冷加载 + hydration
  后，about-poster 网络请求 **0**、模式=six-act-story——media 限定有效，
  桌面零浪费红线（>100KB 撤回线）远未触及。

## 4. 证据（`portfolio-release-followup-2026-10-11/perff2/`）

| 文件 | 内容 |
|---|---|
| `weaknet-cdp.json` | 冷/暖 ×3 全量（瀑布+LCP 历史+字节构成） |
| `regression.json` / `regression-perff.mjs` | 手机+桌面回归全量断言 |
| `boundary-899-900.json` / `.mjs`（ROUNDS=3） | 边界 3 轮遥测 |
| `desktop-zero-waste.json` / `.mjs` | 桌面零浪费探针（新增） |
| `server-3108.log` | 预览服务日志 |
| SSR HTML 验证 | link hoist head 早期（offset 858）、srcset 与 img 逐字 diff=true、img 保持 lazy |

## 5. 限制

- 与 PERFF 同限：headless 模拟节流非物理弱网；单实例串行执行。
- 手机 LCP 理论地板 = lazy img 的布局后处理时刻（~1.5s）+ 解码；再往下压需把
  img 也 eager（桌面必产生 ~80-100KB 浪费）或改挂载结构，均超出本任务批准范围，
  不再列杠杆。
