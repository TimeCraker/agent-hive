# 任务 CFG：config 七子仓文档审计与清理

一句话任务：通读 `config/` 下 7 个子仓的全部 Markdown 文档，找出并处置**内容冗余**、**结构问题**、**完全过期**三类问题，可直接删除/合并/更新并在**各自子仓内**本地提交。

## 背景（已核实事实，勿重新考古）

- `C:\Users\TimeCraker\Desktop\my_workspace\config\` 是工作区的统一配置与工具中心。⚠️ **config/ 根目录本身不是 Git 仓**；它下面 7 个子目录各自是独立 Git 仓：
  `antigravity-config/`、`codex-dotfiles/`、`cursor-dotfiles/`、`pi-config/`、`dsh-config/`（对应 `~/.dsh`）、`dsh-claude-import/`、`mimo-llm-proxy/`（小米 MiMo 免费额度反代，端口 18080）。
- 已知线索（供你核实）：
  - 各子仓 README/AGENTS 的「同步方式」说明疑似跨仓重复且口径不一——冗余收敛要**尊重各仓独立性**（各仓的 README 必须自洽，不能只留一份）。
  - 旧 `config/claude-code-config/` 已于 **2026-09-05 归档删除**，由 `~/.claude/cc-toolkit/`（= github.com/TimeCraker/claude-config）取代——**任何子仓文档里还指向 `config/claude-code-config/` 的链接/段落都是确凿过期，清理**。
  - `mimo-llm-proxy` 的「首次 push 前须轮换 token」事项是否已完成而过时。

## 步骤

1. **先读工作区规则**：完整阅读 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`（其中「工作区与项目边界」一节直接约束本目录）。
2. 逐个子仓 `git status --porcelain` 记录初始快照（在子仓目录内执行）。
3. 盘点文档：每个子仓 `git ls-files '*.md'` + 目录浏览。
4. 逐篇通读，形成七合一「文档清单判定表」（标注所属子仓）：路径｜一句话主题｜判定｜处置。
5. 执行处置：
   - **确凿过期**（如 claude-code-config 残留引用）→ 删除/更正；
   - **仓内冗余** → 合并进该仓权威篇；
   - **结构问题** → `git mv` / 修链接；
   - **拿不准** → 保留，报告列「建议人工复核」。
6. 提交：在**被改动的子仓内**分别提交，Conventional Commits 中英文对照（例：`docs: 清理旧 claude-code-config 引用 / remove stale config references`）。只 `git add` 你动过的具体文件。
7. 写报告（见文末）。

## 红线

- **只动 Markdown 文档（*.md）**。不碰任何真实配置内容、settings、密钥、token、`.env*`——这是配置中心，配错会影响用户工具链。
- **不做配置同步动作本身**（不往 `~/.dsh`、`~/.claude` 等处拷贝/执行任何东西），纯文档审计。
- git 操作只在子仓内进行；**绝不 push**。
- 不装依赖、不启动 mimo-llm-proxy 或任何服务。
- 不确定是否过期 → 保守保留 + 报告建议。
- Windows 11 环境。

## 验收标准

1. 报告整文件写入指定路径，含五段结构（判定表覆盖 7 个子仓全量文档）。
2. 有改动的子仓 `git log --oneline -5` 各自可见 ≥1 个 docs 类提交；全部无可清理则报告给出逐篇依据。
3. 各子仓 `git status` 对比初始快照：除你改动的文档外无新增改动。

## 报告要求

完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\CFG-report.md`

模板：
```
# CFG 结果报告
## 结论一句话
## 文档清单判定表（7 子仓全量，每篇一行：子仓|路径|主题|判定|处置）
## 已执行处置与提交（按子仓分组，含 commit hash）
## 建议人工复核
## 自评（达标|部分达标|未达标 + 原因）
```
