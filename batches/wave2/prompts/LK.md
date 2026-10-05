# 任务 LK：lekao 文档审计与清理

一句话任务：通读 lekao 仓内全部 Markdown 文档，找出并处置**内容冗余**、**结构问题**、**完全过期**三类问题，可直接删除/合并/更新并本地提交。

## 背景（已核实事实，勿重新考古）

- 本仓是 `C:\Users\TimeCraker\Desktop\my_workspace\` 多仓库工作区的子仓 `lekao`，独立 Git 仓，当前工作区干净（0 脏文件）。
- 项目定位：K12 培训机构 AI 助教工作台，线上 **lekao.asterforge.top**。
- 技术栈：Next.js 16 + Prisma + next-auth + ioredis；含 `lekao-android/` Android 端、`e2e/`（Playwright）、`deploy/`。
- 商业模式（2026 年定版）：**免费模式**——签到得 T-Coin，**无付费充值**。
- 已知线索（供你核实）：
  - `README.md`、`CHANGELOG.md`、`DESIGN.md`、`CLAUDE.md`、`docs/` 并存——CHANGELOG 记录与 README 状态口径是否一致。
  - 免费模式定型后，旧文档里是否残留「付费 / 充值 / 订单支付」路线的表述（确凿过期可清理）。
  - `lekao-android/` 与 `deploy/` 内文档是否与主仓现状脱节。

## 步骤

1. **先读工作区规则**：完整阅读 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`（多仓工作区协作规则：项目边界、提交规范、验证原则）。
2. `git status --porcelain` 记录初始状态快照。
3. 盘点文档：`git ls-files '*.md'` + 目录浏览双口径（含未入库的 .md）。
4. 逐篇通读，形成「文档清单判定表」：路径｜一句话主题｜判定（健康/冗余/结构问题/过期）｜处置（留/并/改/删）。
5. 执行处置：
   - **完全过期** → `git rm` 删除；
   - **内容冗余** → 合并进权威篇，重复篇删除或缩成指针段；
   - **过期信息**（如付费模式残留、已下线功能描述）→ 就地更正；
   - **结构问题** → `git mv` / 修链接；
   - **拿不准** → 保留，报告列「建议人工复核」。
6. 提交：每类清理一个独立 commit，Conventional Commits 中英文对照（例：`docs: 清理付费模式残留表述 / remove outdated payment wording`）。只 `git add` 你动过的具体文档文件。
7. 写报告（见文末）。

## 红线

- **只动 Markdown 文档（*.md）**。不碰代码、配置、`.env*`、锁文件、测试、构建产物。
- **绝不 push**，只本地 commit。
- 不做功能开发、不装依赖、不跑 install/build/deploy；只读命令可随意用。
- CHANGELOG 的历史条目是档案，**只追加不删改历史**（若它本身有结构性问题只在报告里建议）。
- 不确定是否过期 → 保守保留 + 报告建议，宁漏勿删。
- Windows 11 环境。

## 验收标准

1. 报告整文件写入指定路径，含五段结构。
2. `git log --oneline -10` 可见 ≥1 个 docs 类提交；若判定无可清理，报告必须给出逐篇依据。
3. `git status` 对比初始快照：除你改动的文档外无新增改动。

## 报告要求

完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\LK-report.md`

模板：
```
# LK 结果报告
## 结论一句话
## 文档清单判定表（全量文档，每篇一行：路径|主题|判定|处置）
## 已执行处置与提交（含 commit hash 与改动摘要）
## 建议人工复核
## 自评（达标|部分达标|未达标 + 原因）
```
