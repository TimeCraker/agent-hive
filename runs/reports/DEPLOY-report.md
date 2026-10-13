# DEPLOY 报告 · Portfolio 六幕版本 备份 + 安全部署 + 服务器端验证

- 执行时间：2026-10-11 13:52 – 14:10（CST）
- 工作目录：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`
- 结果：**部署成功**。发布 SHA `eae5d8bda023454826960a9ebe7d9c659088765e` 已上线 https://asterforge.top，六幕新主站全量生效，原业务入口/API/数据库全部完好，全程零数据丢失、零不可回滚操作。
- 证据目录：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/deploy/`
  - `deploy-output-1011.log`（第一次尝试，fetch 跨境失败中止）
  - `deploy-output-1011-attempt2.log`（第二次尝试，成功全记录）

## 1. 发布信息

| 项 | 值 |
|---|---|
| 发布 SHA | `eae5d8bda023454826960a9ebe7d9c659088765e`（fix(home): 渲染器单例复用修复跨界泄漏） |
| 分支状态 | 本地 `master` = `origin/master` = 服务器 HEAD，三端一致；`7bc1262`、`8302135` 均为 HEAD 祖先（merge-base 验证 ✓） |
| 旧版本（回滚点） | `b2d2eacbfbaf2a3a446a11e88150b426186acb50` / BUILD_ID `pRkaxPhaiEd-PPKQxusZ3` |
| 新 BUILD_ID | `pzMAgpozcTii4Ryej1ld2`（≠ 旧值，证实新构建产物；standalone/server.js mtime = 部署时刻） |
| systemd 进程 | PID 914237（新），etime 3s 起步，持续 active |
| prisma schema | b2d2eac→发布 SHA 零变更（`git diff` 0 行）→ db push 幂等 no-op；dev.db 部署前后同为 2,297,856 bytes |

## 2. 停服窗口

- **约 14:02:10 – 14:02:51，≤ 45 秒**（推断依据：journal 自愈重试起点 14:02:26 → restart 成功 14:02:51；stop 发生在 build 前）
- 窗口内 4 条 `Cannot find module .../standalone/server.js`（journal 14:02:26–14:02:46）：服务器 healthcheck 自愈机制在 standalone 重建完成前尝试拉起所致，属停服窗口预期现象；**14:03 后新错误 0**。

## 3. 备份清单（部署前 13:52 完成，全部先于停服）

备份目录：`/home/ubuntu/backups/portfolio-predeploy-20261011-135231/`（148M，`portfolio-predeploy-LATEST.txt` 已指向）

| 文件 | 内容 | 验证 |
|---|---|---|
| `dev.db` | SQLite 一致性快照（python3 sqlite3 `conn.backup()` = `.backup` 等价；服务器无 sqlite3 CLI） | **14 表 row count 与原库全部一致，BACKUP_VERIFY: PASS**；备份可打开 |
| `next-standalone.tar.gz` | 旧构建 standalone（250M 解压前） | tar 归档成功 |
| `next-static.tar.gz` | 旧 .next/static（4.5M） | tar 归档成功 |
| `BUILD_ID.old` / `git-HEAD.old` | 旧构建标识 / 旧 SHA | 内容核对 ✓ |

部署后 DB 复核：14 表 count 与部署前一致；唯一差异 `AdminAuditLog` 309→310——新记录为 `login success:false ip:111.229.200.178`，即部署脚本 5 项验证中 `POST /api/admin/login`（空凭证预期 401）自身产生的失败登录审计，**预期副作用非数据损坏**。

## 4. 部署过程（两次尝试 + bundle 修 ref）

### 第一次（13:53:16 – 13:56:53，中止，线上无感）

