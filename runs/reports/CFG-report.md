# CFG 结果报告

## 结论一句话

7 个子仓共盘点约 90 篇 Markdown（说明文档 20 篇逐篇通读 + skills 功能内容 70 篇核对），确认 4 类问题并处置 3 仓（antigravity-config 过期引用+清单缺项、codex-dotfiles 过期路径、mimo-llm-proxy 交接文档冗余合并），共 3 个本地 docs 提交、净删 83 行冗余，其余 4 仓文档自洽无清理项；全程只动 *.md、未 push、未做任何配置同步动作。

## 文档清单判定表（7 子仓全量，每篇一行：子仓|路径|主题|判定|处置）

### antigravity-config（23 篇）

| 子仓 | 路径 | 主题 | 判定 | 处置 |
|---|---|---|---|---|
| antigravity-config | README.md | 仓库总览：架构表/同步命令/技能清单 | **确凿过期 + 内容缺项**：「对标 claude-code-config」（该仓 2026-09-05 已归档删除）；架构表漏 hooks.json 与 scripts/auto-turbo-watcher.ps1（sync.mjs 同步清单/磁盘实际存在）；技能清单列 6 个实际 7 个（缺 design-skill） | ✅ 已修正（9d88ffd） |
| antigravity-config | GEMINI.md | Antigravity 全局指令/用户画像 | 健康（与 ~/.claude/CLAUDE.md 同源独立维护，无过期引用） | 保留 |
| antigravity-config | skills/design-skill/SKILL.md | 前端 UI 总入口与调度器 | 功能内容 | 保留（README 清单已补录） |
| antigravity-config | skills/gsap/SKILL.md + references/×8 | GSAP 动画手册（core/timeline/scrolltrigger 等） | 功能内容，结构正常 | 保留 |
| antigravity-config | skills/issue-summary/SKILL.md | 口语 Bug 转专业清单 | 功能内容 | 保留 |
| antigravity-config | skills/lottie/SKILL.md | Lottie/dotLottie 集成 | 功能内容 | 保留 |
| antigravity-config | skills/perf-audit/SKILL.md + references/×3 | 性能审计（schema/thresholds/troubleshooting） | 功能内容 | 保留 |
| antigravity-config | skills/skill-creator/SKILL.md | 技能封装脚手架 | 功能内容 | 保留 |
| antigravity-config | skills/ui-ux-pro-max/SKILL.md + references/×3 | 设计系统细则 | 功能内容 | 保留 |

### codex-dotfiles（9 篇）

| 子仓 | 路径 | 主题 | 判定 | 处置 |
|---|---|---|---|---|
| codex-dotfiles | README.md | 最小配置基线/同步范围/新机部署 | 健康（MCP 数量等与 config.toml 口径一致） | 保留 |
| codex-dotfiles | skills/personal/codex-sync/SKILL.md | Codex 同步 runbook | **确凿过期**：绝对路径 `Desktop\my-workspace\codex-dotfiles` 为迁入 config/ 前的连字符旧名，双重过期（旧连字符 + 缺 config/ 层级） | ✅ 已更正为 `Desktop\my_workspace\config\codex-dotfiles`（67db7ee） |
| codex-dotfiles | skills/personal/perf-audit/SKILL.md + references/×3 | 性能审计 | 功能内容 | 保留 |
| codex-dotfiles | skills/personal/spec-driven-delivery/SKILL.md + references/×2 | 规格驱动交付契约 | 功能内容 | 保留 |

### cursor-dotfiles（3 篇）

| 子仓 | 路径 | 主题 | 判定 | 处置 |
|---|---|---|---|---|
| cursor-dotfiles | README.md | 面向人的换机恢复指南 | 健康 | 保留 |
| cursor-dotfiles | AGENTS.md | 面向 Agent 的逐步操作说明 | 健康：与 README 的重复（恢复步骤/踩坑表/更新命令）为**设计性受众分工**（人 vs Agent，README 明确引导 Agent 读 AGENTS.md，且 Agent 在新机可能无 README 上下文），两篇各自自洽，不属应收敛的冗余 | 保留 |
| cursor-dotfiles | cursor-agent-preferences.md | Cursor Settings UI 开关备忘（不随 settings.json 同步） | 健康（2026-05-26 标注，见「建议人工复核」第 4 条） | 保留 |

