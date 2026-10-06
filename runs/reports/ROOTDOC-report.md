# ROOTDOC · 工作区根文档一致性审计报告

- **日期**：2026-10-06
- **范围**：`my_workspace/CLAUDE.md` + `my_workspace/AGENTS.md`（仅此两文件被修改）
- **方法**：逐行摘出可验证陈述 → 实地核对（目录列举、`git remote`、manifest 依赖、子仓文档原文、`gh repo view`（走代理 7897）、线上 URL 一次性 GET）→ 过期当场改写

---

## 一、修正清单（12 处修正点，已全部落地）

### CLAUDE.md（8 处）

| # | 位置 | 原陈述 | 实况证据 | 修正后 |
|---|---|---|---|---|
| C1 | 项目地图 ResumeAIX 行 | 「**功能冻结**，只修 Bug / 接正式支付」 | 子仓 `ResumeAIX/CLAUDE.md`「当前状态」：**legacy 线冻结 + design 线（Stage 15 起）活跃，全站免费**；git log 近 12 条为 Stage27 生产发布、fix(tcoin) 等活跃提交 | 「legacy 简历线冻结只修 Bug；design 重构线（Stage 15 起）与面试模拟器活跃；**全站免费**（T-Coin 积分）；现处 Stage27 生产收尾」 |
| C2 | L11 子仓指引句 | 「ResumeAIX/、lekao/、xiaofanzhuo/ 已有自己的 CLAUDE.md / AGENTS.md」 | lekao 实际**无 AGENTS.md**（仅 CLAUDE.md）；agent-hive 反而只有 AGENTS.md | 精确列举：ResumeAIX、xiaofanzhuo 两者齐备；lekao、my-portfolio、games、vibe-studio 为 CLAUDE.md；agent-hive 为 AGENTS.md |
| C3 | 项目地图 lekao 行自带指引 | 「README + CHANGELOG」 | 仓库根有 `CLAUDE.md` | 「README + CHANGELOG + CLAUDE.md」 |
| C4 | 项目地图 my-portfolio 行自带指引 | 「README + DEPLOY.md」 | **DEPLOY.md 不存在**（全仓 find 仅 `scripts/deploy*.sh`；docs/ 亦无）；实际有 CLAUDE.md + docs/ | 「README + CLAUDE.md + docs/」 |
| C5 | 项目地图 games 行 | 「…render-lab / art（美术管线）、**scratch（实验场）**」 | `games/` 与 `games/asternova/` 均无 scratch 目录 | 删除 scratch 项 |
| C6 | 项目地图 | （缺行）`stage27-prod-regression/` 存在于根目录但地图未收录 | 非 git 仓；package.json = playwright 1.63；含 stage1-login ~ stage6 等真机流程脚本 + evidence/ + `auth.json`（凭证） | 新增一行：ResumeAIX Stage27 生产回归脚本工作区（标注非 git 仓、凭证勿提交/外传） |
| C7 | 远端说明 | 只标注 ResuAIX 例外 | `git remote` 实名 `TimeCraker/Lekao.git`（大写 L），`gh repo view` 确认 | 补「lekao → TimeCraker/Lekao（大写 L）」 |
| C8 | 归档段 | ①「另有 `archive/Rag-Enterprise-Knowledge-Base/`（RAG Demo 全量）」②sex.md 未列入批次 ③「每个 .md 是锚点」 | ①**该本地目录不存在**（archive/ 仅 11 个 .md，全工作区 find 无 RAG 目录）；`gh repo view` 确认 GitHub 私有仓 `TimeCraker/Rag-Enterprise-Knowledge-Base` 仍在（2026-08-04 止）②`archive/sex.md` 为 2026-08-22 同批第 9 项（sex 旧区 → github.com/TimeCraker/sex）③`audit-2026-09-30.md` 是审计报告非项目锚点 | ①改「本地无副本，仅余 GitHub 私有备份仓」②批次清单补 sex ③加 audit 例外说明 |

### AGENTS.md（4 处）

| # | 位置 | 原陈述 | 实况证据 | 修正后 |
|---|---|---|---|---|
| A1 | ResumeAIX 边界 | 「功能冻结，只修 Bug 和接正式支付」 | 同 C1 | 同 C1（同步改写） |
| A2 | lekao 边界 | 未标远端实名 | 同 C7 | 补「GitHub 仓实名 TimeCraker/Lekao（大写 L）」 |
| A3 | vibe-studio 边界 | 「三平台**自动投稿**」 | `skills/publish/SKILL.md`：B 站/抖音/小红书三端，但「人机分工是硬约束：你登录、你点发布，脚本只填表」 | 「B 站/抖音/小红书三平台投稿填表——人点发布、脚本只填表」 |
| A4 | RAG 条目 | 「已下线归档」 | 同 C8①——本地无归档副本 | 「已下线；本地 archive/ 无副本，仅余 GitHub 私有备份仓」 |

---

## 二、归属矛盾裁决：video-script-workflow

**裁决结论：独立私有仓，两份根文档现有表述正确，无需改动。**

依据（实地）：
1. `video-script-workflow/` 是独立 git 仓，remote = `github.com/TimeCraker/video-script-workflow`
2. `gh repo view`（经代理）确认该仓存在且 **PRIVATE**
3. `vibe-studio/` 全目录 grep（含全部 .md）**无任何**「并入 vibe-studio」的归属声明
4. 子仓 `agent.md` 与根文档「角色档案 → 大纲 → 分镜 → 提示词 + 本地阅读器」描述吻合（agent.md 提及阅读器 4 处；目录实有 `阅读器/`、`视频生成器/`、characters/、stories/）

