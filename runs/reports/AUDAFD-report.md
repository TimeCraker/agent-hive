# AUDAFD 结果报告

> 任务：asterforge-deploy 手册真实性审计（只读 + SSH 只读）
> 审计基线：本仓 HEAD = `efd2987`（并行波次未提交改动一律忽略）
> 服务器抓拍时间：2026-10-06 12:08–12:10 CST（ubuntu@111.229.200.178，SSH key 取 Documents 权威位，实测可连通，与 README §2 一致）
> 红线遵守：SSH 仅白名单只读命令两批；本地零写入（除本报告）；无 git 写操作；未粘贴任何密钥内容

## 结论一句话

手册核心骨架（16 业务服务、22 个端口、9 张证书、3 个业务 timer、nginx vhost 布局）与生产实况高度吻合，但发现 **1 条 P1（磁盘 81% 已越过手册自设 80% 治理线，而手册仍写"69% 持稳"）**、**6 条 P2（§10.5 一键部署脚本两死一危险且漏索引业务仓现役脚本；healthcheck 实际每 5 秒而非 5 分钟；COLD-START 冷启动会装出与现状不同的 timer 拓扑；小饭桌备份/两站监控触发机制手册无落地）**、4 条 P3。

## 服务表比对

实况命令：`systemctl list-units --type=service --state=running --no-pager`（44 个 running，其中业务 16 个）+ `ss -tlnp | grep LISTEN`。

README §1 端口表（L131-154）与 §6.1 服务表（L301-324）逐行核对：

| 手册条目（端口/unit） | 实况 | 判定 |
|---|---|---|
| 3000 `portfolio-web` | running；127.0.0.1:3000 next-server | ✅ |
| 3001 `asternova-web` | running；*:3001 next-server | ✅ |
| 3002 `resumeaix-ai` | running；:3002 node | ✅ |
| 3003 `resumeaix-export` | running；:3003 node | ✅ |
| 3004 `resumeaix-web` | running；*:3004 next-server | ✅ |
| 3005 `interview-helper` | running；:3005 next-server(standalone) | ✅ |
| 3006 `interview-audio` | running；:3006 node | ✅ |
| 3007 `lekao-web` | running；*:3007 next-server | ✅ |
| 3008 `decision-os-web` | running；*:3008 next-server | ✅ |
| 3010 `xiaofanzhuo` | running；:3010 next-server（standalone server.js 进程名即 next-server） | ✅ |
| 3100 `claude-web-terminal` | running；*:3100 node | ✅ |
| 8000 `product-publisher-backend` | running；127.0.0.1:8000 python(uvicorn) | ✅ |
| 8008 `decision-os-api` | running；127.0.0.1:8008 uvicorn | ✅ |
| 8081 `asternova-server` | running；*:8081 asternova-serve | ✅ |
| 8501 `genesis-dashboard` | running；:8501 python(streamlit) | ✅ |
| 15722 `vision-proxy` | running；127.0.0.1:15722 node | ✅ |
| 5434 PG / 6380 Redis / 6333-6334 Qdrant / 9000-9001 MinIO（docker） | 四组端口全部 LISTEN（docker ps 不在本轮白名单，以端口佐证） | ✅ |
| ~~claude-remote-bot~~ 已下线 | 不在 running 列表 | ✅ |
| 8899 保持关闭（README L4） | ss 无 8899 | ✅ |
| **8080（workspace 静态）** | ss 有 0.0.0.0:8080 LISTEN；`nginx -T` 有 `listen 8080 default_server` | ⚠️ 域名表 L195 提及 :8080，但端口分配总表（L126-154）**无 8080 行** → D09 |

