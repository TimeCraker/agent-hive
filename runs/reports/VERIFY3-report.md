# VERIFY3 报告 · 线上核验与收尾证据（8b146a7 终版，全只读）

- 执行时间：2026-10-12 12:11 – 13:25（CST）
- 对象：`https://asterforge.top` = SHA `8b146a7826fae9da2ff18df02b007944bfc9d350`（BUILD_ID `3toA2-tKwJ24W1n0xYW1p`，与 DEPLOY3 发布一致；性能剧本 env 自动断言 buildId 唯一匹配非歧义，`cpu4x-desktop.json` / `cold-mobile.json` env 块）
- 结论先行：**12 项验收域中 10 项全绿**；2 项带发现收尾——① `#vote` 85.1px 偏移在**暖/快速加载路径残留**（原 81px 家族未完全消除，其余三路径 ≤0.5px 达标）；② **第 6 幕（contact）切静态章节丢失**（两次复现，掉落目标不定）。两者均为交互边界缺陷、不影响内容可用性；SVG 绘制优化**线上兑现且画面无退化**。无需回滚。
- 证据目录：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-closeout-2026-10-12/verify3/`（67 文件）
- 红线自查：只读（剧本内 analytics 全程 204 拦截；未投票/登录/写业务数据；SSH 仅只读命令）；my-portfolio 仓 `git status` 干净零改动。

---

## 1. 锚点终验（accept-anchor.mjs → accept-matrix.json，线上版 19/20）

| 组 | 验收项 | 结果 | 数据 |
|---|---|---|---|
| A | 新标签直达 #projects/#services/#vote/#tech ×4 | **4/4 PASS** | hash 全保留，delta 0.3/0.3/0.1/0px，lateHashWrites=0 |
| B | 首页已打开设同组 hash ×4 | hash 4/4 保留 | #projects/#services/#tech delta ≤0；**#vote delta 85.1px**（B 组判据只查 hash，位置偏移见 §1.1） |
| C | **#tech SPA 前进后退 ×6（≥5）**全程记录 | **6/6 PASS** | 最终地址全部 `/explore#tech`；中间序列干净（如 cycle2：`/config → #tech → /explore#tech`，techTop=92.4）；ANCHOR 修复线上生效 |
| D | #tech 完整文档返回 ×3 | 3/3 PASS | 全部 `#tech` |
| E warm | 暖缓存 ×4 | 3/4 | projects/services/tech ≤0.3px；**#vote 85.1px FAIL** |
| E slow | **慢加载（CPU4x+1.6Mbps+150ms）落点 ≤10px** ×4 | **4/4 PASS** | delta 0.3/0.3/**0.1**/0px；distToBottom 1795–11177px 全部远离文档底 |
| F | wheel 接管不被拖回 | PASS | 5s 后 11270 = 落定 10670 + 600 整 |
| G | 页内跳转 #services→#vote→#tech + 3s | PASS | delta 0.3/**−0.5**/0.5px，churn=0（页内 #vote 完美） |

### 1.1 #vote 专项（原 81px 偏移是否消除）：**部分消除**

| 路径 | 结果 | 判定 |
|---|---|---|
| 新标签直达（A，冷） | delta **0.1px** | ✅ 消除 |
| 慢加载（E slow） | delta **0.1px** | ✅ 消除 |
| 页内点击（G） | delta **−0.5px** | ✅ 消除 |
| 首页进入（B）/ 暖缓存复访（E warm） | delta **85.1px** | ❌ **残留** |

残留特征与 ANCHOR 报告修复前生产复现值**逐位一致**（top=177.1 / delta=85.1）；distanceToBottom=1880px 排除文档底钳制 → 同一根因（迟到内容 +85px 撑高）。推断：快速加载时 AnchorSettle 挂载早、落定早，**1.5s 有界校验窗在迟到内容渲染前已关闭**，窗后位移无人纠正；慢路径下位移落在窗内被纠正（E slow #vote 0.1px 佐证）。属修复窗口期边界，非 hash 改写（#vote 深链四路径全部保留）。

## 2. 切换回归（accept-r1-toggle.mjs → accept-r1.json；复核 r1-recheck.mjs → r1-recheck.json）：线上 6/8

