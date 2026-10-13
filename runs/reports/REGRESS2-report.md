# REGRESS2 · 线上相邻回归 + 手机性能复测报告

- 执行时间：2026-10-11 18:00 – 18:45（CST）
- 对象：`https://asterforge.top/`（线上 = `7bee441`，DEPLOY2 已验收发布；服务 PID 1078063 自 17:51:39 起未重启，BUILD_ID 两处 `nwHF9XWOcBX14YFXX9fCN`）
- 线上构建身份确认：首页 head 含 7bee441 三标记 —— about-poster `imageSrcSet`（8 档）+ `fetchPriority="high"` + `media="(max-width: 899px)"` 预载（href=w=1200 在位，已 hoist）；ring.webp 预载 `media="(min-width: 900px)"`（`homepage-r1.html`）
- 证据目录：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-followup-2026-10-11/regress2/`（截图 20 张 + JSON 结果 12 份 + 全部 .mjs 可复跑）
- **总结论：74/75 断言 PASS，唯一 FAIL 归因为 /explore 落地 hash 漂移（FIXUX 已记录的既有非确定行为，非 R2 回归，探针证明前进送达路径 100% 正确）。三项修复线上全部生效，相邻回归零破坏，线上冷 LCP 同口径 1780ms 不劣于本地 1828ms，日志零 P2021/5xx。无需任何处置。**

## 环境与网络实况（如实）

| 项 | 值 |
|---|---|
| 测试机 | Windows 11，系统 Chrome 154 headless（Playwright 驱动；stage27 1.63 / codex-runtime 双模块） |
| 服务器 | 腾讯云 `111.229.200.178`（北京），nginx + standalone |
| **本机网络路径** | **经本地 TUN 代理（fake-ip 198.18.0.246）**——系统 DNS 解析即为 fake-ip，绕行尝试仍入 TUN，无法从本机获得纯净直连；跨境/绕路体现在 TTFB 双峰 |
| TTFB 双峰 | 快路径 76–116ms / 慢路径 1.0–1.3s（probes-d.log 9 探测 + curl ×8），代理路由波动 |
| 服务器无网络基线 | 服务器本机 `curl 127.0.0.1:3000` TTFB **13ms** / total 41ms ×3（应用本身极快，本机测到的慢路径全是代理成本） |
| 测量窗口实况 | weaknet 12 轮命中快路径（navTTFB 28–112ms），Lighthouse 观察期 TTFB 34–40ms |

## A · 三项修复线上确认

### A1 R1 模式切换保留章节（36/36，截图 `a1-act{02,04,06}-*.png`）

| 用例 | 预期 | 实际 | 结论 |
|---|---|---|---|
| 第 2/4/6 幕 动态→静态 | 章节保留 / hash 一致 / 阅读区落同章 / rail aria-current / pin spacer 0 / 不闪回首幕 | act02:12/12、act04:12/12、act06:12/12 全过；minY 全部 > 目标位 30%（如 act06 minY=5633）；progress 带 p=0.217/0.590/1.000 与标称一致 | ✅×3 |
| 第 2/4/6 幕 静态→动态 | 章节保留 / pin=1 / 落点在章节进度带内 / 底部标签一致 | 全过（含 `04/06`·`06/06` 标签断言） | ✅×3 |
| pageerror | 0 | 0（全轮） | ✅ |

### A2 R2 旧锚点（19/20，截图 `a2-*.png`）

| 用例 | 预期 | 实际 | 结论 |
|---|---|---|---|
| 新标签首次 /#projects /#services /#vote | → /explore#<原hash> | 到达 URL 全对 | ✅×3 |
| **页内 hash 切换** ×3（上轮线上漏测路径） | → /explore#<原hash> | 到达 URL 全对（线上补齐） | ✅×3 |
| 抽查 #custom-dev（页内） | → /explore#custom-dev | 到达 URL 对 | ✅ |
| 前进/后退（#tech） | 后退回 / 不循环；前进回 /explore#tech | 后退 ✓ 停留 3s 无重定向 ✓；前进**到达断言读到 `/explore#rag-demo`** | ⚠️ 3/4 |
| chapter-* 深链接回归（#chapter-game） | 留首页第 5 幕 | chapter=4 | ✅ |
| 动态 hashchange（→#chapter-resume） | 跳第 4 幕 + hash 同步 | chapter=3、hash 同步 | ✅ |

