# AFD 结果报告

## 结论一句话

四篇已跟踪文档（README / COLD-START / docs 两篇 coldstart 重写归档）与 `scripts/`、`configs/` 实际清单交叉核对**零确凿过期**——55+ 条路径引用全部存在、对脚本行为的描述经验证仍属实，按极保守原则**零改动、零提交，保守通过**；遗留 3 项内容级存疑转人工复核。

## 文档清单判定表

| 路径 | 主题 | 判定 | 处置 |
|---|---|---|---|
| `README.md` | 生产环境唯一权威部署手册（R71，2026-10-03 更新） | 健康 | 留 |
| `COLD-START.md` | 冷启动清单（2026-08-29 单机化重写版 + 后续维护） | 健康 | 留 |
| `docs/2026-08-29-coldstart-rewrite-spec.md` | 历史任务 Stage Spec（归档记录） | 健康 | 留 |
| `docs/2026-08-29-coldstart-rewrite-report.md` | 历史任务验收报告（归档记录） | 健康 | 留 |
| `docs/audits/lekao-audit-2026-10.md` | **未跟踪用户现场，非本任务处置对象** | 不适用 | 不动 |

**逐篇依据（验收标准第 2 条后半句要求）：**

- **README.md**：① 全部 `scripts/`、`configs/` 引用（backup-from-servers.ps1 / restore-to-servers.ps1 / deploy-tencent.ps1 / deploy-portfolio-only.ps1 / redeploy-frontends.ps1 / xiaofanzhuo-backup.sh / xiaofanzhuo-monitor.sh / test-ws-https.py / 001-coin-idempotency-key.sql / 各 configs 子目录）经 find 实际清单逐条比对**全部存在**；`.claude/commands/game-asternova.md`、`ssh-keys/SSH密钥说明.txt` 亦在。② 两处「文档描述脚本行为」经读脚本验证属实：`deploy-portfolio-only.ps1` 内确无 `@swc/helpers` 补包步骤（README「待补脚本」非过期陈述）；`backup-from-servers.ps1` 产出 7 项（env-portfolio / env-resumeaix / env-interview-audio / genesis-api_keys / genesis-streamlit / nginx-tencent-all / resumeaix-*.sql.gz）与 §0.1 备份表逐条一致。③ 2026-08-29 报告遗留 7 项待确认中 #1（`deploy-artifacts\scripts` 死路径）#2（§2 密钥行重复）#3（备份文件名不一致）#5（§7 缺 7.6）均已在后续维护中修复，现存文本无此问题。
- **COLD-START.md**：引用全绿——11 对 systemd timer 单元与 `configs/systemd-timers/` 实际 22 个单元文件 + install.sh 完全对应；verify 三脚本、backup 双向脚本、monitor 双脚本、`configs/docker-daemon.json.README.md` 全部存在；「17 个 systemd 服务」表（16 active + 飞书 Bot 划线下线）与 README R71 口径一致。
- **spec / report 两篇**：性质是已完成任务的归档快照，非活文档；其中 `scripts/monitor/aliyun` 字样均为「该空目录已删除」的事实陈述（find 确认现无此目录），非死链引用；报告数据为当时快照，不应回改。
- **机器验证说明**：grep 批量提取 39 个去重路径中 12 个 MISS 全为噪音——11 个是 `{service,timer}` 花括号写法被正则截断（实际文件在），1 个是上述 aliyun 历史陈述；真实死链 **0**。

## 已执行处置与提交

**无提交（保守通过）**。理由：审计范围内未发现任何「引用不存在的脚本/配置/路径」的确凿过期项，无可更正对象；3 项内容级存疑（见下节）均不满足「确凿」标准，且涉及部署事实与刻意约定区，按「宁可全留报告」红线不动。git log 无新增 docs 提交属本分支预期（验收标准第 2 条后半句）。git status 终态与初始快照逐字一致（仅 `?? docs/audits/` 用户现场），无新增也无消失的改动，未触碰任何脚本/配置/密钥/`.env`/备份数据，未执行任何 SSH/远程操作。

## 建议人工复核

1. **README §9 MySQL 密码指向 `backups/production/aliyun/env/env-game-backend.env`**（2026-08-29 报告 #4 遗留）：路径存在非死链、且 README §0.1 已声明该目录为 R43 前存量，但 aliyun 命名对单机架构读者有误导性；是否改指当前权威备份位置需知悉 CynosDB 密钥实际存放处的人拍板。backups/ 本次未审计。
2. **README §6.1 目录树 `claude-web-terminal/` 标注「端口 3100 + 15722」**（#6 遗留）：15722 实为独立的 `/opt/vision-proxy`（紧邻的下一行已正确列出），标注位置易误导；属措辞修订而非事实硬错，涉及部署事实描述，生产权威仓不代改。
3. **`configs/systemd-timers/install.sh` 头注释仍为「R33 阿里云长跑服务自愈 timer」语境**（#7 遗留）：非 Markdown（本次红线禁碰），且 COLD-START 重写时刻意未引用它；是否重写或归档待定。
4. （低优先级）README §15 ssh-keys 行仅列 2 个 aliyun 密钥文件，实际目录另有 `aliyun-ecs-portfolio`、`aliyun-install-keys.sh`、`tencent_server_key.pem` 未提；ssh-keys/ 为刻意约定区，仅提示可补充清单，不构成错误。

## 自评

**达标**。审计步骤全数执行（工作区规则已读、初始快照已记、文档面全量盘点、逐篇通读 + 机器交叉验证、判定表成形）；验收三条均满足——报告整文件写入指定路径含五段结构；保守通过分支给出逐篇依据（含 39 路径机器验证与 12 噪音逐项排除说明）；git status 与初始快照一致。剩余风险：本审计仅覆盖「文档 ↔ scripts/configs 清单一致性」维度，README 中服务器运行时数据（内存/磁盘/版本号）的真实性需 SSH 实测方可复核，超出本次红线范围。
