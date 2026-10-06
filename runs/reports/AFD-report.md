# AFD 报告 · asterforge-deploy 文档保鲜度审计与修复（Wave 8）

- **执行日**：2026-10-06
- **基线**：master @ 9f39e1b（fix(nginx): lekao 启用 HTTP/2 与小饭桌补安全头）
- **改动**：4 个 .md 文件，28 insertions / 22 deletions（`git diff --check` 干净）
- **commit**：⚠️ 跳过——工作区存在他人未提交改动（untracked `docs/audits/lekao-audit-2026-10.md`，2026-10-03 生成的 lekao 审计，非本任务产物），按任务红线「目标仓有他人未提交改动时绝不 commit」执行。修改已留在工作区，待该审计文件归属落定后可随其一并处理（建议 commit 信息：`docs: 保鲜修正四份说明文档 / refresh four docs to match repo reality`）。

---

## ① 过期点清单（19 处，全部当场修正）

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---|---|---|---|
| 1 | README.md 顶部更新戳 | 「最后更新：2026-10-03 R71 巡检（…）」 | 拆两行：「最后更新：2026-10-05 nginx 安全优化」+「巡检基线：2026-10-03 R71（…R72 待下轮巡检产生）」 | 最新 commit 9f39e1b（10-05）改 nginx 配置入库，文档未反映；R71 快照为 10-03 时点 |
| 2 | README.md §6.1 目录树 asternova-web-client 行 | 「同级 .old-<日期> 为回滚备份」 | 「R67 清理后不留目录级 .old 回滚档，git monorepo 为唯一回滚源」 | README §6.1 服务表自记「R67 两轮清理后（.old-*）全部移除」；R70 快照 L51 回滚锚已 rm；与本文档 L303 原有自相矛盾 |
| 3 | README.md §8 职责清单 | 无 10-05 nginx 变更记录，lekao/xiaofanzhuo 行止于 R71 时点 | 末尾补「2026-10-05 变更（commit 9f39e1b）」整行（lekao HTTP/2 写法 + xiaofanzhuo 4 项安全头及 add_header 继承切断细节） | `git show 9f39e1b`：nginx-lekao.conf `listen 443 ssl http2`、nginx-xiaofanzhuo.conf 两处各 4 项 add_header |
| 4 | README.md §10.6 末条 | 「回滚 = 恢复同级 .old-<日期> 目录（自带 .next 与 node_modules，无需重建）」 | 「R67 起不再留目录级 .old- 档，git monorepo 为唯一回滚源；增量热更用 .next.bak-<ts> 锚回切」 | 同 #2；.old 目录在服务器已不存在，照原文操作必失败 |
| 5 | README.md §13 已部署服务清单 | 「…Decision-OS / Lekao。」（缺 xiaofanzhuo） | 补「/ xiaofanzhuo」 | xiaofanzhuo 2026-08-23 上线（README §3/§6.1/§7.6 均载）；§13 清单漏更 |
| 6 | README.md §15 文件地图 server-snapshot 行 | 「最近 5 轮 server-status 巡检报告」 | 「现有 R49、R59–R71 共 14 份；R72 待下轮巡检产生」+ 新增 docker-state.R*.md 行（R49、R59–R64、R66–R71；R65 轮未采） | `ls backups/production/`：server-snapshot 14 份、docker-state 13 份（无 R65） |
| 7 | README.md §15 文件地图 | 无 docs/ 与 e2e/perf-baselines 条目；ssh-keys 行仅标 2 个废弃密钥 | 补 `docs/` 行、`e2e/ · e2e-walkthrough · perf-baselines` 行；ssh-keys 行补 tencent_server_key.pem（权威位置 §2）与 aliyun-ecs-portfolio | 目录实存：docs/（2 文件+audits/）、backups/production/{e2e,e2e-walkthrough-2026-10.md,perf-baselines}；ssh-keys/ 实含 tencent_server_key.pem 与 aliyun-ecs-portfolio(.pub) |
| 8 | COLD-START.md §1.1 注意 | 「项目源码在各自独立仓库（ResuAIX / Lekao / AsterNova / DecisionOS 等）」 | AsterNova 前端改指 games monorepo `asternova/web-client` 子目录、后端 game-backend-demo | README §4（2026-09-25 起 monorepo）+ server-snapshot.R65.md 迁移记录 |
| 9 | .claude/commands/game-asternova.md L43 | 密钥 `C:\Users\TimeCraker\.ssh\tencent_server_key.pem` | `…\Documents\tencent_server_key.pem`（注明与 README §2 / 备份脚本一致） | backup-from-servers.ps1 L5 用 Documents 路径且近期备份成功；README §2 经 0745e76 修正为 Documents |
| 10 | game-asternova.md 后端部署段 ×2（scp/ssh 命令） | 同上 `.ssh\` 路径 | 同上改 Documents | 同 #9 |
| 11 | game-asternova.md CynosDB 密码行 | 「见 …/tencent/env-game-backend.env」 | 「见 …/tencent/env/env-asternova-server.env（DATABASE_DSN）」 | `ls tencent/env/`：无 env-game-backend.env，有 env-asternova-server.env；README §7.4/§9 同指 |
| 12 | game-asternova.md 代码仓库表 games 行 | 「回滚 = 恢复同级的 .old-<日期> 目录」 | 「R67 清理后不留目录级 .old- 回滚档，本 git monorepo 为唯一回滚源」 | 同 #2；且与本文件 L126（增量更新节「R67 起不再留目录级回滚档」）原自相矛盾 |
| 13 | game-asternova.md sparse 主路径 | `mv asternova-web-client asternova-web-client.old-$(date)` + `cp ../asternova-web-client.old-*/.env.production` | 先 `cp .env.production /tmp/env.production.bak` 再 `rm -rf` 旧目录，env 从 /tmp 拷回 | 同 #2 原则；.old 目录机制已废止，原文照做会堆积已废弃回滚档 |
| 14 | game-asternova.md 离线备选服务器侧描述 | 「mv 旧目录加 .old-日期」 | 「旧目录拷出 .env.production 后删除（不留 .old 档）」 | 同 #2 |
| 15 | game-asternova.md 回滚指令 | `mv …bad-<ts>` → `mv …old-<日期>` 回滚（旧目录自带 .next+node_modules） | 优先 `.next.bak-<ts>` 锚回切；无锚时从 games monorepo 检出上一 commit 全量重铺 | 同 #2 + 本文件 L126 增量节既有锚做法（R70 实战 `.next.bak-20261003140254`） |
| 16 | backups/README.md 目录树 docker-state.md 行 | 「当前 Docker 容器状态（最新，每次巡检覆盖）」 | 「R43 时点存量，此后不再覆盖」 | backups/docker-state.md 内容标注 R43（2026-07-29）；git log 该文件最后提交 59bcb9a（R43）；R59 起每轮写 docker-state.R{N}.md |
| 17 | backups/README.md 目录树快照范围 ×2 | 「docker-state.R{31..42}.md」「server-snapshot.R{31..42}.md」 | R49、R59–R64、R66–R71 / R49、R59–R71 | `ls backups/production/` 实数 |
| 18 | backups/README.md tencent 子树 ×2 | nginx「(tencent-all/decide/lekao/workspace-os + nginx.conf)」；systemd「13 个 .service」 | nginx 10 份（补 asternova/product/xiaofanzhuo/static-extra/websocket-upgrade）；systemd「20 个 .service（16 业务 + 3 timer 配套 + claude-remote-bot 下线存档）」 | `ls tencent/nginx/` 10 份 .conf + nginx.conf；`ls tencent/systemd/ | grep -c '.service$'` = 20（16 业务 + export-restart/portfolio-web-healthcheck/portfolio-web-restart 3 timer 配套 + claude-remote-bot） |
| 19 | backups/README.md 恢复指引第 4 条 | 「SSL 证书迁移：production/aliyun/ssl-certs.md」 | 「SSL 证书清单：production/tencent/certbot-certificates.txt（…aliyun/ssl-certs.md 为 R43 前历史）」 | 阿里云 R43 (2026-07-28) 废弃、SSL 终端在腾讯云 certbot（README §3/§8）；tencent/certbot-certificates.txt 实存且 R71 轮已刷新 |

### 待人工确认（发现过期但本轮红线禁止修改）

| 文档 | 过期内容 | 证据 | 不改原因 |
|---|---|---|---|
| `ssh-keys/SSH密钥说明.txt` | ①【阿里云 ECS】段仍按在役写「asterforge.top / Portfolio / AsterNova」；②腾讯云段「部署项目: ResuAIX / RAG Demo / Genesis V2」（RAG 2026-06-22 下线，现承载全部 16 服务）；③「game_user (仅允许 8.162.7.172 访问)」 | README 架构声明（R43 阿里云废弃）、§7.7 RAG 下线、§12 `ALTER USER 'game_user'@'111.229.200.178'`、R71 快照 | 非 .md 文件，任务红线「只修改 .md 文档」 |
| `backups/production/task-status.md` | 巡检台账最后条目停在 2026-09-25 R65-2，R66–R71 未追加 | `git log` / 文件内容 | 台账缺条目属「未写」而非「陈述不实」，每轮权威在 server-snapshot.R{N}.md；不建议由文档审计任务代写 |

---

## ② 核对无误条目（抽主要项，证据可复现）

1. **快照链完整性（任务重点）**：R70/R71 的 server-snapshot + docker-state 四份齐全；R72 未产生也未被任何文档提前引用（全仓 grep "R72" 零命中）——链状态 = R71 最新，正常。
2. **README §0 备份表 7 项** vs `scripts/backup/backup-from-servers.ps1` 拉取清单：逐项一致（含 3 项「存在才拉取」的条件逻辑）；「历史 aliyun 备份…脚本已不再更新」与脚本头部注释（单机版）一致。
3. **README §2 密钥位置 `Documents\tencent_server_key.pem`**：与 backup-from-servers.ps1 L5 实测路径一致（0745e76 已修正过）。
4. **README 顶部戳/R71 快照数值**：磁盘 69%、域名 11/11、SSL 9/9（workspace 30d）、8899 关闭、配置 0 drift、resumeaix-web 停机 ~8 分钟处置——逐条与 server-snapshot.R71.md 吻合；§6.1 服务表（BUILD_ID `ba5iczUQutw7tlMv5v-liCg`、`66caf54`、共库事实）与 R70/R71 快照吻合。
5. **scripts 清单 vs README §15（任务重点）**：七个目录 backup/deploy/diagnose/monitor/remote-update/sync/verify 实存且 §15 全列；§10.5 点名的 deploy-tencent.ps1 / deploy-portfolio-only.ps1 / redeploy-frontends.ps1、§7.6 点名的 xiaofanzhuo-backup.sh / xiaofanzhuo-monitor.sh / lekao-monitor.sh、COLD-START §3.4 点名的 3 个 verify 脚本均实存。
6. **COLD-START §2.4「17 个 systemd 服务」表**：16 运行 + 1 下线（claude-remote-bot，表内已标注）= 17，与 tencent/systemd/ 备份及 R71 快照一致；§2.5 timer 单元 11 组与 configs/systemd-timers/ 实存一致；§2.6 引用的 certbot-certificates.txt 实存。
7. **§9 MySQL 密码指向** `tencent/env/env-asternova-server.env`：376ae42 刚修过，文件实存，一致。
8. **端口分配总表 / 域名 DNS 表 / 已下线清单**（rag R12、martino R48、STT 2026-06-13、阿里云 R43）：三处（§1/§3/§13）交叉一致，与 R71 快照「rag 502 归档预期」一致。
9. **数据报告类文档**（perf-baselines/INDEX.md、e2e/ROUTE.md、E2E-2026-10.md、docs/ 冷启动重写 spec）：自带时点与「历史对照」自声明，非持续性陈述，判定不需改。
10. **configs/docker-daemon.json.README.md**：与 configs/docker-daemon.json 内容（tencentyun mirror）一致。

### 抽查复现 5 条（验收标准）

1. `git show 9f39e1b -- backups/production/tencent/nginx/` → lekao `listen 443 ssl http2` + xiaofanzhuo 双处 4 安全头 ↔ README §8 新增行。
2. `ls backups/production/server-snapshot.R*.md | wc -l` → 14 ↔ README §15「共 14 份」。
3. `ls backups/production/tencent/systemd/ | grep -c '\.service$'` → 20 ↔ backups/README「20 个 .service」。
4. `grep -n 'TencentKey' scripts/backup/backup-from-servers.ps1` → Documents 路径 ↔ game-asternova.md 修正后密钥路径。
5. `ls backups/production/tencent/env/ | grep asternova` → env-asternova-server.env（无 env-game-backend.env）↔ game-asternova.md 修正后密码指向。

---

## ③ 自评

- **覆盖面**：通读 README（758 行）、COLD-START（333 行）、backups/README、ssh-keys/SSH密钥说明.txt、game-asternova.md（221 行）、task-status.md、R70/R71 快照、docker-state.md、perf/e2e 索引、docker-daemon README、monitor preset；对全部可本地验证陈述（路径、文件名、数量、版本号、流程步骤、内部一致性）做了核对。服务器实时状态（内存/磁盘/域名探活）以最近快照 R71 为准引用，未做 SSH 复测——快照与文档同源时间戳一致即判定吻合。
- **修复原则**：只改与实况冲突的陈述；历史演进记录（如 §6.1 服务表内各轮数据）与快照式多时点数字（磁盘 R70 70% vs R71 69%）各自标注时点，保留不动。
- **遗留风险**：① 4 个 .md 修改未 commit（他人 untracked 文件在场，红线），若长期搁置可能被后续会话覆盖；② SSH密钥说明.txt 的阿里云在役表述有误导冷启动的风险，建议尽快人工更新；③ task-status.md 台账断更（R66 起）建议在下一轮巡检时决定「补写或废弃该台账」。
- **未做**：不碰代码/配置/锁文件 ✓；不改 .git/历史/push ✓；不改根目录 CLAUDE.md/AGENTS.md ✓；不碰其他仓库 ✓（报告目标路径除外）。