### pi-config（50 篇）

| 子仓 | 路径 | 主题 | 判定 | 处置 |
|---|---|---|---|---|
| pi-config | README.md | 同步机制权威文档（安装/初始化/边界/LSP） | 健康（Pi 0.82.0 基线，见复核第 3 条） | 保留 |
| pi-config | AGENTS.md | Pi 全局规则（同步到 ~/.pi/agent/） | 健康 | 保留 |
| pi-config | docs/stages/2026-07-23-config-hardening.md | 同步与认证加固 Stage | 健康历史记录（顶部已带 2026-07-25 superseded 说明） | 保留 |
| pi-config | docs/stages/2026-07-23-model-agnostic-settings.md | 模型无关配置 Stage | 健康历史记录（顶部已带 2026-07-24 更正说明） | 保留 |
| pi-config | docs/stages/2026-07-23-pi-config-skill-optimization.md | Skill 结构优化 Stage | 健康历史记录（与同日 concision stage 为顺序演进而非重复） | 保留 |
| pi-config | docs/stages/2026-07-23-pi-config-skill-concision.md | Skill 精简 Stage | 健康历史记录 | 保留 |
| pi-config | docs/stages/2026-07-23-pi-lsp-enablement.md | pi-lsp 启用 Stage | 健康历史记录 | 保留 |
| pi-config | docs/stages/2026-07-24-glm-credential-audit.md | GLM 凭证审计 Stage | 健康历史记录 | 保留 |
| pi-config | docs/stages/2026-07-24-high-value-consistency-audit.md | 一致性加固 Stage | 健康历史记录 | 保留 |
| pi-config | docs/stages/2026-07-25-sync-professional-hardening.md | 同步机制专业化 Stage | 健康历史记录 | 保留 |
| pi-config | docs/stages/2026-07-27-orphan-cleanup.md | 被删孤儿清理 Stage | 健康历史记录（含关联引用） | 保留 |
| pi-config | docs/stages/2026-08-08-simplify-sync-drop-full.md | 砍 full 模式 Stage | 健康历史记录（最新演进，验收全勾） | 保留 |
| pi-config | prompts/windows-cleanup.md | Windows 磁盘清理自进化 prompt | 健康（活跃维护至 2026-08-30 实战，含「自动进化」机制） | 保留 |
| pi-config | skills/pi-config/SKILL.md | 同步 Runbook（README 引用） | 功能内容 | 保留 |
| pi-config | skills/genjutsu/_jutsu/**（8 skill + 16 refs） | genjutsu 动效/设计技法集 | 功能内容 | 保留 |
| pi-config | skills/{issue-summary,markitdown,perf-audit,server-status,skill-creator,windows-status}/SKILL.md + perf-audit refs×3 | 全局技能 | 功能内容 | 保留 |

### dsh-config（2 篇）

| 子仓 | 路径 | 主题 | 判定 | 处置 |
|---|---|---|---|---|
| dsh-config | README.md | 配置即仓库定位/同步边界/日常同步 | 健康（对标引用为**新** claude-config，非旧 claude-code-config） | 保留 |
| dsh-config | docs/SETUP-NEW-MACHINE.md | 新机全新部署手册 | 健康；与 README 的「已知坑」3 条重复属概览 vs 执行手册的受众分工，两篇各自自洽 | 保留 |

### dsh-claude-import（1 篇）

| 子仓 | 路径 | 主题 | 判定 | 处置 |
|---|---|---|---|---|
| dsh-claude-import | README.md | Claude 配置导入 DSH 插件说明 | 健康（功能/落点映射/安装/架构齐全自洽） | 保留 |

### mimo-llm-proxy（2 篇 → 1 篇）

| 子仓 | 路径 | 主题 | 判定 | 处置 |
|---|---|---|---|---|
| mimo-llm-proxy | README.md | 反代使用文档（原理/启停/端点/客户端接入） | 权威篇 | ✅ 已扩充吸收 HANDOFF 独有知识（97b4b26） |
| mimo-llm-proxy | HANDOFF-TO-DSH.md | 2026-09-25 一次性交接文档（验收已完成） | **仓内冗余**：原理表/握手流程/启停/文件清单四块与 README 大面积重复，README 已是修正后的权威版（README 原文自注「旧交接文档判断是错的」） | ✅ 独有维护知识（401 自动重铸、X-Client-Version 兜底、模型别名映射、passToken 30 天、pythonw 损坏坑、桌面路径备忘）合并进 README 后删除（97b4b26） |

> 线索核实：任务提示的「首次 push 前须轮换 token」**未过时**——`git remote -v` 为空，该仓从未配置远程、从未 push（本地 6 个 commit），轮换事项仍是待办；仓内文档无此表述（该句在工作区 CLAUDE.md，不在本次 7 子仓范围），故无需改动。

## 已执行处置与提交（按子仓分组，含 commit hash）

| 子仓 | commit | 处置内容 | 改动量 |
|---|---|---|---|
| antigravity-config | `9d88ffd` docs: 清理过期引用并补全架构与技能清单 / fix stale reference and complete asset/skill inventory | ① 对标对象由已归档的 claude-code-config 更正为 claude-config（~/.claude/cc-toolkit/）；② 架构表补 hooks.json、scripts/auto-turbo-watcher.ps1；③ 技能清单 6→7 补 design-skill | +10/-7 行 |
| codex-dotfiles | `67db7ee` docs(skills): 修正 codex-sync 内的仓库绝对路径 / fix stale repo path in codex-sync skill | 过期路径 `Desktop\my-workspace\...` → `Desktop\my_workspace\config\...` | +1/-1 行 |
| mimo-llm-proxy | `97b4b26` docs: 合并交接文档进 README 权威篇 / merge handoff doc into README as single source | HANDOFF 独有维护知识并入 README 后删除 HANDOFF-TO-DSH.md | +13/-96 行（净删 83 行冗余） |

验证：3 仓提交前均过 `git diff --check`；提交后 7 仓 `git status --porcelain` 全空，与初始快照（全空）一致，除上述已提交文档外无任何新增改动；未 push。

## 建议人工复核

1. **mimo-llm-proxy 被删交接文档中的 2 项未勾验收**（Claude Code / DSH 用 mimo-v2.6-pro 端到端对话自验，2026-09-25 遗留「需重启自验」）：删除 HANDOFF 后该历史待办不再有载体，若仍在意请重启两端补验一次。
2. **mimo-llm-proxy 从未 push 且无 remote**：首次 push 前须轮换 auth_token 相关凭证的事项仍然有效，届时先加 remote 再轮换后 push。
3. **pi-config「当前验证基线 Pi 0.82.0」**：仓内最后 stage 记录为 2026-08-08，无法从仓内确证当前 Pi 版本是否仍为 0.82.0，若已升级建议随下次同步更新。
4. **cursor-dotfiles cursor-agent-preferences.md（2026-05-26）**：Cursor Settings UI 项随版本演化，半年未复核，换机前建议快速核对一遍是否仍匹配当前 Cursor。
5. **antigravity-config scripts/auto-turbo-watcher.ps1 不在 sync.mjs 同步清单**：本次已在 README 标注「本地执行器，不同步」；若希望新机也能还原该脚本，需另行决策（涉及配置同步动作，超出本审计范围）。

## 自评

**达标**。理由：① 报告整文件写入指定路径，五段结构齐全，判定表覆盖 7 子仓全量文档（说明文档逐篇、skills 按功能内容归组）；② 3 个有改动子仓各有 1 个 docs 类本地提交（9d88ffd / 67db7ee / 97b4b26），其余 4 仓无可清理项且逐篇依据已在上表给出；③ 7 仓终态 `git status --porcelain` 与初始快照完全一致；④ 红线全程遵守——只动 *.md、未 push、未往 ~/.dsh、~/.claude 等处做任何同步、未启动服务或安装依赖、不确定项（Pi 版本、Cursor UI 偏好等）保守保留并列入人工复核。
