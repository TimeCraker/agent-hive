# 任务 GAM2：games ui-polish 孤儿脚本目录处置

一句话任务：处置 `docs/ui-polish/tools/` 下 4 个未入库也未 gitignore 的孤儿脚本——逐个判定功能与安全性后，**安全可用的入库（git add）、损坏/一次性的进 .gitignore**。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\games`，游戏 monorepo（AsterNova 矩阵）。⚠️ 当前有 **40 个用户未提交改动文件**，全部是用户现场，绝不能回退/覆盖/混入。
- 上一轮审计（报告 `agent-hive/runs/reports/GAM-report.md`）发现：`docs/ui-polish/tools/`（audit.mjs 等 4 个脚本）未入库且未被 .gitignore 覆盖，但 S 系列台账引用它作为扫描器——处于「引用它但 git 里没有」的悬空状态。
- 判定规则（按此执行）：
  - 脚本功能完好 + 被台账引用 + 内容干净 → **入库**（让引用变诚实）；
  - 脚本损坏 / 一次性垃圾 / 内含敏感信息（密钥、token、私人绝对路径之外的敏感物）→ **加入 .gitignore** 并在报告说明。

## 步骤

1. 读工作区规则 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`；`git status --porcelain` 记初始快照（40 条用户现场）。
2. 逐个通读 4 个脚本：功能是什么、能否运行（读代码判断，不执行）、是否被台账/文档引用（grep 引用点）。
3. **安全检查**：grep 密钥/token/密码特征（`api[_-]?key`、`token`、`secret`、`password`、`Bearer ` 等）。有任何命中 → 不入库，进 .gitignore，报告标红。
4. 按判定规则处置：入库的 `git add docs/ui-polish/tools/<文件>`（**逐文件 add，严禁 `git add -A` / `git add .`**）；忽略的写进 `.gitignore`（按现有格式追加）。
5. 提交：Conventional Commits 中英对照（例：`chore(ui-polish): 工具脚本入库使台账引用落地 / track ui-polish tool scripts`）。
6. 写报告（见文末）。

## 红线

- **只动 `docs/ui-polish/tools/` 的 4 个脚本与 `.gitignore`**，不碰其他任何文件。
- 40 条用户未提交现场：不回退、不覆盖、不 stash、绝不混入提交。
- 不执行任何脚本；不碰 Godot/Go/Next 构建；不 push。
- 入库前安全检查必做；有敏感内容宁可 gitignore 也不入库。
- Windows 11 环境。

## 验收标准

1. 报告写入指定路径，含：4 脚本逐个判定表（功能/引用点/安全检查结果/处置）。
2. `git show --stat HEAD` 仅含本任务文件；`git status` 对比初始快照：除本任务处置外，40 条用户现场原样、无新增悬空项。
3. 处置后 `git status` 中不再出现这 4 个脚本的未跟踪告警（要么已入库，要么已忽略）。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\GAM2-report.md`

模板：`# GAM2 结果报告` / `## 结论一句话` / `## 脚本判定表（4 个）` / `## 处置与提交` / `## 人工复核（若有）` / `## 自评`
