# 任务 AFD：asterforge-deploy 文档审计（极保守）

一句话任务：核查 asterforge-deploy 仓的文档与 `scripts/`、`configs/` 实际清单的一致性，找出确凿过期的文档问题并处置。**这是生产权威仓，一切从保守。**

## 背景（已核实事实，勿重新考古）

- 本仓是 `C:\Users\TimeCraker\Desktop\my_workspace\` 多仓库工作区的子仓 `asterforge-deploy`，独立 Git 仓。⚠️ 当前有 **1 个未提交改动**，是用户现场，不要动。
- 项目定位：**生产环境唯一权威部署手册 + 脚本**。单机腾讯云，手动 SSH 部署，push 不自动上线。bash/PowerShell 脚本分目录：`scripts/{backup,deploy,diagnose,monitor,remote-update,sync,verify}/`；`configs/` 是 nginx/systemd/docker 配置。
- 文档面：`README.md` + `COLD-START.md` + `docs/`。
- 已知线索（供你核实）：
  - 文档中列出的脚本清单 / 目录名与 `scripts/` 实际内容是否一致（文档说有而实际没有 = 过期；实际有而文档没提 = 可补充）。
  - 文档引用的 `configs/` 配置文件名与实际是否对得上。
  - `ssh-keys/` 入库是刻意约定（private-only），**相关说明不要当成错误去「修复」**。
  - `.hwinfo-tmp/`、`backups/`、`bundles/` 是运行数据目录，不审计。

## 步骤

1. **先读工作区规则**：完整阅读 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`。
2. `git status --porcelain` 记录初始状态快照。
3. 盘点文档面：`README.md`、`COLD-START.md`、`docs/**/*.md`。
4. 逐篇通读 + 与 `scripts/`、`configs/` 实际清单交叉核对，形成判定表：路径｜一句话主题｜判定（健康/冗余/结构问题/过期）｜处置（留/并/改/删）。
5. 执行处置（**只处理确凿项**）：
   - **确凿过期**（引用不存在的脚本/配置/路径）→ 就地更正，或 `git rm` 删除整篇（仅当整篇失效）；
   - **冗余** → 合并进权威篇；
   - **拿不准** → 保留，报告列「建议人工复核」。
6. 提交：Conventional Commits 中英文对照（例：`docs: 修正脚本清单与实际不一致 / fix script list mismatch`）。只 `git add` 你动过的具体文档文件，**严禁 `git add -A`**。
7. 写报告（见文末）。

## 红线

- **只动 Markdown 文档（*.md）**。不碰任何脚本、配置、`ssh-keys/`、密钥、`.env*`、备份数据。
- **绝不 push**，只本地 commit；**绝不执行任何部署/SSH/远程操作**。
- 用户那 1 个未提交改动：不回退、不覆盖、不混入。
- 生产权威仓：部署步骤类内容**极度保守**——拿不准就不动，宁可全留报告。
- 不确定是否过期 → 保留 + 报告建议，宁漏勿删。
- Windows 11 环境。

## 验收标准

1. 报告整文件写入指定路径，含五段结构。
2. `git log --oneline -5` 可见 ≥1 个 docs 类提交；若判定无可清理（保守通过），报告必须给出逐篇依据。
3. `git status` 对比初始快照：除你改动的文档外，无新增也无消失的改动。

## 报告要求

完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AFD-report.md`

模板：
```
# AFD 结果报告
## 结论一句话
## 文档清单判定表（每篇一行：路径|主题|判定|处置）
## 已执行处置与提交（含 commit hash 与改动摘要）
## 建议人工复核（本仓预期此项最多，逐条给理由）
## 自评（达标|部分达标|未达标 + 原因）
```
