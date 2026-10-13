# DEPLOY3 报告 · Portfolio 统一部署（SVG 性能 ce0fc0c + RB2 runbook 5cf5a9b + ANCHOR 锚点 8b146a7）

- 执行时间：2026-10-12 11:56 – 12:05（CST）
- 工作目录：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`
- 结果：**部署成功**。发布 SHA `8b146a7826fae9da2ff18df02b007944bfc9d350`（= origin/master = 本地 master，三端一致）已上线 https://asterforge.top。一次跨环节插曲：服务器 git fetch 跨境失败（GnuTLS -110），按预案走 SKILL bundle 手法修 ref 成功，未影响已上线的构建产物。全程零数据丢失、零不可回滚操作。
- 证据目录：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-closeout-2026-10-12/deploy/`
  - `backup-output.log`（部署前备份全记录，14 表 count 逐表 PASS）
  - `deploy-output-attempt1.log`（部署全记录，含 fetch 失败 WARN）
  - `bundle-fix-ref.log`（bundle 修 ref 全记录）
  - `verify-output.log`（17 项验证矩阵）
  - `verify-followup.log`（4 项复核：优化器/特征唯一性/日志时间戳/稳定性）
  - `backup-deploy3.sh` / `verify-deploy3.sh`（执行脚本本体）

## 1. 发布信息

| 项 | 值 |
|---|---|
| 发布 SHA（主控显式给定） | `8b146a7826fae9da2ff18df02b007944bfc9d350` |
| 提交链核对 | `7bee441..8b146a7` 恰 3 提交：`ce0fc0c`（SVG 性能，4 文件：2 docs + works-motion/complete-motion）、`5cf5a9b`（RB2 runbook，仅 rollback.md）、`8b146a7`（ANCHOR，仅 AnchorSettle/useActiveChapter）——逐提交核对无夹带、无他人提交丢失 |
| 三端一致 | 部署前：本地 master = origin/master = 8b146a7，服务器 = 7bee441（DEPLOY2 上线版）。部署+修 ref 后：**三端全部 = 8b146a7**，服务器工作树 reset 后 modified=0 |
| 变更范围 | `7bee441..8b146a7`：7 文件全 M/A（3 docs + 4 src），**0 文件删除、prisma/schema.prisma 0 行变更** |
| 旧版本（回滚点） | `7bee44169f76fdb9e6e3603ca6b680e729346612` / BUILD_ID `nwHF9XWOcBX14YFXX9fCN` / PID 1078063（lstart 10-11 17:51:39） |
| 新 BUILD_ID | `3toA2-tKwJ24W1n0xYW1p`（根 .next 与 standalone 两处一致且 ≠ 旧值，证实全新构建产物） |
| systemd 进程 | PID 1847068，lstart 12:00:02，持续 active（12:00:05 后零重启） |
| db push | schema 零变更（区间 diff 无 prisma/schema.prisma）→ db push 幂等 no-op；dev.db 部署前后同为 2,416,640 bytes |

## 2. 停服窗口（journalctl + ps 真实时间戳）

- **11:59:21（systemd Stopped，脚本 stop，status=143 正常 SIGTERM）→ 12:00:02（最终进程 PID 1847068 lstart），约 41 秒**。
- 比 DEPLOY2（26s）长：本次 build 为完整运行（fetch-cache 清理后）+ 自愈竞态多一轮。
- 窗口内 5 条 `Cannot find module .../standalone/server.js`（11:59:36 / 11:59:46×2 / 11:59:57 / 12:00:02）：build 期间 server.js 暂缺，systemd Restart=on-failure 自愈拉起快速失败，**DEPLOY2/wave24 同型预期竞态，非脏服务**；12:00:05 后 `Cannot find module` 与重启计数均为 **0**。
- 取证备注：首轮 §16 脚本 `grep 'Stopp|Start' | tail -8` 截掉了最早的 11:59:21 stop 记录，导致初判 stop 时刻为 11:59:57；复核完整 journal 后时间线如上，5 条报错全部落在窗口内，无窗口外异常。

## 3. 备份清单（部署前 11:56:03–11:56:40 完成，全部先于停服）

备份目录：`/home/ubuntu/backups/portfolio-predeploy-20261012-115603/`（331M，`portfolio-predeploy-LATEST.txt` 已指向，runbook §6 统一布局）

| 文件 | 内容 | 验证 |
|---|---|---|
| `dev.db` | SQLite 一致性快照（python3 backup()） | **14 表 row count 逐表与原库一致，BACKUP_VERIFY: PASS**；2,416,640 bytes；integrity_check ok |
| `next-standalone.tar.gz` | 旧构建 standalone（4,495 项，342.9M） | tar 归档成功，首项前缀 `standalone/` 符合 runbook §1.2 结构 |
| `next-static.tar.gz` | 旧 .next/static（94 项，1.6M） | tar 归档成功，首项前缀 `static/` |
| `BUILD_ID.old` / `git-HEAD.old` | 旧构建标识 / 旧 SHA | `nwHF9XWOcBX14YFXX9fCN` / `7bee441` 与部署前基线核对 ✓ |

