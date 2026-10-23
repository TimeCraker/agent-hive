# S32-PDFCN · legacy PDF 中文文字层修复报告

日期：2026-10-16。Spec：`docs/stages/stage-32-remediation.md` §32-4。
状态：**已实施并验证，未 commit（待主控审查）**。

---

## 1. 差异定位结论（legacy vs design 导出路径）

| 维度 | legacy（修复前） | design |
|---|---|---|
| 字体声明 | export-service `legacy-pdf.ts` 壳 body 字栈 `system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`，**零 @font-face** | 设计稿 HTML 自带 6 条 @font-face（Noto Sans SC 400/500/600/700 + Noto Serif SC 600/700，`/fonts/*.woff2`，`font-display: block`；与 `skills/resume-layout/samples/base.css`、`ai-prompts design.ts` 同一约定） |
| 字体文件 | 无；中文全部落渲染机系统字体（本地 Windows→MicrosoftYaHeiUI；生产 Linux→fonts-noto-cjk 的 Noto Sans CJK，`deploy-production-remote.sh:85` 安装） | 本地 woff2 经 `newPageWithFontServing` CDP Fetch 拦截直供（`apps/export-service/src/index.ts:49`） |
| 就绪等待 | `document.fonts.ready` 已等，但无 web 字体可等（空等） | `document.fonts.ready` 真实等待 @font-face 加载 |
| URL 解析 | 无 base，about:blank 相对 URL 无效 | `<base href="${PUBLIC_WEB_URL}/">` |
| Puppeteer print 参数 | A4 + printBackground + margin 0（壳内 @page 8/10/14/10mm） | 同参数，@page 由设计稿自带 |

**关键基建事实**：`newPageWithFontServing` 的 `*/fonts/*` 拦截对 legacy 页面**本就生效**（index.ts:191 统一创建页面），legacy 缺的只是壳内 CSS 引用——最小接法因此成立。

**根因**：Chrome 对系统字体（MicrosoftYaHeiUI / SimSun 族）的 PDF 子集 ToUnicode 映射不全：缺映射 + 统一汉字错映到康熙部首兼容码位（U+2F00–2FDF）。design 线因 Noto woff2 嵌入无此问题。

### 12 模板字体路径清单（注入点覆盖核对）

1. **默认路径**（appearance 未选字体）：预览容器 inline `font-family: var(--font-noto-sans-sc), ...` 在导出壳中 var 未定义 → 声明失效 → 继承壳 body 字栈。**12 模板全部走此路径**（模板本体 inline 样式只有 `appearance.headingFontFamily || appearance.fontFamily`，而 `headingFontFamily` 无任何 UI 设置点，恒 undefined）。
2. **tech 模板特有**：7 处 `font-family: 'Courier New', monospace`（技能/证书 chips、email）——中文逐字落到 monospace 泛型系统字体（本地 NSimSun）。
3. **appearance 抽屉可选字体**（`appearance-drawer.tsx` FONT_OPTIONS）：思源宋体（`"Noto Serif SC", serif`）走具名族；LXGW WenKai / Inter / Geist / Merriweather / Playfair Display / Roboto Slab / ZCOOL XiaoWei / Ma Shan Zheng 为 Google webfont，项目 `/fonts` **未携带**（红线：不加字体文件）；var() 形态两项（思源黑体默认、Geist）在导出壳失效走继承。

## 2. 接法（零新依赖，全部复用既有能力）

改动仅 2 文件：`apps/export-service/src/legacy-pdf.ts`（+~80 行）、`apps/export-service/src/index.ts`（legacy 调用点 +7 行）。**design 线 `renderDesignPdf` 未动**（冒烟验证见 §5.5）。