| 项 | 结果 | 说明 |
|---|---|---|
| 第 3/4 幕 动态⇄静态三态 | PASS | 三态 hash 一致（#chapter-capabilities ×3 / #chapter-resume ×3） |
| 第 2 幕 三态 | 首测 FAIL → **复测 PASS** | 首测 `about→hero→hero`（跳章后 3.5s 即切）；复测等 5s 后三态全 `#chapter-about`。**线上时序敏感，非稳定缺陷**（本地同脚本 3.5s 全过，线上更慢） |
| **第 6 幕 三态** | **两次均 FAIL** | 首测 `contact→resume→resume`；复测（10s 采样序列）`contact→capabilities→capabilities`。**掉落目标不定、等 10s 不恢复**——切静态瞬间 pin 解除致文档变短、scrollY 被钳制到新 maxScroll 落在中部幕，静态模式按落点写 hash。**确凿缺陷**（9a443e6「切换保留章节」在文档底幕未完全达成） |
| reduce ×4 幕 | **4/4 PASS** | 减少动态下跳章章节全保留（#chapter-about/capabilities/resume/contact） |

## 3. 宽度与布局（layout-width.mjs → layout-width.json + 22 张截图）：全绿

- **五视口无横向溢出**：320/390/899/900/1440 全部 `scrollWidth ≤ clientWidth`（900/1440 为 −10px，滚动条宽度内缩，无溢出）。
- **手机 390 可用性**：四进度点（hero/about/capabilities/resumeaix）视口内配图 8/8 张次真实加载、损坏 0；项目入口命中测试通过（「04 · ResumeAIX」「05 · AsterNova」可点）。
- **六幕关键定格**：`act1-6-online.png`（gotoProgress 定格）+ `act1-6-baseline-style.png`（rail 跳章 + hover caption，复刻 fixui/capture-after.mjs 基准口径）——6/6 act 覆盖（hero/about/capabilities/resumeaix/asternova/contact）。

### 3.1 画面对照（imgdiff.mjs → imgdiff.json / diff-forensics.json；容差：RGB 单通道 >24）

| 对照 | 幕 | 超容差占比 | 定性 |
|---|---|---|---|
| **本轮线上 vs 10-10 基准**（同口径 1440×900 rail 跳章+hover） | act1 / act4 | **0.085% / 0.004%** | 像素级全等——口径复刻自证 |
| 同上 | act2 / act5(settled) / act6 | 5.4% / 4.5% / 2.4% | 噪声族（PRODUI 历史跨环境噪声基线 4.4–24%，当时结论即「动效相位差非美术退化」） |
| 同上 | act5 首测 | 36.1% → 静置 6s 后 **4.5%** | **假差归因闭环**：首测截于跳章缓动中途（progress 0.6856 < asternova 边界 0.74，worst 块线上为亮色空白 vs 基准暗色场景）；settled 后 progress 0.82 归位 |
| 同上 | act3（SVG 改动正体幕） | 无法进度对齐 | 跳章落点本身波动（两轮 0.3323 / 0.1114，起点与时序影响），改用幕内自洽替代（下行） |
| **act3 幕内双向到达自洽**（p=0.38/0.46，fwd vs rev） | capabilities | 4.4% / 8.0% | act/scene 数据一致（差 0.003/0.007）；SVG 场景完整、双向状态机自洽 |

**正反向定格覆盖**（任务书 ≥2 幕）：5 边界 pause（0.17/0.25/0.51/0.74/0.92）× fwd/rev 各 5 张 + act3 幕内 ×2 = **正向 13 幕次、反向 7 幕次**。数据层 act/pose/headX 全一致；边界点 act 一进一出（scene 差 0.004–0.009）与 pause-4 joints 差 0.02–0.03（像素差仅 0.45%，证实为缓动微差非画面残缺）。**结论：Codex SVG 改动（ce0fc0c）画面无退化**（headless 实验室口径）。

## 4. 899↔900 往返 12 轮（leak-boundary.mjs → leak-boundary.json）：全判据 PASS

| 指标 | 结果 | 判定 |
|---|---|---|
| webglContexts | 双计数全程恒 **2** → **去重恒 1**（口径达成） | ✅ |
| texturesLive | 4↔8 有界锯齿，末值 4 < 初值 8 | ✅ 平台 |
| domNodes | 387→388 恒定 | ✅ |
| canvases | 初始 1，首个往返后恒 2（收养 canvas + 隐藏 React 占位，FIXLEAK 设计行为） | ✅（判据修正见下） |
| pinSpacers | 恒 1 | ✅ |
| jsHeapMB | 10.6→22.4，max 25.5，GC 锯齿非单调 | ✅ |

