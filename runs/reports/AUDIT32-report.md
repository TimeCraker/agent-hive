# AUDIT32 · Stage32 多模态版式审计报告

日期：2026-10-16。审计模式：只审图不改码，结论全部锚定截图证据，不臆测截图外行为。
输入：`ResumeAIX-stage32/{PDFCN,VISION,DATE}/` + 前置报告 PDFCN / DATE / VISION2。

## 0. 审计方法与证据增量

- PDFCN：13 组 `visual-{baseline,fixed}-<key>.png` 全量目检（本审计用目录内既有 `render-visual.mjs` 补渲染了 10 个此前无对照图的模板，共新增 20 张；只产证据图，未改任何代码）+ `ab-chip-{plain,injected}.png` + 13 张 `baseline-preview-*.png` 版式基线；页数/裁切与 `baseline-results.json` / `fixed-results.json` 交叉核对。
- VISION：A/B/C 三场景全链截图目检；A-07/B-07 捕获时实际 PDF 预览未加载完，本审计将 `A-exported.pdf` / `B-exported.pdf` 补渲染成图（`VISION/audit-A-exported-full.png`、`VISION/audit-B-exported-full.png`）后目检。
- DATE：三出口截图目检 + 真实导出件 `s32-date-export.pdf` 补渲染（`DATE/audit-s32-date-export-p1.png`）。
- 本审计共新增 23 张证据渲染图（PDFCN 20、VISION 2、DATE 1），文件名带 `audit-` 前缀或沿用脚本既有 `visual-` 命名。

## 1. 分级清单

### P0（阻断部署）

无。

### P1（应修）

1. **design 线导出 PDF 尾随空白页（VISION 场景 A）**
   - 证据：`VISION/audit-A-exported-full.png`（第 2 页整页纯空白）、`VISION/A-exported.pdf`（59,369 B，2 页，与 A-pdf-check.json 页数记录一致）。
   - 描述：A 场景导出件第 1 页内容完整（含「曦」水印与全部章节），第 2 页无任何内容。B 场景同链路导出件为单页、无此现象（`VISION/audit-B-exported-full.png`）。VISION2 报告的 6/6 文本断言与裁切检查均不覆盖空白页目检，属漏检项。
   - 定性：design 线 `renderDesignPdf` 的分页行为（设计稿内容高度略超一页即溢出空白页），本批 Stage32 修复未触碰 design 线、非其引入；影响的是用户下载交付件的质量。建议记入 `docs/DESIGN_TODO.md` 随下一迭代处理，不阻断本次部署准备。

### P2（建议）

2. **creative 模板分页点微移**：fixed 版第 1 页末比 baseline 多容纳一行「中间件与存储」chips（分页点前移一行）。页数 2/2 不变、无裁切。证据：`PDFCN/visual-baseline-creative.png` vs `PDFCN/visual-fixed-creative.png`。成因为 Noto 与 YaHei 行高度量差异，属 Spec 允许的「同源等价字形替换」的自然结果。
3. **editorial 模板第 2 页折行微移**：fixed 版「PostgreSQL·掌握」chip 内折为两行、「资质证书」段落折行点与 baseline 略有差异；四栏结构完整、无重叠溢出。证据：`PDFCN/visual-baseline-editorial.png` vs `PDFCN/visual-fixed-editorial.png`。成因同上。
4. **VISION 终验截图时机**：`VISION/shots/A-07-pdf-desk.png` 与 `B-07-pdf-desk.png` 捕获时「实际 PDF 预览」区仍显示「正在读取实际 PDF…」、`B-03-review.png` 为表单载入半透明态，均为流程中途定格。证据缺口已由本审计补渲染真实导出 PDF 弥补；建议后续 E2E 脚本在截图前等待 PDF 预览加载完成。

## 2. 审计项逐条结论

### PDFCN

