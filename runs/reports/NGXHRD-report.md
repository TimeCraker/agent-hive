# NGXHRD 结果报告

> 任务：lekao 443 启用 HTTP/2 + xiaofanzhuo 补 4 项基础安全响应头
> 执行：2026-10-05 23:37 ~ 23:47（CST）｜仓库：asterforge-deploy ｜commit：`9f39e1b`

## 结论一句话

两项修复均已上线并验证通过：lekao ALPN 协商 `h2`、响应行 `HTTP/2 200`；xiaofanzhuo 首页/`/orders`/`/uploads/` 全路径 4/4 安全头齐全；全站 8 域名 200 无回归——但**任务背景的一处技术断言与实测不符**（见自评 §1），已按服务器真实能力改用替代写法完成。

## 变更内容（diff 摘要）

恰好 1 个 commit（`9f39e1b`），`git diff --cached` 仅 2 conf、+13/-1 行：

**`backups/production/tencent/nginx/nginx-lekao.conf`**（对应服务器 `/etc/nginx/conf.d/lekao.conf`）：
```diff
-    listen 443 ssl; # managed by Certbot
+    listen 443 ssl http2; # managed by Certbot (http2 enabled 2026-10-05 NGXHRD; nginx 1.24 无 http2 on; 指令)
```

**`backups/production/tencent/nginx/nginx-xiaofanzhuo.conf`**（对应服务器 `/etc/nginx/sites-enabled/xiaofanzhuo`）：
```diff
+    # 基础安全响应头（2026-10-05 NGXHRD）
+    # HSTS 首期 max-age=86400 短周期观察，稳定一周后升长周期
+    add_header Strict-Transport-Security "max-age=86400" always;
+    add_header X-Content-Type-Options "nosniff" always;
+    add_header X-Frame-Options "SAMEORIGIN" always;
+    add_header Content-Security-Policy "frame-ancestors 'self'" always;
```
同一组 4 头在 `/uploads/` location 内重复声明（该 location 自带 `add_header Cache-Control`，nginx 规则是 location 内出现任何 add_header 即切断 server 级继承——不补则上传直供路径裸奔，而 nosniff 恰恰对用户上传图片最有价值）。

**基线核对**：改动前已按仓流程拉取现网最新配置比对——lekao 快照与现网逐字节一致；xiaofanzhuo 仅文件末尾换行符差异（现网无 EOF newline），无实质差异。仓内 `configs/nginx-templates/` 无 CSP/HSTS 既有范式（grep 0 命中），按任务指定 4 头原样实施。另勘明真实布局：lekao 配置实际在 `conf.d/lekao.conf`，**不在** `tencent-all` 内（tencent-all 只含 asterforge/resume/interview/rag/workspace）。

## 应用与验证

**应用流程**（拉取→改→提交→scp→`nginx -t`→单次 reload）：
- SSH 预检通过（BatchMode 直连，nginx 1.24.0 确认）
- scp 两 conf 至 `/tmp` → 服务器端先备份原文件 → `sudo cp` 覆盖 → 权限归位 root:644
- `sudo nginx -t`：第一次 syntax ok 但报 2 条 `conflicting server name "xiaofanzhuo..."` warning——系我把 `.bak` 备份误放 `sites-enabled/` 内被 `include *` 加载所致，**立即纠正**（备份移至 `/tmp/`），复测完全干净通过
- reload 前按红线检查：`pgrep` 确认 node/npm 进程全部为 systemd 常驻业务服务，无 deploy/rsync/tar 部署活动，无其他活跃会话（DEPPF 未在部署）
- **单次** `systemctl reload nginx` → active，80/443 监听正常

**验证证据**（全部实测输出）：

| 验收项 | 结果 |
|---|---|
| lekao ALPN 协商 | `openssl s_client -alpn h2,http/1.1` → **`ALPN protocol: h2`** ✅ |
| lekao 响应行 | 服务器侧 `curl -sI --http2` → **`HTTP/2 200`**；本机 node http2 模块真实 h2 帧请求 → `HTTP/2 200`，body 66254B ✅ |
| xiaofanzhuo 首页 4 头 | `curl -sI` 计数 **4/4**：`Strict-Transport-Security: max-age=86400` / `X-Content-Type-Options: nosniff` / `X-Frame-Options: SAMEORIGIN` / `Content-Security-Policy: frame-ancestors 'self'` ✅ |
| 次级路径 | `/orders` 4/4 头 + 200；`/uploads/notexist-probe.png` 404 也带 4 头（`always` 生效，继承切断修复生效）✅ |
| 两站 200 无 5xx | lekao 200 / xiaofanzhuo 200（含 /orders 200）；80 端口 301→HTTPS 正常 ✅ |
| 证书链 | 两站 `Verify return code: 0 (ok)`，xiaofanzhuo CN 匹配 ✅ |
| 全站回归 | asterforge.top / resume / interview / workspace / decide / product / game / api/health **8/8 全 200** ✅ |

注：本机 Git Bash curl 与 Windows 系统 curl（Schannel 8.21.0）均未编译 HTTP/2 支持，h2 验证改用 node 内置 http2 模块（真实公网帧交互）+ 服务器侧 curl 双证据。

**回滚保险**：服务器 `/tmp/lekao.conf.bak-ngxhrd-20261005`、`/tmp/xiaofanzhuo.conf.bak-ngxhrd-20261005`（重启自清）；仓内 git 历史含原版。

## 自评

1. **任务背景技术断言纠偏（已实证）**：背景称 1.24.0「支持 `http2 on;` 新语法」——不成立。`http2 on;` 是 nginx **1.25.1**（2023-08）引入的指令；我在服务器上用独立最小配置无损实测：`nginx -t -c test.conf` 报 **`unknown directive "http2"`**，而 `listen ... ssl http2` 语法通过。故采用 1.24.0 唯一可行的 `listen 443 ssl http2;` 写法（该写法在 1.25.1+ 仅 deprecation warning，未来升级平滑）。
2. **连带效应（非缺陷，须知悉）**：`listen http2` 旧写法的 h2 能力作用于**监听 socket**而非单个 server——lekao 启用后，同 443 端口的 xiaofanzhuo 等 vhost 的 ALPN 也能协商出 h2（实测 xiaofanzhuo ALPN 回 h2 且 h2 200 正常服务）。已全量回归验证 8 域名 200 无破坏。若要求严格 per-server h2，需升级 nginx ≥1.25.1 后改用 `http2 on;`。
3. **过程纠偏 1 次**：备份文件初放 `sites-enabled/` 内引发 server_name 冲突 warning，`nginx -t` 仍过但主动修正后复测归零——教训：nginx 备份禁止放 `sites-enabled/`、`conf.d/` 加载路径内。
4. **遗留待办**：① HSTS `max-age=86400` 为首期短周期，稳定一周（~2026-10-12）后应升长周期（如 31536000）并评估 `includeSubDomains`；② 任务建议的 CSP 仓内范式不存在，本次 `frame-ancestors 'self'` 为最小实现，后续可按需扩展完整 CSP；③ 本 commit 未 push（任务验收口径为恰好 1 commit，未要求推送远端）。
5. **范围合规**：仅动 2 conf 两处变更；未触碰 tencent-all / asternova / product 等其他 server 块；`docs/audits/`（仓内既有未跟踪目录）未纳入提交；密钥零落盘零入报告。
