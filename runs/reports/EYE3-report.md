# EYE3 结果报告

> 审计对象：coding-plan-bench 运行态（RunProgress / ResultCard）· Swiss Industrial Print v3 契约
> 手法：mock 全链路（addInitScript 补丁 `window.fetch` + ReadableStream 按毫秒计划回放 Anthropic SSE；429 JSON 造 rate-limit）——零真实网络、零真实 Key（表单填 `sk-eye3-mock-not-real`，URL 为 `https://mock.upstream.test/v1/messages`，被补丁完全拦截）
> 产物：26 张截图 + `evidence.json`（DOM 计算样式取证）+ `eye3.cjs`（可复跑脚本），全部在 `%TEMP%\cpb-eye3\`，仓库零写入

## 结论一句话

运行态的骨架达标——零圆角、mono 纪律、语义色、触控目标、无障碍语义、状态机口径全部实测通过——但**不能签"美术达标"**：统计带存在一个每张结果卡都可见的 P0（单位双写），另有一个 P1（consent 琥珀左轨被手写 `.border-ink` 级联吃掉、实际渲染墨色）和一个 P1（PARTIAL/CANCELLED 状态文字对比度 3.72:1 / 3.03:1 不达 AA）。

## 截图清单

26 张，逐张判定（✓=达标，✗=含缺陷， artifact=截图手法伪影非页面问题）：

**运行中（含失败后运行态）**

| 文件 | 判定 |
|---|---|
| `c1440-running-full.png` | ✓ 分段条绿+蓝+空语义清晰；页面无横向溢出；页中黑色 nav 块为 fullPage+sticky 截图伪影（正常视口 nav 在页顶，不成立案） |
| `c1440-running-panel.png` | ✓ 面板特写：脉冲点/mono 标签/已用时行齐整；「SAMPLE 1/3」语义滞后见 P2-1 |
| `c768-running-full.png` | ✓ 768 同构，面板满宽不破格 |
| `c768-running-panel.png` | ✓ 槽位发丝线分隔可辨 |
| `c375-running-full.png` | ✓ 375 下条缩+计数右置，无换行溢出 |
| `c375-running-panel.png` | ✓ 取消钮实测 44px（<768 触控基线达标） |
| `p1440-running-full.png` | ✓ 失败后运行态：绿(完成)+红(失败段)+蓝(在测)三色语义准确 |
| `p1440-running-panel.png` | ✓ DOM 取证红=`rgb(196,52,29)`/蓝=`rgb(45,90,136)` 与截图一致 |
| `p1440-running-late-full.png` | ✓ 全页上下文正常 |
| `p1440-running-late-panel.png` | ✓ 「SAMPLE 02/03」+红/蓝槽，全组语义最清晰一张 |
| `p375-running-full.png` / `p375-running-panel.png` | ✓ 375 失败后运行态三色槽仍可辨 |

**consent 琥珀面板**

| 文件 | 判定 |
|---|---|
| `k1440-consent-full.png` | ✗ 面板整体落在 900px 首屏外（P2-3）；左轨视觉为墨色（P1-1） |
| `k1440-consent-panel.png` | ✗ 特写实证：4px 左轨计算色=`rgb(26,26,24)`（ink），琥珀丢失；眉标/方点/双按钮层级本身齐整 |
| `k375-consent-full.png` / `k375-consent-panel.png` | ✗ 同上两条；按钮 375 实测 44px ✓ |

**结果卡·完整（COMPLETE）**

| 文件 | 判定 |
|---|---|
| `c1440-result-full.png` | ✓ 全页：结果卡→榜单联动正确（complete 入榜 01 名，rank 珊瑚制式） |
| `c1440-result-card.png` | ✗ 三段带 48px mono 雄壮，但 TTFT「2113ms」+上标 ms、Total「3.68s」+上标 s 单位双写（**P0-1**） |
| `c768-result-full.png` / `c768-result-card.png` | ✗ 三段横排 ✓，单位双写同样在 |
| `c375-result-full.png` / `c375-result-card.png` | ✗ 375 纵排 44px ✓；明细表横滚区右缘无可供性提示（P2-4）；双写同样在 |

**结果卡·部分成功（PARTIAL）**

| 文件 | 判定 |
|---|---|
| `p1440-result-full.png` | ✓ PARTIAL 不入榜（榜单保持空）——口径正确 |
| `p1440-result-card.png` | ✗ 琥珀章+琥珀底条+失败行「—」空值+bad 红左轨建议面板全对；唯 PARTIAL 章文字 3.72:1 不达 AA（**P1-2**） |
| `p375-result-full.png` / `p375-result-card.png` | ✓/✗ 同构；建议面板红左轨正常渲染——反证 P1-1 根因专属手写 `.border-ink`（375 下「成功样本 2/3」疑折行经 DOM 核验为缩略图伪影：更宽的 COMPLETE 章同行放得下） |

**零真实网络证明**：7 个流程 `blockedExternal` 全为空数组；页内 `__EYE3_NET__` 无 pass-through 记录；console/pageerror 零条。

## 逐状态走查

### 1. 运行中（RunProgress）

- **分段进度条语义色 ✓**：`segmentTone` 四态实测全对——已完成=`#2E7D46` 绿、在测=`#2D5A88` 蓝、失败段=`#C4341D` 红、未开始=透明；发丝线分槽、10px 轨道、`SAMPLE 01/03` 两位补零 mono 计数（JetBrains Mono + `tabular-nums` 实测生效）。
- **LIVE 脉冲 ✓**：7px 圆点、`animation: pulse-dot 2s infinite`。全站零圆角契约下唯一圆形容器例外，语义=live 信号，合规。
- **已用时计时器 ✓**：tabular 等宽，无字宽抖动。
- **✗ P2-1 标签语义滞后**：样本 2 在测时头部仍显「RUNNING · SAMPLE 1/3」（`index`=已完成数），与条上蓝槽（第 2 格）互相矛盾；「SAMPLE 1/3」存在"已完成 1/3"与"正在测第 1 个"两种读法。
- 头部与计数行信息重复（两处 SAMPLE n/N），可并入 P2-1 一并收敛。

