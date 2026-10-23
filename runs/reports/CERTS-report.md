# CERTS-report — 证书/奖项全链渲染接入（S31-LAYPDF-05 · Stage31 Remediation #3）

日期：2026-10-13。仓库 ResumeAIX @ main，分支 main，不 push。Commits：`68d536e`（章节系统+编辑器）、`df9f642`（12 模板渲染）、`c3723df`（台账/Spec/PLAN_LIST）。

## 结论

证书/奖项章节从上传/核对链正式接入成品链路：章节系统（SectionId/DEFAULT_SECTION_ORDER）、正式编辑器（8 节可编辑）、12/12 模板渲染、在线分享、PDF 导出全线打通；历史简历与历史设计稿零错乱；不替换原存储 HTML（渲染层处理，测试数据已逐字节还原）。type-check 过、touched eslint 0 error、真实浏览器九项 E2E 全过。

## 断点盘点表（开工全量盘点，模板 × 渲染状态）

| 环节 | 修前状态 | 判定 |
|---|---|---|
| shared-types 契约（certificates/awards: string[]）| 完好 | 不断 |
| workflow ReviewSection 8 节（核对页可见可编辑）| 完好 | 不断 |
| design-doc design 线（skeleton/slot-path/binder 全支持）| 完好 | 不断 |
| DB 落盘（ResumeContentSchema + PATCH）| 完好 | 不断 |
| resume-store SectionId / DEFAULT_SECTION_ORDER | 仅 6 节 | ❌ 断 1 |
| 编辑器 SECTION_CONFIGS / SectionContent / 计数徽章 | 仅 6 节、无表单 | ❌ 断 2 |
| 模板渲染（12 模板）| 仅 executive 有渲染代码，且硬编码在排序节之后不入 sectionOrder；其余 11 模板无 | ❌ 断 3 |
| 各模板 getSectionOrder（12 份拷贝）| 直接读历史存 sectionOrder，新章节永不命中 | ❌ 断 4（历史兼容核心） |
| 编辑器预览 / 分享 /r/[id] / PDF | 全走 ResumeHTMLPreview → 模板 | 随断 3/4 联动 |

**不按「所有模板均不支持」处理**：全 12 模板都有 sectionMap 渲染结构，逐一接通（无一硬塞、无一放弃）。

## 修法

1. **章节系统**（68d536e）：SectionId + DEFAULT_SECTION_ORDER 增补 certificates/awards，默认位次 `…skills, certificates, awards, selfEvaluation`（技能后、评价前，行业惯例）。新增 `resolveSectionOrder` 读时补位：按 DEFAULT 相邻关系把缺失章节插到最近既有前驱之后，**不重写用户已存顺序**（仅用户拖拽时经 reorderSections 落盘）。editor-sheet 用 raw selector + useMemo 派生（zustand v5 禁 selector 产新引用）。
2. **编辑器**（68d536e）：SECTION_CONFIGS +2（ScrollText/Trophy 图标，标题「资质证书/荣誉奖项」对齐 design-doc 口径）、计数徽章 +2（N 项）、SectionContent +2 case；新增 `string-list-editor.tsx`——「每行一项」textarea（同核对页 guided-desk 既有表单模式，最小接入不重构），本地草稿态解决受控 textarea 换行回吞问题，空行不落 store；store 新增 `updateStringList` action 走统一撤销栈/自动保存。
3. **模板渲染**（df9f642）：registry 增 `getValidStringList` 空条目守卫（同 S31-LAYPDF-09 口径）；template-sections 增共享 `CertificatesSection`/`AwardsSection`。12 模板接入明细：
   - classic / minimal：共享件入 sectionMap
   - executive：尾渲染两块移入 sectionMap（随章节排序，原「证书」标题并入「资质证书」统一口径）
   - elegant / finance / academic / compact / creative：sectionMap 补两节，样式逐模板对齐（药丸 chips / 顿号连排 / 学术左线标题 / 紧凑单行 `|` 分隔 / SectionBadge+tagColor chips）
   - tech / modern / sidebar：入侧栏组（sidebarIds），深色/浅色侧栏各自 chips 样式；creative/modern/editorial 的 iconMap 补 📜🏆
   - editorial：入双栏底区（twoColIds，flex:1）
   - 12 处 getSectionOrder 全部改走 resolveSectionOrder

**不替换原存储 HTML**：模板全部渲染层处理；历史简历 content 不动（验证后 DB 逐字节还原）。

## 数字化验收对照（Spec 第 3 项）