1. **六件套 @font-face 与 design 线完全同源**：`legacyFontFaceCss(origin)` 生成，src 指 `${PUBLIC_WEB_URL}/fonts/*.woff2` 绝对地址，命中拦截模式 `*/fonts/*` 本地直供（不触网，web 端口无关）。
2. **body 字栈前置 `'Noto Sans SC'`**：默认路径全部中文命中 Noto。与生产现状同源等价（生产本就渲染 Noto CJK＝思源黑体系）；本地 Windows 由雅黑变思源黑体＝向预览（next/font Noto）对齐。
3. **未携带 woff2 的具名族补 unicode-range CJK 面片**：serif 风格族（LXGW/Merriweather/Playfair/Roboto Slab/ZCOOL/Ma Shan Zheng）→ noto-serif-sc-600；sans 风格族（Inter/Geist/Courier New）→ noto-sans-sc-400；`font-weight: 400 700`（粗体由 Chrome 合成）。Latin 码位不在 range 内→仍走原系统回退，视觉不变。
4. **Courier New local() Latin 面片**（过程中发现的回归修复）：声明同族 @font-face 会**遮蔽系统 Courier New**，tech chips 的 Latin 实测落到 NSimSun 丢等宽外观；补 `src: local('Courier New'); unicode-range: U+0020-00FF` 面片——装有 Courier New 的机器取系统字形（与修复前一致），未装的（生产 Linux）local 解析失败落 monospace 泛型（也与该机修复前一致）。
5. **降级保障**：`fontsOrigin` 为 null（字体目录缺失）时完全退回旧壳旧字栈，行为不变；单测（3 参调用）不受影响。
6. 模板视觉设计零改动（apps/web 未动一个文件）。

## 3. 提取工具与版本

| 工具 | 版本 | 角色 |
|---|---|---|
| pypdf | 6.20.1（Python 3.11，pip 安装于用户环境） | **严格 ToUnicode 消费者**，主断言工具 |
| pdftotext | 4.00（Glyph & Cog / Xpdf，mingw64 自带） | 第二标准工具交叉验证。**注意：Xpdf 内置 CMap 兜底较宽松，单独使用会掩盖 ToUnicode 缺陷** |

辅助客观证据（非替代）：`inspect-tounicode.mjs` 直接解包 PDF ToUnicode CMap 统计映射条数；`inspect-residual.mjs` 配对 BaseFont↔ToUnicode 列出每张嵌入字体的实际字符集。

## 4. 缺陷实证（为什么修）

- **历史 artifact**（Stage31 LAYPDF 产出 `laypdf-legacy-v1-2pages.pdf`）：pypdf 提取 822 字符 vs Xpdf 1865 字符，输出乱码（`½֪Զ`＝「陆知远」错映射 + 大量替换符）——缺陷真实存在。
- **本次 baseline（修复前，本地栈真实导出）**：`classic-serif`（思源宋体选择 → SimSun 回落路径）pypdf **4 关键词 MISS + 20 个康熙部首污染字**（⼀⼆⼈⼊⼋⼒⼗⼝⼠⼤…＝「一二人」等错映到 U+2F00 区）——与 VFINAL §11.5「康熙部首变体+覆盖不全」签名一致。
- **今日默认路径**（YaHei 子集）在当前 Chrome 版本下本地恰好提取完整（ToUnicode 447 条 ≈ 字符集大小）——缺陷**环境相关**（Chrome 版本 × 系统字体 × 内容），这正是修复要消除的不确定性：注入 Noto 后不再依赖渲染机字体与 Chrome 子集行为。

## 5. 验证结果

栈：web `next start` :3100 + export-service :3003（tsx 跑修复后代码）+ PG 5434 / Redis 6380。数据：自建账号 `pdfcn-s32@resumeaix.test` + 13 份 legacy 简历（12 模板 × 同一富中文内容 + classic 思源宋体变体），内容覆盖验收四要素（姓名/公司/长中文正文/证书奖项）+ 生僻字（燚龘翀彧玥珩）+ 康熙部首字面（⽕⽊）+ 全角标点。路径：真实登录 → 真实编辑器页 → `resume-print.ts` 同款 DOM 抽取 → 页面内 fetch `/api/export/pdf`（mode=legacy）→ 落盘。**验证后账号已级联删除，库内无痕。**

