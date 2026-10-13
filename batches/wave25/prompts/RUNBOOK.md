# RUNBOOK · 回滚说明修正（R3，仓库内正式 runbook）

## 问题（独立复核 R3）
`agent-hive/runs/reports/DEPLOY-report.md` §6 的回滚命令块：注释写「仅当数据受损时」恢复 DB，
但 `cp ... dev.db` 无条件执行——整段复制会**覆盖上线后的新增生产数据**。且未区分运行中
standalone 构建标识与根 .next/BUILD_ID；服务器 reset 不代表三端一致。

## 任务
1. **在仓库内建立正式 runbook**（建议 `docs/runbooks/rollback.md`，遵循 docs/ 既有结构）：
   - **默认流程 = 只恢复代码/构建，保留当前数据库**（零数据丢失路径）
   - **DB 恢复 = 独立条件化章节**：恢复前必须先备份当前生产库（带时间戳），明确「确认数据受损才执行」
   - 分节说明：服务器代码（git reset）/ 运行产物（standalone+static tar 恢复，注意 BUILD_ID 两处位置：
     根 `.next/BUILD_ID` 与 `.next/standalone/.next/BUILD_ID`）/ 本地与远端 ref 状态
     （服务器 reset 后需另行处理本地+origin，不能自称三端一致）
   - **实证核对**：SSH 只读列 `/home/ubuntu/backups/portfolio-predeploy-20261011-135231/` 内
     `next-standalone.tar.gz` / `next-static.tar.gz` 的真实目录结构（tar -tzf 抽样头尾），
     确认 runbook 恢复命令的解压目标路径与归档结构一致；核对线上实际运行路径
     （systemd ExecStart 与 .next/standalone 布局）
   - **未演练路径明确标注**「未演练」（本次不实际回滚线上、不恢复生产 DB）
2. **更新原报告引用**：在 `agent-hive/runs/reports/DEPLOY-report.md` §6 顶部加一行指向仓库 runbook
   的横幅（不删历史内容，历史保留原样）
3. runbook 提交为独立 commit（Conventional Commits 中英文），允许 commit（纯文档）

## 红线
- 只读 SSH（tar -tzf 列表可以）；不实际回滚、不恢复 DB、不重启服务
- 不改其他文件；密钥只引用路径

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\RUNBOOK-report.md`：
归档结构核对证据、runbook 路径与 commit SHA、原报告横幅更新说明。