### 2. consent（琥珀面板）

- **层级构成 ✓**：`CONSENT · 代理确认` mono 眉标 → warn 方点+标题 → 两行实质正文 → 主按钮（墨底反白）+次按钮（描边）；`role=alert` 实测在。
- **✗ P1-1 琥珀左轨失色**：`border-[1.5px] border-ink border-l-[4px] border-l-warn` 实测左轨为墨色。根因锁定：`globals.css` 手写 `.border-ink`（@layer utilities 源序晚于 Tailwind 生成类）覆盖了同元素 `border-l-warn` 的 `border-left-color`。反证：失败建议面板 `border-line + border-l-bad`（两者皆 Tailwind 生成）红左轨正常。
- **✗ P2-3 折叠下无引导**：1440×900 与 375×812 实测 consent 面板整体在首屏外，`role=alert` 只惠及读屏，视觉用户点完 CTA 无任何可见反馈。
- 触控 ✓：375 下双按钮实测 44px。

### 3. 结果卡·完整（ResultCard COMPLETE）

- **状态章 ✓**：双语制（`COMPLETE` mono 大写 0.14em + 中文「完整」细字）+ 8px 方点 + 1px 语义描边，构成完整。
- **三段统计带 ✗（P0-1）**：48px（移动 44px）mono、leading-none、count-up 600ms 落定、4px 状态底条贯通三格、`lbl-mono`+中文小注双段标签——全部达标；唯独单位双写：TTFT 渲染成「2113ms」+上标 ms、Total「3.68s」+上标 s。根因：`fmtMs(n,"ms"/"s")` 返回值自带单位，`StatCell` 再拼上标 `<span>`。TPS 正常（`fmtTps` 纯数字）。
- **上标本体制式 ✓**：14px、顶部偏移 2px、左距 6px，top-aligned 上标印刷制式成立（修掉双写后即正确）。
- **明细表 ✓**：列头左（样本/状态）右（TTFT/TPS/Total/输出 TOKEN）对齐实测正确、全 mono、S01 补零、状态窄章方点+色字双通道、列内单位恒定（TTFT 列全 ms、Total 列全 s）、失败行空值「—」。
- **375 横滚**：`min-w-[520px]` 在 341px 容器内横滚为设计使然（列内单位恒定优先），页面级零横滚未破——记 P2-4 可供性建议，不立案为违约。

### 4. 结果卡·部分成功（PARTIAL）

- **✓ 口径**：成功样本 2/3、聚合只取成功样本中位数（2111ms / 72.0 / 3.67s 与样本明细吻合）、失败行三处「—」、PARTIAL 不入榜。
- **✓ 建议面板**：bad 红 4px 左轨 + 「样本 2 · rate-limit」+ 安全消息「上游返回 HTTP 429」+ 可执行建议（不回显上游 body，符合 AUD-011）。
- **✗ P1-2 状态文字对比度**（panel-2 底实测计算）：PARTIAL 琥珀 `#A8761A` 3.72:1、CANCELLED 灰 `#8A8F98` 3.03:1——12px bold 小字需 4.5:1，均不达 AA；COMPLETE 绿 4.73:1 压线过、FAILED 红 5.07:1 过。同病：TPS 不可用时 token 来源行 `text-warn` 12px（ResultCard.tsx:149）。