- 16/16 业务服务 active，与 README L4"16 服务全 active"口径一致。
- 内存：`free -h` used 2.1Gi / avail 1.6Gi，手册 R70 记 used 1.8G/avail 1.8G——正常波动，不算漂移。规格 3.6G/40G ✅。
- **磁盘：`df -h /` = 40G 已用 31G（81%）**，手册 L4 写"磁盘 69% 持稳"（R71，10-03）、L326 写"磁盘 70%"（R70）→ **D01（P1）**。3 天 +11pp，已越过 COLD-START 阶段4 / README §13 自设的 80% 治理线。疑似 10-03 后部署活动残留（含 R71 记录的外部部署夭折）。
- 备注（非正式偏差）：ss 见 `127.0.0.1:42481` 由 chrome（pid 4101744）监听——resumeaix-export 的 puppeteer chromium 存活中；手册称"按需非常驻、每日 04:00 timer 回收"（L306/L334），今晨 04:00 export-restart 已执行过仍见 chrome，与"非常驻"的吻合性取决于当时是否有导出任务，建议下轮巡检留意。

## 脚本索引 vs 现役脚本

### 手册知道但已死/危险（本仓 scripts/deploy/，README §10.5 L624-636 推荐入口）

| 脚本 | 手册说法 | 实况证据 | 判定 |
|---|---|---|---|
| `deploy-tencent.ps1` | §10.5 "完整部署到腾讯云" | 脚本 L29-33 打包 `$Root\ResumeAIX`、`$Root\main land`、`$Root\deploy-artifacts`——asterforge-deploy 仓内均无此三目录（业务仓在工作区根且名为 my-portfolio） | 🗑️ 死脚本 → D02 |
| `redeploy-frontends.ps1` | §10.5 "重新部署所有前端" | 脚本 L29 `$MainLand = Join-Path $Root "main land"` 同款死路径 | 🗑️ 死脚本 → D02 |
| `deploy-portfolio-only.ps1` | §10.5 "仅部署 Portfolio"，无风险提示 | README 自己 L331 承认"尚无补包/拷贝步骤，直接跑会起不来（MODULE_NOT_FOUND）——待补脚本"；§10.5 与 §6.1 内部矛盾 | ⚠️ 危险脚本 → D03 |
| `deploy-portfolio-tarball.ps1` | §10.5 未列 | 参数化 + 主机白名单（含已废弃阿里云 IP 8.162.7.172），需显式传参可用 | 辅助件，非现役主入口 |

### 现役但手册不知道（业务仓脚本）

| 脚本 | 实况证据 | 手册覆盖 |
|---|---|---|
| `my-portfolio/scripts/deploy-portfolio-safe.sh` | 脚本头注释明确"必用场景：本地 build 后 scp+tarball 部署到腾讯云"，默认目标 `ubuntu@111.229.200.178`，SSH key 引用本仓 `ssh-keys/tencent_server_key.pem`，含 sha256 校验 + 5 项部署后验证 | README §10.5 / §15 均无索引 → D04（种子线索确认） |
| `lekao/scripts/deploy-production.ps1` | 脚本头"Lekao 腾讯云一键部署(:3007)：git bundle → SCP → 服务器 build；systemd lekao-web 守护"，key 同样引用本仓 ssh-keys/ | README §10 部署流程无 lekao 小节、无索引 → D05 |
| `xiaofanzhuo` 部署 | 手工 tar 流程，权威在业务仓 `docs/DEPLOY.md`，README §7.6 L469 有指路 | ✅ 手册知道（一致） |

附带发现（业务仓侧，供下波清理参考）：my-portfolio 另有 `deploy.sh`（阿里云时代 `/home/admin/` 路径）与 `deploy-light.sh`（exec 已移入 archive/ 的 deploy-portfolio-only.sh，引用失效）两枚死脚本。

## 证书与定时器

### 证书（`sudo certbot certificates` + `nginx -T` 抽样）

实况 **9 张证书**，与 README §3 L205"9 张"、COLD-START §2.6 布局（asterforge.top +resume/www / decide / game +api / interview / lekao / product / rag / workspace / xiaofanzhuo）**逐一吻合**：

| 证书 | VALID | 备注 |
|---|---|---|
| asterforge.top (+resume+www) | 75d | |
| game (+api) | 75d | |
| interview | 75d | |
| rag | 75d | 下线兜底证书保留 ✅ 与手册一致 |
| workspace | 87d | 手册 L4"workspace 30d 自动续中"已过时（续期已完成）→ D10 |
| decide | 50d | |
| xiaofanzhuo | 46d | |
| lekao | 42d | |
| product | 41d | |

