# MOTION 报告 · 六幕动作与交互验收矩阵（本地 3108）

- **结论**：98/100 项 PASS，2 项 FAIL（均为产品真实缺陷，见 §6，MOTION 波次不修产品代码）。全部可自动化项已执行；真实手机 / Safari / 物理高刷列「待真机确认」（§7）。
- **范围**：总任务书 §6 脚本部分 + §7 交互矩阵 + §9 可自动化设备项。
- **被测构建**：分支 `codex/character-motion-m1` @ `8302135`（git clean，产品代码零改动），BUILD_ID `NcN87KpY1ZpyRiEWMCC8u`，预览 `http://localhost:3108/`。
- **红线遵守**：未 commit、未部署、未改线上、原交付脚本未动（fluidity 复制为发布变体只改输出路径；矩阵脚本为证据目录内新文件）。唯一环境处置见 §2.2（3108 重建，属任务书授权的预览恢复）。

## 1. 结果总览

| 部分 | 项数 | PASS | FAIL | 明细 |
|---|---|---|---|---|
| A1 `verify-home-completion.mjs` | 20 | 20 | 0 | 与上轮已知 20 项一致 |
| A2 `verify-fluidity.mjs`（发布变体） | 11 | 11 | 0 | 与上轮已知 11 项一致 |
| B 交互矩阵 · interaction | 17 | 17 | 0 | 慢滚/快滚/转场停住/人物/导航 |
| B 交互矩阵 · deeplinks | 22 | 21 | **1** | 动态模式同文档 hash 导航不响应（§6.1） |
| B 交互矩阵 · runtime | 6 | 5 | **1** | WebGL 初始化失败降级不完整（§6.2） |
| C 设备矩阵 · devices | 20 | 20 | 0 | 桌面 3 视口 + 手机 4 视口 CDP 触摸 + 平板 2 + 横屏 |
| C 引擎 · Edge | 4 | 4 | 0 | Edge（Chromium 内核）关键路径 |
| **合计** | **100** | **98** | **2** | |

设备/浏览器：Playwright headless Chrome 1440×900（桌面主力）等 11 种视口上下文；真实 CDP 触摸事件（`Input.dispatchTouchEvent` touchStart/Move/End 序列）；DPR 1/2/3；Edge 138（`msedge.exe`）。全部 phase `pageerror` 零页面错误。

## 2. 测试环境

### 2.1 路径与工具（实测）
- `PLAYWRIGHT_MODULE=C:/Users/TimeCraker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright` ✓
- `CHROME_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe` ✓；Edge：`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe` ✓

### 2.2 环境事件：外部中断 build 毁掉 .next，3108 已按授权重建
- 23:06（A 部分刚跑完）一次**未完成的 build** 清空了 `.next/static` 与 `.next/standalone/.next/static`（BUILD_ID 丢失、无存活的 build 进程，判断为其他并行会话残留）。后果：3108 上全部 `/_next/static/chunks/*.js` 500（text/plain），页面停在 `preparing=true` 降级态，B 部分首跑超时。
- 处置（任务书 §4/§6 授权范围内）：备份 standalone `prisma/data`（dev.db 8.5MB）→ 停止本项目预览进程 26776（它锁着 dev.db 导致首次重建 build `EBUSY` 失败；PID 来自 BASE 报告 §4，确认非他人进程）→ `pnpm build` 重建（exit 0）→ 按 BASE 惯例补拷 `.next/static`、`public`、`.env`、`prisma/data` → 隐藏窗口重启 3108（**新 PID 3104**，日志 `%TEMP%\portfolio-preview-3108\server.log`）→ HTML 200 + chunk 200（application/javascript）+ 动态模式恢复验证。
- **A 部分在重建后复跑**（20/20 + 11/11 与重建前一致），A/B/C 全部结果来自同一构建。`.next` 产物被 gitignore，git 工作区全程 clean。

## 3. A 部分 · 既有脚本（逐项）

A1 `verify-home-completion.mjs`（`PREVIEW_URL=http://localhost:3108`，`VALIDATION_OUTPUT` → 证据目录）：20/20，与上轮通过项数一致。覆盖：无 lab 控件泄漏、六章节正反导航 + aria-current、目录键盘焦点/Escape/遮罩关闭、目录跳转 + ResumeAIX 配置链接、contact hash 刷新、静态⇄动态切换、1920/1366 桌面、850/768/390/320 静态布局、reduce motion、/config 入口、lab 独立控件、canonical/noindex、旧根锚点兼容、移动端图文分离 + 轻量手势、首张角色图失败降级、sitemap。

