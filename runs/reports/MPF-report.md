# MPF-report — my-portfolio 文档保鲜度审计与修复（Wave 8）

- 日期：2026-10-06
- 执行：文档保鲜度审计 Agent（MPF）
- 对象：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`（master @ b6101c1，工作区干净无他人改动）
- 产出：修正 4 份文档 24 处过期陈述，commit `41fd7ba`（docs 前缀，中英对照，husky lint-staged + commitlint 全过）

## ① 过期点清单

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---|---|---|---|
| 1 | README 概览 | 5 个项目"各有独立叙事详情页" | 4 个有详情页，AI 简历走外链（残骸 2026-09-22 清理） | `find src/app/projects -name page.tsx` 仅 4 静态页；删除提交 `4daf69d chore(projects): 清理简历详情页残骸`（2026-09-22） |
| 2 | README 特性表 | 项目详情页 ×5，`/projects/{game,resume,…}` | ×4，去 resume | 同上 |
| 3 | README 架构图 | "Next.js standalone (pnpm next start)" | "(node server.js)" | asterforge-deploy systemd 备份 `ExecStart=/usr/local/node20/bin/node …/.next/standalone/server.js` |
| 4 | README 技术栈表 | Prisma "9 个 model" | 14 个 | `grep -c "^model " prisma/schema.prisma` = 14（README 数据模型节本就写 14，自相矛盾已消除） |
| 5 | README 项目结构 | "5 静态详情页" | 4 静态详情页 | find 结果 4 静态 + [slug] |
| 6 | README 项目结构 | sections "13 个 section 组件" | 14 | `ls src/components/sections/` = 14 tsx（16 文件 − 2 module.css） |
| 7 | README 项目结构 | game-detail "11 组件" | 14 | `ls` = 14 文件 |
| 8 | README 项目结构 | mockups "11 个" | 12 | `ls` = 12 文件 |
| 9 | README 项目结构 | ui "30 个" | 34 | `ls` = 34 tsx（35 文件 − 1 module.css） |
| 10 | README 项目结构 | lib "30 个工具" | 34 | `ls src/lib/` = 34 |
| 11 | README 项目结构 | data "5 个项目详情 hardcode data" | 4 | `ls src/data/project-details/` = 4（game/genesis/interview/rag） |
| 12 | README 项目结构 | schema.prisma "9 个 model" | 14 | 同 #4 |
| 13 | README 路由表 | `/projects/resume` 整行（3600s） | 删除 | 路由不存在，请求将落 [slug] 动态段或 404 |
| 14 | README 路由注 | "静态段 projects/resume > 动态段，5 个静态详情页" | "静态段 projects/game 等，4 个" | 同 #1 |
| 15 | README 徽章 | "mobile 80+ / a11y 100" | "mobile 89 / LCP 2.5s" | A2 复测 Perf 89；a11y 100 无 2026-10 证据（见 #17） |
| 16 | README Lighthouse 表 | 标注"2026-10-03 A2 复测"却含 TBT ~60ms / CLS 0.008 / a11y·BP·SEO 100 / "此前 4-run 80~88 / LCP ~3.4s" | A2 可溯源数据：Perf 89（次轮 81）/ LCP 2.46–2.72s / TBT 0.27–0.53s / 桌面 98–99；pre 改"同日两轮 47–81 / 3.1–5.9s"；BP/SEO/CLS 标注 2026-07 后未复测待人工确认 | asterforge-deploy `perf-baselines/retests/RETEST-2026-10.md` 补充节：post 仅测 Perf/LCP/TBT/桌面；TBT 移动 270-527ms；"~60ms/0.008"全仓无出处 |
| 17 | README 可访问性段 | "Lighthouse a11y 满分 100" | 97（2026-10-03 基线；对比度项制作人拍板保持现状，A5 未做） | stage-2026-10-landing-perf.md：基线 A11y 97；验收标准"a11y 97→100（若做 A5）"，A5 已拍板不做 |
| 18 | CLAUDE.md 这是什么 | "5 个静态项目详情页" | 4 个（列名 game/interview/genesis/rag） | 同 #1 |
| 19 | CLAUDE.md 三层数据源 | "5 个项目详情 project-details/*.ts" | 4 个 | 同 #11 |
| 20 | CLAUDE.md 组件与数据流 | "主页 13 段" | 14 段 | 同 #6 |
| 21 | CLAUDE.md 路由优先级 | "5 个静态段（game/resume/…）" | 4 个，注明 resume 已清理走外链 | 同 #1 |
| 22 | DESIGN.md 星图装饰色四档 | starline-strong 0.07 / starline-mid 0.05 | 0.1 / 0.07 | `src/app/globals.css:145-146` |
| 23 | DESIGN.md z 令牌 | `--z-overlay:9998`（漏列两档） | `--z-modal:9998 / --z-modal-top:9999 / --z-admin-modal:10000` 补齐 | `globals.css:136-141`；与 motion.ts 顶部表镜像注释一致 |
| 24 | SKILL.md 部署原子操作注 | "服务器实际跑 `pnpm exec next start -p 3000`" | systemd unit ExecStart = `node …/.next/standalone/server.js`（standalone 产物） | 同 #3；README/package.json `start` 三处互证 |

## ② 核对无误条目（抽样可复现）

- **版本徽章/技术栈表**：Next 16.3.7 / React 19.2.4 / TS 5.9.3 / Tailwind 4.1.8 / Motion 12.15 / three 0.184 / lucide 0.511 / dnd-kit 6.3——package.json + pnpm-lock 逐一相符（Prisma 行 "6.9" 为 manifest semver 下限口径，实际装 6.19.3，范围内）
- **48 个 route handler**：`find src/app/api -name route.ts` = 48
- **8 章节叙事**：`home-chapters.ts` HOME_CHAPTERS 恰 8 章（INTRO…CONNECT），TechMarquee 为插曲不算章
- **20 份安装指南**：`ls public/config/guides/*.md` = 20；**"20+ 工具配置包"**：分发包实况 21 个 zip/exe
- **90+ 格式白名单**：`vault.ts` EXT_MAP 95 keys；**密码解锁 2h**：`vault-auth.ts:16 SESSION_TTL_MS = 2*60*60*1000`
- **admin 7 tab**：7 个 tab 组件 + AdminConsole 壳 + 辅助 Modal；**project-detail "30+"**：实况 33
- **部署事实链**：`scripts/deploy-portfolio-safe.sh` 存在；systemd unit（asterforge-deploy R54 巡检同步备份）验证端口 3000、路径 /home/ubuntu/my-portfolio、EnvironmentFile .env；`scripts/archive/README.md` 归档清单与"现行权威路径"表文件逐一存在
- **CLAUDE.md**：pnpm-workspace.yaml 仅 `packages: - .`（hub 不被吸收 ✓，hub/package-lock.json 存在即 npm ✓）；scripts 表与 package.json 一致；`tsconfig` 排除 hub 佐证"不碰它"
- **DESIGN.md 色板 13 项**与 globals.css 亮色定义全部一致（canvas/parchment/ink/ink-muted/ink-subtle/signal/signal-text/signal-solid/signal-on-dark/surface-band/page-dark/surface-band-card/hairline/genesis-accent）；圆角四档、ease/dur 曲线、starline-accent/faint 一致
- **rules.md**：令牌比值表、三层纪律、z 表（与 motion.ts 顶部表一致）；`--signal-hover` 确存（globals.css:48）
- **stage-2026-10-landing-perf.md**：§6 实施提交表 6 笔 hash（437349a/f62b13c/47b1c38/c28d74c/bad821f/635812f）与 git log 全部对上
- **hub/ 版本表述（重点项）**：hub 版本仅存于 `tauri.conf.json`（0.1.18），全部文档未硬编码版本号；17 篇 resources README 抽查 3 篇（claude-code/gh/uv）版本均为泛指命令输出，无过期风险（b2d2eac 已于近期回灌 7 篇 + 补 antigravity）
- **docs/CynosDB-初始化步骤.md**：为 asternova 后端（game_dev 库）操作快照，非本站数据库声明，与 SQLite 陈述不冲突 → 保留
- **ICP 备案号 / 域名 / 邮箱**：外部事实，本地不可核实，保留原样

**按快照性质豁免未改**：`docs/stages/*`（18 篇历史 Stage Spec）、`docs/2026-08-29-*`（升级报告/spec）、HANDOFF、guides-uplift-acceptance、`.claude/plans/*`、AUDIT.md——内容自带时点标注，属历史记录而非现状陈述。

## ③ 自评

- **覆盖度**：任务点名 3 份（README / DESIGN.md / ui-polish/rules.md）逐条核对完毕；CLAUDE.md、SKILL.md、config/archive README 同步全查；stages 与验收报告按历史快照豁免；hub resources 抽查 3/17。最大发现是 resume 详情页删除（4daf69d，2026-09-22）后 README/CLAUDE 连带 6 处未回灌，以及 Lighthouse 表把无出处数据（TBT ~60ms/CLS 0.008/a11y 100）挂在 A2 复测名下。
- **证据纪律**：24 处修正每条对应命令输出 / git 提交 / 权威配置备份；asterforge-deploy 仓仅只读核实，未做任何修改。
- **保守取舍**：Lighthouse 表收窄为可溯源数据并显式标注"待人工确认"（BP/SEO/CLS 自 2026-07 后未复测），宁可信息量下降也不保留无据数字——符合"不虚构"红线。
- **遗留待人工确认**：① BP/SEO/CLS 建议跑一轮线上复测回填；② `public/og-resume.png` 已无代码引用（资产残骸，超出本次 .md 红线，建议代码侧评估清理）；③ hub resources 剩余 14 篇未逐篇深查。
- **提交**：`41fd7ba docs: 修正过期陈述——详情页数/计数/Lighthouse/令牌 / fix stale doc claims`（4 文件 +44/−45，含 lint-staged prettier 表格重排；首次提交因 header 超 100 字符被 commitlint 拒绝，压缩后通过）。