回滚走仓库正式 runbook `my-portfolio/docs/runbooks/rollback.md`（本轮 5cf5a9b 修复版），`$BK` 统一引用 `portfolio-predeploy-20261012-115603`。

## 4. 部署过程（一次成功 + fetch 失败插曲 + bundle 修 ref）

### 4.1 主部署（11:56:48–12:00:03）

- 打包 4 项安全检查全过（prisma/data 排除 / .env* 排除 / package.json 在）；tarball 245MB（>50MB WARNING 为 character-motion 655 + design 270 文件原画资产所致，非泄漏）；sha256 `c0144733…` 服务器校验通过。
- `pnpm install --frozen-lockfile` 3.9s → **next 版本断言 installed=16.3.7 = locked=16.3.7** → dev.db 未被覆盖（2,416,640 bytes）→ db push（schema 零差异 no-op）→ seed 幂等 → stop（11:59:21）→ 清 fetch-cache → build 成功 → cp static+public → restart → 新 PID 1847068 **etime=3s** ✓ → tarball 清理 ✓。
- 脚本 5 项终验：/admin HTTP/2 200 / login 路由 401 预期 / dev.db 2.4MB / 近 1 分钟 P2021+500 = 0。

### 4.2 插曲：跨境 fetch 失败 → SKILL bundle 手法修 ref（预案内）

- **现象**：`git fetch origin` 报 `GnuTLS recv error (-110)`，脚本按设计 WARN 跳过 ref 同步（tar 已提取新代码，build 正常完成上线）。服务器 git HEAD 残留 `7bee441`，工作树 532 文件 modified（tar 提取所致）。
- **风险判定**：本轮为前向部署且区间 0 文件删除（全 M/A），残留无 import 路径风险（SKILL「revert×fetch 必炸」前提不成立）；构建产物已是新代码（BUILD_ID 新值），只需修 ref 对齐，**无需重 build / 重启**。
- **修复**：本地 `git bundle create deploy3-ref.bundle 7bee441..master`（15KB）→ scp → 服务器 `git fetch /tmp/deploy3-ref.bundle master && git reset --hard FETCH_HEAD`。首次执行 SSH 会话中途抖断（log 截止于前状态采集），按 SKILL「命令轻量化」教训分步重试：fetch 与 reset 拆开各一次成功。
- **结果**：服务器 HEAD = `8b146a7`，reset 后工作树 **modified=0**（反证 tar 提取内容与 Git HEAD 逐字节一致 → 构建输入精确为 8b146a7）；untracked 仅剩 `.env.bak-seam-1843`（wave24 已知遗留）。运行产物未受影响（BUILD_ID/服务/PID 全程未变）。

## 5. 服务器端验证矩阵（17 项 + 4 项复核）

| # | 项 | 结果 |
|---|---|---|
| 1 | 三端 HEAD 一致 | 本地 = origin/master = 服务器 = `8b146a7` ✓ |
| 2 | 新进程 + 新 BUILD_ID | PID 1847068（lstart 12:00:02）/ `3toA2-tKwJ24W1n0xYW1p` 两处一致且 ≠ 旧值 ✓ |
| 3 | `https://asterforge.top/` | HTTP/2 200 + `<title>TimeCraker · AI Builder</title>` + 六幕章节锚点全在（当次 HTML 实测：chapter-hero/about/capabilities/resume/game/contact 各 3-4 次 + rail/caption/marker 系列标记）✓ |
| 4 | CSS chunks ×4 | 从当次 HTML 提取 `/_next/static/chunks/*.css` 全 200 `text/css` + `immutable` 1 年 ✓（矩阵输出第 4 行 `[000]` 为提取脚本把多 URL 粘连的杂音，4 个独立 URL 均单独验证通过） |
| 5 | JS chunks ×3 | 200 `application/javascript` ✓（当次 HTML 提取） |
| 6 | 原画直出 | 当次 HTML preload：about-poster / hero-poster `imageSrcSet`（8 宽度 640–3840，`/_next/image` 优化器路径）+ ring.webp 直链；pose-00~03 hero 系列 webp 4 张 200 `image/webp` ✓ |
| 7 | reading-v1 素材 | `assets.json` 200 json + `mascot-present.webp` 200 `image/webp` ✓ |
| 8 | 字体分片 | 当次 HTML 提取 `noto-serif-sc-{100..103}-600-normal.woff2` 200 `font/woff2` ✓ |
| 9 | `/_next/image` 优化器 | 200 `image/jpeg` 38133B（curl 无 Accept 协商回退 jpeg，DEPLOY2 同口径）✓。首轮 `000` 为验证脚本把多段 imagesrcset 整串当 URL 的自身口径 bug，复核以单段干净 URL 通过 |
| 10 | 关键页面 | `/admin` `/explore` `/config` `/projects/game` `/home-preview` 全 200 ✓ |
| 11 | 公开 API | `/api/public/projects` 200 真实 JSON（links 7 条）、`/api/public/announcement` 200、`/api/files/categories` 200 ✓ |
| 12 | SEO | `/` = `index, follow`；`/home-preview` = `noindex, nofollow` ✓ |
| 13 | DB 完好 | dev.db 2,416,640 bytes；14 表 count：13 表 == 备份基线，AdminAuditLog 312→313（见 §6 披露）✓ |
| 14 | 日志 | 自 11:56 起 P2021/HTTP-500 = 0；`Cannot find module` ×5 全部落在 41s 停服窗口内（§2）✓ |
| 15 | 资源 | 内存 1684M / 3723M；磁盘 5.1G 可用 ✓ |
| 16 | 停服窗口 | 11:59:21 → 12:00:02（41s），journalctl + ps 双证 ✓ |
| 17 | 服务稳定 | 12:00:05 后重启计数 0；PID 1847068 etime 持续增长（166s→266s 复核不变）✓ |

