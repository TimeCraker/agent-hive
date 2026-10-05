# 任务 DEPCB：coding-plan-bench Pages 重部署（P2）

一句话任务：把 coding-plan-bench 远端 main（`ec0f774`，glm-5.3 矩阵世代）构建并重新部署到 Cloudflare Pages（https://coding-plan-bench.pages.dev），线上核验生效。

## 背景（已核实事实，勿重新考古）

- wave6 INSPCB 巡检实证：线上站仍是 2026-08-05 世代——bundle `index-CrwXWtwV.js` / `index-BSAjIVF_.css`、`/leaderboards.json` 全文无 `glm-5.3`、数据标注「更新于 2026-08-05」。
- 远端 main HEAD = `ec0f774`（2026-10-05 16:11:51 +08，`feat(matrix): glm-5.3 多模型对比矩阵 + 首轮实测`，已与本地 origin/main 核对一致）。
- 仓根有 `wrangler.toml`（Cloudflare 通道）；README 声称外链与 Releases 均 200。
- ⚠️ **本地 `coding-plan-bench` 工作树正被另一个 S01 实施会话占用（有未提交改动）——绝对不进入、不读取、不修改该目录**。本任务 cwd 特意设在 `pwa-hw-voice`（纯落脚点，归档仓无需读）。

## 步骤

1. `git clone --depth 1 https://github.com/TimeCraker/coding-plan-bench.git` 到**系统临时目录**（如 `$env:TEMP\cpb-deploy`），确认 clone 后 HEAD = `ec0f774`。
2. 读 clone 仓内 README / 部署相关文档与 `wrangler.toml`，确认 Pages 部署通道（`wrangler pages deploy <dir>` 还是既有脚本）与产物目录（`site/` 或构建产物目录）、构建命令（以仓内 `package.json` 为准，预期 npm/pnpm + build）。
3. 认证预检：`wrangler whoami`。**无有效认证 → 如实报 failed**（说明缺什么凭据、从哪里提供），绝不猜 token、绝不把认证信息写进任何文件或报告。
4. 按仓文档构建 → 部署到 Pages。
5. 部署后线上核验（4 项，证据留报告）：
   - 首页 bundle hash 变化（不再是 `CrwXWtwV` / `BSAjIVF_`）；
   - `https://coding-plan-bench.pages.dev/leaderboards.json` 含 `glm-5.3`（计数 > 0）；
   - 首页 HTML 出现矩阵相关入口/标记（以 clone 仓内 UI 关键词为准）；
   - `GET https://coding-plan-bench-api.timecraker-ace.workers.dev/api/health` 仍回 `{"ok":true}`（只测健康端点）。
6. 清理临时 clone 目录，整文件覆盖写报告。

## 红线

- **不进本地 `coding-plan-bench` 目录**（S01 会话在工作）；一切操作在系统临时目录的 clone 内。
- **不发起任何真实测速请求**（`POST /api/bench` 会消耗真实 key/额度）。
- 认证信息 / token 零落盘、零入报告、零入日志摘录。
- 失败如实报（尤其认证缺失类失败），不盲重试；Windows 11 + PowerShell。

## 验收标准（数字化）

1. 4 项线上核验全过；
2. 临时 clone 已清理（报告附清理确认）；
3. 报告含部署命令、产物清单与 4 项核验的原始输出片段。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\DEPCB-report.md`

模板：`# DEPCB 结果报告` / `## 结论一句话` / `## 部署过程` / `## 线上核验（4 项）` / `## 自评`
