# DEPLOY · 备份 + 安全部署 + 服务器端验证

## 前置（主控已确认才放行本任务）
- 本地全部验证波（BUILD/MOTION/UIUX/PERF/AUDITL）通过；origin/master = 发布 SHA（8302135 或其后的修复提交）

## 总上下文
- 总任务书必读 §5：`.../my-portfolio/docs/handovers/homepage-release-and-acceptance-agent-prompt.md`
- BASE 报告必读（部署脚本审查结论与已知坑）：`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\BASE-report.md`
- 工作目录 `C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`；证据目录 `C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/deploy/`
- 部署脚本：`scripts/deploy-portfolio-safe.sh`——**用 Git Bash 显式执行，不把 bash 语法交给 PowerShell**
- SSH：`ssh -i C:/Users/TimeCraker/Desktop/my_workspace/asterforge-deploy/ssh-keys/tencent_server_key.pem ubuntu@111.229.200.178`（密钥只引用不输出）

## 执行步骤
### 1. 部署前基线与备份（可立即回滚才允许停服）
- 服务器记录：当前 HEAD/构建标识（.next/BUILD_ID）、`systemctl status portfolio-web`、健康 curl
- **SQLite 一致性备份**：实际库路径核对（Prisma cwd 陷阱：`prisma/data/dev.db`）；用 `sqlite3 <db> ".backup '<dest>'"` 或 `VACUUM INTO`（先确认 sqlite3 可用；不可用则停服窗口内 cp + WAL checkpoint，如实记录方式与局限）；**验证备份可打开**：关键表 row count 与原库一致（projects/config 等业务表）
- 旧构建备份：`.next/standalone` 与 `.next/static` 打包挪到带时间戳的备份目录；记录回滚命令
### 2. 发布审查
- 确认打包 HEAD = origin/master HEAD = 发布 SHA（`git rev-parse HEAD origin/master` 一致；`merge-base --is-ancestor 7bc1262 HEAD` ✓）
- 核对 prisma schema 在基线 b2d2eac→发布 SHA 间是否有变更；无变更则 db push 为幂等 no-op（记录实际输出证明无数据写入）
- tar 内容抽查：含原画/reading-v1 轻量素材/清单；不含 dev 数据库/.env/凭证/node_modules
### 3. 执行部署
- Git Bash 运行 `scripts/deploy-portfolio-safe.sh`，全程记录输出；**若出现 `WARN: git fetch failed`（跨境超时）且本次发布含文件删除 → 按项目 SKILL 停下走 git bundle 修 ref 再继续**，不盲目重试
- SSH 断线先查远端任务是否仍在跑（`ps aux | grep deploy`），不重复启动
### 4. 服务器端验证（构建成功才算健康版本）
- 三端 HEAD 一致；systemd 新进程（etime<60s）+ 新 BUILD_ID 与发布 SHA 对应
- `https://asterforge.top/` 200 且含六幕标记；`/_next/static` chunk、public 原画、字体、`/_next/image` 真实内容 200 且 Content-Type 正确（无 HTML 假图片）
- `/admin` 200、公开 API 路由活、prisma/data 完好、近 1 分钟日志无 P2021/持续 500
- 失败处理：构建未成功/服务不可用 → 立即用备份恢复旧构建并验证恢复结果，如实报告，不带病交付
### 5. 回滚就绪记录
- 回滚命令序列 + 备份路径 + 恢复验证方式写入报告

## 红线
- 只操作 portfolio-web；不批量停 Node/Chrome/Docker；不覆盖 .env/systemd EnvironmentFile/数据库/上传；不上传本机开发数据
- 无可回滚备份不得先停服；构建失败不上线；不 force push

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\DEPLOY-report.md`（含停服起止时间、备份清单、部署输出摘录、验证矩阵）。
