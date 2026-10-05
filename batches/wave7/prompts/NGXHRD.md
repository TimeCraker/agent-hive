# 任务 NGXHRD：nginx 修复合集——lekao 启用 HTTP/2 + xiaofanzhuo 补基础安全头（P2×2）

一句话任务：按 asterforge-deploy 仓权威流程，给 lekao.asterforge.top 的 443 启用 HTTP/2，给 xiaofanzhuo.asterforge.top 补 4 项基础安全响应头，应用上线并验证。

## 背景（已核实事实，勿重新考古）

- **P2-A（lekao 无 h2）**：`openssl s_client -alpn h2,http/1.1` 仅回 `http/1.1`，响应行 `HTTP/1.1 200`（wave6 INSPLK 巡检实证）；首屏 20+ 资源受浏览器 HTTP/1.1 的 6 并发连接限制排队。
- **P2-B（xiaofanzhuo 缺安全头）**：`curl -I` 于 `/` 与 `/orders` 两次验证，全站无 `Strict-Transport-Security` / `X-Content-Type-Options` / `X-Frame-Options`（或 CSP `frame-ancestors`）/ `Content-Security-Policy`（wave6 INSPXZ 巡检实证）。
- 服务器：腾讯云单机 Ubuntu，nginx/**1.24.0**（支持 `http2 on;` 新语法，勿再用 `listen 443 ssl http2;` 旧写法）。
- **asterforge-deploy 是生产环境唯一权威**：README + COLD-START.md；现网配置快照在 `backups/production/tencent/nginx/`（`nginx-lekao.conf`、`nginx-xiaofanzhuo.conf`），但快照可能滞后——**改前先按仓内 scripts/（sync/backup）工具拉取服务器现网最新配置**，以现网为准。

## 步骤

1. 读 `README.md` / `COLD-START.md`，确认本仓的配置变更权威流程（拉取→改→提交→scp→`nginx -t`→reload）。
2. SSH 连通性预检。**不通则如实报 failed 收档**（本机代理 TUN 近期抖动）。
3. 按仓工具拉取现网两份 conf 的最新版本。
4. 修改：
   - `nginx-lekao.conf`：443 server 块加 `http2 on;`
   - `nginx-xiaofanzhuo.conf`：server 块加 4 头——`Strict-Transport-Security: max-age=86400`（首期短周期观察，一周后再升长周期）、`X-Content-Type-Options: nosniff`、`X-Frame-Options: SAMEORIGIN`、`Content-Security-Policy: frame-ancestors 'self'`（若仓内模板对 CSP 有更成熟范式，以仓内范式为准并在报告说明）。
5. `git diff` 自查仅含这两处变更 → Conventional Commits 中英对照提交（如 `fix(nginx): lekao 启用 HTTP/2 与小饭桌补安全头 / enable h2 for lekao and add security headers`）。
6. 应用：scp 两 conf → `nginx -t` **必须通过** → **单次** reload。
7. 验证（全部留证据）：
   - `openssl s_client -connect ... -alpn h2,http/1.1` 回 `h2`；`curl -sI --http2 https://lekao.asterforge.top/` 响应行 `HTTP/2 200`；
   - `curl -sI https://xiaofanzhuo.asterforge.top/` 4/4 头齐全；
   - 两站首页均 200、无 5xx、证书链正常。
8. 整文件覆盖写报告。

## 红线

- **`nginx -t` 不过绝不 reload**；reload 前 `pgrep -af 'deploy-portfolio|node|npm'` 检查并行部署（DEPPF 任务可能在部署 my-portfolio，若其部署脚本正在服务器上运行，等它退出后再 reload）。
- 只改这两个站点的 conf，不碰 asterforge.top / product / asternova 等其他 server 块。
- 拉取的现网配置与快照若有出入，以现网为准并在报告注明差异。
- 密钥零入报告零落盘；失败如实报，不盲重试。

## 验收标准（数字化）

1. lekao ALPN 协商出 h2 且响应行 HTTP/2 200；
2. xiaofanzhuo 4/4 安全头在响应中可见；
3. 两站 200 无 5xx；
4. 恰好 1 个 commit，`git diff --cached` 仅两 conf。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\NGXHRD-report.md`

模板：`# NGXHRD 结果报告` / `## 结论一句话` / `## 变更内容（diff 摘要）` / `## 应用与验证` / `## 自评`
