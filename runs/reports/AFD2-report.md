# AFD2 结果报告

## 结论一句话

README §9 MySQL 密码指向已从旧 `aliyun` 存量路径更正为当前权威备份 `backups/production/tencent/env/env-asternova-server.env`（与 §7.4 自洽），一行改动提交 `376ae42`，全程零密钥值外泄。

## backups 结构调查（仅目录与文件名）

> 调查方式：`find backups -print`，只看名字，未读任何 env 文件内容。

```
backups/
├── README.md
├── docker-state.md
└── production/
    ├── aliyun/                          ← R43 前存量（README §0.1：脚本已不再更新）
    │   ├── compose/    (game-backend-demo / smart-product-publisher 两份 docker-compose.yml)
    │   ├── conf.d/     (websocket-upgrade.conf)
    │   ├── env/        env-asternova-web.env · env-game-backend.env · env-smart-publisher.env
    │   ├── nginx/      (nginx.conf + 6 份站点 conf)
    │   ├── systemd/    (asternova-server / asternova-web / product-publisher-backend .service)
    │   └── ssl-certs.md
    ├── aliyun-migration/
    │   └── MIGRATION-CHECKLIST.md
    ├── tencent/                         ← 当前权威（README §22：「线上真实配置」）
    │   ├── certbot-certificates.txt · docker-ps.txt · xiaofanzhuo.env
    │   ├── compose/    (ResumeAIX / decision-os-infra docker-compose.yml)
    │   ├── db/         resumeaix-20260524.sql.gz
    │   ├── env/        env-ai-service · env-asternova-server · env-asternova-web.env.production
    │   │               env-claude-remote-bot · env-decision-os-web.env.local · env-decision-os
    │   │               env-game-backend-demo · env-interview-audio · env-interview-helper
    │   │               env-lekao · env-portfolio · env-product-publisher · env-resumeaix-web
    │   │               env-resumeaix · genesis-api_keys · product-publisher （各 .env）
    │   ├── misc/       (genesis-streamlit.config.toml · vision-proxy-config.json)
    │   ├── nginx/      (nginx.conf + 8 份站点 conf + 1 份 .before)
    │   └── systemd/    (20 份 .service/.timer，含 asternova-server.service)
    ├── archive/        server-snapshots-R9-R30.tar.bz2
    ├── e2e/ + e2e-walkthrough-2026-10.md（E2E-2026-10.md · ROUTE.md · artifacts/）
    ├── perf-baselines/ (2026-10/ 六站基线 + retests/ 前后对比与截图)
    ├── server-snapshot.R49–R71.md（15 份，R65 含 asternova-web 迁移记录）
    ├── docker-state.R49–R71.md（13 份）
    └── task-status.md
```

**判定依据**（三条证据闭环）：

1. README §7.4「AsterNova 游戏后端」：服务器 env 位于 `/home/ubuntu/game-backend-demo/.env`，备份明确写为 `backups/production/tencent/env/env-asternova-server.env`，关键配置即 `DATABASE_DSN`（CynosDB MySQL 连接串，含密码）——这正是 §9 MySQL 条目的唯一使用者（§9 写明「用途: AsterNova 游戏」）。
2. README §0.1（:57）：`aliyun/` 整目录为「R43 前存量，脚本已不再更新」——旧路径指向的密码轮换后必然过期，且 §12 故障表恰好存在「密码失效需 root 重置」场景，误导有实际风险。
3. README §22（:731）：`tencent/` 为「线上真实配置」。

**两路径关系**：非同一文件的两个名字，而是同一凭证链的两个快照——`aliyun/env/env-game-backend.env` 是旧阿里云机 docker-compose demo 时代（R43 前）的备份镜像（对应 `aliyun/compose/game-backend-demo.docker-compose.yml`）；`tencent/env/env-asternova-server.env` 是现行腾讯云 systemd 服务 `asternova-server` 的 env 备份，由现行备份脚本维护。

## §9 更正与提交

提交 `376ae42`：`docs(readme): §9 MySQL 密码指向更正为当前权威备份位 / point §9 MySQL password to authoritative backup path`

```diff
--- a/README.md
+++ b/README.md
@@ -537 +537 @@ ## 9. 数据库 → MySQL (腾讯云 CynosDB)
-- **密码**: 见 `backups/production/aliyun/env/env-game-backend.env`
+- **密码**: 见 `backups/production/tencent/env/env-asternova-server.env`（`DATABASE_DSN`；旧 `aliyun/env/env-game-backend.env` 为 R43 前存量）
```

- 改动最小化：1 行；新指向 + 旧路径来历注记一次完成，§0.1 已有 aliyun 存量声明故不重复加注。
- 验收核验：`git show --stat HEAD` 仅 README.md（1 file changed, +1/-1）；`git diff --cached` 提交前自查，仅含路径与字段名，无任何密钥值/token 片段；`git status --porcelain` 对比初始快照（`?? docs/audits/`）完全一致，用户未提交改动未触碰。
- 未 push（红线遵守）。

## 人工复核（若有）

1. **两份 env 的字段值是否曾分叉**（低风险，可选）：本任务红线禁止读 env 内容，判定完全基于 README §7.4 与 §0.1 的自洽描述。若需 100% 确认旧 aliyun 文件与新文件携带同一凭证，可人工比对两文件的 `DATABASE_DSN` 字段（仅看是否一致，勿外泄值）。即便分叉，新指向（脚本持续更新的 tencent 侧）也是更可信的一侧，不影响本次更正方向。
2. `tencent/env/` 下另有 `env-game-backend-demo.env`，名字与旧 aliyun 侧 compose 同源；本次未改其任何引用，如后续审计涉及可一并核对。

## 自评

- 证据先行：先探明 backups 实际结构再动手，判定依据三条闭环（§7.4 备份自洽 + §0.1 存量声明 + §22 权威定性），不属于「拿不准」情形，故直接改路径而非仅加注记。
- 红线全守：零 env 内容读取、零密钥外泄、只动 README.md 一行、未 push、用户 `docs/audits/` 改动原样保留。
- 改动即闭环：新指向与 §7.4 既有描述互相印证，README 内部一致性提升，无新增维护面。
