# COPY：修复 8+小项 3——免费话术清理 + AI 失败退币措辞 + 空圆点/悬空分隔符

## 任务一句话

清理全站与免费规则冲突的付费话术（S31-UPLD-01+MISC-04）、统一 AI 失败的「退币/返还 T-Coin」措辞、修复模板与 PDF 的空成果圆点和空结束日期悬空分隔符。

## 共享背景

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。**开工三件事**：`git log --oneline -1` → `node C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/status-all.mjs` → 读 `docs/stages/stage-31-remediation.md`（第 8 项+小项 3）+ 台账 S31-UPLD-01/MISC-04 行及 LAYPDF 观察族（空圆点/悬空分隔符的现场记录）。
- 环境：E2E 账号 `e2e-stage31@resumeaix.test / E2eStage31!2026`；rebuild 流程见 runbook；浏览器独占；截图 `.../ResumeAIX-stage31-audit/COPY/`（自建）+ 读图目检。
- 修复纪律：一类一个 commit；修完 rebuild 前后对照；台账+Spec 更新；lint/type-check 过。**收尾纪律**：最后 Write 报告 `.../runs/reports/COPY-report.md`。

## 修复 8：免费话术（S31-UPLD-01 + MISC-04）

- 背景：2026-09-19 起全站免费（stage-20 拍板，见 CLAUDE.md 计费现状节）。付费时代文案残留。
- 全站扫描：`grep -rn "升级套餐\|升级.*套餐\|upgrade.*plan\|付费\|购买" apps/web/src --include="*.ts" --include="*.tsx"`（含中文变体），逐一判断：与现行免费规则冲突的改为免费叙事（如配额触顶提示改为「免费版最多存储 5 份简历，请删除不需要的简历后重试」之类，语义与既有配额政策一致——**不修改额度政策本身**）。
- **保留**：admin 历史订单管理中的真实业务文案（核销/收款订单是历史事实，按实际用途保留）。
- AI 失败措辞：全站扫「退款/现金退款」类表述，AI 功能失败场景统一为「退币/返还 T-Coin」措辞（T-Coin 是计量闸门非现金）。

## 小项 3：空圆点与悬空分隔符（模板/PDF）

- 台账现场（LAYPDF 观察族）：成果条目为空时模板仍渲染圆点 bullet；结束日期为空时留下悬空分隔符（如「2024-01 — 」尾部悬空）。
- 修法：模板渲染层过滤空成果（空条目不渲染圆点行）；日期区间渲染时空结束日期不产出悬空分隔符。
- **保留语义**：「至今」正常显示；合理的未来毕业日期（在读，如 2027-06）不被误伤。
- 验证：构造【E2E】简历含空成果条目+空结束日期+至今+未来毕业日期四形态，浏览器渲染对照（预览+分享页+PDF 导出三处）。

## 红线

不动面试线与他人改动；不重做设计（纯文案/渲染条件修正）；不 push；零密钥；【E2E】数据。

## 验收标准

1. 全站扫描清单（文件×文案×处置）入报告；冲突话术清零（复扫断言）；admin 历史订单文案保留有说明。
2. 空圆点/悬空分隔符四形态三处（预览/分享/PDF）前后对照截图；「至今」与未来毕业日期不受影响。
3. fix commits + 台账/Spec 更新；lint/type-check 过。
4. 报告落盘 COPY-report.md。
