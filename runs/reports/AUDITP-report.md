# AUDITP · 线上六幕多模态审计报告

- 日期：2026-10-11
- 待审对象：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/produi/`（act1..act6 desktop/mobile，共 12 张）
- 本地基准：同目录 `motion/matrix/act1..act6-{desktop,mobile}.png`（12 张，`8302135` 构建 @ localhost:3108 定格）
- 认可基准：`my-portfolio/docs/design/character-homepage/home-completion-v1/README.md` + `validation/`（desktop-hero / desktop-resume / desktop-contact / mobile-capabilities / mobile-resume / mobile-contact）；`home-fluidity-v1/after-mobile.jpg`（1170×13917 整页阅读版）
- 红线遵守：只审图未改产品代码；结论全部指向具体截图或 HTTP 实测；未臆测截图外行为。

## 0. 前置缺口与补采说明（必须先读）

任务前置声明「PRODUI 已产出线上截图」，但审计开始时 `produi/` 目录**为空**（该目录 2026-10-11 14:15 创建后无任何文件）。DEPLOY 报告确认 14:10 起六幕版本已上线 asterforge.top。为不阻塞审计，本任务自行按 MOTION 报告记载的 matrix.mjs 同款方法补采 12 张线上定格：

- 桌面：1440×900 @DPR1，headless Chrome（本机 chrome.exe），`goto /` → 等 `data-active="true"` 且 `.motion-stage[data-loaded="true"]` → 逐幕点 `.story-chapter-rail[data-chapter-index=i]` → 等 `chapter==i` 且 `|displayedProgress−targetProgress|<0.001` → 截图。
- 手机：390×844 @DPR3 hasTouch isMobile，等 `data-active="false"`（静态阅读版）→ 逐幕 `#chapter-*` scrollIntoViewIfNeeded → **等滚动静止 + 段内图片全部 complete** → 截图。
- **与基线方法的一处有意偏差**：手机端基线用固定 250ms 等待（AUDITL P2-1/P3-1 因此捕到中间态）；线上补采改为滚动/图片就绪判定，保证线上帧为落定态。该偏差的影响见 P3-4。
- **重采说明**：首次桌面采集因系统 Chrome 新无头模式下 `newPage({viewport})` 视口仿真未生效，产出 1920×1080（hexdump + `file` 双证）；已改用 `newContext({viewport:1440×900, deviceScaleFactor:1})` 重采，最终 12 张全部 `file` 验证为 1440×900 / 1170×2532。
- 采集中 desktop+mobile 两会话 `pageerror` 合计 **0**。

## 1. 逐幕三对照总表

量化证据：12 组「线上 vs 本地」同尺寸逐像素 diff（阈值 >8/通道；PNG 经 canvas 解码，同一 Chrome 实例单次会话内完成）。

| 幕 | 桌面 diff %（差异域 px） | 手机 diff %（差异域 px） | 三对照判定 |
|---|---|---|---|
| 01 首屏 | **0.09**（571,794–774,832 底部指示区微点） | 1.97（全域，见 P3-4 方法差） | 线上=本地；与 fluidity/completion 认可稿同画同构 |
| 02 关于我 | 11.36（全域边缘晕） | 1.40（上 2/3 幅，末行渐变残差） | 线上=本地（差异为亚像素位移，见 §2）；无桌面认可帧，内部一致 |
| 03 创作世界 | 13.03（全域边缘晕 + **引言位移残影**） | **0.00**（逐像素相等） | 线上**优于**本地：AUDITL P1-1 叠压缺陷已由 `f4d14e9` 修复并上线（§2/§3） |
| 04 ResumeAIX | **0.02**（95,680–1316,869 进度点条） | 1.47（791,1838–1047,2158，Q 版区） | 线上=本地=认可稿 `desktop-resume.jpg` 逐要素（新增幕标签除外，P3-1） |
| 05 AsterNova | 9.19（全域边缘晕） | 0.43（683,1890–1069,2531 底缘） | 线上=本地；无桌面认可帧，内部一致 |
| 06 联系 | 3.56（全域边缘晕） | **0.00**（逐像素相等） | 线上=本地=认可稿 `desktop-contact.jpg` 逐要素（新增幕标签除外，P3-1） |

手机 6 幕均为轻量静态阅读版：HTML 文字 + 裁切原画、进度点 + 「0X / 06 · 幕名」+ 回到顶部，与认可稿阅读版结构一致；act3/act6 手机帧与本地**逐像素相等**（diff 0.00）。

## 2. 桌面 act2/3/5/6 差异性质鉴别（为何判定非缺陷）

