# DEPLOY2 报告 · Portfolio 最终候选发布 备份 + 安全部署 + 服务器端验证

- 执行时间：2026-10-11 17:48 – 17:58（CST）
- 工作目录：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`
- 结果：**部署成功，一次通过**。发布 SHA `7bee44169f76fdb9e6e3603ca6b680e729346612` 已上线 https://asterforge.top，含 R1/R2 修复（`9a443e6`）+ 批准的 LCP 性能优化（`7bee441`）+ 回滚 runbook（`d6e9f32`）。原业务入口/API/数据库全部完好，全程零数据丢失、零不可回滚操作。
- 证据目录：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-followup-2026-10-11/deploy/`
  - `backup-output.log`（部署前备份全记录）
  - `deploy-output-attempt1.log`（部署全记录，一次成功）
  - `verify-output.log`（验证矩阵首轮 + 会话内二轮补验，关键结果见 §5）

## 1. 发布信息

| 项 | 值 |
|---|---|
| 发布候选确认 | 主控消息未附显式 SHA；经核对 origin/master HEAD = `7bee441`，其提交构成（`9a443e6` 一提交含 R1 切换保留章节 + R2 旧锚点跳转两修复点、`7bee441` LCP 性能优化）与「R1/R2 修复 + 批准的性能优化」精确吻合，且为 `eae5d8b`（上次已上线 SHA）之后唯一代码变更区间 → 判定 `7bee441` 为发布候选 |
| 分支状态 | 本地 HEAD = `origin/master` = 服务器 HEAD，三端一致 `7bee4416`；部署前服务器为 `eae5d8b`（wave24 已上线版） |
| 变更范围 | `eae5d8b..7bee441`：7 文件，+467/−48，全部为 character-motion 组件/逻辑 + runbook 文档；**prisma schema 0 行变更、0 文件删除** |
| 旧版本（回滚点） | `eae5d8bda023454826960a9ebe7d9c659088765e` / BUILD_ID `pzMAgpozcTii4Ryej1ld2` |
| 新 BUILD_ID | `nwHF9XWOcBX14YFXX9fCN`（≠ 旧值，证实新构建产物） |
| systemd 进程 | PID 1078063，lstart 17:51:39，持续 active |
| prisma schema | `eae5d8b→7bee441` 零变更（`git diff` 0 行）→ db push 幂等 no-op；dev.db 部署前后同为 2,363,392 bytes |

## 2. 停服窗口（journalctl + ps 真实时间戳）

- **17:51:13（systemd Stopped）→ 17:51:39（最终进程 PID 1078063 lstart），约 26 秒**。
- 依据：`journalctl -u portfolio-web` 17:51:13 `Stopping/Stopped`；`ps -o lstart= -p 1078063` = `Sun Oct 11 17:51:39 2026`；脚本 restart 与 systemd 自愈汇合于同秒，最终稳定进程即承载新 BUILD_ID 的进程（首页新 preload 已验证在位）。
- 窗口内 3 条 `Cannot find module .../standalone/server.js`（journal 17:51:27 / 17:51:37 ×2）：systemd 自愈在 standalone 重建完成前尝试拉起，与 wave24 同型的预期竞态现象；**17:52:00 后 `Cannot find module` 计数 = 0**。

## 3. 备份清单（部署前 17:48–17:49 完成，全部先于停服）

备份目录：`/home/ubuntu/backups/portfolio-predeploy-20261011-174846/`（331M，`portfolio-predeploy-LATEST.txt` 已指向）

| 文件 | 内容 | 验证 |
|---|---|---|
| `dev.db` | SQLite 一致性快照（python3 sqlite3 `conn.backup()`） | **14 表 row count 与原库全部一致，BACKUP_VERIFY: PASS**；2,363,392 bytes |
| `next-standalone.tar.gz` | 旧构建 standalone（342.8M） | tar 归档成功 |
| `next-static.tar.gz` | 旧 .next/static（1.6M） | tar 归档成功 |
| `BUILD_ID.old` / `git-HEAD.old` | 旧构建标识 / 旧 SHA | `pzMAgpozcTii4Ryej1ld2` / `eae5d8b` 核对 ✓ |

