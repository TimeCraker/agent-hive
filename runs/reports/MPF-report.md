# MPF 结果报告

> 任务：my-portfolio 文档审计与清理（2026-10-05）· 范围：仓内全部 86 篇 git 追踪 Markdown · 红线遵守：只动 *.md、未 push、未跑 install/build

## 结论一句话

86 篇文档中 6 篇完全过期已删除（旧阿里云部署文档 ×2、他仓错位计划 ×3、UTF-16 损坏空文 ×1），README/CLAUDE/SKILL/archive 共 21 处过期信息已就地更正，hub 侧 7 篇未回灌的指南镜像已同步 + 1 篇缺失补齐，其余判定健康；3 个独立 commit，工作区收尾干净。

## 文档清单判定表（全量 86 篇，路径|主题|判定|处置）

### 根与 docs/ 根（13 篇）

| 路径 | 主题 | 判定 | 处置 |
| --- | --- | --- | --- |
| README.md | 权威总览 | 过期（详情页 ×4 漏 rag、缺 /config 与 hub、admin 5 tab、model 9、API 25、npm install、Lighthouse 旧值、Lenis 死依赖、env 缺 2 项） | 已更正 4ec32ab |
| CLAUDE.md | Agent 指引 | 过期（stages 写死 5 个实际 19、引用已删的 DEPLOY/FRESH_INSTALL） | 已更正 aefb499+4ec32ab |
| docs/DEPLOY.md | 阿里云 Docker 部署指南 | **完全过期**（阿里云+docker compose+cursoruse.pem+`NEXT_PUBLIC_ADMIN_PASSWORD` 暴露密码反模式+一次性 Cursor 排障；现权威为 SKILL.md+asterforge-deploy 仓） | **已删除** aefb499 |
| docs/FRESH_INSTALL.md | 旧服务器从零部署 | **完全过期**（/home/admin 旧机、阿里云 deploy key、deploy-light Docker 形态、旧 game 仓库；冷启动权威=asterforge-deploy COLD-START） | **已删除** aefb499 |
| docs/DESIGN.md | 星图制图台视觉单一事实源（更新至 09-30） | 健康 | 留 |
| docs/HANDOFF-vault-phase2.md | vault 二期交接（2026-08-21） | 一次性使命终结（stage 17/17 全勾），但第 2 章「架构铁律」（三级 token/next.config 覆盖/pagehide beacon）有长期价值 | 留·建议人工复核 |
| docs/CynosDB-初始化步骤.md | 游戏后端 CynosDB MySQL 初始化 | 过期+错位（服务已封存、「Resume 在阿里云」失实、属 games 域不属本仓） | 留·建议人工复核 |
| docs/2026-08-29-nextjs16-upgrade-spec.md | Next16 升级 spec | 健康（历史留痕，配对 report） | 留 |
| docs/2026-08-29-nextjs16-upgrade-report.md | 升级验收报告（版本对照+坑） | 健康（知识沉淀） | 留 |
| docs/2026-08-29-guides-uplift-zcode-spec.md | 指南扩写 spec（含 GuideModal 白名单） | 健康（历史留痕，配对 acceptance） | 留 |
| docs/guides-uplift-acceptance.md | 扩写验收留痕（脚本行号事实源） | 健康 | 留 |
| docs/ui-polish/AUDIT.md | 永续 UI 审计台账 | 健康（活跃） | 留 |
| docs/ui-polish/rules.md | UI 规则台账（DESIGN.md 唯一登记处） | 健康 | 留 |

### docs/stages/（19 篇，仓库惯例保留的历史 spec）