### 5.1 断言矩阵（17 关键词 × 13 PDF × 双工具）

| 模板 | pypdf CJK 字符 | MISS | 康熙污染 | 页数/裁切（base→fixed） |
|---|---|---|---|---|
| academic | 612（=base） | 0 | 0 | 2/passed → 2/passed |
| classic | 622（=base） | 0 | 0 | 2/passed → 2/passed |
| classic-serif | **622（base 554）** | 0（**base 4 MISS**） | **0（base 20 字）** | 2/passed → 2/passed |
| compact | 622 | 0 | 0 | 1/passed → 1/passed |
| creative | 612 | 0¹ | 0 | 2/passed → 2/passed |
| editorial | 616 | 0 | 0 | 2/passed → 2/passed |
| elegant | 618 | 0 | 0 | 2/passed → 2/passed |
| executive | 616 | 0 | 0 | 2/passed → 2/passed |
| finance | 624 | 0 | 0 | 2/passed → 2/passed |
| minimal | 622 | 0 | 0 | 2/passed → 2/passed |
| modern | 596 | 0 | 0 | 2/passed → 2/passed |
| sidebar | 622 | 0 | 0 | 1/passed → 1/passed |
| tech | 622 | 0 | 0 | 1/passed → 1/passed |

¹ creative 的 2 个「MISS」为关键词措辞假阳性：该模板 SectionBadge 用「教育」「工作」而非「教育经历/工作经历」，`教育`/`工作`/`项目` 实际均 HIT。

四要素命中示例（fixed，双工具一致）：姓名 `陈明远`、公司 `云枢科技`/`腾讯`、正文 `亿级流量网关`/`消息积压`/`灰度发布`/`单元化容灾`、证书 `系统架构设计师（软考高级）`/`PMP`/`阿里云ACP`、奖项 `技术之星`/`数学建模`、生僻字 `燚龘`/`翀彧玥珩`、康熙字面 `⽕⽊`（经 YaHei 子集正确映射）、全角标点 `（软考高级）`。

### 5.2 嵌入字体（fixed PDF BaseFont 实测）

- 全部中文正文 → **NotoSansSC**（Regular/SemiBold/Bold 三档真实分档）；classic-serif → **NotoSerifSC**；tech chips Latin → **CourierNewPSMT**（=base）+ chips 中文 → NotoSansSC；残留系统字体仅 `●`（U+25CF，Noto SC woff2 子集不含几何图形区，视觉为实心圆点无差异，提取无关）与字面注入的 `⽕⽊`。
- 文件体积：base 198–255KB（serif 811KB、138 张碎片 SimSun 子集）→ fixed 100–140KB（serif 124KB）——碎片化消失，子集更小。
- PDF 内部 PostScript 名 `NotoSansSCThin-*` 系 Google 静态实例命名怪癖（变字重实例沿用默认名），**字重正确**：三档子集字形目检可辨 + 与 design 线生产用同一组文件多年无字重问题。

### 5.3 版式无回归

- **页数**：13/13 模板 base 与 fixed 页数逐一相同（见上表）；**裁切**：13/13 双向全 `passed`。
- **目视抽查**（无头 Chromium PDF 查看器渲染成 PNG + 读图目检，3 模板）：classic（布局/分节/配色一致，黑体系等效无 tofu）、classic-serif（宋体系正文、字重恰当、无 tofu、家族一致）、tech（侧栏/主栏/配色完整，chips 干净）。截图 `visual-{baseline,fixed}-{classic,tech,classic-serif}.png`。
- **chips 等宽外观客观证明**：视觉模型对小字号等宽字体的判断与 PDF 字体表矛盾，补 A/B 像素对照（同标记、无注入 vs 全注入 CSS，CDP 同款拦截）：4 组 chips 宽度**逐位一致**（172.8/194.4/213.6/141.6px）——Latin 走 Courier New 不变，中文 1em 全宽不变（`ab-chip-render.mjs` + `ab-chip-*.png`）。
- 本地 Windows 默认路径字形由雅黑→思源黑体（与生产现状、预览、design 线同源）；生产 Linux 本就渲染 Noto CJK，修复后同为思源黑体系＝视觉等价（Spec 允许项，已按上述截图对照说明）。