回滚流程使用**仓库正式 runbook** `my-portfolio/docs/runbooks/rollback.md`（`d6e9f32`，本次发布区间内已合并），不再使用上次报告 §6 的历史命令块（该块已被 R3 复核标注不安全）。

部署后 DB 复核：14 表 count 与备份时一致；唯一差异 `AdminAuditLog` 311→312——新记录为部署脚本 5 项终验中 `POST /api/admin/login`（空凭证预期 401）自身产生的失败登录审计，**预期副作用非数据损坏**（与 wave24 同型）。

## 4. 部署过程（一次成功，无需 bundle 修 ref）

- 打包 4 项安全检查全过（prisma/data 排除 / .env* 排除 / package.json 在）；tarball 245MB（>50MB WARNING 为 character-motion 655 文件 + design 268 文件原画资产所致，非泄漏）；sha256 `836260ca…` 服务器校验通过。
- **本次跨境 fetch 顺利**（`eae5d8bd..7bee4416  master -> origin/master`，1631 文件 reset 落位），未触发 wave24 的 FATAL 中止路径，bundle 修 ref 手法备而未用。
- 全链路：提取 → `HEAD: 7bee4416` → 构建输入一致 ✓ → `pnpm install --frozen-lockfile --config.confirm-modules-dir=false` 3.9s → **next 版本断言 installed=16.3.7 = locked=16.3.7** → dev.db 未被覆盖（2,363,392 bytes）→ db push（schema 零差异 no-op）→ seed 幂等 → stop（17:51:13）→ 清 fetch-cache（保留 images 缓存）→ build 成功（增量热缓存，~20s，输出含 Static/Dynamic 图例）→ cp static+public 进 standalone → restart → 新 PID 1078063 **etime=3s** ✓ → tarball 清理 ✓。
- 脚本 5 项终验：三端一致 `7bee441` / `/admin` HTTP/2 200 / `/api/admin/login` 路由活（401 预期）/ dev.db 2.3MB / 近 1 分钟 P2021+500 = 0。

## 5. 服务器端验证矩阵（15 项 + 三项修复服务器侧确认）

| # | 项 | 结果 |
|---|---|---|
| 1 | 三端 HEAD 一致 | 本地 = origin/master = 服务器 = `7bee441` ✓ |
| 2 | systemd 新进程 + 新 BUILD_ID | PID 1078063（lstart 17:51:39）/ `nwHF9XWOcBX14YFXX9fCN` ✓ |
| 3 | `https://asterforge.top/` | 200 + 六幕标记 ×6（chapter-hero/about/capabilities/resume/game/contact）+ `<title>TimeCraker · AI Builder</title>` ✓ |
| 4 | CSS chunks ×3 | `/_next/static/chunks/*.css`（Next 16 布局，非旧报告的 `static/css/` 口径）全 200 `text/css; charset=UTF-8` + `immutable` 1 年 ✓ |
| 5 | JS chunks ×3 | 200 `application/javascript; charset=UTF-8` ✓（从首页 HTML 提取真实 URL） |
| 6 | 原画直出（webp）×4 | about-poster / hero-poster / 120/frame-0000 / 60/frame-0000 → 200 `image/webp` ✓ |
| 7 | reading-v1 轻量素材 | `/character-motion/reading-v1/assets.json` 200 json + mascot-present.webp 200 `image/webp` ✓（首轮 404 为验证脚本照抄旧报告丢前缀，非回归） |
| 8 | 字体分片 | `/fonts/noto-serif-sc/5.3.0/noto-serif-sc-{100,115}-600-normal.woff2` 200 `font/woff2` ✓（首轮 404 为抄错文件名 `regular`，真实引用为分片命名） |
| 9 | `/_next/image` 优化器 | 200 真实图片内容（curl 未带 avif/webp Accept 协商回退 `image/jpeg`，同 wave24 口径）✓ |
| 10 | `/admin` `/explore` `/config` `/projects/game` `/home-preview` | 全 200 ✓ |
| 11 | 公开 API | `/api/public/projects` 200 + 真实 JSON（`{links:[…]}` 7 条）、`/api/public/announcement` 200、`/api/files/categories` 200 ✓ |
| 12 | SEO 元数据 | `/home-preview` = `noindex, nofollow`；`/` = `index, follow` ✓ |
| 13 | prisma/data 完好 | 2,363,392 bytes + 14 表 count 复核（见 §3）✓ |
| 14 | 日志 | 近 1 分钟 P2021/500 = 0；17:52:00 后 `Cannot find module` = 0 ✓ |
| 15 | 资源 | 内存 used 1414M / 3723M；磁盘 5.5G 可用 ✓ |

