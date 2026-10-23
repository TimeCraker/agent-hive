# AUDIT32 · Stage32 多模态版式审计（glm-5.3-flash）

## 你是多模态审图任务。前置：PDFCN 与 VISION 已完成并产出截图证据。

## 输入（逐一用读图能力打开）
1. **PDFCN 修复前后 PDF 截图对照**：`C:/Users/TimeCraker/Desktop/my_workspace/ResumeAIX-stage32/PDFCN/`
   （修复前 baseline 与修复后导出的代表模板截图——以 PDFCN-report 证据清单为准）
2. **12 模板版式抽查**：PDFCN 产出的 12 模板导出截图（同上目录）
3. **VISION 全链路截图**：`C:/Users/TimeCraker/Desktop/my_workspace/ResumeAIX-stage32/VISION/`
   （上传→识别→核对→编辑器→PDF 各步截图）
4. **DATE 三出口截图**：`C:/Users/TimeCraker/Desktop/my_workspace/ResumeAIX-stage32/DATE/`
   （预览/分享/PDF 中「2020-01」无「至今」的定格）

## 审计项（每条结论必须指向具体截图路径）
### PDFCN
1. 修复前后中文字形对照：无字形退化/替换（粗细、衬线风格、字重一致）；
   Noto 注入不应改变视觉排版
2. 12 模板版式：标题/分栏/间距/分页与基线一致；无文字溢出、无重叠、无缺字位
3. 证书奖项区块渲染正常（Stage31 CERTS 成果不被本修复破坏）
### VISION
4. 识别结果页：中文姓名/日期/章节结构合理可读（识别质量目检，不替代文本断言）
5. 最终 PDF：左右栏顺序、中文字符渲染完整
### DATE
6. 三出口定格中日期显示形态一致且无「至今」误显

## 产出
- P0（阻断部署）/P1（应修）/P2（建议）分级清单，每条附截图路径与描述
- 总结论：Stage32 四项的视觉面是否可进入部署准备

## 红线
只审图不改码；不臆测截图外行为

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AUDIT32-report.md`。