A2 `verify-fluidity.mjs` 发布变体（复制至证据目录，唯一改动输出路径；`PREVIEW_URL=http://localhost:3108/`）：11/11，与上轮一致。覆盖：快速正反跳收敛（opacity>0.95、faceDeformation=0、textureCount≤9）、收尾停止绘制、visibility 确定性模拟暂停/恢复无速度脉冲、320/390/768/850 素材解码无溢出、600px 轻量吉祥物 + 后台暂停、原生滚动动画可逆、reduce motion 双禁用、手机不下载桌面 pose/mascot 纹理、零运行时错误。

## 4. B 交互矩阵（逐项，正反双向）

| # | 任务书条目 | 预期 | 实际 | 设备 | 证据 | 结论 |
|---|---|---|---|---|---|---|
| B1 | 一→六幕慢滚再倒滚 | 无变形/无错误/持续绘制 | 正反 12s 连续滚动各 60 样本：faceDeformation 全 0、avgOpacity 0.977/0.976、drawn +2095/+2166 帧、textureCount≤9、无 motionError | Chrome 1440×900 headless | `interaction/slow-roll-samples.json`、`interaction/result.json` | PASS |
| B1a | 角色全程可见，无 PPT 式淡入重现 | 换角窗口外 opacity>0.95 | 换角点 p≈0.334 为 original→mascot 设计内交叉溶解（细采样 468 点确认平滑单谷、无振荡、pose 原子切换不混脸/手）；窗口外全部 >0.95 | 同上 | `interaction/`（数据含 kind 序列） | PASS |
| B1b | Q 版关节合理 | 关节数值有限有界 | 关节范围 [-0.30, 1] 全有限，正反一致 | 同上 | slow-roll-samples.json | PASS |
| B2 | 快速大幅滚动/滚轮连击/快速倒向 | 无黑帧/角色消失/错误姿势定格 | 滚轮 12 连击、6 点大幅跳（120ms 不给收敛）、6 点快速倒向：全程 opacity>0.9 无掉落、收敛后姿态一致、textureCount≤12、无 motionError | 同上 | `wheel-burst-settled.png`、`fast-reversals-settled.png` | PASS |
| B2a | 拖滚动条 | 拖拽驱动叙事无错误 | headless overlay 滚动条无法拖动（before=after=0）→ 以大幅跳序列等效覆盖（连续 scrollTop 驱动即滚动条拖拽的输入形态）；**真机拖拽待确认** | 同上 | `interaction/result.json` NOTE | PASS（等效）+ 待真机 |
| B3 | 转场中间停住再继续/倒滚 | 图层共用进度，正反到达一致 | 实测 act 边界 0.17/0.25/0.51/0.74/0.92，每个边界前向到达 vs 越过后倒回：act/pose/kind 精确一致，headX/scene/joints 容差内一致 | 同上 | `interaction/pause-{1..5}-{forward,reverse}.png` | PASS |
| B4 | 脸部不变形/不混两张脸两套手 | faceDeformation=0、单一 pose/kind | 全部采样 faceDeformation=0；kind 切换原子（original pose≤5 / mascot pose≥6 无中间态） | 同上 | slow-roll-samples.json | PASS |
| B5 | 章节导航与目录入口 | 跳转正确、指示准确 | 6 章节导航正反 + 目录 6 项逐一跳转 + aria-current=step 全对 | 同上 | A1 + `interaction/result.json` | PASS |
| B5a | 过渡中不可见链接不可点击 | 非 works 幕不可命中 | elementFromPoint 实测：hero/contact 幕 works 链接命中 svg/contact-email（visibility:hidden 继承），resume 幕可见可点 | 同上 | `interaction/result.json` | PASS |
| B6 | 六深链接 × 首开/刷新/新标签 | 落到正确章节 | 6 hash × 3 方式 = 18 项全对（chapter + 静态模式 rect≈88） | Chrome 1440×900 | `deeplinks/result.json` | PASS |
| B6a | 前进/后退 | 内容跟随历史遍历 | **静态阅读模式 PASS**（back/forward 链式全对）；**动态演出模式 FAIL**：URL 变了 chapter/滚动不跟随 → §6.1 | 同上 | `deeplink-backforward-static.png` / `deeplink-backforward-dynamic.png` | **FAIL（动态）** |
| B7 | 静态⇄动态/reduce motion 保留章节 | 位置保留 | A1 两项 PASS（静态⇄动态保留章节、reduce 开关保留锚点） | A1 | A1 verification.json | PASS |
| B8 | 收尾停止无意义绘制 | settled 后 drawn=0 | A2 PASS（settled drawn=0）；真实 tab 切换 headless 不可用（document.hidden 不变，NOTE 记录）→ 确定性模拟 A2 PASS + 真后台**待真机** | A2 | A2 verification.json | PASS + 待真机 |
| B9 | 899→900/900→899 边界 | 无重复 canvas/孤立 pin spacer/滚动高度错乱 | 3 轮交替：canvas 1⇄0 干净、pin-spacer 稳定、900 动态高度 12420 与 899 静态 6333 各轮差 <50px、textureCount 有界 | Chrome 900×900⇄899×900 | `runtime/boundary-900-settled.png` | PASS |
| B10 | WebGL 上下文丢失 | 回到可读六幕 | 运行中 `webglcontextlost` 派发 → active=false + 六幕可读 + contact 可见 | Chrome 1440×900 | `runtime/webgl-lost-fallback.png` | PASS |
| B10a | 动作图失败 | 回到可读六幕 | 首张（A1 pose-00）与后续（pose-03 预载期 abort）均正确降级：motionError + 六幕可读 + contact 可见 | 同上 | `runtime/pose-failure-fallback.png` | PASS |
| B10b | WebGL 初始化失败 | 回到完整可读六幕 | **FAIL**：六幕 section 全 0×0、文档高度 900（不可滚动），只剩首屏 → §6.2 | 同上 | `runtime/webgl-init-failure-fallback.png`、`probe-webgl-init*.png` | **FAIL** |

