# GAM · games 文档保鲜度审计与修复报告

- **日期**：2026-10-06
- **仓库**：`C:/Users/TimeCraker/Desktop/my_workspace/games`（分支 `main`，领先 origin 5 提交）
- **方法**：git log/status/ls-files 实况取证 + 2 个只读探查代理（美术区 / web+backend 区）+ 人工复核全部关键陈述后逐条改写
- **修改面**：20 个 `.md`（+143/−73 行）；未触碰任何代码/配置/依赖/锁文件
- **commit**：**跳过** —— 仓库存在并行美术会话的未提交改动（`white/rework` blend/GLB/脚本、`character-art-rework*.md`、`white/rework/README.md` 等），按任务红线「他人未提交改动时绝不 commit」执行。改动已留在工作区，可随该会话或人工一并提交。

---

## ① 过期点清单（改前 ‖ 改后 ‖ 证据）

### 根级门面（games/README.md · games/CLAUDE.md）

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---|---|---|---|
| 1 | games/README.md:95 | `cp .env.development .env.local` | `cp .env.production .env.local`（注明模板不入库） | `ls web-client/.env*` 仅 `.env.local`/`.env.production`，无 `.env.development` |
| 2 | games/README.md Monorepo 树 | 仅列 6 目录，backend 未标封存 | 补 `render-lab/`、`art/`、`scripts/` 三行，backend 加 ❄️ 封存标注 | `ls asternova/` 实有 art/render-lab/scripts；AGENTS.md §1 称 render-lab 为当前核心工作区 |
| 3 | games/README.md 快速开始 | 无一键启动说明 | 补仓库根 3 个 bat（战斗沙盒/三角色/白色样板） | bat 在盘且目标场景 `combat_playground.tscn`、`white_static_review.tscn` 存在 |
| 4 | games/CLAUDE.md:82 | 「CI 是死文件…本仓库没有（根 workflows）→ 当前无生效 CI」 | 「CI 已生效（2026-10-03 起）」：根 ci.yml 跑 web-client lint+build | 根 `.github/workflows/ci.yml` 存在（git `5a9d844`）；子目录死 CI 已删（`c5667ae`），`web-client/.github`、`backend/.github` 目录不复存在 |
| 5 | games/CLAUDE.md:39 | `cp .env.development .env.local # 仓库当前只有 .env.production`（命令与注释自相矛盾） | `cp .env.production .env.local # 模板在本机、被 git 忽略` | 同 #1 + `git check-ignore`（`.gitignore:37 .env*`） |
| 6 | games/CLAUDE.md:63 | 「services/ 下已有 **9 包**单测」 | 「8 包（auth 域 4 包 + battle + gateway/handlers + match + proto）」 | `services/` 下 `*_test.go` 实际 12 文件、8 个 Go 包（BLUEPRINT M0 验收口径亦为 8 包） |
| 7 | games/CLAUDE.md:75 | art/ 描述含 `environments/`（不存在） | 按实况重写（characters 五角色目录 / models / references / comparisons 等） | `ls art/`：无 environments；characters 下有 aster/white/purple/orange/animation-source/rigging-review |
| 8 | games/CLAUDE.md:19(M2) | 「69 项无头门禁」无时态限定 | 「2026-09-10 时点 69 项，现持续扩容」 | `tests/test_combat_runner.gd` 的 `check(` 调用现约 98 处 |