act1（0.09%）与 act4（0.02%）几乎全同，而 act2/3/5/6 为 3.6%–13%。阈值扫描（差异像素 % @ 阈值 8/16/32/64）：

| 幕 | @8 | @16 | @32 | @64 | 平均幅值 |
|---|---|---|---|---|---|
| act2 | 11.36 | 7.27 | 4.26 | 2.09 | 5.95 |
| act3 | 13.03 | 9.73 | 6.45 | 3.25 | 7.71 |
| act5 | 9.19 | 6.12 | 3.44 | 1.68 | 5.33 |
| act6 | 3.56 | 2.83 | 2.05 | 1.27 | 3.47 |

差异幅值随阈值单调快速衰减 → 低幅值边缘类差异主导。放大差异热图（×6 增幅）目检证实：差异全部是**文字字形轮廓、原画碎片/环/丝带边缘、Q 版轮廓的 1px 位移晕边**（视差浮动层相位差 + 两次采集的亚像素栅格化差），**无任何块级内容替换/缺图/换素材**。act3 热图中引言「爆裂吧，现实！…」呈现新旧两个位置的重影，恰为 `f4d14e9`（第三幕引言抬离底部幕标签）的修复落点——线上引言独立成行、与「03 · 创作世界」标签完全无叠压（`produi/act3-desktop.png` 目视可证），本地基线仍带该缺陷（`motion/matrix/act3-desktop.png`）。

## 3. 分级清单

### P0（不可上线级）

无。12 张截图零破图/裸 alt/空白区、零脸部变形/双脸/混手、零图层遮挡错乱、零未加载素材。

### P1（应修）

无。AUDITL 的两项 P1 处置状态：P1-1（act3 叠压）**已修复且线上生效**（`produi/act3-desktop.png` vs `motion/matrix/act3-desktop.png`）；P1-2（常驻幕标签）随版本上线，转为 P3-1 基准对齐事项。

### P2（建议处理）

无（部署层面）。两项认可稿偏差均已随发布流程裁决，降级为 P3 记录。

### P3（记录 / 基准对齐建议）

**P3-1 桌面六幕常驻居中幕标签为认可稿不存在的新增元素，已随版本上线**
- 证据：`produi/act1..act6-desktop.png` 底部中央「01 · 首屏 … 06 · 联系」；认可稿 `validation/desktop-hero.jpg`、`desktop-resume.jpg`、`desktop-contact.jpg` 同位置均无。
- 判定：AUDITL P1-2 曾要求产品裁决；本版本已携该元素上线 = 事实接受。线上与本地完全一致，非部署遗漏。
- 建议：补一条认可记录或更新 home-completion-v1 基准帧，消除「线上与认可稿不一致」的账面差异。

**P3-2 手机 act3/4/5 落定态均无认可稿中的小幕标签（对 AUDITL P2-2 的最终定性）**
- 证据：`produi/act3-mobile.png`、`act4-mobile.png`、`act5-mobile.png` 底部分隔线与进度点之间均为空白（底部 700px 裁片核验）；认可稿 `mobile-capabilities.jpg`、`mobile-resume.jpg` 同位置有「03 · 创作世界」「04 · ResumeAIX」小标签。本地基线同样缺失。
- 判定：线上补采等待滚动/图片就绪后仍缺失 → **排除「淡出动画定格在透明度 0」假设**，属真实缺失；线上=本地，非部署遗漏，属发布时已带有的设计态。
- 建议：与 P3-1 同批处理——更新认可基准或补齐标签后重拍。

**P3-3 act2-mobile 定格于幕 1/2 边界位置时指示仍为「01 / 06 · 首屏」（对 AUDITL P2-1 的最终定性）**
- 证据：`produi/act2-mobile.png` 落定帧：视口上部约 40% 仍为幕 1 文字块（INDEPENDENT BUILDER / 01、TimeCraker、AI · SOFTWARE · HARDWARE），中下部为幕 2 原画与标题，指示条实心点 1、「01 / 06 · 首屏」；与本地 `motion/matrix/act2-mobile.png` 同状态（diff 1.40%）。
- 判定：该滚动位置下视口顶部仍被幕 1 内容占据，指示不切换具备合理性；线上与本地行为一致，非部署缺陷、不升级 P1。真实手机滑动吸附态的指示时机属真机验收范围，本报告不臆测。

**P3-4 act1-mobile 线上为落定态、本地基线为幕间滚动中间态（基线方法差，非站点缺陷）**
- 证据：`produi/act1-mobile.png`（落定：幕 1 文字 + 进度点 1/6 + 回到顶部）vs `motion/matrix/act1-mobile.png`（画面已滚入幕 2 原画、底部标签仍 01，为基线固定 250ms 等待捕到的平滑滚动中间帧）；两者 diff 1.97%。
- 判定：线上行为正确且更符合「定格」语义。建议后续若复用 matrix 基线，手机端按本报告方法重拍。