「两种说法」的矛盾源应为历史会话记忆或旧版文档残留，当前根文档层面不存在冲突。

---

## 三、核对无误条目（抽样证据）

| 条目 | 证据 |
|---|---|
| 项目地图 12 个子目录全部实存，除 sex-workspace 外均为 git 仓 | 逐目录 `git rev-parse`；sex-workspace 设计即非 git 仓，活跃区 `sex2/` 为独立私有仓（remote = TimeCraker/sex2 ✓） |
| pwa-hw-voice「纯本地仓库、未启动、仅归档协议」 | git 仓**无 remote** ✓；README 首屏「当前状态：未启动」✓ |
| agent-hive 全部声明 | 太木（AGENTS.md/index.html/server.mjs）、珊瑚底印章（docs/design.md）、双模型路由 glm-5.3/flash、stream-json、验收状态机 reported→accepted/rejected（终态只出自验收）、`--resume` 续派、`?wave=<n>`、`HIVE_MAX_CONCURRENT` 默认 4、`node app/server.mjs`——逐一在子仓 README/AGENTS.md/代码实证 |
| coding-plan-bench 三端 + 已上线 | `wrangler.toml` + `src-tauri/` + `engine/`（+bench/）✓；https://coding-plan-bench.pages.dev → HTTP 200 ✓ |
| vibe-studio「7 个 skill」 | `skills/` 恰好 7 个：auto-subtitle / humanizer / narration / ppt / publish / video-motion / web-capture ✓ |
| lekao 技术栈 + 免费模式 + 在线 | next 16.3.7 / prisma 6.19 / next-auth 4 / ioredis 5 / husky 9 + `.github/workflows/ci.yml` ✓；README「T-Coin 体系（免费）：不付费、不充值」✓；lekao.asterforge.top → 200 ✓ |
| xiaofanzhuo 技术栈 + 上线 + 支付模式 | next 16.3.7 / prisma 6.19 / `provider = "sqlite"` ✓；docs/{BRD,PRD,DEPLOY,CHECKLIST-DEVICE}.md 全在 ✓；xiaofanzhuo.asterforge.top → 200 ✓；README「无在线支付，收款走微信私信 + 订单快照」✓ |
| my-portfolio 技术栈 | next 16 / tailwind 4 / three 0.184 / prisma 6 / Dockerfile ✓ |
| ResumeAIX 技术栈 | pnpm-workspace.yaml + turbo 2.4.4 + react 19.2.4；apps/{web,ai-service,export-service,interview-helper,interview-audio}，fastify 命中 3 个服务 package.json ✓ |
| games/asternova 架构声明 | backend README「⚠️ 封存状态声明（2026-09-30）」「现行权威架构为房主权威」✓；client-godot FROZEN.md「不再开发」✓；client-godot-v2「M2 主力开发中」✓；asternova/AGENTS.md 存在 ✓ |
| asterforge-deploy | scripts/{backup,deploy,diagnose,monitor,remote-update,sync,verify} 七件套 + ssh-keys/ ✓ |
| config/ 清单 | 实际 7 子目录与文档完全一致：antigravity-config / codex-dotfiles / cursor-dotfiles / pi-config / dsh-config / dsh-claude-import / mimo-llm-proxy ✓ |
| cc-toolkit 表述 | 与记忆及 `~/.claude/cc-toolkit` 活跃事实一致（未动子仓） |
| archive/ 锚点存在性 | 2026-08-22 批次 8 项 + claude-code-config 均有对应 .md 文件 ✓（sex.md 补列后 9 项） |
| 线上域名 | lekao / xiaofanzhuo / coding-plan-bench.pages.dev / asterforge.top 四 URL 全部 HTTP 200 ✓ |

---

## 四、待人工确认（不虚构、未擅改）

1. **`stage27-prod-regression/` 去留**：已按实况收录进项目地图（C6）。若它是用完即弃的临时回归工作区，删除目录时应同步移除该行；其内 `auth.json` 为生产凭证，建议尽早清理或移入忽略清单。
2. **根目录散落文件**：`bad-cues.mjs`、`ok-cues.mjs`（2026-10-05）与隐藏目录 `.ai-delivery-artifacts/`（coding-plan-bench 交付工件）不在两文档陈述范围内，未处理；是否清理由用户定夺。
3. **ResumeAIX 支付去向**：PRD 愿景仍写「微信/支付宝支付」（目标市场条目），但当前状态明确「全站免费」。本次以子仓 CLAUDE.md + git 活动为准移除了「接正式支付」；若近期确有接支付计划，定位行需再调。

---

## 五、自评

- **覆盖度**：项目地图 13 行（原 12 + 新增 1）逐行实地核对；config/ 7 目录逐一比对；archive/ 11 个文件全查；15 个 git 远端核对（gh 在线实证 3 个关键仓）；4 个线上 URL 实测。
- **修正量**：12 处修正点（CLAUDE.md 8 + AGENTS.md 4），全部有实地证据支撑，无凭记忆改写。
- **红线遵守**：仅修改根 CLAUDE.md 与 AGENTS.md 两个文件；未碰任何子仓；根目录非 git 仓未做 commit。
- **局限**：①xiaofanzhuo「2026-08-23 HTTPS 验收全绿、2026-08-28 微信真机复验」为历史事件，只能验证文档记载存在 + 当下线上 200，无法重放当日验收；②agent-hive「珊瑚底与主站色板同源」未逐色号比对，以 design.md 明确记载「珊瑚」「印章」视为成立；③gh 查询经代理完成，若代理状态不同结果或有差异。
