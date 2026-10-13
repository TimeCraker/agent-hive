# RUNBOOK 报告 · R3 回滚说明修正（仓库内正式 runbook）

- 执行时间：2026-10-11 15:50 – 16:05（CST）
- 工作目录：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`（runbook 交付）+ `agent-hive`（本报告与原报告横幅）
- 结果：**完成**。正式回滚 runbook 已建仓并独立提交（`d6e9f32`）；原 DEPLOY-report §6 已加横幅指向 runbook；归档结构与线上布局经只读 SSH 实证核对。全程未回滚线上、未动生产 DB、未重启服务。

## 1. R3 问题确认（独立复核成立）

`DEPLOY-report.md` §6 回滚命令块的两个缺陷均属实，另发现两处次生问题：

1. **`cp ... dev.db` 无条件执行**：注释写「仅当数据受损时」，命令却裸排在块内，整段复制即覆盖生产库。实证：发布当天 15:51 `dev.db` 已从部署时的 2,297,856 → 2,363,392 bytes（**上线约 2 小时 +65,536 bytes 新增生产数据**）。
2. **「三端一致」口径不实**：`git reset --hard` 只回退服务器一端，本地 / origin 仍指 `eae5d8b`。
3. （次生）**未区分两处 BUILD_ID**：根 `.next/BUILD_ID` 与 `.next/standalone/.next/BUILD_ID` 都存在且部署时同步更新，原命令块只恢复产物不动根标识，其末行「验证 BUILD_ID = 旧值」在根处必然对不上。
4. （次生）**tar 解压不删旧文件**（SKILL 既有坑）：直接对运行中的 `.next/standalone` 解压会残留新构建独有文件，得到新旧混合目录。

## 2. 实证核对证据（只读 SSH，2026-10-11）

连接 `ubuntu@111.229.200.178`（密钥只引用路径，不入文）。全部命令只读：`ls` / `cat` / `systemctl cat` / `tar -tzf` / `tar -xzOf` / `git rev-parse` / `systemctl show`。

### 2.1 备份归档结构（`/home/ubuntu/backups/portfolio-predeploy-20261011-135231/`）

| 核对项 | 结果 |
| --- | --- |
| 目录清单 | 6 项齐备：`dev.db`（2,297,856 B）、`next-standalone.tar.gz`（150,534,283 B）、`next-static.tar.gz`（1,532,475 B）、`BUILD_ID.old`、`git-HEAD.old`；`portfolio-predeploy-LATEST.txt` 指针正确指向该目录 |
| standalone 归档结构 | 3472 项，**全部以 `standalone/` 开头**（头尾抽样 + 全量计数）→ 原报告 `tar -xzf … -C .next` 落位 `.next/standalone/` **正确**；内含 `server.js`、`package.json`、`node_modules/`（1395 项，pnpm 布局，含 next/react/react-dom/sharp）、`.next/`（1096 项）、`public/`（220 项）、`prisma/`（12 项） |
| 内嵌构建标识 | `tar -xzOf … standalone/.next/BUILD_ID` 直读 = `pRkaxPhaiEd-PPKQxusZ3`（旧值）；内嵌 `.next/static/` 83 项与根 static tar 同源 → **standalone 单包解压即得完整可运行旧构建** |
| static 归档结构 | 83 项，全部以 `static/` 开头（含 `static/pRkaxPhaiEd-PPKQxusZ3/` manifests、`media/`、`chunks/`）→ `-C .next` 落位 `.next/static/` **正确** |
| 标识/ ref 留证文件 | `BUILD_ID.old` = `pRkaxPhaiEd-PPKQxusZ3`；`git-HEAD.old` = `b2d2eacbfbaf2a3a446a11e88150b426186acb50`，与报告 §1 回滚点一致 |

### 2.2 线上运行布局

| 核对项 | 结果 |
| --- | --- |
| systemd（`systemctl cat portfolio-web`） | `ExecStart=/usr/local/node20/bin/node /home/ubuntu/my-portfolio/.next/standalone/server.js`；`WorkingDirectory=/home/ubuntu/my-portfolio`；`Restart=on-failure`（RestartSec=10）；`DATABASE_URL` 绝对路径注入 → 运行时唯一依赖 = `.next/standalone/` 一个目录 |
| nginx（`scripts/nginx-site.conf`） | `/_next/static/` → `proxy_pass 127.0.0.1:3000`（**不读磁盘**，由 standalone 内嵌 static 提供）→ 根 `.next/static` 仅为一致性存在；`/uploads/` → `/var/www/portfolio-uploads/`（仓库外，回滚不涉及） |
| BUILD_ID 两处（`cat`） | 根 `.next/BUILD_ID` = `.next/standalone/.next/BUILD_ID` = `pzMAgpozcTii4Ryej1ld2`（新值）→ 回滚两处都要管 |
| 服务器 git | HEAD = `eae5d8b`（= 本地 = origin，发布后未漂移）；工作树仅 `?? .env.bak-seam-1843`（untracked 历史残留，`reset --hard` 不受影响） |
| 服务状态 | `active`，PID 914237，ActiveEnterTimestamp 14:02:51（部署波起服后未再动） |
| 替代恢复点 | `/home/ubuntu/backups/dev-YYYY-MM-DD.db` 每日 03:00 日备快照（服务器既有定时任务产出），已纳入 runbook §4.5 |

### 2.3 原报告 §6 写法 → runbook 修正对照

| 原报告写法 | 实证结论与修正 |
| --- | --- |
| `cp dev.db` 无条件执行 | 不安全（上线 2h 即有实测增量）→ runbook 默认路径全程不碰 DB；DB 恢复独立成 §4，门槛 = 实证损坏证据 + 强制先做带时间戳 preflight 备份 |
| `tar -xzf … -C .next` ×2 | 落位正确（归档前缀实证）✔ 保留；但改为**先 `mv` 旧目录留证再解压**（可逆 + 防 tar 不删旧文件的新旧混合），并给出 Abort 路径 |
| 未提根 `.next/BUILD_ID` | 补 `cp BUILD_ID.old .next/BUILD_ID` + 验证两处均为旧值 |
| 「保持三端一致口径」 | 服务器 reset 只动一端 → runbook §3.4 分「master 留新版向前修复（默认）/ 真三端回退（需用户拍板 force push）」两选项，交接口径强制如实三元组 |
| `git reset` 前无状态检查 | 补 `git status --short` 预检（预期仅 `?? .env.bak-seam-1843`，其他改动先停） |

## 3. 交付物

### 3.1 正式 runbook（独立 commit）

- **路径**：`my-portfolio/docs/runbooks/rollback.md`（新建 `docs/runbooks/` 域，遵循 docs/ 既有分域结构：stages/ ui-polish/ design/ → runbooks/）
- **Commit**：`d6e9f32eacd6a7158242be1bec1fd6e3501b2c00`（分支 `codex/character-motion-m1`，与 master 同基 `eae5d8b`；纯文档 1 file / 230 行；husky lint-staged prettier + commitlint 全过）
- **章节**：§0 缘起（R3 两问题）/ §1 事实基座（实证表 + 本回滚对兼容性事实：schema 零 diff、零文件删除、服务器本地已有旧对象）/ §2 决策树 / §3 默认路径（保留 DB + Abort 路径 + 双 BUILD_ID 验证 + 三端 ref 分节）/ §4 DB 条件恢复（preflight 强制备份 + schema 门槛 + 日备替代点）/ §5 构建式回滚备选（含 bundle 修 ref 坑）/ §6 备份布局约定（把本次手工备份固化为每次部署的标准动作）/ §7 回滚完成定义清单
- **未演练标注**：文档头部全局声明 + §3/§4 操作章节逐处标注【未演练】

### 3.2 原报告横幅

`DEPLOY-report.md` §6 标题下插入单行 blockquote：说明本节命令块已被取代（无条件 `cp dev.db` + 三端口径两点）+ 指向 `my-portfolio/docs/runbooks/rollback.md`（commit `d6e9f32`，分支 `codex/character-motion-m1`）。历史命令块与全文**原样保留未删改**。

## 4. 红线自查

- 只读 SSH ✔：全部为 ls / cat / systemctl cat / tar -tzf / tar -xzOf / git rev-parse / systemctl show；无写操作、无 stop/restart、未触碰生产 DB
- 未实际回滚线上、未恢复 DB、未重启服务 ✔
- 未改其他文件 ✔：my-portfolio 仅新增 `docs/runbooks/rollback.md`（提交只含此一文件；工作树另有并行会话的 2 个 character-motion WIP 文件，非本任务产物，未触碰未提交）
- 密钥只引用路径 ✔（本报告与 runbook 均只出现路径，无密钥内容）

## 5. 遗留与移交

1. **runbook 在 `codex/character-motion-m1` 上**（该分支当前与 master 同基）。若要立即进 master：`git checkout master && git merge --ff-only codex/character-motion-m1`；工作树现有并行会话 WIP，本任务未擅自切分支——**是否快进由用户拍板**。
2. **备份布局尚未自动化**：`deploy-portfolio-safe.sh` 目前不产 predeploy 备份（本次备份为部署波手工执行）。runbook §6 已给出固化命令块，建议后续并入部署脚本或部署 SOP 前置步骤（本任务遵循最小改动未动脚本）。
3. 全部恢复路径未演练：首次实际执行时按 runbook §7 验收清单逐项核对，并把执行实况回填到本文档或新报告。
