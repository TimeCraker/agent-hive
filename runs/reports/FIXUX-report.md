# FIXUX · 模式切换保留章节（R1）+ 旧锚点 hashchange（R2）

日期：2026-10-11 · 分支 `codex/character-motion-m1`（HEAD `eae5d8b` 之上，**未 commit**，工作区留改动待主控审查）
验收环境：本地 standalone 3108（BUILD_ID `bQSt2RV8vcFr_tSm7PBe4`，含本次改动，服务运行中）
证据目录：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-followup-2026-10-11/fixux/`
（截图 26 张 · 全部 1440×900 · `acceptance.mjs` 可重跑 · `acceptance-result.json` 机器可读结果 · `probe.mjs`/`probe2.mjs` 定向探针 · `db-backup-20261011/` 重建前双库备份）

## 改动清单（2 文件，+141/−42）

### `src/lib/character-motion/navigation.ts`
- 新增 `legacySectionAnchor(hash)`：12 个旧站锚点（intro/stats/footer/about/projects/services/custom-dev/hardware/rag-demo/tech/vote/contact **全集**）的共用解析函数（R2 的「抽出共用」要求）。

### `src/components/character-motion/ArtDirectedPreview.tsx`
**R1（模式切换保留章节）：**
- `toggle()`（原 :394）：presentation 路径**删除** `scrollTo(0)`、`targetProgress="0"`、hash 重写 `#chapter-hero`、`syncStoryChapter(root,0)` 四项无条件回首幕操作；改为在点击瞬间捕获当前章节存入 `restoreChapter` ref（点击时 `data-chapter` 必新鲜）。非 presentation（lab）行为不变。
- mount() 内新增章节解析（`firstSettle`/`motionMode`/`restore`/`hashIndex`/`live` 五元决策）：首次落定尊重 `#chapter-*` 深链接；同模式重挂载（899↔900 视口跨界等）维持原有 hash 门控与 `targetProgress` 精确续播（不回归 FIXLEAK 行为）；**跨模式**时依次取「toggle 捕获章 → 上次落定对齐的 hash → live `data-chapter`」。
- 静态分支落定改为**等 ReadingStory 挂载就绪再定位**（rAF 重试 ≤12 帧，等待期内消失则放弃），并以 `alignChapter()`（hash 重写 + `syncStoryChapter`）保证 hash / 页面内容 / rail aria-current / 底部标签四者一致；深链接路径行为不变（同一机制，目标同为 hash 章）。
- 动态分支按解析章节写 `dataset.targetProgress` + `pendingAnchor`，由 mountArtMotion 自带 resume 滚动 + 原 AnchorSettle effect（:277，**未改动**）落位——无新增 ScrollTrigger / pin spacer。
- **竞态守卫**：新增 `settleGeneration` 代数 ref——wheel/touchmove/keydown（既有 stop 监听三处）、`navigateChapter`、`toggle` 均使其自增并清 `pendingAnchor`；静态落定循环与 pendingAnchor 消费全部校验代数，用户主动滚动或再次切换后旧异步定位不再覆盖新操作。
- **media（prefers-reduced-motion）过渡路径**：跨模式时优先用「上次落定对齐的 hash」。根因（probe2 MutationObserver 实测）：mq 翻转瞬间浏览器先钳制 scroll 至 y≈1，静态 IntersectionObserver 在 mount() 有机会读取前就把 `data-chapter` 归 0；而 `alignChapter` 维护的 hash 不受钳制影响，是过渡期唯一可靠来源。
- WebGL 失败 catch 与 fallback 回调补 `alignChapter`：降级回静态时按当前章对齐 hash，不再落到陈旧锚点/顶部。

**R2（旧锚点 hashchange）：**
- 挂载 effect 与两个 hashchange 处理器（静态 `jumpToHash`、动态 `jump`）三处共用 `legacySectionAnchor`，命中即 `location.replace('/explore#<原hash>')`（replace 语义与首次进入路径一致：历史栈不增项、回退不循环）。
- `chapter-*` 深链接与动态 hashchange 原逻辑不动；/explore 侧 AnchorSettle 未改动。

## 验收矩阵（82/82 PASS，Playwright + 系统 Chrome 无头，1440×900）