判据修正披露：canvases 判据由「全程恒定」修正为「首轮后恒定」（FIXLEAK 已知设计：首次跨界复用产生隐藏占位 canvas 后恒 2）——离线重算 `samples.slice(1)` 全为 2，**未重测**；脚本同步修正。与 Codex 十轮资源检查（context 恒 1 / 纹理恒 13 / canvas 恒 2）同族。

## 5. 线上性能终测（PERFCAL 同法，buildId 断言 = 3toA2 非歧义）

### 5.1 桌面真节流 CPU4x 三轮（1440×900，12s 0→1 慢滚，CDP 真降速）

| 指标 | 本轮 8b146a7 线上 | PERFCAL 7bee441 线上 | Codex ce0fc0c 本地 | 判定 |
|---|---:|---:|---:|---|
| 绘制提交 CPU P95 中位 | **5.3ms**（5.6/5.3/5.1） | 12ms | 5.8ms | ✅ **−56%，与 Codex 本地对齐 → ce0fc0c 线上兑现** |
| rAF P95 中位 | **31.9ms**（31.9/31.9/31.8） | 34.8ms | 帧间隔 30.7ms | ✅ −8.3%，同向 |
| rAF max 中位 | 63.7ms | 52.8ms | — | 同族波动 |
| >100ms 停顿 | **0** | 0 | — | ✅ 持平 |
| 主线程 busy | 89.9% | 89.9% | — | 持平 |
| 布局重算 | 5275ms / 1243 次 | 5261ms / 3238 次 | 2853ms（另一口径） | 总时长持平，次数下降 |
| Commit 产出帧 | 1276（101fps） | 981（77.7fps） | — | 提高（绘制跳帧后提交节奏变化，方向性参考） |
| 长任务（>50ms） | 1 轮 1 次（50ms） | 0 | 2/0/0 | 同族 |
| 动作系统 | 9 纹理、结束进度 1.0、无 motionError、drawnDelta 1032 | 同 | 同 | ✅ |

### 5.2 手机冷加载三轮（390×844 DPR3 touch + CPU4x + 1.6Mbps/150ms + 禁缓存）

| 轮 | FCP | LCP | CLS |
|---|---:|---:|---:|
| 1 | 1324ms | 1644ms | 0 |
| 2 | 1272ms | 1816ms | 0 |
| 3 | 1272ms | 1824ms | 0 |
| **中位（范围）** | **1272** | **1816（1644–1824）** | **0** |

对比：PERFCAL（7bee441）LCP 中位 1876（1752–3716，含一轮 3.7s 波动）；独立复核（10-11）中位 1924（含一轮 4.8s）。本轮 **中位改善 −3.2%、范围收窄、无 3.7s+ 波动轮**；LCP 元素三轮一致（about-poster w=1200，85800B）。样本仅 3 轮，不宣称波动入口已根除（PERFCAL 曾建议瀑布定位，仍开放）。

## 6. 门禁复核引用 + 日志健康 + 探测

- **构建/单测（引用既有产物，不重跑）**：DEPLOY3——`next build` 成功、BUILD_ID `3toA2` 根/standalone 两处一致且 ≠ 旧值、部署后 `modified=0`（构建输入逐字节 = 8b146a7 的数学级证明）。Codex SVG 轮——`typecheck-final.log`（tsc --noEmit 0 错）+ `unit-final.log`（**23/23 pass**，1.19s）。ANCHOR 轮——tsc ✅ / eslint 0 error（69 warning 为存量）。
- **服务器日志健康**（server-health.sh → server-health.log，SSH 只读）：`portfolio-web` active、**NRestarts=0**、PID 1847068（etime 1246s，与 DEPLOY3 交接的 12:00:02 起跑一致，无重启）；自 12:00:05 起 P2021 / HTTP-500 / Cannot find module / EADDRINUSE / UnhandledRejection **全 0**；journal 该区间无常规输出条目（standalone 不打请求日志，静默正常）；内存 1819/3723MB、磁盘 5.1G 可用；`dev.db` 2,416,640B 与部署交接一致；BUILD_ID 复核一致。
- **短时探测 3×3**（probe-3x3.log）：服务器本机 ×3 = 200 @ 11–16ms；公网 3 轮 ×3 = **9/9 HTTP 200**，body 937204B 九次一致（版本稳定），耗时 2.1–14.6s（一次 14.6s 链路波动，服务端本机 16ms 佐证慢在公网段，非服务异常）。