**唯一 FAIL 归因（probe-forward.json）**：重放同一 back→forward 路径，init-script 在 /explore 新文档脚本运行前捕获 `initialHref=/explore#tech`，其后 4s 无任何改写、终态 `#tech` —— **前进送达路径 100% 正确**。a-fixes 那条 FAIL 是 explore 落地后自身 `useActiveChapter` 改写 hash（FIXUX §观察项已记录的非确定既有行为）在 goBack 前把**历史条目**改写成 `#rag-demo`，前进恢复的是被改写后的条目。与 R1/R2 改动无关，跳转送达本身零缺陷；漂移问题建议按 FIXUX 建议另开单。

### A3 回滚 runbook 可访问性与引用（不演练）

| 项 | 结果 |
|---|---|
| 本地 `7bee441:docs/runbooks/rollback.md` | 在位，19,495 字节（内容含安全原则：默认路径零数据丢失、DB 恢复独立条件章节） |
| 服务器部署副本 | `/home/ubuntu/my-portfolio/docs/runbooks/rollback.md` 在位（同尺寸，md5 `d2ae0417…`，mtime 17:51 随本次部署落位） |
| 回滚产物 | `/home/ubuntu/backups/portfolio-predeploy-20261011-174846/` 五件全在（dev.db / next-standalone.tar.gz / next-static.tar.gz / BUILD_ID.old / git-HEAD.old），`portfolio-predeploy-LATEST.txt` 已指向 |
| 新报告引用 | DEPLOY2-report §3 明确引用该 runbook 并弃用历史命令块 |
| 小观察 | runbook §1.1 例证 BUILD_ID 为 eae5d8b 代值（「当前均为 pzMAgpozcTii4Ryej1ld2」），文字会随部署过时——文档新鲜度瑕疵，不阻塞 |

## B · 相邻回归

### B1 手机 390/320 布局 + 零桌面纹理（`b1-mobile.json`，verdict 全 true）

| 断言 | 390×844@DPR3 | 320×568@DPR1 |
|---|---|---|
| 静止期桌面纹理（art-directed-v1）请求 | **0** | **0** |
| 静止期 reading-v1 请求 / 占位 / 图 / motion-character | 0 / 3 / 0 / 0 | 0 / 3 / 0 / 0 |
| 横向溢出（静止 & 触摸滚动后） | 0px / 0px | 0px / 0px |
| CDP 触摸滚动 | 移动 642px，无 JS 错 | 移动 >40px，无 JS 错 |
| 接近第三幕挂载 | 3 图全挂载（走 /_next/image），盒子零位移，CLS=0 | 同左 |
| 截图 | `b1-w390-heroo/capabilities`、`b1-w320-*.png` | |

### B2 桌面六幕导航 + 深链接 ×2（29/29）

- rail 逐幕跳转 ×6：aria-current=step、无横向溢出全过；滚到尾 displayed=1.000；反向回落 settled=target=0.300 精确；急停后纹理 9 张。
- **桌面零浪费保持**：冷加载全程 about-poster 请求 **0**（media 限定预载有效），模式=动效叙事。
- 深链接 ×2（全新上下文）：`#chapter-resume`→chapter 3 ✓、`#chapter-game`→chapter 4 ✓（截图 `b2-deeplink-*.png`）。

### B3 公开入口与 API

| 项 | 结果 |
|---|---|
| /explore /config /projects/game | 全 200 + 内容渲染（截图 `b3-*.png`） |
| /api/public/projects | 200，links=7（业务结构在位） |
| /api/votes | 200，投票对象数组 n=3 |
| /api/public/announcement、/api/files/categories | 全 200 + JSON（`b3-api.json`） |

