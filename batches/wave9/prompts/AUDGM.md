# 任务 AUDGM:games/asternova 深度审计(只读)

一句话任务:对 games monorepo(asternova 矩阵)做一次**只读**深度审计——子项目文档一致性、代码质量、仓库卫生——产出 P0-P3 分级问题清单,每条附证据。**不改任何文件(报告除外)、无 git 写操作。**

## 背景(已核实事实,勿重新考古)

- 本仓是游戏 monorepo,整合 AsterNova 矩阵,内含:`asternova/web-client`(Next.js+WASM)、`asternova/backend`(Go+Gin+WS+PostgreSQL+Redis,**一期封存**;现行架构为**房主权威**,即客户端房主裁决游戏状态)、`asternova/client-godot-v2`(Godot,**主力客户端**)、`asternova/client-godot`(冻结)、`asternova/render-lab`、`asternova/art`(美术管线)、`asternova/scratch`(实验场)。
- 指引:`games/README.md` + `asternova/AGENTS.md`(先读)。
- 同工作区另有并行波次在做各仓**文档保鲜审计**(只改 .md);你若发现 `git status` 有 .md 未提交改动,那是他们的,原样保留、忽略即可。

## 步骤

1. **一致性**:各子项目"封存/冻结/主力"的声明 vs `git log -15 --oneline` 实际活动时间线,找出声明与实况漂移(如"封存"却在近期有 commit;或"主力"却数月无活动)。
2. **代码质量(重点 client-godot-v2 与 web-client)**:项目结构、脚本组织(GDScript 文件数/最大文件行数)、TODO/FIXME 密度、明显的死代码或重复实现;backend 侧跑 `go vet ./...` 与 `go build ./...`(只写 GOCACHE 不写仓,允许;若 Go 环境缺失如实标注)。
3. **协议漂移**:房主权威架构下,client-godot-v2 与 web-client 对 WS 消息/房间状态的理解是否有分叉(消息类型常量、序列化结构两处定义是否一致)。
4. **仓库卫生**:`git status` 未跟踪文件、大文件(>5MB)、疑似应 gitignore 未 ignore 的产物目录。
5. 汇总写报告。

## 红线

- **只读**:除报告文件外零写入;不 commit/stash/checkout/restore;不 install 依赖;不动生产。
- Go 命令只允许 `go vet` / `go build`(验证封存仓可编译性),禁止 `go mod tidy` 等改 lockfile 操作。
- 不碰 ResumeAIX 等兄弟仓;China 网络重试 ≤2。
- Windows 11 + PowerShell。

## 验收标准

报告含五节(一致性/代码质量/协议漂移/仓库卫生/分级清单 P0-P3),每个问题附证据(命令输出/文件路径+行号/commit 哈希),P0/P1 给出建议动作但不执行。

## 报告要求

完成后**整文件覆盖写入**:
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AUDGM-report.md`

模板:`# AUDGM 结果报告` / `## 结论一句话` / `## 子项目一致性` / `## 代码质量` / `## 协议漂移` / `## 仓库卫生` / `## 分级问题清单(P0-P3)` / `## 自评`