### R1（截图 `r1-*.png`，数据见 acceptance-result.json）
| 用例 | 预期 | 实际 | 结果 |
|---|---|---|---|
| 第 2/3/4/6 幕 动态→静态 | 落同章 / hash 一致 / rail+标签一致 / pin spacer 0 / 无闪回首幕 | chapter 1/2/3/5 全对；hash=#chapter-{about,capabilities,resume,contact}；readingAt 同章；rail+标签同步；pin=0；切换全程 minY 均 > 目标位 30%（如 act06 minY=5633 > 3456） | ✅×4 |
| 第 2/3/4/6 幕 静态→动态 | 落同章 / pin spacer 1 / 落点在章节进度带内 | chapter 全对；pin=1；p=0.217/0.410/0.590/1.000（章节标称 0.217/0.410/0.590/1.000） | ✅×4 |
| 快速连续切换 ×3（第 5 幕发起） | 终态一致、无重复 pin、无崩溃 | 终态静态、chapter=4、hash=#chapter-game、落点 chapter-game、pin=0 | ✅ |
| reduce-motion 开→关、关→开（第 3 幕） | 双向保留章节 | 开→静态 chapter=2 落 chapter-capabilities；关→动态 chapter=2、pin=1（probe 实测 targetProgress=0.41、scrollY=4723 恢复原位） | ✅ |
| 深链接 #chapter-resume 后切换 | 保留第 4 幕 | 动态落定 chapter=3 → 切静态 chapter=3、落 chapter-resume、hash 一致 | ✅ |
| pageerror | 0 | 0（全轮次） | ✅ |

### R2（截图 `r2-*.png`）
| 用例 | 预期 | 实际 | 结果 |
|---|---|---|---|
| 新标签首次 /#projects /#services /#vote（回归） | → /explore#<原hash> | 三者到达 URL 全对 | ✅×3 |
| **已打开首页内** location.hash 切三锚点（此前漏测路径） | → /explore#<原hash> | 三者到达 URL 全对 | ✅×3 |
| 前进/后退（#tech） | 回退回 / 不循环；前进回 /explore#tech | back→/ 停留 3s 无重定向；forward 到达 /explore#tech | ✅×2 |
| 其他 legacy 抽查（#custom-dev、#tech） | → /explore#<原hash> | 页内 #custom-dev ✓；#tech 见前进/后退用例 ✓ | ✅ |
| chapter-* 深链接回归 | 留首页第 5 幕 | /#chapter-game → chapter=4 | ✅ |
| 动态 hashchange 回归 | 跳第 4 幕 + hash 同步 | #chapter-resume → chapter=3、hash 同步 | ✅ |

### 观察项（非本次范围，如实记录）
- **/explore 落地后 hash 漂移（既有、非确定）**：落地 1–2s 后 explore 页自身 `useActiveChapter` 可能把 hash 改写为可视区块（本轮采样：页内 #vote→#contact、前进 #tech→#about；同轮 fresh #vote 未漂）。对照证据：**直接全新加载 `/explore#vote`（完全不经过首页代码）同样复现漂移**（probe.mjs 第一轮漂、第二轮不漂）→ 与本次改动无关，属 /explore 页既有行为（AnchorSettle.tsx 注释自载「滚动途中 useActiveChapter 会把 hash 改写成路过的区块」）。跳转本身 100% 按原 hash 送达（到达瞬间 URL 断言全过）。

## 工程验证
- `pnpm run typecheck` ✅ · `pnpm run lint` 0 errors（69 warnings 与改前完全一致，均既有）✅
- 动作单测 `tsx --test scripts/character-motion/*.test.ts` **23/23**（较复核时 21 新增 2 个既有用例，无 skip/fail）
- 3108 重建流程按规：双 dev.db 备份 → 停服防 EBUSY → build → 先拷 .next/static 后起服（期间处置过一个 EADDRINUSE 半初始化僵尸实例：重杀 + 干净重启后 Ready）；重启后校验 served chunk 含改动（`/_next/static/chunks/41_*.js` HTTP 200 且含 explore# 逻辑）才跑验收
- AnchorSettle（:277 pendingAnchor effect）与 /explore 侧组件零改动；无新增 ScrollTrigger；renderer 单例机制未触碰

## 剩余风险与边界
- reduce-motion 过渡若发生在「用户在静态模式长时间自由滚动且从未导航/落定」的场景，保留的是上次落定章而非精确当前章（「尽量保留」口径；优于归零）。toggle 路径不受此限（点击瞬间捕获）。
- /explore 落地 hash 漂移为独立既有问题，建议另开单（R2 范围外）。
- 验收为无头 Chromium（系统 Chrome）；未覆盖真机触摸/Safari（与 REVIEW R4 口径一致）。
- 本地 `.next` 为验证构建；**未 commit、未部署**，服务器线上行为不变，待主控审查后统一处理。
