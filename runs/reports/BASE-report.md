# BASE 报告 · Portfolio 发布基线核对与 Git 集成

- 执行时间：2026-10-10
- 工作目录：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`
- 结果：**全部 4 项完成**（三端基线 / 文档审查 / Git 集成推送 / 3108 生产预览），无红线违规，未做任何部署、未改服务器任何状态。

## 1. 三端基线 SHA

| 端 | 分支 | SHA | 状态 |
|---|---|---|---|
| 本地 | `codex/character-motion-m1` | `8302135b12dda44cd3b96dd81d632a5097b9f065` | `git status --porcelain` 为空（干净），与任务书基线一致 |
| 远端 | `origin/master`（fetch 后） | `b2d2eacbfbaf2a3a446a11e88150b426186acb50` | 落后本分支 31 提交、领先 0（无分叉），是本分支祖先 → 可快进。无他人新提交 |
| 服务器 | `/home/ubuntu/my-portfolio`（master） | `b2d2eacbfbaf2a3a446a11e88150b426186acb50` | = origin/master（集成前），部署基线明确 |

服务器健康（只读 SSH，未做任何写操作）：

```
● portfolio-web.service - Portfolio Web
   Active: active (running) since Mon 2026-10-05 23:43:22 CST; 4 days ago
   Main PID: 3601660 (next-server)   Memory: 553.1M
curl http://127.0.0.1:3000/ → 200
ss -ltnp | grep :3000 → LISTEN 127.0.0.1:3000  pid=3601660
```

**基线补充说明（与任务书的细微出入，无风险）**：快进前本地 `master` 领先 `origin/master` 4 个提交（HEAD `8b3ccb1`），并非恰好等于 origin/master。`8b3ccb1` 是 `8302135` 的祖先（`merge --ff-only` 成功即证明），属"本地已集成本分支部分早期提交但未推送"，快进路径不受影响。

## 2. 必读文档与部署脚本审查要点

### 2.1 `scripts/deploy-portfolio-safe.sh`（读源码结论）

- **同步方式**：本地 `git archive --format=tar HEAD | gzip -9`（只打包已提交 HEAD，天然排除 node_modules/.next/运行时数据/未跟踪文件）→ scp 单传 → 服务器 `tar -xzf` 提取；随后服务器 `git fetch origin && git reset --hard origin/master`，fetch 跨境失败仅 `WARN` 不阻塞（tar 已提取最新代码，ref 靠 git bundle 补）。打包前有 `git -c core.autocrlf=true diff --quiet` 检查，存在未提交已跟踪文件则拒绝部署。
- **打包安全**：固定时间戳 tarball 名 `/tmp/portfolio-deploy-<ts>.tar.gz`（防 glob 投毒/TOCTOU）；本地 4 项检查——prisma/data 与 dev.db 不在 tar、`.env*` 不在 tar（允许 .env.example）、size < 50MB、package.json 必须在。
- **SHA256 一致性校验**：本地 `sha256sum` 生成完整 "hash filename" 格式 → scp → 服务器 `sha256sum -c` 校验（防传输中途替换），任何一项 fail 立即 abort。
- **构建流程**：**先停服再构建**——`sudo systemctl stop portfolio-web`（释放内存，2G 机器必须）→ `rm -rf .next/cache/fetch-cache`（只清数据缓存，保留 images 缓存防部署后图片慢）→ `NODE_OPTIONS=--max-old-space-size=1536 npm run build` → standalone 两件套 `cp -a .next/static` + `cp -a public` → `systemctl restart` → 断言新进程 etime < 30s（防 restart 未回收旧进程）。
- **依赖与 db 步骤**：`pnpm install --frozen-lockfile --config.confirm-modules-dir=false` + 装完断言 next 版本与 lockfile 一致（2026-09-30 pnpm 静默跳过重装实录的防护）→ `npx prisma db push --accept-data-loss=false`（P3005 场景）→ `DATABASE_URL='file:./data/dev.db' npx prisma db seed`（幂等，不覆盖已有数据）→ build 前断言 `dev.db` size > 0。
- **回滚手段**：SKILL `revert <hash>` = 本地 + 服务器 `git reset --hard` 到指定 commit + 重新 build；跨境 fetch 失败用 git bundle 修 ref。⚠️ 已知复合坑（SKILL 2026-08-28 实录）：**部署"删文件"的 commit 且脚本输出 `WARN: git fetch failed` 时必须停下走 bundle 修复 ref 再 build**——tar 只覆盖不删除，残留已删文件对着回退后 schema 编译会 build 失败并清空 `.next` → 服务停机。
- **最终 5 项验证**：三端 commit 一致 / `https://asterforge.top/admin` 200 / `/api/admin/login` 路由活 / prisma/data 大小 > 0 / 近 1 分钟无 P2021、HTTP 500。

### 2.2 SKILL.md（`.agents/skills/my-portfolio/SKILL.md`）要点