### MASTER.md 反模式清单逐条判定

| 反模式 | 判定 | 依据 |
|---|---|---|
| 圆角 | ✅ 通过 | 全部运行态 DOM 扫描唯一 offender=`pulse-dot` 50%，契约唯一例外且语义正确 |
| 渐变/玻璃拟态/backdrop-blur/发光阴影 | ✅ 通过 | 实测阴影均为无 blur offset（`rgba(26,26,24,0.06) 3px 3px 0px`），无渐变 |
| 第二强调色 | ✅ 通过 | 蓝/琥珀/红/灰只出现在数据语义位（在测/待确认/失败/取消），珊瑚未越界 |
| 图标库 | ✅ 通过 | 全部用几何方点 + mono 文字标签 |
| 文字墙 | ✅ 通过 | consent 正文 2 行、建议面板 3 行内、免责语位置未增 |
| 截断藏安全信息 | ✅ 通过 | 连接卡未涉；数据表 375 为滚动非截断（P2-4 留可供性建议） |
| hover scale 布局位移 | ✅ 通过 | 取消/同意按钮 hover 仅 color/背景变化 |
| 动效超 500ms 阻塞交互 | ✅ 通过 | count-up 600ms 为数字动效且不阻塞（MASTER 动效规范明列允许），入场 250ms |

**运行态特有四项**：进度条语义色 ✅；统计带单位上标对齐 ❌（P0-1）；明细表列头 ✅；consent 琥珀面板层级 ❌（P1-1 + P2-3）。

## 分级清单（P0-P2）

### P0-1 统计带单位双写——每张结果卡可见

- **定位**：`site/src/components/ResultCard.tsx:122`（`format={(n) => fmtMs(n, "ms")}`）、`:140`（`format={(n) => fmtMs(n, "s")}`）配合 `:261`（`{format(shown)}`）+ `:263`（上标 `{unit}`）。
- **现状**：`fmtMs` 返回值自带单位 → TTFT 渲染「2113msᵐˢ」、Total 渲染「3.68sˢ」，44-48px 英雄数字上单位出现两遍，七张结果卡截图无一幸免。
- **改法**：传纯数字 formatter，单位完全交给上标——TTFT：`format={(n) => String(Math.round(n))}`；Total：`format={(n) => (n / 1000).toFixed(2)}`；TPS 不动。`null` 分支「—」不受影响。

### P1-1 consent 琥珀左轨被手写 `.border-ink` 级联覆盖

- **定位**：`site/src/components/RunProgress.tsx:94`（`border-ink border-l-warn` 同元素）× `site/src/styles/globals.css:246-248`（手写 `.border-ink { border-color: var(--color-ink) }`）。
- **现状**：手写类在 `@layer utilities` 中源序晚于 Tailwind 生成类，`border-left-color` 被 ink 压制——琥珀警示轨实际渲染墨色（计算样式实证 `borderLeftColor: rgb(26,26,24)`）。全仓同元素混用仅此一处（grep 核验），但这是整类冲突的地雷。
- **改法**：删除 `globals.css:246-248` 手写 `.border-ink`——`@theme` 的 `--color-ink` 已原生生成同名工具类，二者重复；删除后 Tailwind 的 longhand-after-shorthand 排序让 `border-l-warn` 正常生效（与 `border-l-bad` 在建议面板的表现一致）。改后复跑 consent 截图核对琥珀轨。

### P1-2 状态章/警示小字对比度不达 AA（warn / mute）

- **定位**：`ResultCard.tsx:27-30`（STATUS_TONE text 类）命中 `:84` 状态章文字；`:149` token 来源行 `text-warn`。
- **现状**：panel-2 底实测——PARTIAL 琥珀 `#A8761A` 3.72:1、CANCELLED 灰 `#8A8F98` 3.03:1，均低于小字 AA 4.5:1（COMPLETE 4.73:1 压线，FAILED 5.07:1 达标）。MASTER 自己的要求是"说明 ≥4.5:1"。
- **改法**：新增"文字安全档"语义 token 并用于小号状态文字（色条/方点/描边维持原色）：`--color-warn-text ≈ #8A6215`（实算 5.1:1）、`--color-mute-text ≈ #5F6369`（实算 5.6:1），落 token 前按最终底色复核。