### docs 决策层（asternova/docs/）

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---|---|---|---|
| 9 | docs/architecture.md §1 | 「全局命令行通过 `godot.cmd` 调用」 | 「无全局 `godot` 命令，按绝对路径调用（见 AGENTS.md §0）」 | `command -v godot/godot.cmd` 均为空；AGENTS.md §0 同口径 |
| 10 | docs/README.md 索引表 | 缺 10 份现行文档（当前主线 character-art-rework、紫色 spec、三角色装配、白皮书×4、ui-polish×2、perf2 草案） | 补 8 行（阶段施工 3 + 阶段草案 1 + 游戏锚点 2 + UI 工艺 1，交接文档以链接并入） | 全部文件在盘；「当前主线施工单不在全景索引」为新会话迷路实害 |
| 11 | docs/README.md m1/m2 行 | 「待用户放行」「69 项门禁全绿」无状态演进 | m1 注明 09-10 放行作废待终审；m2 加 69 项快照注 | m1 spec :88-97 自记 09-10 复审判废；门禁扩容同 #8 |
| 12 | docs/ui-polish/rules.md:6 | 「S 序列，**R5–S13**」（编号混写）且未交代根目录现状 | 「S5–S13；该目录现仅存 tools/ 脚本」 | 同批归一的 AUDIT.md 口径为 S5–S13；`git ls-files docs/` 仅 4 个 tools 脚本 |
| 13 | docs/stage-specs/m1-render-vertical-slice.md:3 | 状态「**待用户放行**（2026-08-30 起草）」 | 「待制作人终审（09-07 放行被 09-10 复审判废）」 | 文内 :88-97 明载复审判废，头部状态与之矛盾 |
| 14 | docs/stage-specs/three-character-assembly-rigging.md:3 | 「当前先返工白色…等待用户确认」（隐含紫色也卡在白门后） | 补「紫色已单独授权并行；橙色与统一绑定仍待白门」 | git log 紫色 4 提交（`2f49d80`→`a92ee70`）；purple spec :3 明言授权 |
| 15 | docs/stage-specs/purple-character-rework.md:48 | 「新工程在 art/characters/purple/rework/」 | 补注：rework 根下 rig/动画文件为旧轮被否定实验产物，本轮产物全在 source_repair/ | 未跟踪文件 mtime 10-03 01:20–14:16，早于交接提交 `90d74a4`(16:06) |
| 16 | docs/stage-specs/purple-character-rework-handoff.md:1 | 全文「本 Agent 已停止、等待接手」口吻 | 顶部加「已被接手（当日推进至 5/8）」横幅，指向现行 spec | source_repair 轮 4 提交在案；spec 记 5/8 |

### 美术区（asternova/art/）

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---|---|---|---|
| 17 | art/README.md 目录树 | 停格于 2026-09-05：缺 models/references/textures/ui/三角色/animation-source/rigging-review/combat/environment 等十余实存目录 | 重写目录树 | `ls -R art/` 全量核对 |
| 18 | art/README.md:32,36,37 | 张数 13/6/9 张 | 5/12/6 张（另补 combat 4、environment+ground_qa 22、m1 系列 4、qa 5、lumina 1） | 逐一 `ls` 计数 |
| 19 | art/README.md SSOT 条款 | 「角色建模与风格验收以 aster turnaround-final.png 为唯一视觉基准」 | 「角色按各自原画与实物资产验收（2026-10-01 口径）；旧 Aster 才用 turnaround-final.png」 | AGENTS.md §2.4 与 STYLE.md 2026-10-01 校正同口径 |
| 20 | art/characters/README.md:3 | 同 #14（紫色卡白门） | 补紫色并行授权注 | 同 #14 |
| 21 | art/characters/aster/weapon.md:62 | 「client-godot-v2（**下一步挂载装配**）」 | 「挂载已落地：太刀 4 段普攻接入」＋socket 佐证文件 | `aster_rig.gd` 含 Hand_R_Weapon_Socket；`check_scabbard_transform.gd:9` 含 Pelvis_L_Scabbard_Socket；m1 spec :114 亦称已落地 |
| 22 | art/characters/aster/aster.md §3.2 | 「现行基准」提示词内「约 6.5 头身 / 154cm」与 §1 定稿卡「165cm / 8.5 头身」无调和 | §3.2 头部加冲突注：以 §1 定稿卡为准，取用提示词前须改定稿值 | :12 vs :821 同文件两套体格参数 |