| 路径 | 主题 | 判定 | 处置 |
| --- | --- | --- | --- |
| stage-2026-07-brand-presence.md | 品牌存在感 | 健康（历史） | 留 |
| stage-2026-07-cinematic-visual-upgrade.md | 电影感视觉升级 | 健康（已完成） | 留 |
| stage-2026-07-portfolio-refinement.md | 主站精修 | 健康（历史） | 留 |
| stage-2026-07-timecraker-master-mark.md | 品牌标记 | 健康（历史） | 留 |
| stage-2026-07-visual-universe-rebuild.md | 视觉宇宙重建 | 状态行挂起（[~] 进行中，后续 spec 已实际接棒） | 留·建议人工复核（收尾状态行） |
| stage-2026-08-cloud-vault.md | vault 一期立项 | 状态行挂起（「待确认」，实际已上线） | 留·建议人工复核 |
| stage-2026-08-config-wave2.md | /config 第二波 | 健康（历史） | 留 |
| stage-2026-08-homepage-polish.md | 主页暗色修复 | 健康（历史） | 留 |
| stage-2026-08-project-pages-redesign.md | 详情页改版 | 健康（历史） | 留 |
| stage-2026-08-site-uplift.md | 站点升级批 | 健康（历史） | 留 |
| stage-2026-08-tool-config-center.md | /config 中心本体 | 健康（历史） | 留 |
| stage-2026-08-tool-config-upgrade.md | Hub exe+指南弹层 | 健康（历史） | 留 |
| stage-2026-08-vault-folders.md | vault 文件夹 | 健康（历史） | 留 |
| stage-2026-08-vault-phase2.md | vault 二期（17/17 全勾） | 健康（已完成） | 留 |
| stage-2026-08-vault-ux-polish.md | vault 30 项 UX | 健康（历史） | 留 |
| stage-2026-09-art-upgrade.md | 美术 S0-S9 | 健康（已完成） | 留 |
| stage-2026-09-art-upgrade-2.md | 显影轮 T1-T6 | 健康（已完成） | 留 |
| stage-2026-09-tail-features.md | 小尾巴 4 项+新功能 | 健康（历史） | 留 |
| stage-2026-10-landing-perf.md | 落地页性能（当日活跃） | 健康 | 留 |

### skills / plans（15 篇）

| 路径 | 主题 | 判定 | 处置 |
| --- | --- | --- | --- |
| .agents/skills/my-portfolio/SKILL.md | 运维单一真相源 | 过期（「npm（本地）」、两处「npm ci」，服务器实况 pnpm install --frozen-lockfile） | 已更正 4ec32ab |
| .agents/skills/add-tool-config/SKILL.md | 新增工具流程 | 过期（指南模板仍四段，08-29 已落地五段骨架） | 留·建议人工复核（与 .claude 双份联动） |
| .claude/skills/add-tool-config/SKILL.md | 同上（与 .agents 逐字节双份） | 同上 | 同上 |
| .claude/skills/avant-garde-design/SKILL.md | 前卫设计禁忌 | 健康 | 留 |
| .claude/skills/avant-garde-design/RULES.md | 配套验证规则 | 健康 | 留 |
| .claude/skills/awwwards-3d.md | 3D 方法论 | 健康 | 留 |
| .claude/skills/cinematic-frontend/SKILL.md | 电影感方法论 | 健康（版本声明 Next 15 为 skill 锁定口径，不改） | 留 |
| .claude/skills/cinematic-frontend/CHECKLIST.md | 配套清单 | 健康 | 留 |
| .claude/skills/cinematic-frontend/MOTION-RECIPES.md | 动效配方 | 健康 | 留 |
| .claude/skills/cinematic-frontend/PITFALLS.md | 坑清单 | 健康 | 留 |
| .claude/skills/three/SKILL.md | Three.js 方法论 | 健康 | 留 |
| .claude/plans/detail-scroll-layout-fix.md | 详情页滚动修复方案 | 一次性已实施（Lenis 已移除获代码证实） | 留·建议人工复核（是否留痕） |
| .cursor/plans/写完_9_个_stage_spec_1eb6f8bf.plan.md | ResumeAIX 仓规划 | **完全过期+错位**（规划对象是 ResumeAIX/docx/stages） | **已删除** aefb499 |
| .cursor/plans/商业矩阵开源复用规划_86813991.plan.md | ResumeAIX 矩阵规划 | **完全过期+错位**（同上） | **已删除** aefb499 |
| .cursor/plans/封板落地收尾_d2f09f5c.plan.md | 6 月封板收尾 | **完全过期**（引用已消失的 deploy-artifacts、旧部署形态） | **已删除** aefb499 |

### hub / public / scripts（38 篇）

