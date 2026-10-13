# ANCHOR · 旧业务页锚点稳定性修复报告

- **分支**：`codex/character-motion-m1`（基线 `5cf5a9b`，含 `ce0fc0c`）；**未 commit**，工作区改动待主控审查
- **改动面**：`src/components/ui/AnchorSettle.tsx`、`src/hooks/useActiveChapter.ts`（+207/−45，仅此两文件）
- **测试站**：本地 3108 standalone 生产构建（含 ce0fc0c + 本修复），`http://127.0.0.1:3108`
- **证据目录**：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-closeout-2026-10-12/anchor/`
- **结论先行**：两个现象同根——**AnchorSettle 释放锁之后的晚到布局位移无人纠正 + useActiveChapter 的 IO 章节竞赛在无锁时改写深链**。修复后验收矩阵 **20/20 PASS** + R1 回归 **8/8 PASS**。

---

## 一、复现数据与触发源结论

生产站复现（asterforge.top，锚点代码与 HEAD 同源于 `4dbbbc7`；取证脚本 `repro-tech.mjs` / `repro-vote.mjs`，analytics 全程拦截 204，只读）：

### 现象 1：`/explore#tech` 被改写（tech-hash-timeline.json）

| 路径 | 修复前结果 | 证据 |
|---|---|---|
| fresh 直达 ×3 | `#intro` / `#rag-demo` / `#rag-demo`，hash 改写 1/69/15 次 | `tech-hash-timeline.json` runs |
| 完整文档返回 ×3 | 1 次 `#tech` 保留、2 次被改写（`#about`）且位置错乱（scrollY 889 vs 9219） | 同上 fulldoc-back |

**触发链**（fresh-2 时间线，逐帧取证）：

1. `t=10829`：AnchorSettle 落定完美（#tech top=92 = scroll-margin，锁在）。
2. `t=10849`（释放帧）：锁消失的**同一毫秒**发生 `#tech→#rag-demo` 改写。原因：解锁在 `requestAnimationFrame` 回调里执行，而落定帧自己的 IntersectionObserver 回调在 rAF **之后**才派发——IO 拿到无锁文档。#tech 是幕间曲（INTERMISSION），不在 IO 监听清单（8 章 + 2 alias）内；落在 #tech 时监听带（rootMargin −20%/−70%）内最可见的旧章节是 rag-demo → 竞赛赢家改写深链。
3. `t=10849~11415`：**69 次 `#rag-demo↔#projects` 乒乓改写**（每 15-30ms 一次 replaceState）。放大器：`fonts.status` 在 t=10854 从 `loaded` 退回 `loading`（**第二波 CJK 字体子集**，晚到内容触发新 glyph 渲染）→ 布局 ±81/−700px 抖动 → IO 竞赛逐帧翻转，而写 hash 的副作用嵌在 `setActiveIndex` updater 里（React 重放 updater 会重复执行副作用）。

### 现象 2：`/explore#vote` 落点偏 81px（vote-offset-timeline.json）

生产 4 条件（normal/slow × viaHome/直接）**全部复现** top=177.1（delta=85.1px，与原证据 81.1px 同族；内容长度略异）。viaHome + normal 时间线：

| t (ms) | 事件 |
|---|---|
| 2144~3600 | 原生平滑滚动先落（水合晚：AnchorSettle 约 4.5s 后才挂载）；字体第一波交换把上方内容推高，#vote top 漂到 **−62.9** |
| 4642 | AnchorSettle `land()` 瞬时纠正 → top=**92.1**（✓ 完美） |
| 4652 | rAF 释放锁（原实现 land 后仅 1 帧即放） |
| **5081** | layout-shift：`<section#vote>` y 92→177（释放后 **426ms**，第二波字体/晚到重排把目标推走 +85px）——**释放后无任何纠偏机制** → 残留 85.1px |

### 位移源点名（shift-source.json，修复后构建上取证）

位移真实存在、与修复无关（修复使落点对位移免疫）：

- 文档顶部迟到的全局内容撑高 **+81px**（intro 自身 absTop 都 +81 → 顶部公告类异步渲染）；
- services→custom-dev 之间再 +237px（ServicesSection 激活展开）。
- 即「81px 家族」= 顶部迟到内容 + 字体第二波，不是底部钳制（原证据 distanceToBottom=1876px 已排除）。

---

## 二、修复内容

### `AnchorSettle.tsx`（落定引擎强化）

1. **有界落定后校验窗**（治现象 2）：最终 `land()` 后 1.5s 内逐帧比对目标 top 与落定基线（同步采样，不留 16mm 缝隙），漂移 >8px 即瞬时重落；**重落 ≤8 次、窗口 ≤1.5s、用户 wheel/touch/滚动键接管即终止**——无无限定时器。
2. **解锁顺序后移**（治现象 1 的释放帧竞态）：`rAF → setTimeout(0)` 后再解锁，落定帧的 IO 回调先于解锁执行，useActiveChapter 不再拿到无锁文档。
3. **hashchange 复用同一落定流程**（治页内点击偏移，验收 G 项暴露）：Navbar 章节链接的原生滚动按点击时刻布局定靶，途中位移无人纠正（#services 实测偏 81.3px）。挂载与 hashchange 共用 `settle(id)`，配**代数守卫**（新目标使旧流程含解锁整体失效；被取代者不删新代的锁）。
4. 键盘滚动（Arrow/Page/Home/End/Space）纳入用户接管取消。

### `useActiveChapter.ts`（hash 跟随三道门）

