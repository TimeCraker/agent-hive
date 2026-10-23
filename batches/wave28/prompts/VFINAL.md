# VFINAL：全链回归 + 成功路径补齐 + 台账/清单收口 + 最终修复报告

## 任务一句话

对 wave28 全部 11 项修复做收口：全链一次贯通回归、逐项终态核对（已修已回归/明确阻塞）、视口抽查、PLAN_LIST/台账/验证记录收口、最终修复报告——只有真实修完并通过验收的项目才能勾选完成。

## 共享背景

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。**开工三件事**：`git log --oneline -30` 罗列本波全部 commit → `node C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/status-all.mjs` → 读 `docs/stages/stage-31-remediation.md`（11 项验收标准与各任务登记状态）+ `docs/stages/stage-31-browser-audit.md` 台账 + 八份修复报告 `C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/{SPEC,UNDO,UPSM,COPY,ASSET,QUOTA,DESIGN,CERTS,VIBE}-report.md`。
- 环境：E2E 账号；AI 文本渠道可用/vision 仍 401（环境限制）；rebuild 见 runbook；浏览器独占（本任务可用但要克制——回归为主）；截图 `.../ResumeAIX-stage31-audit/VFINAL/`（自建）+读图目检。
- **收尾纪律**：最后 Write 报告 `.../runs/reports/VFINAL-report.md`。

## 步骤

1. **逐项终态核对**（11 项）：对照 remediation Spec 的验收标准逐项核各任务报告与 git 实证——每项三选一：已修+本波回归通过 / 已修+仅局部回归（列缺口）/ 明确阻塞（原因）。发现报告与实际不符（如声称修了但 git 无 commit、或回归证据不足）：**复测该项**，如实降级。
2. **全链贯通回归**（一次真实用户路径）：上传（文字 PDF 重传一份【E2E】VFINAL）→ 解析 → 核对修改 → 保存 → 编辑器编辑+撤销重做（重点：UNDO 修复后的多步语义）→ AI 建议（评分或润色单次真实调用）→ 版式/设计稿（DESIGN 修复后生成一次）→ 版本对比（UNDO 修复后自比零差异）→ 分享（开→验→关）→ PDF 导出（含证书奖项渲染——CERTS 修复后）。每环节断言+截图。
3. **成功路径补齐核对**：素材生成简历（ASSET）、/vibe 真实回复（VIBE）、设计稿全链（DESIGN）——三项在各自任务已验，此处快速复验一次入口可用性；**扫描图片成功路径**：vision 仍 401 → 明确保留为阻塞项（环境限制，非修复失败），不得用合成替代结论。
4. **视口与无障碍抽查**：修复涉及的页面（编辑器/版本对比/上传/素材/分享）390/768/1440/1920 抽查 + 减少动画设置（prefers-reduced-motion 模拟）下无异常 + 焦点管理抽查。
5. **安全与计量抽查**：私有归属（他人简历 URL 不可见）、分享权限（关闭后 404）、重复提交保护（评分/生成连点）、失败不误耗 T-Coin（对一次账）。
6. **门槛**：受影响包 lint/type-check/build 全过（web + 本波动过的 packages/ai-service）。
7. **收口**：remediation Spec 全项终态打勾或阻塞标注；PLAN_LIST 31.5（或实际编号）子项真实勾选；台账 S31-xx 对应行终态；`docs/stages/stage-31-verification.md` 追加「2026-10-13 收尾修复更新」节（11 项结果+遗留）。全部 docs 一个 commit。
8. **最终报告**（见验收标准）。

## 红线

不新开大修（发现新缺陷只登记）；不 push 不部署；零密钥；【E2E】数据；不虚勾——只有真实修完并通过验收的项目才能勾选完成。

## 验收标准

1. 11 项终态表（项/结论/证据路径/阻塞原因），与 git 实证一致。
2. 全链贯通回归全环节断言+截图；三项成功路径复验；扫描图片明确保留阻塞。
3. lint/type-check/build 输出记录。
4. PLAN_LIST/台账/verification 收口 commit。
5. 报告落盘 VFINAL-report.md：修复清单、提交列表、实际验收结果、证据位置、仍未完成/未验证清单——逐项真实。