**专项：新代码进 bundle 证明**（证据链分层）：

| 层 | 证据 |
|---|---|
| 数学级（充分） | BUILD_ID 全新（≠ 旧值）证明全新构建；服务器工作树 reset 后 **modified=0** 证明构建输入逐字节 = 8b146a7；next build 成功 → 新代码必然在产物中 |
| 特征级（辅助） | `hashchange` 字符串字面量：旧版两源文件 0 处、新版各 3 处；旧备份产物命中 2 文件（其他既有组件），新产物 **3 文件 9 次**（`0dm91qsnl48ku.js` 等，含新增 AnchorSettle/useActiveChapter 所在 chunk）。`baseVal`（works-motion SVG 新路径 DOM 属性访问）：新产物 2 chunk 命中，旧备份 1 块命中（特征不唯一，仅辅助）。AnchorSettle `performance.now()+1500` 校验窗：新产物 9 文件命中（常量常见，仅辅助） |
| 备注 | 特征 grep 均非唯一（旧产物有既有命中），单靠特征不能定论；定论依据是第一层（BUILD_ID + modified=0 + build 成功） |

## 6. 审计日志副作用披露（预期，非数据损坏）

部署脚本 5 项终验中 `POST /api/admin/login`（空凭证，预期 401）在 AdminAuditLog 产生 1 条失败登录审计：

```
id=313 action=login target=admin detail={"success":false,"ip":"111.229.200.178"} createdAt=2026-10-12 12:00
```

ip 为服务器本机公网 IP（脚本自身 curl 所致），与 DEPLOY2（311→312）同型。**AdminAuditLog 312→313 是本轮唯一 DB 变化，其余 13 表与备份基线逐表一致。**

## 7. 红线自查

- 只操作 `portfolio-web`（stop/restart 各一次 + 窗口内 systemd 自愈 5 次快速失败），未批量停 Node/Chrome/Docker ✓
- 未覆盖服务器 `.env` / systemd EnvironmentFile / 数据库 / uploads：`git archive HEAD` 天然排除，脚本 4 项检查证实；bundle 修 ref 的 `reset --hard` 仅动 tracked 文件（.env/prisma/data/uploads 均 untracked/ignored）✓
- 未上传本机开发数据（tarball 仅含 git HEAD 已提交内容）✓
- 备份先行且验证可用（11:56 `BACKUP_VERIFY: PASS` 后才允许停服）✓
- 构建成功才 restart 上线 ✓；无 force push ✓；schema 零变更、db push no-op（区间 diff 无 schema 文件 + dev.db 大小不变 + 13 表 count 一致）✓
- 密钥仅引用路径（`asterforge-deploy/ssh-keys/tencent_server_key.pem`），未输出内容 ✓

## 8. 剩余风险与移交

1. **跨境 fetch 连续两轮不稳**（DEPLOY2 顺利、本轮 GnuTLS -110）：bundle 修 ref 已是熟练预案，本轮实录再次验证可行（15KB bundle + 两条轻量命令）。建议维持「fetch 失败 → 前向部署直接修 ref / 含删除的部署必须停下先修 ref 再 build」的 SKILL 口径。
2. **SSH 会话中途抖断**（修 ref 首次执行截断）：分步轻量化重试即愈；长命令仍建议 nohup 后台化（SKILL 已载）。
3. tarball 245MB 持续增长（原画累积），与 DEPLOY2 记录一致，未恶化到需处理。
4. 服务器 `.env.bak-seam-1843` untracked 残留依旧（wave24 遗留项，未动，待主控决定）。
5. 交互行为验收（锚点落定 #vote/#tech、模式切换 R1 回归、手机 LCP）属验收波任务；本轮 8b146a7 提交信息载验收 20/20 + R1 回归 8/8（开发侧），服务器侧仅证明产物在位。
6. 部署时间线取证教训：journal 过滤命令别用 `tail` 截断（会丢最早记录致误判），全量输出或明确 `--since/--until` 区间。
