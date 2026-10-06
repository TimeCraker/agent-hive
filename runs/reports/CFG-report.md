# CFG 报告：config 文档保鲜度审计与修复（Wave 8）

- **执行日期**：2026-10-06
- **范围**：`my_workspace/config/` 下 7 个子仓库全部 13 个说明性 .md 文档
- **结果**：发现并修正 **14 处过期/缺失**，5 仓各 1 个 docs commit；7 仓工作区收尾全部干净；未 push

---

## ① 过期点清单

| # | 仓库 | 文档位置 | 改前 | 改后 | 证据 |
|---|------|---------|------|------|------|
| 1 | codex-dotfiles | README.md · 仓库内容表 | `auth.json` = 「ChatGPT 登录认证备份（私有仓库）」 | 仅本地文件，`.gitignore` 忽略，不随 Git 分发 | `git ls-files` 无 auth.json（复跑 [4] 输出 none）；.gitignore 末行显式 `auth.json`；commit `378aba8` untrack |
| 2 | codex-dotfiles | README.md · 开头段/同步范围/新电脑部署/认证段 | 「私有仓库会同步 auth.json 跨机复用登录态」「按需使用仓库中的 auth.json」 | sync.mjs 仅在本机 ~/.codex ↔ 仓库工作目录间搬运；新机用 `codex login`；跨机迁移须自行安全传输 | `scripts/sync.mjs:25` 仍有映射，但文件被 ignore → clone 后不存在，跨机复用实际已断 |
| 3 | cursor-dotfiles | README.md · 说明 | 「**公开仓库**」 | 「**私有仓库**」 | `gh repo view TimeCraker/cursor-dotfiles` → `PRIVATE`（复跑 [2]） |
| 4 | cursor-dotfiles | README.md · 仓库内容表 | 缺 `_update_editor_font_settings.py` | 补一行（字体设置 Python 主路径，`_common.ps1` 回退） | `scripts/` 实存 6 文件，README 只列 5 |
| 5 | mimo-llm-proxy | README.md · DSH 接入段 | 「真正生效的配置在 `~/.dsh/settings.yaml`」 | provider 声明在工作区 `config/dsh-config/settings.yaml`；`~/.dsh` 现无 settings.yaml（仅 .imported 残留），活配置落位**待人工确认** | `ls ~/.dsh`：无 settings.yaml；dsh-config/settings.yaml:97 有「MiMo Desktop 免费额度」 |
| 6 | mimo-llm-proxy | README.md · 文件表 | 缺 switch-to-xiaomimimo-desktop.bat/.ps1 | 补一行（Claude Code 一键切换脚本） | `git ls-files` 两文件被追踪；`~/.claude/cc-toolkit/switches/` 实存部署副本 |
| 7 | mimo-llm-proxy | README.md · 注意事项 | 「cookies.txt 与 device_id 永不提交进 git」（与自身「原理」第 5 条矛盾） | cookies/device_id.txt/usage.json/proxy.log 已忽略；**device_id 现写死在被追踪的 config.json 内**，仓库无远端未 push，首次 push 前须移出或轮换 | config.json 含 device_id（35 字符，脱敏核实）且在 `git ls-files`；`git remote -v` 为空 |
| 8 | dsh-config | README.md · 定位段 + badge | 「`~/.dsh` 本体就是 Git 工作树」「dsh 启动时直接读取工作树中的 settings.yaml」；badge `0.1.2-alpha.4` | 工作区独立仓库为配置基线，`~/.dsh` 是运行时目录、**非** Git 工作树；badge `0.1.5-rc.3` | `ls ~/.dsh/.git` → 不存在（复跑 [1]）；`dsh --version` = 0.1.5-rc.3（复跑 [3]） |
| 9 | dsh-config | README.md · 日常同步 / 修改后验证 | `git -C "$env:USERPROFILE\.dsh" add/commit/push`；验证 `~/.dsh/settings.yaml` 语法 | git 指向工作区仓库路径；验证仓库内 settings.yaml；注明活配置手动对齐 + 落位待人工确认 | 同 #8；仓库 `git ls-files` 含 settings.yaml（yaml.safe_load 复验 OK） |
| 10 | dsh-config | docs/SETUP-NEW-MACHINE.md · 第 4 步 | 安装/验收 `0.1.2-alpha.4`；「latest=0.1.1-rc.2」 | `0.1.5-rc.3`（与主力机一致）；渠道说明更新为 latest=0.2.0-rc.2、alpha=0.2.1-alpha.1（0.2.x 未验证） | `dsh --version`；`npm view @deepseek-ai/dsh dist-tags` 实查（2026-10-06） |
| 11 | dsh-config | docs/SETUP-NEW-MACHINE.md · 验收清单 | 千帆含「4 个模型」 | 6 个模型（+GLM-5.3、DeepSeek-V4.1-Flash），注明以 settings.yaml 为准 | settings.yaml `qianfan-tokenplan` 实数 6 个模型 id |
| 12 | dsh-config | docs/SETUP-NEW-MACHINE.md · 已知坑 | 「套餐里**没有** glm-5.3，加了报 model_not_supported」 | 该坑已过时（套餐现含 glm-5.3/flash），改写为现状 | settings.yaml 配有 glm-5.3；README 侧同坑已被 commit `ae22348` 删除，此处是漏删 |
| 13 | pi-config | README.md · 验证基线 / 本地扩展 / 主要文件表 | 基线 Pi 0.82.0；扩展段只讲 volcengine-glm + **permission-gate.ts（已不存在）** + notify.ts | 基线 0.84.2（隔离回归全过）；扩展段对齐实存 4 文件：volcengine-glm / baidu-glm / volcengine-coding / notify.ts；文件表删 permission-gate.ts、补 2 个新 provider | `pi --version` = 0.84.2；`ls extensions/`（复跑 [5]）无 permission-gate.ts；commit `f48429e` 关闭该扩展后文件已删 |
| 14 | pi-config | README.md · 新设备初始化第 2 步 | 只提 `ARK_API_KEY` | 补 `QIANFAN_API_KEY`、`VOLCENGINE_CODING_API_KEY` 的 setx 说明 | 两个新扩展头部注释明确 key 依赖；settings.json extensions 加载 3 个 mjs |