- martino 证书确已删除（列表无）✅；全部 >30d，`certbot.timer` active（昨 03:53 跑过）✅。
- `nginx -T` 见 1 处 `listen 443 ssl http2`（注释"enabled 2026-10-05 NGXHRD"）——lekao h2 与 README §8 L502 一致 ✅。
- HSTS 31536000 是否已在服务器生效**未核实**（并行波次 HSTSUP 职责，主动避让，未抽 add_header）。
- 本地备份 `backups/production/tencent/certbot-certificates.txt` 存在 ✅（COLD-START L207 引用有效）。

### 定时器（`systemctl list-timers --all`）

| timer | 手册声称 | 实况 | 判定 |
|---|---|---|---|
| portfolio-web-restart | 每周日 04:00（L329） | active；LAST Sun 04:00:01 / NEXT Sun 04:00 | ✅ |
| export-restart | 每日 04:00（L329） | active；LAST Tue 04:00:01 / NEXT Wed 04:00 | ✅ |
| portfolio-web-healthcheck | 每 5 分钟探活（L329；unit 描述同） | active，**但抓拍 NEXT−LAST=2s**；unit 文件 `OnCalendar=*:*:00/5` 秒位步进 = **每 5 秒**（想写每 5 分钟应为 `*:0/5`） | ⚠️ → D07 |
| COLD-START §2.5 其余 8 对（asternova-web/server、product-publisher-backend 各 healthcheck+restart、smart-publisher-backup、smart-publisher-video-quota-monitor） | 冷启动教人安装并 enable 全部 11 对 | `--all` 模式下均不出现 = **unit 文件未装载**；本地 configs/systemd-timers/ 11 对文件确在 | ⚠️ → D06 |
| xiaofanzhuo 每日 03:10 备份、lekao/xiaofanzhuo 5 分钟监控 | README §7.6 只写频率；COLD-START L194"定时安装见 README §7.6"循环引用 | systemd timers 无此三项；触发机制疑似 cron（crontab 不在本轮 SSH 白名单，**无法核实**） | ⚠️ → D08 |

README L329"R68 复核 4 timer 全 active" vs 今日实测业务 timer 3 个 → D11。

## 偏差分级清单（P0-P3）