补充（无页面错误）：5 个 phase 的 `pageerror` 断言全 PASS。

## 5. C 设备矩阵

| 项 | 结果 | 证据 |
|---|---|---|
| 桌面 1366×768 / 1440×900 / 1920×1080（动态模式六章导航 + 无横向溢出） | PASS ×3 | `devices/desktop-{1366,1440,1920}-contact.png` |
| 每幕定格桌面截图（1440×900） | PASS | `act1..6-desktop.png`（12 张主产出之一，供 AUDITL） |
| 手机 320@DPR1 / 360@DPR2 / 390@DPR3 / 430@DPR3（hasTouch+isMobile）静态轻量模式、无桌面 pose/mascot 纹理下载、无横向溢出 | PASS ×4 | `devices/mobile-{320,360,390,430}-hero.png` |
| 同上视口真实 CDP 触摸滚动（touchStart→8×touchMove→touchEnd，页面移动 + 状态干净 + 无溢出） | PASS ×4 | `devices/result.json` |
| 平板 768@DPR2 / 850@DPR2（同上断言） | PASS ×2 | `devices/mobile-{768,850}-hero.png` |
| 手机横屏 844×390（静态、无溢出、底部无遮挡：文档底部 colophon-底栏 gap=+118px） | PASS | `devices/mobile-844-landscape-contact.png` |
| 每幕定格手机截图（390×844 @DPR3） | PASS | `act1..6-mobile.png` |
| Edge 引擎（桌面六章 + 深链接 + 静态切换；手机 390 轻量 + 无桌面纹理） | PASS ×4 | `edge/edge-desktop-contact.png`、`edge-mobile-hero.png` |

## 6. FAIL 项详情（真实缺陷，如实记录；MOTION 波次不修产品代码）

