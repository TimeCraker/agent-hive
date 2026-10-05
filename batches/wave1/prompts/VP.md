# 任务 VP：vibe-studio 收口与产线盘点

你在 `C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio` 目录工作（当前目录）。这是内容创作工作台（skills 集合 + remotion 视频管线 + 三平台发布工具），master 分支上有 **30 个本地未推送提交**（hsr-currency-war 介绍成片项目、gitignore 补漏、三端文案修正等），另有少量未提交改动。你的任务：安全收口推送 + 产线盘点。

## 已知事实
- 分支 master，远端 github.com/TimeCraker/vibe-studio（PUBLIC）
- 曾有另一个会话在此工作（体检 agent G），现在可能已结束——**动手前必须确认无并发**：
  `git status --porcelain` 记录快照 → 等 60 秒 → 再记录一次，两次一致才算静止
- `.gitignore` 策略：products 二进制不入库（README 标注入库）、projects/*/remotion-app/{public,out} 不入库、场景代码入库
- 三平台发布工具在 `skills/publish/`（douyin/xhs/bili，登录态在仓外 ~/.xxx-upload-profile，勿动）

## 步骤
1. 并发确认（上述双快照法）
2. 检查未提交改动：属于明显收尾的（报告/文档）就补提交；像半成品的保留并在报告标注，不强行推
3. `git push origin master`（30+ 提交一次推上）
4. 产线盘点（写入报告）：projects/ 活跃项目清单（名称/状态/产物）、skills/ 能力清单、发布工具与最近发布记录（worklog）、products/ 已发布内容索引
5. 给「内容量产」列出 3 个最短路径选题建议（基于现有管线能力）

## 红线
- 路径限定提交，禁止 git add -A
- 不跑任何发布脚本（不真发抖音/小红书）
- 网络失败重试一次，仍失败如实记录

## 验收标准
- push 成功，远端与本地一致
- 盘点表完整（项目/技能/产物三张清单）

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\AGENT-BOARD-2026-10\reports\VP-report.md`
模板：# VP 结果报告 / ## 做了什么 / ## 提交与推送（哈希） / ## 产线盘点（三张清单+选题建议） / ## 验证证据 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