### 渲染沙盒与 Web/Backend

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---|---|---|---|
| 23 | render-lab/README.md:3,11 | 「Godot 4.7 / 4.7.2 独立工程」 | 「工程特征 4.5（Forward+），与 v2 的 4.7 工程并存」 | `render-lab/project.godot` features="4.5"、rendering_method=forward_plus |
| 24 | render-lab/README.md:14 | `aster_head_base_v2.blend # 当前最新基模工程` | models/aster 现状（aster_assembled.glb + 贴图 + Tripo 源参考） | 全仓 find 该 blend 零命中 |
| 25 | render-lab/README.md:31,52 | `street_sunset.tscn`（场景 + CLI 命令两处） | `street_environment.tscn` | scenes/ 下实存后者、无前者 |
| 26 | render-lab/README.md 树 | 缺 environments/materials/polyhaven/textures/levels/lighting | 补齐（含 endfield 标准布光、6 个 levels 场景） | `ls render-lab/`、`ls scenes/levels/` |
| 27 | render-lab/.../ground/README.md:16 | 「Godot 4.7 用法」 | 「工程特征 4.5」 | 同 #23 |
| 28 | web-client/README.md:91 | 「Node.js 18+」 | 「Node.js 20.9+（CI 用 24）」 | next@16.3.7 engines >=20.9.0；根 ci.yml node-version 24 |
| 29 | web-client/README.md:67,86 | 「强制开启 **Brotli**/Gzip 压缩」×2 | `.gz` 预压缩变体 + 一年 immutable 缓存头 | `next.config.ts` headers 仅 `.data.gz/.js.gz/.wasm.gz` 三组，无任何 .br 规则 |
| 30 | web-client/README.md:95 | 「仓库内现有环境模板为 .env.production」 | 注明该模板 git 忽略不入库，新 clone 需自建 | `git ls-files` 无此文件；check-ignore 命中 |
| 31 | web-client/README.md 拓扑 | 缺 components/lib/scripts | 补两行 | 目录实存 |
| 32 | web-client/public/audio/README.md | games 列表缺 xiaoxiaole | 补「路由已上线，音频目录按需增补」 | `app/xiaoxiaole` 路由在；CREDITS.md 已含 xiaoxiaole |
| 33 | backend/README.md 拓扑 | `proto/` 画在根；漏 queries/migrations/sqlc.yaml/docs；test/ 称「网关路由模拟」 | proto 移入 services/ 第 5 项；补 4 项；test/ 改「手动压测客户端」 | `ls services/` 实有 5 子目录；test/ 仅 test_client.go |
| 34 | backend/README.md:118 | `docker-compose up -d`（只提 PG+Redis） | `docker compose up -d`（PG+Redis+**Qdrant**） | docker-compose.yml 三服务；根 CLAUDE.md 同用新命令 |
| 35 | backend/.agents/skills/game-asternova/SKILL.md | 全文以现行运维手册口吻自居（独立仓名/mysql.go/Redis 6380 硬编码） | 顶部加「历史参考」横幅，指明旧版栈路径与新栈去向 | `services/auth/db/` 现为 postgres.go+redis.go（REDIS_ADDR 可覆盖）；两独立仓已 subtree 并入 |
| 36 | client-godot/README.md:107 | 导出路径 `../asternova-web-client/...`（旧仓名，重用会失败）未获说明 | 冻结横幅补注：旧仓名，现行等价路径为 asternova/web-client/public/godot/ | export_presets.cfg:11 同旧路径（配置不碰，仅文档注明） |

## ② 核对无误条目（抽要）

