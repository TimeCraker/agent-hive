# 任务 XFZ：xiaofanzhuo 文档审计与清理

一句话任务：通读 xiaofanzhuo 仓内全部 Markdown 文档，找出并处置**内容冗余**、**结构问题**、**完全过期**三类问题，可直接删除/合并/更新并本地提交。

## 背景（已核实事实，勿重新考古）

- 本仓是 `C:\Users\TimeCraker\Desktop\my_workspace\` 多仓库工作区的子仓 `xiaofanzhuo`，独立 Git 仓，当前工作区干净（0 脏文件）。
- 项目定位：社区小饭桌点餐服务（顾客点链接点餐 + 商家管理端）。**已上线** https://xiaofanzhuo.asterforge.top （2026-08-23 HTTPS 公网验收全绿；2026-08-28 微信真机复验通过）。
- 技术栈：Next.js 16 + Prisma 6 + SQLite（standalone）。商业模式：无在线支付，快照 + 微信私信收款。
- 已知线索（供你核实）：
  - `docs/` 有 BRD / PRD / DEPLOY / CHECKLIST-DEVICE 及 Stage Spec——项目已上线，**开发期的 Stage Spec、设备验收清单**这类阶段性文档是否已失去现势性（可归档标注「历史」或删除，取决于其档案价值）。
  - **DEPLOY 是现行生产部署权威文档，必须保真**——只更正确凿失真，不重构。
  - `data/` 是运行数据目录，与文档审计无关。

## 步骤

1. **先读工作区规则**：完整阅读 `C:\Users\TimeCraker\Desktop\my_workspace\AGENTS.md`。
2. `git status --porcelain` 记录初始状态快照。
3. 盘点文档：`git ls-files '*.md'` + 目录浏览双口径。
4. 逐篇通读，形成「文档清单判定表」：路径｜一句话主题｜判定（健康/冗余/结构问题/过期）｜处置（留/并/改/删）。
5. 执行处置：
   - **完全过期**（如针对已验收里程碑的临时任务清单）→ `git rm` 删除，或改名为 `docs/archive/` 下加「历史档案」标注（二选一，按档案价值判断）；
   - **内容冗余** → 合并进权威篇；
   - **过期信息**（上线前状态描述）→ 就地更正为上线后现状；
   - **结构问题** → `git mv` / 修链接；
   - **拿不准** → 保留，报告列「建议人工复核」。
6. 提交：每类清理一个独立 commit，Conventional Commits 中英文对照（例：`docs: 归档已验收的阶段性文档 / archive completed stage docs`）。只 `git add` 你动过的具体文件。
7. 写报告（见文末）。

## 红线

- **只动 Markdown 文档（*.md）**。不碰代码、配置、`.env*`、锁文件、`data/` 运行数据、构建产物。
- **绝不 push**，只本地 commit。
- **已上线生产项目**：DEPLOY 类文档修改极度保守，拿不准就不动。
- 不做功能开发、不装依赖、不跑 install/build/deploy。
- 不确定是否过期 → 保守保留 + 报告建议。
- Windows 11 环境。

## 验收标准

1. 报告整文件写入指定路径，含五段结构。
2. `git log --oneline -10` 可见 ≥1 个 docs 类提交；若判定无可清理，报告必须给出逐篇依据。
3. `git status` 对比初始快照：除你改动的文档外无新增改动。

## 报告要求

完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\XFZ-report.md`

模板：
```
# XFZ 结果报告
## 结论一句话
## 文档清单判定表（全量文档，每篇一行：路径|主题|判定|处置）
## 已执行处置与提交（含 commit hash 与改动摘要）
## 建议人工复核
## 自评（达标|部分达标|未达标 + 原因）
```