### 6.1 [中] 动态演出模式下，同文档 hash 导航（含浏览器前进/后退）内容不跟随
- **现象**：桌面动态模式中，已在页面时改变 hash——地址栏手改 `#chapter-X`、前进/后退到另一个章节 hash——URL 更新但 `main.dataset.chapter` 与滚动位置停在原处（实测 goBack 后 URL=`#chapter-hero`，chapter 停在 1、scrollY 不变）。静态阅读模式正常。
- **根因**：`src/components/character-motion/ArtDirectedPreview.tsx:291-293`——hashchange 监听（jumpToHash）仅在静态阅读（`active=false`）时挂载，动态模式无 hash 监听。UI 章节导航用 `replaceState`（`:345`）不产生 history entry，故主流程不暴露。
- **复现**（Playwright headless Chrome 1440×900）：`goto /#chapter-hero` 等 chapter=0 → `goto /#chapter-about`（同文档 hash 导航）→ 1.2s 后 chapter 仍 "0"；继续 `goBack()` → URL 回 `#chapter-hero`，chapter 不变。
- **影响**：非主流路径（地址栏/书签/跨站返回）；首次打开、刷新、新标签 18 项全 PASS。
- **建议修复方向**（主控拍板）：动态模式也监听 hashchange，按 hash 找到 chapter.progress 后 scrollTo（`navigateChapter` 已有等价逻辑可复用）。

### 6.2 [高] WebGL 上下文初始化失败时降级不完整，六幕只剩首屏一屏
- **现象**：`getContext('webgl'/'webgl2')` 返回 null（真实场景：无 GPU/驱动黑名单/关闭硬件加速/远程桌面）→ 页面设置 `motionError="Error creating WebGL context."` 且未卡加载，但 **`dataset.active` 仍为 "true"（与 UI 矛盾：页面显示「动态浏览」按钮）**，六幕 section 全部 0×0，**文档高度 900px = 单屏无法滚动**——二至六幕内容完全不可达，退化为单屏死页面。
- **对照**：WebGL 运行中丢失与动作图失败两条降级路径均正常（§4 B10/B10a PASS），仅初始化失败路径布局塌陷。
- **根因方向**：mount 的 try/catch `setActive(false)` 后，错误路径渲染的 ReadingStory 容器尺寸塌陷（sections 0×0、docHeight 900），与正常「静态阅读」切换的布局不一致；`dataset.active` 与 React 状态不同步。
- **复现**（Playwright）：`addInitScript` 将 `HTMLCanvasElement.prototype.getContext` 对 webgl/webgl2 返回 null → `goto /` → 1.5s 后 `document.documentElement.scrollHeight === 900`，全部 `#chapter-*` 高度 0。
- **建议修复方向**：初始化失败与运行中丢失走同一 fallback 渲染路径；发布前修复为宜（命中即全站不可读，虽命中面小）。

## 7. 待真机确认（未测，不得计入已通过统计）

1. 真实 Android Chrome / iOS Safari（触摸惯性、真实 GPU 合成、系统字体）。WebKit 引擎本地未装（避免给项目加依赖），未测。
2. 物理高刷屏（120/144Hz）单帧预算实测——本地 headless 60Hz 封顶；沿用总任务书口径，不把 rAF 回调率冒充物理帧率。
3. 真实标签页后台休眠（OS 级节流/冻结）——本地已完成确定性 visibilitychange 模拟（A2 PASS）；headless 多页切换无法使 `document.hidden` 变 true（NOTE 记录），真实切换待真机。
4. 真实滚动条拖拽（headless overlay 滚动条不可拖，已用连续 scrollTop 序列等效覆盖）。

## 8. 证据清单（`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/motion/`）

- `home-completion/`：A1 截图 ×8 + verification.json（20 项）
- `fluidity/`：A2 截图 ×2 + verification.json（11 项）
- `matrix/act{1..6}-{desktop,mobile}.png`：每幕双端定格 ×12（主产出，供 AUDITL）
- `matrix/{interaction,deeplinks,runtime,devices,edge}/result.json`：B/C 全部检查项与 NOTE；`interaction/slow-roll-samples.json` 慢滚原始采样（120 样本）
- `matrix/interaction/`：快滚/转场停住（pause-N-forward/reverse ×10）截图
- `matrix/runtime/`：边界与失败注入截图 ×6（含 FAIL 证据 webgl-init-failure-fallback.png、probe-webgl-init*.png）
- `verify-fluidity-release.mjs`：fluidity 发布变体（唯一改动：输出路径）
- `matrix.mjs`：本波次发布专用矩阵脚本（5 phase，可复跑：`node matrix.mjs <phase>`）

3108 预览现由 **PID 3104** 服务（重建后 BUILD_ID `NcN87KpY1ZpyRiEWMCC8u`）；若后续波次发现 3108 再次损坏，优先排查是否有并行会话的中断 build 清空 `.next`（本次事件复盘见 §2.2），恢复命令同 BASE 报告 §4。