- 打包 4 项安全检查全过（prisma/data 排除 / .env* 排除 / package.json 在）；tarball 245MB（>50MB WARNING 为 character-motion 原画 655 文件 + design 资产所致，非泄漏）；sha256 服务器校验通过。
- **服务器 `git fetch origin` 跨境失败**（github.com:443 超时 134s，WARN 不阻塞）→ `reset --hard origin/master` 落空（ref 仍 b2d2eac）→ tar 提取的 1630 个新文件对旧 HEAD 呈 untracked → 脚本「构建输入与 Git 跟踪清单一致」断言 **FATAL exit 1**。
- **中止点在 `systemctl stop` 之前，服务未停、线上无感**；残留 tarball 已清理。
- 本次发布区间 b2d2eac→eae5d8b **零文件删除**（`git diff --name-status` D 计数 0），无「已删文件残留」次生风险。

### bundle 修 ref（13:58 – 14:00）

按 SKILL 路径：本地 `git bundle create`（332MB 完整历史，verify 通过，指向 eae5d8b）→ scp 直连腾讯云 → 服务器 `git fetch <bundle> +master:refs/remotes/origin/master` → `reset --hard` 落位 1630 文件 → untracked 构建输入 **CLEAN** → 服务仍 active/200。

### 第二次（14:00:59 – 14:02:53，成功）

- sha256 与第一次完全相同（同一 HEAD 打包，bit 级一致）。
- 全链路：提取 → `HEAD: eae5d8b` → 构建输入一致 ✓ → `pnpm install --frozen-lockfile` 4.1s（node_modules 已与 lockfile 一致）→ **next 版本断言 installed=16.3.7 = locked=16.3.7**（memory 所载引号转义 bug 已由 commit `b6101c1` 修复，本次实际跑通）→ dev.db 未被覆盖 → db push（schema 零差异 no-op）→ seed 幂等（数据 count 不变）→ stop → 清 fetch-cache（保留 images 缓存）→ build 成功（输出含 Static/Dynamic 图例）→ cp static+public 进 standalone → restart → 新 PID etime=3s ✓ → tarball 清理 ✓。
- 脚本 5 项终验：三端一致 `eae5d8b` / `/admin` HTTP/2 200 / `/api/admin/login` 路由活（401 预期）/ dev.db 2.2MB / 近 1 分钟 P2021+500 = 0。

## 5. 服务器端验证矩阵（构建成功后的健康版本验证）

| # | 项 | 结果 |
|---|---|---|
| 1 | 三端 HEAD 一致 | 本地 = origin/master = 服务器 = `eae5d8b` ✓ |
| 2 | systemd 新进程 + 新 BUILD_ID | PID 914237 / `pzMAgpozcTii4Ryej1ld2` ✓ |
| 3 | `https://asterforge.top/` | 200 + 六幕标记 ×6（chapter-hero/about/capabilities/resume/game/contact）+ `<title>TimeCraker · AI Builder</title>` ✓ |
| 4 | CSS chunk | 200 `text/css; charset=UTF-8` ✓ |
| 5 | JS chunks ×3 | 200 `application/javascript; charset=UTF-8` ✓（从首页 HTML 提取真实 URL） |
| 6 | 原画直出（webp）×4 | about-poster / hero-poster / 120/frame-0000 / 60/frame-0000 → 200 `image/webp` ✓ |
| 7 | reading-v1 轻量素材 | assets.json 200 json + mascot-present.webp 200 `image/webp` ✓ |
| 8 | 字体 | `/fonts/noto-serif-sc/5.3.0/*.woff2` 200 `font/woff2` ✓ |
| 9 | `/_next/image` 优化器 | 200 `image/jpeg`（curl 未带 webp Accept 的正常格式协商，真实图片内容）✓ |
| 10 | `/admin` `/explore` `/config` `/projects/game` `/home-preview` | 全 200 ✓ |
| 11 | 公开 API | `/api/public/projects` 200 + 真实 JSON（DB 驱动 7 条链接）、`/api/public/announcement` 200、`/api/files/categories` 200 + 真实 JSON ✓ |
| 12 | SEO 元数据 | `/home-preview` = `noindex, nofollow`；`/` = `index, follow` ✓ |
| 13 | prisma/data 完好 | 2,297,856 bytes + 14 表 count 复核（见 §3）✓ |
| 14 | 日志 | 近 1 分钟 P2021/500 = 0；14:03 后新错误 0 ✓ |
| 15 | 资源 | 内存 141.6M（峰值 153.5M）；磁盘 5.8G 可用 ✓ |