- **里程碑表述**：BLUEPRINT M0 ✅/M1+M2 并行、M2「Transport 未启动（scripts/ 无 transport 实现）」——`client-godot-v2/scripts/` 实测无 transport，与 CLAUDE.md 19 行一致。
- **client-godot 冻结**：冻结（2026-08-30）后仅 2 个提交且全部只动 README.md，零代码改动；FROZEN.md 引用的 ProtoParser.gd/BattleWsClient.gd/GameManager.gd/game.proto 全部实存。
- **紫色 spec 数据**：4 个 SHA-256 实测相符；全部路径存在；「15 单视图 + 5 交付板」「garment_fit 14 单视图」张数对上。
- **acceptance.md**：证据矩阵（skin_report/deformation_report/godot_report 等）逐项在盘，Walk 0.841m 等数值与报告交叉相符。
- **紫色/白色交接文件表**：blob `89ccf77`（45,664,637 字节）、`faec633`≡`5186377` 经 `git ls-tree/cat-file` 实测验证。
- **map_style 参考图**：31/31 张按文件名对上（14 CS2 + 13 ZZZ + 4 其它）。
- **Arcade 路由**：根 CLAUDE.md 五游戏列表与 `app/` 实际 page.tsx 完全一致（另有 /arena /lobby /login）。
- **web-client 工艺陈述**：npm 定源（仅 package-lock.json，.gitignore 防回归 pnpm）、dev.mjs/--webpack、rewrites、1366x768 设计分辨率均有实码。
- **CREDITS.md**：6 条目对应 .webp 全在。
- **backend 封存横幅、:8081、.env.example、local_{up,down,logs}.ps1、封存期四条检查**：全部属实。
- **bat 启动器**：4 个 bat 在盘；3 个指向仓内场景有效（「Demo 纯动作沙盒」指向仓外 scratch 目录，本机有效，未写入 README 推荐）。
- **AGENTS.md / STYLE.md / m2 spec / web-client-perf2-content.md / 白皮书四件 / CONTENT_BACKLOG / animation-source、models/source、sfx README**：无过期点（状态行均带日期锚定且与实况相符）。

## 发现但未改（待人工确认）

1. **`character-art-rework.md` / `-handoff.md` / `white/rework/README.md` 的「紫色尚未开始/白色确认前不进紫色」族表述（约 10 处）**——已被紫色 4 提交推翻，但这三个文件正被并行美术会话编辑（有未提交改动），本次跳过，避免冲突。
2. **backend 39.5MB `asternova-server` 编译二进制被 git 追踪**——资产问题非文档问题，建议人工决策是否移出 git。
3. **`client-godot/export_presets.cfg` 内旧仓名路径**——配置文件不碰，已在 README 注明。
4. **backend/docs/roadmap.md 进度停格在封存前**——文件头冻结横幅已声明「严禁据此推进」，不构成误导，不改。
5. **线上 URL（asterforge.top/game 等）可达性**——外部端点未验证。

## ③ 自评

- **覆盖**：全仓 62 份非 node_modules 说明文档全部过目；根级 2 + docs 层 8 + 美术区 8 + web/backend/render-lab/client 共 20 份完成修正，共 36 组过期点。
- **证据纪律**：每条修正对应磁盘/git 亲证；两份子代理报告的关键数字（张数、SHA、路径）经人工抽复验（render_previews 计数、socket 引用、project.godot features 均重跑命令确认）。
- **验收抽查 5 条可复现**：① 根 ci.yml 存在 ↔ CLAUDE.md 新表述；② .env* 实况 ↔ 两处 env 命令；③ street_environment 在/street_sunset 不在 ↔ README 两处；④ aster 预览 5 张 ↔ art/README；⑤ aster_rig.gd socket 引用 ↔ weapon.md「已落地」。全过。
- **风险**：白色线三份文档的紫色矛盾仍在（交由并行会话/人工）；aster.md 只加了导航注未改提示词数值（避免擅改设计存档）；docs 索引新增行的状态描述（如紫色 5/8）会随制作推进再次过期，属台账固有属性。
- **commit**：按红线跳过，本报告即交接凭证；建议随白色会话收尾时以 `docs: 全仓文档保鲜度修正 / repo-wide docs freshness fixes` 一并提交。