### B4 六幕定格截图 ×2 幕 vs PRODUI 线上基准（eae5d8b，`imgdiff2.json` + `selfdiff2.json`）

| 对照 | diffRatio | 判读 |
|---|---|---|
| act1 桌面 vs 基准 | 0.04284 | **= 线上自身复拍噪声（0.04284）**——帧相位抖动，零退化 |
| act4 桌面 vs 基准 | 0.09956 | > 自身噪声（0.0074）；**图像分析结构级对照：同一场景**（大标题 ResumeAIX、底标 04/06·ResumeAIX、角色右侧伸臂指向简历文档、版式/文案元素齐全）→ 判「落定姿态微移」（7bee441 落定路径/写守卫变化所致的稳定微差），非美术损坏 |
| 手机 act1 vs 基准 | **0（maxDelta=0，像素级完全一致）** | 静态阅读渲染确定性完好，最强「无退化」证据 |

## C · 线上性能复测

### C1 三方对比（同口径：390×844 DPR3 触摸 / 1.6Mbps↓+150ms RTT / CPU 4x，冷/暖 ×3 中位）

| 指标 | PERFB 本地基线 eae5d8b | PERFF2 本地优化后 7bee441 代码 | **REGRESS2 线上 7bee441** |
|---|---|---|---|
| 冷 FCP | 1368ms（1000-1488） | 1168ms（1156-1312） | **1300ms**（1292-1380） |
| 冷 LCP | 5548ms（5532-5572） | 1828ms（1760-1828） | **1780ms**（1716-1852） |
| 冷传输 | 2048KB / 39 请求 | 1058KB / 36 | **1028KB / 36** |
| 暖 FCP | 972ms | 1036ms | **808ms**（788-828） |
| 暖 LCP | 1436ms | 1036ms | **808ms** |
| CLS | 0 | 0 | **0**（12 轮全 0） |
| LCP 元素 | about-poster（lazy 5408ms 落地） | about-poster w=1200 预载 | **about-poster w=1200**（`weaknet-online.json` finalLcpEntry）|

**判读：优化在线上完整兑现** —— 真实 TLS+HTTP 链路上冷 LCP 1780ms 不劣于本地 1828ms（spread 重叠），较 eae5d8b 基线 **-67.9%**；暖 LCP 808ms 好于本地（轮间一致性极强，spread 仅 40ms）。

### C2 真实网络（不节流，实况参考）

冷：FCP 240ms / **LCP 460ms** [436-464] / 1028KB / 36 请求；暖：FCP=LCP 180ms；navTTFB 28–112ms。真实宽带手机用户首屏体验远优于节流口径。

### C3 Lighthouse 移动+桌面 ×3（`lh-summary.json`，13.4.0，simulate 节流）

| 模式 | 中位 score | FCP | LCP | TBT | CLS | 字节 |
|---|---|---|---|---|---|---|
| 移动 | 63 | 5355ms | 6559ms | 50ms | 0 | 2043KB |
| 桌面 | 68 | 2836ms | 2939ms | 20ms | 0 | 5218KB |
| 对照 PERF 本地（3108） | 移动 64 / 桌面 82（LCP 7112 / 1707） | | | | | 移动 3088KB / 桌面 6223KB |

判读（如实，不粉饰）：
- **移动分持平（63 vs 64）**：LH 分数由字节主导——观察期拉入 below-fold 阅读图（resume-plate 391KB + mascot-point 213KB + mascot-present 209KB + works-v1 ~202KB，合计 ~1MB，LH bytes 2043KB vs CDP 冷加载 1028KB 的差异全在此）。PERF 本地 LH 同行为（3088KB），**既有非回归**；字体 496KB 已由主控裁决不动。优化收益体现在 LH 之外的真实 LCP（1780/460ms）与 TBT 50ms。
- **桌面 -14（68 vs 82）**：归因网络环境——本地基线 0ms 网络，线上经本机代理（观察 TTFB 34-40ms 但 Lantern 模拟串行化放大代理方差），且桌面字节 5218KB（动效纹理）本就重。CDP 实测与 rAF 健康均无退化信号，判环境差而非站点退化；服务器本机 TTFB 13ms 佐证。

