# 任务 INSPCB：coding-plan-bench 线上站巡检

一句话任务：对 **https://coding-plan-bench.pages.dev**（模型测速台线上站）做一次**只读**线上健康巡检（可用性 / 功能形态 / 性能 / 死链），产出带严重度分级的问题清单。

## 背景（已核实事实，勿重新考古）

- 模型测速台（TTFT/TPS/Total 榜单）线上站，Cloudflare Pages 部署。⚠️ **本仓工作树此刻有另一个实施会话在跑 S01 大改造——你绝对不进 coding-plan-bench 目录、不碰它的任何文件**，本任务 cwd 特意设在 pwa-hw-voice（纯落脚点，该仓是未启动的归档仓，只读它的 README 都没必要）。
- 你只做一件事：从公网视角检查线上站。

## 步骤

1. **可用性**：HTTPS、首页状态码/响应时间、静态资源（JS/CSS bundle）抽样可加载。
2. **功能形态走查（只读）**：首页 HTML 是否渲染出主框架内容（SSG/SPA 壳判断）、预置数据是否可拉取（若 site 用 results.json 类静态数据文件，直接 GET 验证其有效性与模型矩阵内容）、Workers 代理端点 `coding-plan-bench-api.timecraker-ace.workers.dev` 的可达性（只测健康状态，**不发测速请求**）。
3. **性能**：PSI 免费接口 mobile+desktop 各一次（重试 ≤2）；失败降级 curl 计时 + bundle 体积清单。
4. **死链**：首页链接 + README 声称的 Releases/GitHub 仓外链 HEAD 验活，限深 2、并发 ≤2、间隔 ≥500ms。
5. 汇总写报告。

## 红线

- **不进 coding-plan-bench 本地仓**（S01 会话在工作）；不发起任何真实测速请求（那会消耗真实 key/额度）；不提交表单。
- 失败重试 ≤2；拿不到的如实标注。除报告外零写入；无 git 操作。Windows 11 + PowerShell。

## 验收标准

报告含五节 + P0-P3 问题分级清单（含「线上版与仓内 S01 改造的已知差异」提示节，方便部署时对照）。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\INSPCB-report.md`

模板：`# INSPCB 结果报告` / `## 结论一句话` / `## 可用性` / `## 功能形态走查` / `## 性能` / `## 死链` / `## 问题分级清单` / `## 自评`