## 7. 汇总证据清单（供主控写 HANDBACK）

| 文件（verify3/） | 内容 |
|---|---|
| `accept-anchor.mjs` / `accept-matrix.json` / `anchor-run.log` | 锚点矩阵线上 19/20 + #vote 专项四路径数据 |
| `accept-r1-toggle.mjs` / `accept-r1.json` / `r1-run.log` | 切换回归 6/8 |
| `r1-recheck.mjs` / `r1-recheck.json` | 第 2/6 幕复核（第 2 幕时序敏感 / 第 6 幕确凿缺陷） |
| `layout-width.mjs` / `layout-width.json` / `layout-run*.log` | 五视口溢出 + 手机可用性 + 六幕定格（4 轮迭代 log 全存） |
| `pause-fwd-rev.mjs` / `pause-fwd-rev.json` / `pause-run.log` + `pause-{1..5}-{forward,reverse}.png` | 5 边界正反向到达一致性 + 10 张定格 |
| `act3-bidir.mjs` + `act3-p{0.38,0.46}-{fwd,rev}.png` | SVG 幕内双向自洽 |
| `act{1..6}-online.png` / `act{1..6}-baseline-style.png` / `act{3,5}-baseline-style-settled.png` / `mobile-390-online.png` / `reshoot-acts.mjs` | 六幕定格与基准口径重拍（含 act5 假差归因闭环） |
| `imgdiff.mjs` / `imgdiff.json` / `diff-forensics.mjs` / `diff-forensics.json` | 像素对比 + 差异归因（位移搜索/块内容统计） |
| `leak-boundary.mjs` / `leak-boundary.json` / `leak-run.log` | 899↔900 ×12 轮资源核查 |
| `cpu4x-desktop.mjs` / `cpu4x-desktop.json` + 3 trace.gz / `perf-desktop-run.log` | 桌面真节流三轮（含 buildId 断言） |
| `cold-mobile.mjs` / `cold-mobile.json` / `perf-mobile-run.log` | 手机冷加载三轮 |
| `server-health.sh` / `server-health.log` | 服务器日志健康（SSH 只读） |
| `probe-3x3.log` | 公网 3×3 探测 |

## 8. 红线自查与副作用披露

- **只读**：所有 Playwright 剧本拦截 `**/api/analytics/**` 返 204（覆盖 fetch/XHR/beacon）；未投票/登录/上传/写任何业务数据；服务器侧 13 表 count 未动（dev.db 字节数与 DEPLOY3 交接一致）。SSH 会话仅只读命令（journalctl/systemctl show/ps/free/df/ls/cat/curl localhost）。
- **自动化副作用披露**：① 访问产生服务器 access/网络日志（正常只读流量）；② 截图经本工具 Read 通道自动上传第三方 CDN（ufileos.com）——工具链固有行为，画面为公开站点无敏感信息，本报告不依赖该通道出结论；③ 判据修正两处（leak canvases「首轮后恒定」离线重算未重测；layout 手机配图改多点视口内采样后重测），修正理由与数据均留档；④ verify3 脚本迭代产生的 4 份 layout-run log 全保留（含两次判据错误的 FAIL 记录，未删）。
- **真机未测清单（维持）**：真实 Android Chrome、iOS Safari、触摸惯性滚动、横竖屏旋转、物理 120/144Hz 高刷、真实蜂窝网络——本轮全部结论仅覆盖 headless Chrome 154 实验室口径。

## 9. 移交主控事项

1. **#vote 暖路径 85.1px**：建议归因至「AnchorSettle 1.5s 校验窗 vs 迟到内容渲染时序」（线上公告/字体第二波在窗后到达）；可选修法方向为校验窗内末次位移后再展期一次，属产品决策。
2. **第 6 幕切静态章节丢失**：与 §2 同族的「跳章/切换落点时序」问题（另见 act3 跳章落点波动 0.11–0.33 的观察）；建议并入同一修复议题。
3. 手机 LCP 波动入口（about-poster 链路偶发 3.7s+）：本轮未复现但样本仅 3，PERFCAL 的瀑布定位建议仍开放。
4. 上轮遗留（DEPLOY3 §8）：服务器 `.env.bak-seam-1843` untracked 残留、tarball 245MB 增长——维持待主控决定。