### 5.4 回归测试与静态检查

- `apps/export-service` `test:pdf`（7 用例，真实 Chrome）：7/7 通过；`tsc --noEmit` 通过；`eslint src/` 0 问题。
- `git diff` 范围确认：仅 `legacy-pdf.ts` + `index.ts` 两文件（工作区内另有 3 个本次未触碰的存量改动：`interview-helper/next-env.d.ts`、`scripts/eval-f5-*.json`）。

### 5.5 design 线不受影响

`renderDesignPdf` 零改动；冒烟：POST `/api/export/pdf` mode=design（Noto @font-face 载荷）→ 200、8.1KB、嵌入 NotoSansSC ✓（`smoke-design.pdf`）。

## 6. 残差与限制（如实登记）

1. **LXGW WenKai / ZCOOL XiaoWei / Ma Shan Zheng 等中文 webfont 选择**：项目无 woff2（红线不加文件），其** Latin** 与修复前一样落系统回退；**中文**已由 CJK 面片兜底到 Noto（提取可修复；字形与预览的该字体外观不同——修复前导出同样没有该字体，非本次引入）。
2. **思源宋体正文字重**：仅有 600/700 两档（house 六件套同款），400 正文映射到 600 面。目检（读图）字重恰当不显粗；如需逐字重对齐预览，需引入 serif 400 文件（红线外，未做）。
3. `⽕⽊` 等**字面康熙部首码位**字符经系统 YaHei 渲染（Noto SC woff2 子集不含该区）；本 Chrome 版本下其 ToUnicode 映射正确、提取正常。真实简历内容出现此类码位极罕。
4. `●` 圆点经 YaHei 子集嵌入（几何图形区不在 Noto SC 子集）；无提取诉求。
5. 修复后 export-service 由本会话以 `tsx src/index.ts` 后台拉起于 :3003（修复前进程为手动启动的同命令）；**主控验收后统一重启/提交**。

## 7. 证据清单（`C:/Users/TimeCraker/Desktop/my_workspace/ResumeAIX-stage32/PDFCN/`）

- `baseline-<key>.pdf` ×13 + `baseline-results.json`（修复前，含页数/裁切头）+ `baseline-preview-<key>.png`（预览基准）+ `baseline-extraction.json`
- `fixed-<key>.pdf` ×13 + `fixed-results.json` + `fixed-extraction.json`
- `visual-{baseline,fixed}-{classic,tech,classic-serif}.png`（PDF 渲染目检对照）
- `ab-chip-plain.png` / `ab-chip-injected.png`（chips A/B 像素对照）+ `ab-chip-render.mjs`
- `smoke-design-payload.json` / `smoke-design.pdf`（design 线冒烟）
- 脚本：`setup-pdfcn.mts`（种子）/ `export-matrix.mts`（真实路径导出矩阵）/ `check-extraction.py`（双工具断言矩阵）/ `inspect-tounicode.mjs`、`inspect-residual.mjs`（CMap/字体客观检查）/ `render-visual.mjs` / `cleanup-pdfcn.mts`（清理）/ `apply-patch.mjs`、`add-local-companion.mjs`（CRLF 精确补丁，留档）
- `export-service-fixed.log`（修复后服务运行日志）

## 8. 结论

§32-4 验收全部满足：差异定位完成（§1）、design 线 Noto 注入以最小接法复用至 legacy（§2，零新依赖、模板零改动、design 线零触碰）、真实导出文件经标准工具双验证四要素可复制可搜索（§5.1）、12 模板+serif 变体字体路径全覆盖（§1/§5.2）、分页/裁切/版式无回归（§5.3）。待主控审查后 commit（建议 `fix(export): legacy PDF 中文文字层注入 Noto 同源字体 / inject design-line Noto fonts into legacy PDF text layer`）。
