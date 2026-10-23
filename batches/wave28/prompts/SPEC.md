# SPEC：Stage31 收尾修复 Spec 建立 + 清单挂载 + 旧记录修正（无浏览器测试）

## 任务一句话

建立本次收尾修复的 Stage Spec（11 项修复逐项数字化验收标准）、挂载进度清单、修正旧验证记录中已过期的环境状态——为后续 8 个修复任务提供权威依据。

## 共享背景

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。开工：`git log --oneline -1` 记 HEAD → `node C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/status-all.mjs` 核五服务 → 读根 `AGENTS.md`、`CLAUDE.md`、`docs/PLAN_LIST.md`、`docs/stages/stage-31-browser-audit.md`（缺陷台账+环境事实+runbook）、`docs/stages/stage-31-verification.md`（旧验证记录）。
- 环境（主控 2026-10-13 11:55 核实）：五服务全绿（3100/3002/3003/6380/5434，BUILD_ID `Ta2NXP7g1YEv6fwQs2Att`）；PG 已是正常服务（数据落盘 stage31-runtime/pg-data，旧「僵尸禁 kill」红线过时）；AI 文本渠道真实可用（智谱 glm-5.3 系）；vision 通道 401（环境限制）；E2E 账号 `e2e-stage31@resumeaix.test / E2eStage31!2026`。
- wave27 走查结论：28/28 页面结论、31 条缺陷台账（7 修+1 复核+8 交回+15 观察）——本次修复的就是 8 交回+3 小项。

## 步骤

1. **建 Spec** `docs/stages/stage-31-remediation.md`：本次收尾修复的权威文档。逐项列出 11 个修复项（下表），每项含：缺陷编号（沿用台账 S31-xx）、问题描述（从台账摘录）、修复要求（用户指令原文要点）、**数字化验收标准**（可执行的通过判据）、归属任务代号（UNDO/UPSM/COPY/ASSET/QUOTA/DESIGN/CERTS/VIBE/VFINAL）、状态（未开始）。文首写明任务边界：仅简历平台、不 push 不部署、保留现有设计、上一轮的「独占文件」约束在本任务范围内由用户本次指令解除。

   | 项 | 缺陷 | 归属 |
   |---|---|---|
   | 1 富文本撤销/重做双栈冲突 | S31-EDIT-04 | UNDO |
   | 2 设计稿生成失败 S4_NON_TEXT | S31-LAYPDF-10 | DESIGN |
   | 3 证书奖项接入不完整 | S31-LAYPDF-05 | CERTS |
   | 4 素材删除假成功 | S31-MISC-01 | ASSET |
   | 5 创建副本绕过数量限制 | S31-LAYPDF-01 | QUOTA |
   | 6 版本对比假差异 | S31-LAYPDF-02 | UNDO |
   | 7 /vibe 独立对话成功链路 | S31-AIFLOW-01 | VIBE |
   | 8 免费产品话术 | S31-UPLD-01(+MISC-04) | COPY |
   | 小1 断网保存中文提示 | S31-UPLD-02 | UPSM |
   | 小2 零字节文件拦截 | S31-UPLD-03 | UPSM |
   | 小3 空圆点/悬空分隔符 | 台账 LAYPDF 观察族 | COPY |

2. **挂载进度清单**：`docs/PLAN_LIST.md` 增加本次收尾修复条目（编号沿用现有体例，如 31.5 Stage31 收尾修复，11 子项 [ ]），或按文档现有结构最合理的方式挂载——先读文档结构再决定，不破坏既有格式。
3. **修正旧验证记录**：`docs/stages/stage-31-verification.md` 的「环境与未完成项」节有过期状态（Redis 未就绪等）——在文末追加「2026-10-13 更新」小节修正当前事实（Redis 已恢复、走查已完成、PG 已重建、AI 渠道就绪），**保留原有历史验收事实不删改**，只追加更新。
4. **commit**：`docs(stage31): ...` 中英文 Conventional Commit（Spec+清单+记录修正可一个 commit）。

## 红线

不修任何代码（本任务纯文档）；不动面试线与他人工作区改动；不 push；零密钥。

## 验收标准

1. remediation Spec 存在且 11 项都有数字化验收标准与归属代号。
2. PLAN_LIST 挂载新条目且格式合规。
3. verification.md 有追加更新且历史保留。
4. 一个 docs commit 落库。
5. **报告最后一步用 Write 工具写入 `C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/SPEC-report.md`**（不写文件=失败）。
