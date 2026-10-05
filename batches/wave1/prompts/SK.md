# 任务 SK：把 frontend-test / perf-audit 两个 skill 导入 DSH 可用范围

你在 `C:\Users\TimeCraker\Desktop\my_workspace\dsh-claude-import` 目录工作（当前目录）。这个仓是把 Claude Code 配置资产导入 DeepSeek Harness（DSH）的工具（GUI 插件形态：DSH 设置页 → 插件 → 插件配置 →「导入 Claude 配置」卡片；支持 skills/rules/commands 等五类资产，幂等导入）。

## 任务
把 Claude Code 全局目录里的两个 skill：
- `C:\Users\TimeCraker\.claude\skills\frontend-test`（Web E2E 人工走查流程）
- `C:\Users\TimeCraker\.claude\skills\perf-audit`（Lighthouse/PSI/WPT 性能跑分工作流）

导入到 DSH 能加载的位置，使 DSH 新会话的可用 skill 列表里出现它们。

## 步骤（探索型任务，路径以实际为准）
1. 读本仓 README 与源码，查明插件实现的 skill 导入落点（目标目录），以及 DSH 用户级 skill 的加载目录约定
2. 优先方案：若插件有可编程/幂等的导入逻辑（内容指纹比对那种），复用其落点规则手动等价落位；次选：直接把两个 skill 目录复制到 DSH 用户级 skill 目录（保持 SKILL.md 结构完整）
3. 落位后自验：检查文件完整（SKILL.md 存在、描述 frontmatter 完好）；若能在本环境验证 DSH 识别（查 DSH 的 skill 清单机制/缓存）就验证，不能就写清「用户开新 DSH 会话应看到两个 skill」的验证步骤
4. 如有冲突策略问题（已存在同名/等效内容），按插件规则处理并在报告说明

## 红线
- 不修改 DSH 安装目录的程序代码（只放配置/资产文件）
- 不动 `~/.claude` 源目录（只读复制）
- 如果查明的事实与本任务前提冲突（比如 DSH 不支持外部 skill 目录），如实报告并给出替代方案，不蛮干

## 验收标准
- 两个 skill 文件落位（报告含完整目标路径清单 + 文件树）
- 验证方法明确（已验证或给出用户侧验证步骤）

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\AGENT-BOARD-2026-10\reports\SK-report.md`
模板：# SK 结果报告 / ## 落点机制调查结论 / ## 实际操作（复制/修改清单） / ## 验证证据 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