1. **赢家稳定期 250ms**：IO 竞赛翻转期间不写 hash（杀 69 次乒乓；到点重验赢家未再翻转）。
2. **显式导航武装（navArmed）**：hashchange/popstate（= 链接点击/地址栏/前进后退）后、用户主动滚动（wheel/触摸/滚动键/指针按下）前**禁写**——平滑滚动途经的章节不再抢写（实测点击 #vote 途经 projects 大段 ≥250ms，hash 被 `#projects→#contact` 两跳踩掉）。本 hook 与 AnchorSettle 的写入用 replaceState，不触发这两个事件、不会自解除。
3. **非武装期非章节深链保护**：#tech 等页面内非章节锚点，同样等用户滚动（直达/恢复路径无 hashchange，靠此门保护）。
4. `replaceState` 副作用移出 `setActiveIndex` updater（updater 纯净化，消除 React 重放放大）。

alias 兼容保持：#vote→contact、#hardware→custom-dev 解析到当前章节时不改写（原有行为，验收 B/G 证实 #vote 深链完整保留）。

红线自查：无无限定时器（所有窗口有界）、无永久锁地址（用户接管即释放）、不屏蔽任何章节导航（门只拦 URL 改写，导航点击/滚动/高亮全部照常）。

---

## 三、验收矩阵（本地 3108，含 ce0fc0c + 本修复）

`accept-anchor.mjs` → `accept-matrix.json`；`accept-r1-toggle.mjs` → `accept-r1.json`。

| # | 验收项 | 结果 | 数据 |
|---|---|---|---|
| 1a | 新标签直达 `#projects/#services/#vote/#tech` ×4 | **PASS** | hash 全保留；delta −0.2/0.3/−0.5/0.5px |
| 1b | 首页已打开设同组旧 hash ×4 | **PASS** | 同上（全部正确进入 /explore#X） |
| 2 | **#tech 前进后退 ×6（SPA，记录中间+最终）** | **PASS** | 6/6 最终 `/explore#tech`；中间序列干净（如 cycle2：`/config → #tech → /explore#tech`，techTop=92.4） |
| 2b | #tech 完整文档返回 ×3 | **PASS** | 3/3 `#tech` |
| 3 | 冷缓存（=1a）×4 | **PASS** | delta ≤0.5px，无钳制场景 |
| 3 | 暖缓存 ×4 | **PASS** | delta ≤0.5px |
| 3 | CPU4x+1.6Mbps+150ms ×4 | **PASS** | delta ≤0.3px；distToBottom 1547~11177px（远离文档底，非钳制） |
| 4 | wheel 主动滚动取消自动落定 | **PASS** | 落定 11184 → wheel +600 → 5s 后 11784（=落定+600，未被拖回；修复前测量误差系 Chrome 平滑滚轮动画中途读数） |
| 5 | 页内跳转 #services→#vote→#tech + 3s 静默 | **PASS** | hash 全保留，delta 0.3/−0.5/0.5px，3s 内改写 0 次（无循环）；修复前 #services 81.3px、#vote 被踩成 #contact +125.5px |
| 6 | R1：第 2/3/4/6 幕动态⇄静态双向 | **PASS 4/4** | 三态 hash 一致（如 `#chapter-about→#chapter-about→#chapter-about`） |
| 6b | R1：减少动态（reduce）下章节保留 | **PASS 4/4** | reduce 下设计即无模式切换按钮（motionAllowed=false），跳章后章节全保留 |

合计：锚点矩阵 **20/20 PASS**、R1 **8/8 PASS**。

> 过程记录：首轮验收 18/20——两个 FAIL（G 的 #services 81.3px / #vote→#contact，F 为测量误差）暴露出门设计缺陷与页内点击无兜底，据此补齐「显式导航武装 + hashchange 复用落定」二轮全绿。诚实起见此处保留一轮失败记录。

---

## 四、工程验证

- `tsc --noEmit` ✅；`eslint` 0 errors（69 warnings 为预存，改动文件无新增）
- 动作单测 `npx tsx --test scripts/character-motion/*.test.ts` **23/23** ✅（注：直接 `node --test` 跑不了这些无扩展名 TS import，非本次改动引入）
- 生产构建 ×2（修复迭代各一次）✅；standalone 重建流程按规执行（备份 dev.db 至系统临时目录 → 停服 → build → 先拷 static 再起服；Prisma cwd 陷阱用绝对路径 DATABASE_URL 规避，SSR 直出含真实投票项证实 DB 生效）
- 红线：未投票/上传/发消息/登录/写业务数据（analytics 全程 204 拦截；本地 dev.db 只读）；**未 commit**
- 服务现状：3108 standalone 保持运行（构建 `3r1g9rtwlf6ue.js` 含修复，可用 `grep anchorLock+hashchange+pointerdown` 复核）；dev.db 备份在系统临时目录 `dev.db.anchor-backup-20261012-103818`

## 五、残留风险

1. 稳定期 250ms + 武装门改变了「滚动中 URL 实时跟随」的粒度：用户**缓慢滚动**时 URL 更新延迟至章节稳定 ≥250ms（快速滚动原本也不会逐章写）。属预期收敛，非缺陷。
2. 非武装期直达**章节**锚点（#projects 等）理论上仍可能在极端布局抖动下被稳定赢家改写（hysteresis 已大幅收窄、验收未复现）；非章节/alias 深链（#tech/#vote）已完全保护。
3. `isChapterHash` 对未来的新页面内锚点（如新增非章节 section id）默认按「非章节深链」保护（用户滚动前不改写）——保守方向，不会产生踩写。