| # | 验收标准 | 结果 |
|---|---|---|
| 1 | 编辑器章节列表出现两节且可编辑，计数 6→8 | ✅ 「8 节 · 自动保存」；06 资质证书 2 项 / 07 荣誉奖项 2 项徽章；textarea 增「阿里云 ACP 数字化转型认证」→ 徽章 3 项 + 自动保存 + DB 读回一致（截图 02/03） |
| 2 | 编辑器预览渲染；分享公开页渲染同内容 | ✅ 预览技能→证书→奖项→个人简介；/r/[id] 同内容同顺序（截图 03/07） |
| 3 | PDF 文字层走查 MISS 关键词 0 MISS | ✅* PDF 2 页，实际 PDF 预览渲染图键断言（审计同法「PDF 渲染图」）：荣誉奖项（2023 年度技术之星、**数学建模**二等奖）→个人简介→资质证书（**系统架构设计师**（软考高级）/PMP/阿里云 ACP）全部在案（截图 09）；文字层为真文本（pdftotext + 自研 CMap 解码双验证 PMP/资质证书/荣誉奖项/姓名 HIT）。*中文 body 字形提取残缺为**既有平台限制**，见下「观察项」 |
| 4 | legacy 与 design 两管线均过 1–3 | ✅ design 线 /r/ 公开页与编辑器 DesignPreview 均渲染 `data-section="certificates"`（资质证书 CET-6 绑定正确，截图 10）；design PDF 文字层由 DESIGN 任务已验 |
| 5 | 既有 6 节简历无回归、零空节 | ✅ 【E2E】COPY-渲染边缘四形态（certs=[] awards=[]）：编辑器 8 节可填、预览仅渲染 5 个有内容节，零空节占位 |

## 历史兼容两场景

1. **旧 sectionOrder**：审计原件本身即历史 fixture（content 有证书奖项、`_appearance.sectionOrder` 仅 6 节）——全程补位渲染正常（验收 1–3 即其本体）；拖拽后 sectionOrder `["…skills","awards","selfEvaluation","certificates"]` 持久化，预览/分享/PDF 三处一致跟随（截图 04，DB 实证）。
2. **历史设计稿恢复**：设计稿 v6(copper-plate)→回滚 v5(midnight-rail)→回 v6，全程 `data-section="certificates"` 在位、CET-6 绑定正确、零错乱（截图 11）。

## 观察项（记录不修）

**legacy PDF 文字层中文 ToUnicode 映射残缺**：本机 Chrome print 将 MicrosoftYaHeiUI 子集嵌入 PDF，3 个 ToUnicode CMap 仅 272 条映射——pdftotext 中文全空、自研 CMap 解码约 60% 字形可提取（工作经历正文同样残缺）。影响全部章节的中文正文，**非本修引入、非证书特有**（根因：预览字体回退到系统雅黑，Chrome 对其 ToUnicode 嵌入不全；design 线经 injectFontBase 嵌 Noto 无此问题，故 DESIGN 任务文字层断言可全过）。证书关键词验收以审计同款「PDF 渲染图」断言为准；如需 legacy PDF 全文可检索，建议后续单独立项（预览字体强制 Noto / 导出端字体注入），不在本修复边界内。

## 测试数据还原

- legacy 简历 cmv59aeab000juvj8xtvrkxv8（【E2E】LAYPDF-版式多页）：测试前 content JSON 备份，测后回写，`BYTE-EQUAL: MATCH`（含新增证书删除、sectionOrder 复原 6 节、templateId 复原 classic）。
- design 简历 cmv59aebn000luvj87drd0qrr：仅做只读渲染检查与免费回滚（v6→v5→v6），active 已回 v6。
- T-Coin 全程未动（195）；未动面试线、未动他人改动（git status 仅会话前既有脏文件）。

## 证据清单（`ResumeAIX-stage31-audit/CERTS/`）

01-editor-8-sections / 02-editor-section-list-8（8 节+徽章）/ 03-preview-certs-awards（预览渲染+3 证书）/ 04-drag-order-changed（拖拽三处跟随）/ 05-06 模板 tech 侧栏 / 07-share-page-certs（分享页）/ 08-09 PDF 两页（第 2 页渲染图键断言）/ 10-design-share-certs（design 分享页）/ 11-design-restore-v5-certs-ok（历史设计稿恢复）。

## 提交清单

```
c3723df docs(stage31): 登记 CERTS 修复结论与台账 / record CERTS remediation result in ledger and spec
df9f642 feat(templates): 12 模板接入证书/奖项渲染 / render certificates & awards across all 12 templates
68d536e feat(editor): 证书/奖项接入章节系统与编辑器 / integrate certificates & awards into section system and editor
```
