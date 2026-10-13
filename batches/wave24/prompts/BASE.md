# BASE · Portfolio 发布基线核对与 Git 集成（不部署）

## 背景基线（主控已核实，你需实时复核不得假定）
- 工作目录 `C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`，分支 `codex/character-motion-m1`，
  HEAD `8302135`（docs 交接提交），其下 `7bc1262`（perf 手机滚动与高刷动效）。
- 工作区干净。`origin/master` 落后本分支 31 提交、无分叉（master 是本分支祖先 → 可快进）。
- 本地预览 http://localhost:3108/ 当前**已停止**。
- 总任务书：`docs/handovers/homepage-release-and-acceptance-agent-prompt.md`（必读，本任务是其中 §3/§4）。

## 你要做的事（顺序执行）

### 1. 三端基线（只读，记录进报告）
- 本地：`git status --porcelain`（应为空）、`git rev-parse HEAD`、分支名。
- 远端：`git fetch origin` 后记录 `origin/master` SHA；确认远端 master 无他人新提交（若出现新提交，
  停止并报告，不自行合并）。
- 服务器（只读 SSH，禁止任何写操作）：
  `ssh -i C:/Users/TimeCraker/Desktop/my_workspace/asterforge-deploy/ssh-keys/tencent_server_key.pem ubuntu@111.229.200.178`
  记录：`cd /home/ubuntu/my-portfolio && git rev-parse HEAD`、`systemctl status portfolio-web --no-pager | head -8`、
  `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/`、`ss -ltnp | grep :3000`。
- 注意：本地 PowerShell 跑 git；远端命令是 Linux shell。SSH 脚本用 pwsh here-string 传 bash -s，
  参考模式：`($script -replace "`r","") | ssh -i <key> ubuntu@111.229.200.178 bash -s`，结尾 `echo __SCRIPT_END__`。

### 2. 必读文档与部署脚本审查（记录要点进报告）
- `.agents/skills/my-portfolio/SKILL.md`
- `C:/Users/TimeCraker/Desktop/my_workspace/asterforge-deploy/README.md`（部署环境权威说明）
- `scripts/deploy-portfolio-safe.sh` **读源码**：记录其同步方式（origin/master + reset）、打包方式（git archive HEAD）、
  构建流程（先停服再构建？）、db push/seed 步骤、SHA256/一致性校验点、回滚手段。
- `docs/stages/stage-2026-10-10-home-completion.md` 与 `stage-2026-10-10-home-fluidity.md`（只记结论性要点）。

### 3. Git 集成（快进 + 正常推送）
- `git checkout master && git merge --ff-only codex/character-motion-m1`
- `git push origin master`（**禁止 force push**）
- 验证：`git merge-base --is-ancestor 7bc1262 origin/master && echo OK`；再验证 `8302135` 同样是 ancestor。
- 记录最终发布 SHA（应为 8302135 或集成的更高提交）。
- 切回 `codex/character-motion-m1` 分支保持现场。
- **本任务不做任何部署、不改服务器任何状态。**

### 4. 本地生产预览拉起（供后续验证波使用）
- 检查 3108 端口归属；确认 package.json 的 build/start 脚本语义。
- 用隐藏窗口后台进程拉起本地生产预览在 3108（先 `pnpm build` 再 `pnpm start -- -p 3108` 或项目等价方式，
  以项目实际脚本为准）；等待就绪后 `Invoke-WebRequest http://localhost:3108/` 应 200。
- 验证首页含六幕标记（如 chapter 容器/标题文本抽查）与 `/home-preview`、`/explore` 可达。
- 把拉起进程的 PID 与日志路径写进报告（供主控后续管理）。若 3108 被非本项目进程占用，只报告不杀。

## 红线
- 只读服务器；不部署、不推送服务器、不覆盖任何线上数据。
- 不 force push、不 reset 任何分支、不 clean 工作区。
- 密钥文件只引用路径，禁止输出内容；不输出完整环境变量。
- 发现与基线不符（他人新提交/服务器异常）→ 停止并如实报告，不带病推进。

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\BASE-report.md`：
三端基线 SHA 表、部署脚本审查要点、集成与推送证据（命令输出摘录）、3108 预览 PID/日志/验证结果。
