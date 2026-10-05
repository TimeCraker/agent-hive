# 任务 SMK2：派发链路冒烟（验收状态机版）

一句话任务：最小动作验证新链路——读一个文件、写一份报告，其余什么都不做。

## 步骤

1. 读 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\README.md` 的第一行标题。
2. 把报告**整文件覆盖写入** `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\SMK2-report.md`，内容三行：
   - `# SMK2 冒烟报告`
   - `## 读取到的标题`（下一行写那一行原文）
   - `## 自评：达标`
3. 结束。不做任何 git 操作、不改任何其他文件。

## 红线

- 只读 README.md；只写上述报告文件；不碰 `batches/`、`runs/logs/`、`app/`
- 不做任何 git 操作

## 验收标准

- 报告文件存在且含读取到的真实标题（主控随后会走 resume 续派 + 验收 API 闭环验证）