| 路径 | 主题 | 判定 | 处置 |
| --- | --- | --- | --- |
| hub/src-tauri/resources/{dbeaver,steam,chrome,nanazip,vlc,terminal,git}/README.md ×7 | Hub 内嵌指南镜像 | **过期**（停在 08-14~08-17 快照，08-29 五段重写未回灌；engine.rs 契约与主站同源） | **已同步** b2d2eac（cmp 逐字节一致） |
| hub/src-tauri/resources/antigravity/README.md | （原缺失） | **结构缺陷**（descriptor 已注册+脚本在库，缺 README 致 Hub 指南面板空） | **已补齐** b2d2eac |
| hub/src-tauri/resources/{claude-code,dsh,docker,gh,pi,uv,volume-keys,vscode,wsl}/README.md ×9 | Hub 内嵌指南镜像 | 健康（与 guides 逐字节相同） | 留 |
| public/config/README.md | 分发包目录约定 | 健康 | 留 |
| public/config/guides/ 20 篇（vscode-install/wsl/antigravity/vlc/uu-remote/terminal-config/steam-install/nanazip/git-config/dbeaver-install/chrome-install/volume-keys/uv/github-cli/docker-desktop/hibit-uninstaller/deepseek-harness/pi/claude-code/clash） | 站点安装指南 | 健康（20 slug 全被 tool-configs.ts 引用，无孤儿无重复） | 留（clash/claude-code/pi 星号语法遗留见复核） |
| public/game-assets/README.md | （UTF-16 损坏） | **完全过期**（编码损坏，内容仅一行目录名零信息量） | **已删除** aefb499 |
| scripts/archive/README.md | 退役脚本归档说明 | 引用悬空（表引用已删的 DEPLOY/FRESH_INSTALL） | 已更正 aefb499 |

## 已执行处置与提交

| commit | 类型 | 改动摘要 |
| --- | --- | --- |
| aefb499 | docs: 删除 | 6 文件 -1728 行：DEPLOY.md、FRESH_INSTALL.md、.cursor/plans ×3、game-assets/README；同步修复 CLAUDE.md/README.md/scripts/archive/README.md 三处引用 |
| 4ec32ab | docs: 更正 | README 15 处（×5 详情页、/config+vault+hub 补全、7 tab、model 14、API 48、pnpm、Lighthouse Perf 89/LCP ~2.5s、删 Lenis 行、env +2）、CLAUDE stages 去写死、SKILL pnpm 实况 ×3 |
| b2d2eac | docs(hub): 同步 | 7 篇 README 回灌 + antigravity 新增（+406 -76），提交前后两轮 cmp 校验 8 对全部与 guides 逐字节一致 |

验证：`git status --porcelain` 收尾为空（对比初始快照仅多上述已提交文档改动）；`git log --oneline -5` 见 3 个 docs 提交；未 push、未触碰任何非 md 文件。

## 建议人工复核

1. **docs/HANDOFF-vault-phase2.md**：交接使命已终结，建议把第 2 章「架构铁律」（vault 三级 token 前缀隔离、next.config headers 覆盖、pagehide beacon、FALLBACK）迁入 SKILL.md 或 DESIGN.md 后删除全文。
2. **docs/CynosDB-初始化步骤.md**：游戏后端已封存且属 games 域，建议迁至 games/asternova 或 asterforge-deploy 仓，或确认 CynosDB 集群退役后删除。
3. **add-tool-config SKILL（.claude+.agents 双份）**：指南模板仍是旧四段，与 08-29 落地的五段骨架（多「包里有什么」「卸载与回滚」）脱节，需拍板新模板口径后两份同步改。
4. **guides 星号语法遗留**：clash.md（10 处）、claude-code.md（11 处）、pi.md（1 处）含 GuideModal 不支持的 `**粗体**`（星号原样露出）；pi.md 版本硬编码 0.82.0。
5. **两篇 stage 状态行挂起**：stage-2026-07-visual-universe-rebuild（[~] 进行中）、stage-2026-08-cloud-vault（待确认）实际均已被后续工作接棒/上线，建议补收尾状态。
6. **scripts/deploy.sh 与 nginx-site.conf**：原引用方（DEPLOY/FRESH_INSTALL）已删，二者现无文档引用（deploy.sh 自述仍为阿里云 Docker），建议评估移入 scripts/archive/（动脚本超出本次只动 md 的红线，未处理）。
7. **.claude/plans/detail-scroll-layout-fix.md**：一次性修复方案已实施（代码证实 Lenis 已移除），留痕价值低，可删可留。
8. **hub 双端同步无脚本保障**：本次人工回灌后，clash/hibit-uninstaller/uu-remote 三个 web-only 工具刻意不在 hub（descriptor 未注册，非缺陷）；建议后续在 add-tool-config SKILL 或 hub 构建流程加同步校验，防再次分叉。

## 自评

**达标**。理由：报告五段结构完整写入指定路径；3 个 docs 类 commit 可见于 `git log`（删除/更正/同步三类各自独立可回滚）；`git status` 与初始快照对比无越界改动（只动 *.md、未 push、未装依赖）；全量 86 篇逐篇判定有据（每处更正均先以代码/脚本/目录现状核实，如 admin 7 tab、model 14、路由 48、pnpm install 实况、guides 双端 git 历史取证）；不确定项全部保守保留并列 8 条人工复核，未发生误删。