### P2-1 RUNNING 样本计数语义滞后

- **定位**：`RunProgress.tsx:139-141`（头部 `RUNNING · SAMPLE {index}/{total}`）、`:160-165`（条右 `SAMPLE {pad2(index)}/{pad2(total)}`）；`index` 引擎语义=已完成数。
- **现状**：样本 2 在测时两处都显 1/3，与蓝槽位置矛盾，头部信息与计数行重复。
- **改法**：头部改显在测序号 `SAMPLE {pad2(min(index+1, total))}/{pad2(total)}`（或改词「DONE 01/03」明确已完成口径），计数行保留已完成制式；两处口径在文案上分工而非重复。

### P2-2 硬阴影契约漂移（MASTER vs 实现）

- **定位**：`site/design-system/MASTER.md:31`（sm/mo/lg = α.12/.16/.22，wave14 加重档）vs `globals.css:240-245`（`.hard-shadow` 3px α.06、`.hard-shadow-lg` 4px α.09）——`:root:53-55` 的重档 `--shadow-md/lg` 变量实际无人消费。
- **现状**：RunProgress/consent/ResultCard 实测阴影 α0.06/0.09，明显轻于设计规范文本；视觉自洽但"单一事实源"已失真。
- **改法**：`.hard-shadow`/`.hard-shadow-lg` 改指 `var(--shadow-md)`/`var(--shadow-lg)`（wave14 本意是加重），或修订 MASTER 对齐现状——二选一，建议前者。

### P2-3 consent 面板出现在折叠下、无视觉引导

- **定位**：`site/src/App.tsx:146-151`（RunProgress 挂载点，无 scrollIntoView）。
- **现状**：1440×900 与 375×812 实测 consent 面板整体在首屏外；点「开始测速」后视觉零反馈（`role=alert` 仅惠及读屏用户）。
- **改法**：consent 面板挂载时 `scrollIntoView({ block: "nearest" })`（包一层 reduced-motion 判断），或 CTA 旁内联一行 mono 提示「请在下方确认代理」。

### P2-4 明细表 375 横滚无可供性（观察项）

- **定位**：`ResultCard.tsx:159-160`（`overflow-x-auto` + `min-w-[520px]`）。
- **现状**：375 下容器 341px / 表 520px，组件级横滚（页面级零横滚未破）；右缘无渐隐或提示，部分用户不会发现可滑。
- **改法**（可选）：右缘 12px hairline 渐隐遮罩，或表尾右下 `lbl-mono`「横向滑动查看」；不改也成立——数据表保列宽是合理取舍。

## 自评

- **验收标准对账**：①截图 26 张 ≥8，覆盖 4 状态 × ≥2 断点（运行中 1440/768/375 + 失败后运行态 1440/375；consent 1440/375；完整结果卡 1440/768/375；部分成功 1440/375），逐张有评；②MASTER 反模式 8 条逐条判定；③P0-P2 每条含定位+现状+改法；④git status 见下。
- **git status 留证（有差异，差异非本审计产生）**：起始 `M site/src/content/copy.ts` → 结束新增 `M site/src/components/Leaderboard.tsx` + 未跟踪 `TrendSpark.tsx` / `boardShare.ts` / `boardShare.test.ts`。本审计对仓库零写入（脚本/截图/evidence 全在 `%TEMP%\cpb-eye3\`，仅 dev server 与无头浏览器接触本仓）；审计窗口内 dev server 日志有第三方 HMR 记录（10:12:25 `[vite] hmr update /src/styles/globals.css`），增量文件属 wave22 趋势功能在研改动，与测速运行态无关——判定为并行会话产物，予以保留未动。
- **覆盖缺口**：全失败（0 成功）与 cancelled 两种结果态未截图（CANCELLED 章 3.03:1 来自 token 实算非像素）；`validating` 相位同步瞬时、无法稳定截取。
- **方法备注**：`addInitScript` 补丁 fetch + ReadableStream 毫秒计划，比既有 e2e 的 route+delay 更接近真实流式计时（TTFT/思考/生成时长全可控、断言全部先于截图），手法可反哺 `tests/e2e/benchmark-flow.spec.ts`。
- **收尾**：dev server 分两步关闭——TaskStop 先杀 npm 包装进程，vite 子进程（PID 14544）残留监听 5174，追加 `taskkill /F /PID 14544` 后 `netstat` 复验端口已释放；临时产物保留 `%TEMP%\cpb-eye3\`（26 图 + evidence.json + eye3.cjs）供修后复跑对比。