**三项修复服务器侧确认**：

| 项 | 证据 |
|---|---|
| perf（`7bee441`）LCP 优化 | 首页 `<head>` 内三条件在位：about-poster `imageSrcSet`（8 宽度 640–3840）+ `fetchPriority="high"` + `media="(max-width: 899px)"` 手机限定；hero-poster `imageSrcSet` + `fetchPriority="high"`；ring.webp preload `media="(min-width: 900px)"` 桌面限定。**preload 已 hoist 到 head**（head 段内计 2+ 条，memory 所载 RSC imageSrcSet-no-href 不 hoist 坑未复发）✓；三图能力章配图改走优化器（`/_next/image` 200）✓ |
| R1/R2（`9a443e6`） | client chunk `0cc81dqmo255d.js` 含 `custom-dev`/`rag-demo` 常量（`LEGACY_SECTION_IDS` 字符串数组编译进 bundle，DB 运行时数据不入 client chunk，命中即新代码）✓；源码在位：navigation.ts `legacySectionAnchor` 1 处、ReadingStory `fetchPriority` 2 处 ✓ |
| 交互级验收 | 服务器侧仅能确认代码/产物在位；R1 章节保留、R2 锚点跳转、手机 LCP 实测属验收波任务，未在本波范围 |

## 6. 红线自查

- 只操作 `portfolio-web`（脚本 stop/restart 各一次 + systemd 自愈竞态 3 次拉起均失败于窗口内），未批量停 Node/Chrome/Docker ✓
- 未覆盖服务器 `.env` / systemd EnvironmentFile / 数据库 / uploads；`git archive HEAD` 天然排除运行时数据，脚本 4 项检查证实 ✓
- 未上传本机开发数据（tarball 仅含 git HEAD 已提交内容，1631 文件）✓
- 备份先行且验证可用（17:49 `BACKUP_VERIFY: PASS` 后才允许停服）✓
- 构建成功才 restart 上线 ✓；无 force push ✓；schema 零变更、db push no-op（git diff 0 行 + 表 count 复核）✓
- 密钥仅引用路径（`asterforge-deploy/ssh-keys/tencent_server_key.pem`），未输出内容 ✓

## 7. 剩余风险与移交

1. **发布候选 SHA 为推断确认**：主控派发消息未附显式 SHA，本波以「origin/master HEAD + 提交构成与任务描述精确吻合」判定 `7bee441`。事后核对无歧义（`eae5d8b` 后仅 3 提交且全部包含在内），但流程上建议主控下次派发附显式 SHA。
2. **首轮验证 4 项假阴性教训**：字体 404 / reading-v1 404 / CSS 提取空 / fetchpriority 未命中，全部为验证脚本自身口径错误（照抄 wave24 报告的 URL 与 grep 模式过时），修正后全绿、真实回归 0。下次验证矩阵应从**当次 HTML 提取真实资源 URL**，不照抄历史报告。
3. R1/R2 交互行为与手机端 LCP 实测（1.8s 口径）需验收波以真机/Playwright 确认；服务器侧仅能证明产物在位。
4. 停服窗口 26s 内 systemd 自愈拉起 3 次（均 `Cannot find module` 快速失败，无脏服务）；如需消除可评估 unit 加 `ExecCondition` 检测 server.js 存在性（本次未动，遵循最小改动）。
5. tarball 245MB 持续增长（原画累积），scp/打包耗时随之上升；wave24 已记录，本次未恶化到需处理。
6. 服务器 `.env.bak-seam-1843` untracked 残留依旧（wave24 遗留项，未动，待主控决定）。