1. **修复前后中文字形对照：PASS**。13 组对照渲染全量目检：无 tofu、无缺字位、无字形替换错乱；classic-serif 的宋体系风格保留（`visual-{baseline,fixed}-classic-serif.png`）；黑体系正文 YaHei→Noto Sans SC 差异轻微、与预览及 design 线同源（Spec 允许项，对照不可辨为退化）；chips A/B 四组宽度逐位一致（`ab-chip-plain.png` / `ab-chip-injected.png`），tech 模板 Courier Latin 等宽外观不变；生僻字「燚龘翀彧玥珩」与康熙部首字面「⽕⽊」在所有对照图中渲染正常。
2. **12 模板 + serif 变体版式：PASS**。13/13 页数 base 与 fixed 逐一相同（JSON 交叉核对：compact/sidebar/tech 1 页，其余 2 页）、13/13 裁切 passed；全量对照渲染无文字溢出、无重叠、无缺字位；分栏模板（tech/sidebar/modern 左右栏、editorial 底部四栏）结构一致；仅 creative/editorial 两处折行微移（见 P2-2/P2-3）。
3. **证书奖项区块：PASS**。classic/classic-serif/tech 及全部模板的「资质证书」「荣誉奖项」区块渲染正常，内容与 baseline 一致（系统架构设计师（软考高级）/PMP/阿里云ACP/CET-6、2023年度技术之星等），Stage31 CERTS 成果未被破坏。

### VISION

4. **识别结果页：PASS**。`shots/A-03-review.png`：姓名「欧阳睿曦」、电话 138-0000-8629、邮箱、所在地、求职意向完整可读，章节计数 教育经历 2 / 工作经历 2 / 项目经历 2 / 技能分组 1。`shots/B-03-review.png` 为载入中定格（解析明细与计数可见、表单半透明），其内容完整性由 `B-04-editor.png` 编辑器页与 VISION2 的 14/14 内容断言覆盖。
5. **最终 PDF：PASS（附 P1 一条）**。补渲染目检 `VISION/audit-A-exported-full.png` / `audit-B-exported-full.png`：中文字符渲染完整无 tofu；两场景设计稿均为单栏版式，无左右栏可核，自上而下章节顺序正确（基本信息→教育→工作→项目→技能）；A 件尾随空白页记 P1-1。

### DATE

6. **三出口一致且无「至今」误显：PASS**。
   - 预览：`DATE/s32-date-editor-pdf-preview.png` — 缺尾日期大学/公司/项目均裸显 `2020-01`，在职标记公司 `2021-03 - 至今`（页底可见）。
   - 分享：`DATE/s32-date-share-page.png` — 六条目形态同上，「至今」全文仅 isCurrent 条目 1 次；齐全对照 `2018-01 - 2019-12`、在读 `2023-09 - 2026-06` 原样。
   - PDF：`DATE/audit-s32-date-export-p1.png`（真实导出件渲染）— 三类形态与上两出口逐一一致，无悬空「2020-01 - 」、无缺尾条目误显「至今」。
   - 编辑检查：`DATE/s32-date-editor-checklist.png` — 「3 条日期需要检查」+ 三按钮「核对 缺尾日期大学·缺结束日期」等标注正确，对照条目（在职标记/完整日期/在读）未计入。

## 3. 总结论

**Stage32 视觉面可进入部署准备。**

- PDFCN（32-4）：视觉零回归，13/13 页数与裁切一致、无字形退化，两处 P2 折行微移为 Spec 允许的字形同源替换的自然结果，不建议阻断。
- VISION（视觉渠道 + 全链路）：识别页、编辑器、设计稿、最终 PDF 视觉面全部通过；P1 一条（design 线导出尾随空白页）为存量渲染行为、非本批修复引入，建议记 DESIGN_TODO 随下迭代修复。
- DATE（32-2）：三出口日期形态一致、无「至今」误显，通过。
- 范围说明：Stage32 第四项（32-3 素材生成原子数量闸门）无视觉证据目录（LIMIT 目录未在本审计输入清单），本次视觉审计不覆盖其结论。
