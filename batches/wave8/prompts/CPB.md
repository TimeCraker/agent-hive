# 任务：coding-plan-bench 文档保鲜度审计与修复（Wave 8 · CPB）

## 背景与目标
多仓库工作区 C:/Users/TimeCraker/Desktop/my_workspace 下多个会话并行开发，coding-plan-bench 的文档很可能已落后于实际代码。你的任务：**核对该仓全部说明性文档与实际状态的一致性，过期的当场修正**，产出「过期点清单」报告。工作区最新全景见 `C:/Users/TimeCraker/Desktop/my_workspace/CLAUDE.md`（先读它的项目地图行）。

## 步骤
1. 摸清实际状态：`git -C <仓库> log --oneline -30`、目录结构、manifest/配置、关键代码入口——以实况为准
2. 通读该仓全部说明性文档（README.md、PLAN-v2.md、docs/），逐条摘出可验证陈述
3. 逐条核对：与实况一致 → 保留；过期 → 当场改写；文档缺失的重要事实 → 补一段
4. 若修正了文档：按该仓自己的提交规范 commit（docs: 前缀，中英对照）；该仓有他人未提交改动时只动 .md 并跳过 commit
5. 报告写入 `C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/CPB-report.md`（整文件覆盖）

## 重点核对
- PLAN-v2 归档指向
- wave4 升级后 README 功能表述
- 三端架构 vs 实际目录

## 红线
- 只修改 coding-plan-bench 内的 **.md 文档**；不碰任何代码/配置/依赖/锁文件
- 不碰 .git、不改历史、不 push；目标仓有他人未提交改动时绝不 commit
- 不虚构：每条修正必须对应你亲眼核实的证据；无法核实的写成「待人工确认」
- 不修改 C:/Users/TimeCraker/Desktop/my_workspace 根目录的 CLAUDE.md/AGENTS.md（那是 ROOTDOC 任务的范围）
- 不碰其他仓库

## 验收标准
- 文档内可验证陈述 100% 与仓库实况一致（抽查 5 条可复现）
- 报告含「过期点清单」表：每条 = 文档位置 ‖ 改前 ‖ 改后 ‖ 证据
- 修正有 git commit（或注明跳过原因）

## 报告要求
写入 `C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/CPB-report.md`：① 过期点清单表 ② 核对无误条目 ③ 自评
