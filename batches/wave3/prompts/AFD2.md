# 任务 AFD2：asterforge-deploy README §9 密码指向修正

一句话任务：查清 `backups/` 实际目录结构，把 README §9 里 MySQL 密码指向的旧 `aliyun` 命名 env 路径更正为当前权威位置（或加注说明）。**全程零密钥值外泄。**

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\asterforge-deploy`，生产环境唯一权威部署手册 + 脚本（单机腾讯云，手动 SSH，push 不自动上线）。⚠️ 有 1 个用户未提交改动，保留不动。
- 上一轮审计（报告 `agent-hive/runs/reports/AFD-report.md`）发现：README §9 的 MySQL 密码指向 `backups/production/aliyun/env/env-game-backend.env`——路径**存在非死链**，但 `aliyun` 命名是旧架构遗留（README §0.1 已声明该目录为 R43 前存量），对单机腾讯云架构的读者有误导；是否改指当前权威位置需调查 backups/ 实际结构后定。
- 注意：该 env 属 games 后端（已封存）域的凭证，本仓只是备份镜像。

## 步骤

1. 读工作区规则 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`；`git status --porcelain` 记初始快照（区分用户那 1 个改动）。
2. **只列目录结构**：`ls` / `Get-ChildItem` 探明 `backups/` 全部层级目录与文件名（**只看名字，绝不 cat/读任何 env 文件内容**）。
3. 对照 README 其他章节（§0.1 存量声明、备份策略段）判断：当前权威的 env 备份位置是哪里？旧 `aliyun` 路径与新位置是什么关系（同一文件的旧名？不同实例？）。
4. **更正 §9**：指向当前权威位置；若旧路径仍有存在价值（如历史备份），在 §9 或 §0.1 加一行注记说明两者关系。改动最小化，一两行内解决。
5. 提交：Conventional Commits 中英对照（例：`docs(readme): §9 密码指向更正为当前权威备份位 / point §9 to authoritative backup path`）。只 add README.md。
6. 写报告（见文末）。

## 红线

- **零密钥值外泄**：报告与提交中只允许出现目录/文件名，**绝不出现任何 env 文件的内容、密钥值、token 片段**。提交前 `git diff --cached` 自查。
- 只动 `README.md`；不碰 `ssh-keys/`、任何 env 文件本体、脚本、配置。
- 绝不 push；不执行部署/SSH/远程操作。
- 用户那 1 个未提交改动：不回退不覆盖不混入。
- 拿不准当前权威位置 → 不改路径，只加注记说明旧命名来历，报告列人工复核。
- Windows 11 环境。

## 验收标准

1. 报告写入指定路径，含：backups/ 目录结构树（仅名字）/ 判定依据 / §9 改动 diff 摘要。
2. `git show --stat HEAD` 仅 README.md；`git diff --cached` 无密钥内容。
3. `git status` 对比初始快照：除 README.md 外仅剩用户原有那 1 个改动。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AFD2-report.md`

模板：`# AFD2 结果报告` / `## 结论一句话` / `## backups 结构调查（仅目录与文件名）` / `## §9 更正与提交` / `## 人工复核（若有）` / `## 自评`
