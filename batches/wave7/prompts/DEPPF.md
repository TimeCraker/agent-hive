# 任务 DEPPF：my-portfolio 上线 2026-10-05 性能优化轮（P1）

一句话任务：按仓内权威部署流程，把已推送的 10-05 性能优化轮部署到 https://asterforge.top 线上，并复测部署生效。

## 背景（已核实事实，勿重新考古）

- 2026-10-05 15:43–16:31 的 perf 轮 5 个 commit（`f62b13c` 字体 preload 清单改相对路径 → `c28d74c` 关闭 Inter/JBMono preload → `47b1c38` / `bad821f` / `635812f` Link 预取优化）**已全部推送远端 master，但线上未部署**（wave6 INSPPF 巡检实证 P1：线上首页 preload 字体仍是绝对路径 `https://asterforge.top/fonts/...`，且 Inter latin 48.4KB + JBMono latin 31.3KB 仍被预载，与 LCP 抢带宽）。
- **push ≠ 部署**：部署是手动 SSH 跑 `scripts/deploy-portfolio-safe.sh`（原子 7 项验证）。完整权威流程见仓内 `.agents/skills/my-portfolio/SKILL.md` 与 `asterforge-deploy` 仓 README / COLD-START.md。
- 本地工作树干净；本地 master 领先远端 3 条 docs 提交（aefb499/4ec32ab/b2d2eac，均为文档）——以 SKILL 与脚本预期为准，不顺手做额外 push。
- 服务器：腾讯云单机 Ubuntu + nginx + systemd（standalone）。

## 步骤

1. 读 `.agents/skills/my-portfolio/SKILL.md` 部署节 + `asterforge-deploy/README.md`、`COLD-START.md` 相关段，确认权威部署流程与前置条件。
2. SSH 连通性预检（如 `ssh <host> 'echo ok'`，主机/密钥以 asterforge-deploy 仓 ssh-keys 与文档为准）。**不通则如实报 failed 收档，不盲等不盲试**（本机代理 TUN 近期抖动）。
3. 按权威流程执行部署；若流程要求服务器侧拉取代码，确认拉到的是含 `635812f` 的 master。
4. 部署脚本自带的原子 7 项验证必须全部通过，输出留档进报告。
5. 线上复测（`curl -s --compressed https://asterforge.top/`）：
   - preload 字体链接变为**相对路径** `/fonts/noto-serif-sc/...`（预期 ≥9 条）；
   - Inter latin（~48.4KB）与 JBMono latin（~31.3KB）的 preload **消失**（计数 0）；
   - 首页 HTTP 200、TTFB 正常量级。
6. 整文件覆盖写报告。

## 红线

- 不改任何业务代码 / 配置 / nginx（**nginx 由并行任务 NGXHRD 负责，绝对不碰**）。
- 部署失败立即停止并如实报告失败原因，不盲目重试（部署是有副作用操作，重试 ≤1 且仅限确认是网络瞬断时）。
- 密钥零入报告零落盘（ssh 私钥只在 asterforge-deploy/ssh-keys，不复制不输出内容）。
- Windows 11 + PowerShell；SSH 目标与认证方式以 asterforge-deploy 文档为唯一权威。

## 验收标准（数字化）

1. 部署 7 项验证全过（输出留报告）；
2. 线上 preload 相对路径 ≥9 条 / Inter+JBMono preload 计数 = 0 / 首页 200；
3. 报告含：部署日志摘要、7 项验证结果、线上复测原始证据（curl 输出片段）。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\DEPPF-report.md`

模板：`# DEPPF 结果报告` / `## 结论一句话` / `## 部署过程` / `## 原子 7 项验证` / `## 线上复测` / `## 自评`