## 6. 回滚就绪记录（如需）

> ⚠️ **R3 复核（2026-10-11）：本节命令块不安全，已被仓库正式 runbook 取代**——整段复制会无条件执行 `cp ... dev.db` 覆盖部署后的新增生产数据（发布当天 2 小时实测 +65,536 bytes），且「三端一致」口径不实（服务器 reset 不影响本地/origin）。正式回滚流程见 **`my-portfolio/docs/runbooks/rollback.md`**（commit `d6e9f32`，分支 `codex/character-motion-m1`）。以下历史内容保留原样，仅作当时部署记录。

```bash
ssh -i <key> ubuntu@111.229.200.178
cd /home/ubuntu/my-portfolio
sudo systemctl stop portfolio-web
# 恢复旧构建（快路径，无需重 build）
tar -xzf /home/ubuntu/backups/portfolio-predeploy-20261011-135231/next-standalone.tar.gz -C .next
tar -xzf /home/ubuntu/backups/portfolio-predeploy-20261011-135231/next-static.tar.gz -C .next
# 恢复 DB（仅当数据受损时）
cp /home/ubuntu/backups/portfolio-predeploy-20261011-135231/dev.db prisma/data/dev.db
# 源码 ref 一并回退（保持三端一致口径）
git reset --hard b2d2eacbfbaf2a3a446a11e88150b426186acb50
sudo systemctl restart portfolio-web
# 恢复验证：curl http://127.0.0.1:3000/ 200 + https://asterforge.top/ 200 + BUILD_ID = pRkaxPhaiEd-PPKQxusZ3
```

SKILL 备选路径（构建式回滚）：本地 + 服务器 `git reset --hard b2d2eac` 后重跑 build 流程，跨境 fetch 失败时用同一 bundle 手法修 ref。

## 7. 红线自查

- 只操作 `portfolio-web`（stop/restart 各一次），未批量停 Node/Chrome/Docker ✓
- 未覆盖服务器 `.env` / systemd EnvironmentFile / 数据库 / uploads；`git archive HEAD` 天然排除运行时数据，脚本 4 项检查 + tree 抽查双重证实 ✓
- 未上传本机开发数据（tarball 仅含 git HEAD 已提交内容，1630 文件）✓
- 备份先行且验证可用（13:52 完成 BACKUP_VERIFY: PASS 后才允许停服）✓
- 构建成功才 restart 上线；第一次中止于停服前，线上无感 ✓
- 无 force push；正常快进推送（BASE 波已完成）✓

## 8. 剩余风险与移交

1. **跨境 fetch 不稳定是结构性风险**：本次 `git fetch origin` 一次失败一次成功。bundle 修复手法已实证有效（本次全程留痕），后续部署遇同类 WARN 可直接复用 §4 的 bundle 流程。
2. tarball 245MB 持续增长（原画素材累积）：>50MB WARNING 非泄漏，但 scp/打包耗时随之上升；若继续增长可考虑瘦身原画入库或调整脚本阈值口径（本次未动，遵循最小改动）。
3. 服务器 `.env.bak-seam-1843` untracked 残留依旧存在（不在构建输入检查范围，未动，建议后续主控决定清理时机）。
4. 真实手机 / Safari / 物理高刷验收不在本波范围（属验收波任务），本报告仅覆盖部署与服务器端健康。
5. 短时观察已完成：部署后 3–8 分钟窗口内服务 active、HTTPS 200、14:03 后零新错误；未创建任何永久定时任务。