### C4 桌面慢滚健康抽样（一轮，`raf-health.json`）

12s 0→1 连续滚动（CPU 4x）：2533 帧无停顿——P50 4.5ms / **P95 4.6ms / max 90.9ms / >50ms 仅 2 次 / >100ms 0 次**；face=0 全程、drawn +646、纹理 9、终态 displayed=1.000。（headless 无 vsync 上限，帧间隔绝对值仅作停顿检测用。）脚本内 4 条 `ERR_FAILED` 为我方 abort 埋点请求所致——不屏蔽复测 console/request 失败 **0**（归因闭环）。

## D · 日志与健康

| 项 | 结果 |
|---|---|
| journalctl 17:51:39–18:40 | 17 行；**P2021=0、5xx=0、`Cannot find module`=0** |
| 服务进程 | PID 1078063 未重启（etime 连续），BUILD_ID 根/standalone 两处一致 `nwHF9XWOcBX14YFXX9fCN` |
| 短时探测 3 端点 × 3 轮 | 全 200（`probes-d.log`）：`/` ttfb 105-117ms、API 76ms-1.04s、/explore 104ms-1.34s（双峰=代理路由） |
| 新增日志观察 | 2 条 `Server Reference ID ... "x"`（18:24:44，Next server action 探测特征；本会话流程零 server action 调用，判外部扫描噪声，无 5xx 关联，不阻塞） |
| 资源 | mem 1849/3723M（DEPLOY2 时 1414M，测试流量常态波动）、磁盘 5.5G 可用（持平） |

## 红线自查与副作用披露

- 全只读：未登录、未投票（仅 GET）、未发邮件、未触发下载计数、未演练回滚、未动仓库（my-portfolio 工作树 0 变更）。服务器侧仅只读命令（journalctl / ls / cat / curl / sqlite `mode=ro` SELECT）。
- **埋点副作用（如实披露）**：AnalyticsEvent 在 17:58–18:37 窗口新增 **149 条**——主要来自性能/Lighthouse/验证页等未屏蔽埋点的自动化加载（功能测试脚本已 route.abort 埋点，abort 发送前拦截、服务器不记）。
- **零写库旁证**：AdminAuditLog 总数 312 与 DEPLOY2 部署后一致（max createdAt=部署脚本自身的 401 探测）；dev.db 未被本会话写入（除埋点表）。
- 密钥仅引用路径，未输出内容。

## 未测真机清单（维持，不冒充）

1. 真机触摸滚动 / 惯性（iOS Safari、Android Chrome、微信内置浏览器）
2. 物理弱网（真实蜂窝/弱 WiFi）下的 LCP——本轮弱网为 CDP 模拟节流
3. 真 DPR≥3 设备的渲染与字体裁剪行为
4. Safari 引擎（WebGL/动效降级路径）
5. 系统级 reduce-motion 开关的真机表现（本轮为 Playwright emulate）
6. 1920×1080 等更大视口的视觉复核（PRODUI 已过，本轮按范围抽查 1440×900）

## 观察项与移交

1. **/explore 落地 hash 漂移**（非确定、既有）：本轮再次以「前进到达断言」形式显形；FIXUX 建议另开单，本轮维持该建议。
2. Lighthouse 移动分受 below-fold 阅读图 ~1MB 与 CJK 字体 496KB 主导——若未来要抬分，杠杆在图片尺寸策略（当前按需挂载已是最优挂载时机），字体策略已裁决不动。
3. 桌面 LH 分对网络环境敏感（代理+Lantern 放大），建议后续线上 LH 用 PSI/真实国内节点复测，或服务器同机房跑 LH 以剥离本机代理因素。
4. runbook 例证 BUILD_ID 会随部署过时（§A3 小观察），可在下次文档维护时改为「以实际读取为准」措辞。
