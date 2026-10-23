# CERTS：修复 3——证书奖项全链接入（章节系统/编辑器/模板/分享/PDF，兼容历史）

## 任务一句话

把 certificates/awards 章节从上传/核对链真正接入成品链路：章节系统（SectionId/顺序）、正式编辑器编辑、适用模板渲染（executive 已有渲染代码）、在线分享、PDF 导出，且兼容历史简历/既有章节顺序/历史设计稿，不替换原存储 HTML。

## 共享背景

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。**开工三件事**：`git log --oneline -1` → `node C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/status-all.mjs` → 读 `docs/stages/stage-31-remediation.md`（第 3 项）+ 台账 S31-LAYPDF-05 行（现场：SectionId 与 DEFAULT_SECTION_ORDER 不含 certificates/awards，MODULE_ICONS 有预留未接入；上传含证书奖项的简历→核对页可见→编辑器/预览/分享/PDF 全链不渲染，DB 完好）。
- **不能按「所有模板均不支持」处理**（用户指令原文）：executive 模板已有渲染代码——先全量盘点：哪些模板已有 certificates/awards 渲染代码（grep 模板目录）、SectionId 枚举、DEFAULT_SECTION_ORDER、编辑器章节配置、PDF/分享渲染入口，把「断在哪几环」列清楚再动手。
- 环境：E2E 账号；素材可用 `C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/UPLD/materials/`（含证书 2/奖项 1 的合成简历）重传或库中已有；rebuild 见 runbook；浏览器独占；截图 `.../ResumeAIX-stage31-audit/CERTS/`（自建）+读图目检。
- 修复纪律：commit 中英文不 push（本项可能拆 2-3 个 commit：章节系统/编辑器/渲染）；rebuild 后浏览器回归；台账+Spec 更新；lint/type-check 过。**收尾纪律**：最后 Write 报告 `.../runs/reports/CERTS-report.md`。

## 修复要求（用户指令原文要点）

1. **章节系统**：certificates/awards 接入 SectionId 与 DEFAULT_SECTION_ORDER（放合理位置，参考行业惯例：教育后/技能前后）；**兼容既有章节顺序**——历史简历的 sectionOrder 不含新章节时按默认规则补位渲染，不重写用户已存的顺序。
2. **正式编辑器**：可编辑（增删改证书/奖项条目，走既有表单模式——注意 wave27 台账「五个基础内容编辑表单」的原独占约束已由用户本次指令在修复范围内解除，做最小接入不重构）。
3. **模板渲染**：适用模板正确展示（executive 用已有代码；其他模板逐一判断——有渲染代码的接通，确实无渲染结构的模板在报告中如实列出不硬塞）；**不擅自替换原存储 HTML**（历史简历的 content 不动，渲染层处理）。
4. **分享与 PDF**：公开分享页与 PDF 导出都渲染证书奖项；PDF 文字可复制、无编辑标记。
5. **历史兼容**：历史简历（content 已有 certificates 数据但 sectionOrder 无此章节）→ 渲染正常；历史设计稿版本恢复后不因章节接入而错乱。

## 验证场景

上传含证书奖项简历 → 核对页（原有，回归）→ 编辑器可见可编辑（增一条证书）→ 预览渲染 → 章节顺序含新章节且可拖拽 → 分享公开页渲染 → PDF 渲染可复制 → 历史简历（DB 造一台账口径的 fixture 或用既有数据）渲染不断层。

## 红线

不动面试线与他人改动；不 push；不重做模板设计（纯接入）；零密钥；【E2E】数据；不删改历史简历存储内容。

## 验收标准

1. 断点盘点表（模板×渲染状态）+ 接入前后对照（编辑器/预览/分享/PDF 四处截图）。
2. 历史兼容两场景（旧 sectionOrder/历史设计稿恢复）通过。
3. fix commits + 台账/Spec 更新；lint/type-check 过。
4. 报告落盘 CERTS-report.md。
