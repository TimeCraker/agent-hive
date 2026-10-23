# PDFCN · legacy PDF 中文文字层（S32-PDFCN）

## 权威 Spec
`docs/stages/stage-32-remediation.md` §32-4（先读）。历史记录：
`agent-hive/runs/reports/VFINAL-report.md` §11.5 + CERTS-report 观察项——
legacy PDF 中文 ToUnicode 映射不完整（康熙部首变体 + 覆盖不全）；design 线经 Noto 注入无此问题。

## 任务
### 1. 差异定位
- 对比 legacy 与 design 两条导出路径的：字体加载（font-family 解析）、字体文件嵌入、
  **导出前字体就绪等待**（document.fonts.ready / load 事件）、Puppeteer print 参数
- 查 design 线的 Noto 注入机制（export-service 或渲染页），评估**复用**到 legacy 渲染路径的
  最小接法（优先复用既有字体与导出能力，不引入新字体文件/新依赖）
- 查 12 个 legacy 模板各自字体路径（registry/模板 CSS），确认注入点覆盖全部

### 2. 实施
- legacy 渲染（或导出）路径接入与 design 等价的字体嵌入/就绪保障；最小改动
- **不改变视觉排版**：字体渲染结果应与现状一致（若注入改变字形外观，需截图对照说明——
  中文字形应同源 Noto 系则视觉等价）

### 3. 验证（真实导出文件，标准工具）
1. 代表模板完整导出 PDF：中文**姓名、公司名、成果正文（长中文段落）、证书奖项**——
   用标准 PDF 文本提取工具验证可复制/可搜索（Windows 可用 `pdftotext`（若装了 poppler）或
   Python pypdf/pdfminer；以本机实际可用工具为准并记录工具与版本；**自研解码/仅英文命中不算**）
2. 12 模板字体路径覆盖：每模板至少导出一次抽查关键中文字符提取（全量 12 份导出，
   提取断言关键词命中）
3. 分页/裁切/历史版式无回归：对照修复前导出（保留修复前 PDF 作 baseline），页数一致、
   目视抽查 2-3 模板排版
4. 本地栈：web 3100 + export-service 3003（status-all 检查后按需拉起）

## 红线
- 不动 design 线导出；不加新依赖（字体复用项目已有）；不改模板视觉设计
- 不 commit（主控审查后统一提交）；不 push 不部署；PDF 证据存证不覆盖旧目录

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PDFCN-report.md`：
差异结论、接法与 diff、提取工具+版本、12 模板断言表、版式对照结论。
证据：`C:/Users/TimeCraker/Desktop/my_workspace/ResumeAIX-stage32/PDFCN/`