| # | 手册位置 | 手册声称 | 实况证据（命令+输出摘要） | 严重度 | 建议动作 |
|---|---|---|---|---|---|
| D01 | README L4（R71 基线）、L326 | 磁盘 69% 持稳 / 70% | `df -h /`：40G 已用 31G **81%**（10-06）；已越过手册自设 80% 治理线，3 天 +11pp | **P1** | 下一波跑 /server-status（R72）对齐基线 + du 排查增量源（疑似 10-03 后部署残留/journal/chromium） |
| D02 | README §10.5 L627-636 | deploy-tencent.ps1 / redeploy-frontends.ps1 是现役一键部署入口 | 两脚本均引用仓内不存在的 `main land`、`ResumeAIX`、`deploy-artifacts` 源路径，跑必失败 | **P2** | §10.5 移除或标注"历史/已废弃"，改指业务仓现役入口 |
| D03 | README §10.5 L632 vs §6.1 L331 | §10.5 无警告推荐 deploy-portfolio-only.ps1 | 同文档 L331 自认"直接跑会起不来（MODULE_NOT_FOUND）——待补脚本" | **P2** | §10.5 加醒目警告或移除；补齐脚本前不作为入口 |
| D04 | README §10.5 / §15（缺失） | （未提及） | `my-portfolio/scripts/deploy-portfolio-safe.sh` 为现役主站部署入口（sha256+scp+服务器 build+5 项验证，默认目标本生产机） | **P2** | 手册 §10 增设"各站现役部署入口索引"收录之 |
| D05 | README §10（缺失 lekao 小节） | （未提及） | `lekao/scripts/deploy-production.ps1` 为 lekao 现役一键部署（git bundle→SCP→服务器 build） | P3 | 同上收录 |
| D06 | COLD-START §2.5 L169-192 vs README L329 vs 服务器 | COLD-START 教装 11 对 timer；README 称"6 个 unit 已入库；4 timer 全 active" | 服务器实况仅 3 对业务 timer active（portfolio 2 对 + export 1 对），其余 8 对 unit 未装载；本地 configs/systemd-timers/ 含已归档项目 smart-publisher 两对遗产 | **P2** | 三处口径统一：明确生产 timer 拓扑=3 对；COLD-START §2.5 按现状裁剪；smart-publisher 两对移入 configs/deprecated/ |
| D07 | README L329 + COLD-START L194 + unit 描述 | healthcheck 每 5 分钟探活 | `configs/systemd-timers/portfolio-web-healthcheck.timer` L5 `OnCalendar=*:*:00/5` = 每 5 秒；服务器 list-timers 抓拍 NEXT−LAST=2s 佐证；12× 频率，journal ~1.7 万条/天，81% 磁盘背景下加剧膨胀 | **P2** | 修正 OnCalendar 为 `*:0/5`（或 `*-*-* *:00/5:00`）+ reload；文档口径同步 |
| D08 | README §7.6 L467-468 + COLD-START L194 | 小饭桌每日 03:10 备份、lekao/xiaofanzhuo 5 分钟监控 | 触发安装方式手册无落地（两文档循环引用）；systemd timers 无此三项；cron 因白名单未核实——冷启动后备份/监控将静默丢失 | **P2** | 手册补"触发机制与安装命令"小节（核实 crontab 后落字），unit/cron 定义入库 |
| D09 | README §1 端口总表 L131-154 | （无 8080 行） | `ss -tlnp`：0.0.0.0:8080 LISTEN；`nginx -T`：`listen 8080 default_server`（workspace 静态，域名表 L195 有提及） | P3 | 端口总表补 8080 行（nginx default_server） |
| D10 | README L4 | workspace 证书"30d 自动续中" | `certbot certificates`：workspace VALID **87d**（expiry 2027-01-02，续期已完成） | P3 | 陈述随 R72 基线更新 |
| D11 | README L329 | "R68 复核 4 timer 全 active" | 今日实测业务 timer 3 个 active；第 4 个身份/口径不明 | P3 | 下轮巡检明确 timer 计数口径 |
| D12 | COLD-START L116 | "预期运行的 17 个 systemd 服务" | 表内实为 16 现役 + 1 已下线（claude-remote-bot，服务器 running 列表无）；实际"预期运行"=16 | P3 | 标题改"16 现役 + 1 下线" |

一致性抽查（全部通过，增强手册可信度）：server-snapshot 14 份（R49+R59-R71）✅ L735；docker-state 13 份无 R65 ✅ L736；e2e/ + e2e-walkthrough-2026-10.md + perf-baselines/ 存在 ✅ L737；backups systemd 备份 16 现役 unit 全在 ✅ COLD-START L116；scripts/backup、verify 引用文件全存在 ✅。

## 自评

- **覆盖度**：验收四类（服务表逐行、脚本索引、证书、timers）全覆盖；服务表 22 端口/16 unit 逐行核过，证书 9 张逐张核过。
- **方法**：SSH 两批全只读白名单命令；本地仅 Read/Glob；唯一写入物 = 本报告。
- **限制（如实声明）**：① cron 触发机制未核实（crontab 不在白名单），D08 因此标"疑似 cron"；② docker 容器以端口监听佐证，未跑 docker ps（白名单外）；③ HSTS 上线状态未核实（并行 HSTSUP 职责，避让约定）；④ 端口绑定地址（127.0.0.1 vs 0.0.0.0）手册未声称，未作比对维度；⑤ 并行波次未提交改动已按任务约定忽略，全部以 HEAD `efd2987` + 服务器 10-06 实况为基线。
- **最有行动价值的两条**：D01（磁盘 81% 过线）与 D07（healthcheck 每 5 秒）——前者已构成手册自设告警条件，后者是文档、unit 描述、实际行为三方失实且直接放大前者。
- 修正动作全部留给下一波，本任务零改动手册、零改动服务器。
