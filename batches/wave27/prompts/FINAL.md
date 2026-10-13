# FINAL：Stage31 全站走查收口（台账合并、回归核对、PLAN_LIST、交付报告）

## 任务一句话

核查前序 7 个走查任务的产出完整性，合并缺陷台账、复核全部修复的全局回归、按真实完成度更新 docs/PLAN_LIST.md 勾选、产出最终交付报告——逐区列出通过/失败/未测数量与证据路径，不以构建通过冒充全平台完工。

## 背景（主控已核实；全部前序产出在仓库与走查文档里）

- **夜间事件（2026-10-12 深夜→13 晨）**：机器重启导致全部服务掉线；主控已于 10-13 09:40 按 runbook 全部恢复（PG 数据这次在磁盘上、重启后保留；Redis 队列态清空但无在途任务；Web/AI/Export 重拉）。status-all 五绿（BUILD_ID `lqdffvP-mU9ZzV8mOvaRX`）。走查文档环境事实节可补记这一事件与恢复时间线。
- **PG 红线更新**：旧「僵尸进程禁 kill」红线已过时（那个 PG 已死并被 PGFIX 替换）；当前 PG 是正常服务（start-pg.mjs/stop-pg.mjs 管理，数据在 stage31-runtime/pg-data）。仍不要随意重启，但已无「一死全丢」风险。
- **本波已验收任务与交付**（报告在 runs/reports/，git 在仓库）：PREP（环境+文档骨架）、PUB（9/9 页，9caec05 修复）、UPLD（6 类文件真实链路，368390c 登记）、PGFIX（库重建 92a763a）、EDIT（9/9 交互+3 修复 be53b9f/153ef60/48890e2，7cd5933 登记）、AIFLOW（6 入口真实调用对账，c4051d4）、LAYPDF（版式/分享/PDF，836b434/a72a350 修复，0308093 登记）、MISC（四块+对账，f424796 修复，dd5a3ac 登记）、ADMIN（8 模块只读矩阵，9b6ef16 修复，35fdff7 登记）。
- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。先读：`docs/stages/stage-31-agent-testing-handoff.md`（「交付」节是验收口径）、`docs/stages/stage-31-browser-audit.md`（PREP 建立、七个走查任务分区填写后的现状）、九份报告 `C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/{PREP,PUB,UPLD,EDIT,AIFLOW,LAYPDF,MISC,ADMIN,PGFIX}-report.md`、根 `AGENTS.md`（进度跟踪规则）、`docs/PLAN_LIST.md`。
- **开工第一步**：确认环境还在（读走查文档 runbook：3100/3002/3003/6380/5434；PG 僵尸进程禁止 kill/重启）；`git log --oneline -30` 罗列本波全部 commit；`git status` 确认无未收编改动。
- 浏览器：本任务**可用但克制**——只做回归复核截图，不开新走查面。

## 步骤

1. **完整性核查**：对照走查文档页面清单：每个路由都有归属任务的结论行；七个分区（PUB/UPLD/EDIT/AIFLOW/LAYPDF/MISC/ADMIN）都有结果表；缺口列清单（哪个页面/哪项没测、原因），能补的用浏览器快速补测（简单页面），补不完的如实标注未测。
2. **台账闭环审计**：缺陷台账每条要有终态：已修复+回归通过 / 取证交回（附证据路径）/ 未修（原因）。把「交回本会话」的复杂问题单独整理成清单（解析/计量/鉴权/合并/PDF 分页等），附根因与复现步骤——这是给原 Stage31 会话的回执。
3. **修复全局回归**：本波全部 fix commit 逐个在当前构建上复测（3100 若非最新 HEAD 构建先按 runbook 重建）：每个缺陷场景一次截图复核；`pnpm --filter @resumeaix/web lint` + `type-check` + `pnpm --filter @resumeaix/web build` 全绿记录（这是门槛不是验收替代）；涉及 ai-service 改动（若有）跑其 lint/type-check。
4. **PLAN_LIST 勾选合并**（handoff：共享文件交付时合并）：逐项核对本波真实完成的工作对应 PLAN_LIST 哪些条目，**只勾真实完成项**（浏览器走查类验收完成才勾；部分完成的注明）；不勾任何仅静态验证的项。同时核对 `docs/stages/README.md` 完成度统计是否需要更新（stage-31 相关行）。
5. **走查文档定稿**：环境事实节更新为终态（服务状态、最终 HEAD、测试资料留存清单、分享开关终态、T-Coin 终态）；补「总览」段：各区通过/失败/未测计数、真实 AI 通过/仅模拟/生产未测的区分说明。
6. **交付报告**：写 `runs/reports/FINAL-report.md`（见下）+ 走查文档 commit（docs: ...中英文）。
7. **收尾**：测试资料按 handoff 保留（供用户核对）；确认无密钥/凭证进任何 commit（`git log -p --all -20` 抽查 + grep key 类字段名）；服务保持运行。

## 红线

- 不新开大规模走查（补测限于明确缺口的小页面）；不做复杂修复（发现新复杂问题进交回清单）。
- 不 push 不部署不碰生产；不碰面试线；PG 僵尸进程禁区。
- PLAN_LIST 只勾真实完成项——宁可少勾不虚勾；不把「构建通过」写成「全平台完工」。

## 验收标准

1. 走查文档：页面清单 100% 有结论行（含未测标注）、台账 100% 有终态、总览计数齐全。
2. 交回清单完整（每条：根因/复现/证据/建议）。
3. 全部 fix commit 有回归复核记录；lint/type-check/build 输出记录。
4. PLAN_LIST/stages README 更新 commit（如适用）。
5. 报告落盘 `runs/reports/FINAL-report.md`。

## 报告要求

整文件覆盖写入 `runs/reports/FINAL-report.md`：总览计数表（区×通过/失败/未测）、完整链路清单（哪些真实用户路径全程走通）、缺陷台账统计（已修 N/取证交回 M/未修 K）、修复 commit 全列表、验证命令与结果、截图与证据根目录、遗留与建议（给原会话的交回清单摘要）、自评。