### Commit 清单（均只含 .md，Conventional Commits 中英对照）

| 仓库 | commit | 文件 |
|------|--------|------|
| codex-dotfiles | `41240fa` | README.md |
| cursor-dotfiles | `d099181` | README.md |
| mimo-llm-proxy | `861c546` | README.md |
| dsh-config | `a4098e4` | README.md + docs/SETUP-NEW-MACHINE.md |
| pi-config | `0720e80` | README.md |

---

## ② 核对无误条目（抽查可复现）

| 仓库 | 条目 | 核对方式 |
|------|------|---------|
| antigravity-config | README 技能清单 7 项、hooks enabled:false、MCP 仅 playwright+context7、`~/.gemini/config/` 映射、sync.mjs / auto-turbo-watcher.ps1 存在 | `ls skills/` 逐项比对；cat hooks.json / mcp_config.json；ls ~/.gemini/config |
| dsh-claude-import | README 架构段全部文件（lib 4 js、tests、scripts/gui-verify.cjs、docs/social-preview.png） | 逐文件 ls 实存 |
| mimo-llm-proxy | 端点 5 条、模型别名映射（auto/pro→v2.6-pro、flash→v2.6-flash）、X-Client-Version 兜底 26.923.232338、MIMO_PROXY_TOKEN=mimo-proxy 已 setx、cc-toolkit switch 脚本存在 | proxy.py:76-92/266/985/1015 grep；PowerShell 读 User 级环境变量；ls ~/.claude/cc-toolkit/switches |
| pi-config | LSP 5 路由（biome/ty/ruff/bash/yaml）、「audit 要求 ARK_API_KEY」、AGENTS.md、sync/test.sh 隔离性声明 | pi-lsp.json 全量解析；sync.sh:339-342 只查 ARK_API_KEY；test.sh 头部 mktemp 隔离确认后实跑 ALL PASS |
| cursor-dotfiles | 「当前扩展」12 项与 extensions.txt 全覆盖、autoDetectColorScheme:true、fontLigatures:true、AGENTS.md 文件说明、踩坑表 | cat extensions.txt / settings.json 逐项比对 |
| codex-dotfiles | 3 个 skill 白名单、5 可移植 MCP（context7/fetch/filesystem/pdf/playwright） | `find skills -maxdepth 2`；grep config.toml |
| 通用 | GEMINI.md、pi AGENTS.md、cursor-agent-preferences.md、prompts/windows-cleanup.md 为规则/模板类文档，无可失效的仓库事实陈述 | 通读判断 |

### 验收抽查 5 条（全部通过，命令可复现）

1. `ls ~/.dsh/.git` → No such file or directory（支撑 #8/#9）
2. `gh repo view TimeCraker/cursor-dotfiles --json visibility -q .visibility` → PRIVATE（支撑 #3）
3. `dsh --version` → 0.1.5-rc.3（支撑 #8/#10）
4. `git -C config/codex-dotfiles ls-files | grep auth` → 无输出（支撑 #1/#2）
5. `ls config/pi-config/extensions` → baidu-glm.mjs / notify.ts / volcengine-coding.mjs / volcengine-glm.mjs，无 permission-gate.ts（支撑 #13/#14）

---

## ③ 自评

**完成度**：7 仓 13 个 .md 全部通读；14 处过期修正落地为 5 个 docs commit；7 仓收尾 `git status --short` 均为 0 脏文件；未 push（遵守红线）。

**做得好的**：
- 每条修正都有第一手命令证据（git ls-files / ls / gh / npm view / 版本号实跑），无一虚构；
- 修正顺带闭环验证：dsh-config settings.yaml 语法复验、pi sync/test.sh 隔离回归实跑 ALL PASS 后才升基线；
- 红线遵守：只动 .md（5 个 commit 均只含 README/SETUP 文档）、未碰工作区根 CLAUDE.md/AGENTS.md、未碰其他仓库、未改历史未 push。

**待人工确认（4 项，已写入对应文档）**：
1. DSH 0.1.5 活配置落位：`~/.dsh/settings.yaml` 不存在、仅 `.imported` 残留，provider 实际读取路径需用户确认（涉及 #5/#9）；
2. dsh-config 活配置 ↔ 仓库的手动对齐是否已有固定新流程（README 现按「手动拷贝」如实描述）；
3. SETUP-NEW-MACHINE 第 5 步 Copy-Item 到 `~/.dsh/settings.yaml` 在 0.1.5 下是否仍是正确落位（与待确认 1 同源）；
4. cursor-dotfiles「公开仓库」→ PRIVATE：若当初是有意转私有则文档已修对；若本意公开需用户自行改 GitHub 可见性设置。

**风险提示**：mimo-llm-proxy 的 device_id 现随被追踪的 config.json 存于本地仓库（#7）。该仓无远端、从未 push，无泄露面；但**首次 push 前必须先把 device_id 移出 config.json 或轮换**——文档已改为如实警示（与工作区 CLAUDE.md「首次 push 前须轮换 token」口径一致）。
