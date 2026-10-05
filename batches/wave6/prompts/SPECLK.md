# 任务 SPECLK：lekao 下一阶段 Stage Spec 起草

一句话任务：为 lekao 起草下一阶段（免费模式深化）的 **Stage Spec 草案**——一份 PRD 级规划文档落仓，标注 DRAFT 待所有者评审。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\lekao`，K12 机构 AI 助教工作台（线上 lekao.asterforge.top）。Next.js 16 + Prisma + next-auth + ioredis + Android 端。
- 商业模式定版：**免费模式**——签到得 T-Coin，无付费充值。规划**不得引入付费/充值方向**。
- 方向种子（所有者给的两个主题，可交叉组织）：
  1. **T-Coin 体系深化**：获取途径扩展（每日任务/成就/连续签到加成？）、消耗场景设计（哪些 AI 能力花币、花多少）、余额经济学（防通胀/防刷）、清零与过期策略
  2. **助教能力升级**：现有 AI 能力盘点后选 2-3 个高价值扩展（如作业智能批改辅助、学情周报生成、错题归因）——以「机构教师省时间」为北极星
- ⚠️ 同仓此刻有另一个只读巡检会话（INSPLK）在跑——它零写入，你只管写你的文档，互不干扰；你的 git 操作正常做。

## 步骤

1. 读 README / CHANGELOG / docs/ / DESIGN.md 摸清现状（已有功能、既有规划、T-Coin 现行规则）。
2. 依方向种子展开：目标/非目标、用户故事、FR（按能力分组编号）、NFR、验收标准（可量化）、任务分解草案（带依赖序）、风险与开放问题（留给所有者决策的点单独列）。
3. 落盘为 `docs/specs/` 下新文件（目录不存在就建），文件名如 `next-stage-free-mode-deepening.spec.md`，**头部显著标注 `status: DRAFT（待所有者评审，非实施指令）`**。
4. 提交：Conventional Commits 中英对照（例：`docs(spec): 下一阶段免费模式深化规划草案 / draft next-stage free-mode deepening spec`）。只 add 你的新文件。
5. 写报告。

## 红线

- **只新增文档**，不改任何现有文件/代码/配置；不 push。
- 这是草案不是实施授权——不得顺手实现任何功能。
- 不引入付费/充值方向；引用现状必须来自仓内文档，不臆造。
- Windows 11 + PowerShell。

## 验收标准

1. Spec 文件落盘且结构完整（目标/非目标/FR/NFR/AC/任务分解/风险/开放问题）。
2. `git show --stat HEAD` 仅含新文件；`git status` 无其他改动。
3. 报告含 spec 要点摘要 + 留给所有者的决策点清单。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\SPECLK-report.md`

模板：`# SPECLK 结果报告` / `## 结论一句话` / `## Spec 要点摘要` / `## 留给所有者的决策点` / `## 提交` / `## 自评`