- `deploy-portfolio-safe.sh` 是**唯一 deploy 入口**，deploy 前必查三端一致性（本地/origin/服务器同 SHA，`rev-list --left-right --count HEAD...origin/master` 必须 `0 0`），不手敲 tar+scp。
- systemd unit ExecStart = `/usr/local/node20/bin/node /home/ubuntu/my-portfolio/.next/standalone/server.js`（standalone 产物），不要改 unit。
- Prisma 6.x cwd 陷阱：client 启动切 cwd 到 `prisma/`，`DATABASE_URL=file:./data/dev.db` 实际解析 `prisma/data/dev.db`。
- 手动兜底部署流程（脚本卡住/SSH 抖）：scp 远程脚本 + nohup 后台跑（`< /dev/null` 必须补）；ref 同步用 git bundle 不依赖跨境 fetch。

### 2.3 `asterforge-deploy/README.md` 要点

- 单机腾讯云 `111.229.200.178`（4C/3.6G/40G），Portfolio :3000 = `portfolio-web`，SSL Certbot 直管，push 不自动上线，手动 SSH 部署。
- 服务器 git 只能 pull 不能 push；跨境不稳时走 git bundle。
- Portfolio 运行约 320MB cgroup（R70 巡检），周日 04:00 timer 重启 + 5 分钟 healthcheck 自愈兜底。
- ⚠️ README §6.1 的「Next 16 standalone 需补 @swc/helpers、@next/env 两包」与项目 memory（deploy-safe 引号 bug 条目：standalone 无需补 @swc 件）存在口径差——以实际部署脚本 + 项目 memory 为准，本任务未部署不涉及。

### 2.4 Stage 文档结论

- `stage-2026-10-10-home-completion.md`：六幕主站整合 4/4 完成——`/` 启用六幕新主站、`/explore` 承接原站业务、候选页不索引、旧根锚点兼容；首幕资源 11.4→6.0MB，Lighthouse 87→92；本地完成，未推送未部署。
- `stage-2026-10-10-home-fluidity.md`：手机流畅度与高刷打磨 4/4——手机浏览资源 5.1→2.9MB、主线程绘制提交 P95 ~1.7ms；未测出整体帧间隔改善，真实手机 GPU 与物理高刷未验收；本地完成，3108 提供最新生产预览。

## 3. Git 集成与推送证据

```
$ git checkout master && git merge --ff-only codex/character-motion-m1
Updating 8b3ccb1..8302135
Fast-forward
（734→920 文件更新，含 docs/design/character-homepage 资产）

$ git push origin master        # 第一次
error: RPC failed; HTTP 408 ... fatal: the remote end hung up unexpectedly
# → China 跨境超时；ls-remote 确认远端仍 b2d2eac（推送未生效，幂等可重试）

$ git push origin master        # 重试（第 2 次）
To https://github.com/TimeCraker/my-portfolio.git
   b2d2eac..8302135  master -> master

$ git merge-base --is-ancestor 7bc1262 origin/master && echo OK
OK: 7bc1262 is ancestor of origin/master
$ git merge-base --is-ancestor 8302135 origin/master && echo OK
OK: 8302135 is ancestor of origin/master
$ git rev-parse origin/master
8302135b12dda44cd3b96dd81d632a5097b9f065
```

- **最终发布 SHA：`8302135b12dda44cd3b96dd81d632a5097b9f065`**（origin/master，正常快进推送，未用 force）。
- 已切回 `codex/character-motion-m1` 保持现场，工作区干净。
- 注意：**服务器仍在 `b2d2eac`（旧版在线），部署由后续部署波执行**——本次按红线未动服务器。

## 4. 本地生产预览（3108）

| 项 | 值 |
|---|---|
| 端口 | 3108（启动前确认空闲，无他人进程占用） |
| 构建 | `pnpm build`（= `prisma generate && next build`），BUILD_ID `FTFkTi63sDev9TOw0zRjn`，含 8302135 最新代码 |
| standalone 两件套 | `public` 自动就位；`.next/static` 构建后缺失，已手动补拷至 `.next/standalone/.next/static`；另按部署惯例 `cp .env .next/standalone/.env`（.next 与 .env 均被 gitignore，不污染工作区） |
| 启动命令 | `cd .next/standalone && PORT=3108 node server.js`（standalone 端口走 `PORT` 环境变量，`-p` 参数对该入口无效） |
| **PID（Windows）** | **26776**（`netstat -ano` 监听 3108 的 LISTENING PID，供主控 taskkill 管理） |
| **日志** | **`C:\Users\TimeCraker\AppData\Local\Temp\portfolio-preview-3108\server.log`** |

验证结果：

```
curl http://localhost:3108/             → 200
curl http://localhost:3108/home-preview → 200
curl http://localhost:3108/explore      → 200
```

首页六幕标记抽查（chapter 容器 × 6，即六幕结构）：

```
id="chapter-hero"  id="chapter-about"  id="chapter-resume"
id="chapter-capabilities"  id="chapter-game"  id="chapter-contact"
<title>TimeCraker · AI Builder</title>
```

## 5. 剩余风险与移交事项

1. **服务器未部署**（预期内）：线上仍为 `b2d2eac` 构建运行，六幕新主站尚未上线；部署走 `deploy-portfolio-safe.sh`，见 §2.1 审查要点与回滚注意事项。
2. push 第一次 HTTP 408 重试成功——若部署波在服务器 `git fetch origin` 遇同类跨境超时，按 SKILL 走 git bundle，不要盲目重试。
3. 3108 预览为后台进程 PID 26776，Windows 重启或进程被杀后需重新拉起（命令见 §4）。
