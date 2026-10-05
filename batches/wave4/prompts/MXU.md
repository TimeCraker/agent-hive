# 任务 MXU：预置模型矩阵更新（消费 BMI + S01I 产出）

一句话任务：依据 BMI 调研报告的建议清单，在 S01I 完成后的主干上更新测速台预置模型矩阵（`engine/models.ts` + README 同步），typecheck 与 build 通过，一个提交。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`。**本任务在 S01I 与 BMI 都已收档后才派发**——派发时主干应已含 S01 的 T-001 起的提交链；开工前 `git status` 必须 clean，若发现脏区立即 BLOCKED 报告。
- 调研结论在：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\BMI-report.md`（先完整读它）。
- 产品口径：预置矩阵以「填 endpoint+key 即测」的快选为主；**glm-5.3 家族是默认对比组，保留不动**（除非 BMI 明确建议且标注了理由）。

## 步骤

1. 读 BMI 报告的「预置矩阵更新建议」节；读当前 `engine/models.ts` 结构与 README 矩阵段。
2. 按建议执行增/删/改：模型 ID 直书厂商真实 ID；字段结构与现有保持一致；每条建议若与当前代码现实冲突（如 S01I 改了结构），以新结构为准适配并记录。
3. README 模型矩阵/快选相关段落同步更新；不虚构未核实的数据——BMI 标「未获取到」的字段不填。
4. 验证：`npm run typecheck && npm run build`（若 S01I 已建立新 scripts，以其为准）。
5. 提交：Conventional Commits 中英对照（例：`feat(matrix): 更新预置模型矩阵至 2026-10 调研 / refresh preset model matrix from 2026-10 research`）。只显式暂存本任务文件。
6. 写报告（见文末）。

## 红线

- **不跑真实测速**（需要真实 key 与额度，不在本任务范围）；只更新静态预置信息。
- 不 push、不部署；不动 `docs/ai-delivery/` 冻结五件套；不碰 `.env*`。
- BMI 明确标「未获取到」或存疑的数据不落库。
- Windows 11 + PowerShell 语法。

## 验收标准

1. `git show --stat HEAD` 仅含本任务文件；`npm run typecheck && npm run build` 退出 0。
2. models.ts 预置与 BMI 建议逐条对得上（未采纳的列理由）。
3. 报告写入指定路径。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\MXU-report.md`

模板：`# MXU 结果报告` / `## 结论一句话` / `## 采纳/未采纳清单（对 BMI 建议）` / `## 提交与验证` / `## 自评`