**P3-5 手机 act4 Q 版角色区 1.47% 微差为呼吸/倾身动画相位差**
- 证据：diff 域 [791,1838]–[1047,2158] 恰为 Q 版轮廓区，双图姿态同族、无变形（`produi/act4-mobile.png` vs `motion/matrix/act4-mobile.png`）。认可稿 README 载明阅读版保留「轻微倾身与呼吸」动效，逐帧相位不同即产生此量级差异。

**P3-6 素材同源实测（审计项 1 的量化佐证）**
- 线上 8 项关键素材全 200，其中 4 项与本地仓库 `public/` 字节数完全一致：`character-motion/hero-poster.webp` 327,732B、`about-poster.webp` 338,074B、`art-directed-v1/pose-00-hero.webp` 314,108B、`art-directed-v1/pose-05-about.webp` 307,918B；另有 `ring.webp` 524,812B、`ribbons.webp` 105,790B、`reading-v1/assets.json` 952B、`reading-v1/ai.webp` 417,726B。海报走 `/_next/image`（w=3840&q=75）优化输出，原画为有逐像素一致性证据的无损 WebP（completion README §交付）。无「未优化巨图直出」信号。

## 4. 逐项审计结论（对照任务书五项）

1. **素材一致**：✅ 12 帧全部素材加载完整，无缺图/破图/错误版本；4 项关键原画线上与本地字节数逐一致（P3-6），无部署遗漏信号。
2. **构图一致**：✅ 12 组双图构图逐要素一致（量化见 §1）；无 CSS 顺序退化迹象（无裸样式文字、无字体回退、无错位叠压）；act3 桌面线上优于本地基线（修复生效）。桌面差异为亚像素边缘晕（§2），非构图差异。
3. **人物完好**：✅ 全帧单脸无变形、无混 blended 脸/手；act1 掩眼手与伸手五指自然、act2 托掌手完整、各幕 Q 版姿态正常；丝带/环/观测站面板遮挡关系双端一致；act4 手机 Q 版 1.47% 为动画相位（P3-5）。
4. **手机轻量布局**：✅ 线上手机 6 幕均为静态阅读版（HTML 文字 + 裁切原画 + 进度点），结构/排版与认可稿阅读版一致；act3/act6 与本地逐像素相等；未见 WebGL 画布内容或桌面纹理泄漏迹象。
5. **性能视觉病**：✅ 12 帧零白块、零布局跳动残迹（唯一重影为 act3 修复位移，§2）、零巨图直出信号（海报经优化器、原画为无损 WebP，P3-6）。单帧无法证明运行时 CLS/加载时序，属验收波范围，本报告不越界。

## 5. 结论：线上美术与认可版本一致性判定

**判定：一致，可放行。**

线上 https://asterforge.top 六幕版（SHA `eae5d8b`）美术与认可版本无实质性不一致：

- 与本地同幕定格逐像素/逐要素一致（手机 act3/act6 diff 为 0，桌面 act1 0.09%、act4 0.02%）；
- AUDITL 两项 P1 均已闭环：act3 叠压已修复上线，幕标签元素随版本上线转为基准对齐事项；
- 与认可稿仅存两项**已随发布裁决的已知差异**（桌面常驻幕标签新增、手机小幕标签缺失），线上与本地彼此一致，均非部署遗漏，合并为 P3-1/P3-2 基准维护建议；
- 人物、素材、轻量阅读版、性能视觉四条红线全绿；页面脚本错误 0。

遗留动作仅一项（非阻断）：更新 home-completion-v1 认可基准帧或补认可记录，把 P3-1/P3-2 的设计态差异记账，消除「线上 ≠ 认可稿」的账面缺口。

## 6. 证据清单

- 线上定格（本次补采）：`portfolio-release-2026-10-10/produi/act{1..6}-{desktop,mobile}.png`（12 张，`file` 验证 1440×900 / 1170×2532）
- 本地基准：`portfolio-release-2026-10-10/motion/matrix/act{1..6}-{desktop,mobile}.png`
- 认可帧：`my-portfolio/docs/design/character-homepage/home-completion-v1/validation/`（6 张对照帧）+ `home-fluidity-v1/after-mobile.jpg`
- 差异热图与底部裁片：`%TEMP%\audip\act{n}-desktop-diffviz.png`、`crop-act{3,4,5}m-bottom.png`、`crop-fluidity-first.png`（临时证据，报告定稿后清理）
- 素材 HTTP 实测：§3 P3-6 所列 8 项 200 记录
