# HSTSUP 结果报告

## 结论一句话

lekao 与 xiaofanzhuo 两站 HSTS 已于 2026-10-06 升级为 `max-age=31536000`（1 年）并 reload 生效，两站 `HTTP/2 200` + HSTS 头复测通过，生产备份留档，配置镜像与 README 已同步仓内并提交 `efd2987`，回滚预案未启用。

## 变更前现状

SSH 经 `~/Documents/tencent_server_key.pem` 连通（与仓内 `ssh-keys/tencent_server_key.pem` 同一份），服务器 `VM-0-2-ubuntu`，nginx/1.24.0 (Ubuntu)。

实测现状与任务描述存在两处偏差（以服务器实测为准，已按任务意图执行）：

| 站点 | 任务描述 | 实测现状 | 配置位置 |
|---|---|---|---|
| lekao.asterforge.top | HSTS 604800 | **无 HSTS 头**（2026-10-05 NGXHRD 只启用了 h2，未加 HSTS） | `/etc/nginx/conf.d/lekao.conf` |
| xiaofanzhuo.asterforge.top | HSTS 604800 | **HSTS 86400**（1 天观察期） | `/etc/nginx/sites-enabled/xiaofanzhuo` 行 10（server 级）+ 行 21（`/uploads/` location 级） |

变更前 curl 留证（服务器视角，2026-10-06 03:59 UTC）：

```
===== lekao.asterforge.top (before) =====
HTTP/2 200
server: nginx/1.24.0 (Ubuntu)
date: Tue, 06 Oct 2026 03:59:11 GMT
content-type: text/html; charset=utf-8
content-length: 66254
vary: Accept-Encoding
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
x-powered-by: Next.js
cache-control: s-maxage=31536000
etag: "72h5jz98b41bi4"
（无 Strict-Transport-Security 头）

===== xiaofanzhuo.asterforge.top (before) =====
HTTP/2 200
server: nginx/1.24.0 (Ubuntu)
date: Tue, 06 Oct 2026 03:59:11 GMT
content-type: text/html; charset=utf-8
vary: Accept-Encoding
set-cookie: xfz_device=5367dfc...; Path=/; Expires=Wed, 06 Oct 2027 03:59:11 GMT; Max-Age=31536000; HttpOnly; SameSite=lax
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
link: </_next/static/chunks/0c72tk-ov0vvi.css>; rel=preload; as="style"
x-powered-by: Next.js
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
strict-transport-security: max-age=86400
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
content-security-policy: frame-ancestors 'self'
```

（本机外部视角同步 curl 过一遍，头部一致，仅本机 curl 协商为 HTTP/1.1。）

## 服务器变更过程

1. **备份**（避开 `sites-enabled/*` 通配 include，防止备份文件被 nginx 当配置加载，统一放 `/etc/nginx/` 根下）：
   - `/etc/nginx/xiaofanzhuo.bak-hsts-20261006`（2131 B，cp -a 保留属性）
   - `/etc/nginx/lekao.conf.bak-hsts-20261006`（2240 B）
2. **变更**（全部 sed 精确落位，改动后 grep + cat -n 全文核对）：
   - xiaofanzhuo：行 10、21 两处 `max-age=86400` → `max-age=31536000`；行 9 过时注释同步改写（`# HSTS 2026-10-06 HSTSUP 升长周期 1 年（原 86400 短周期观察期）`）。其余 3 项安全头与其他指令零改动。
   - lekao：443 server 块新增 `add_header Strict-Transport-Security "max-age=31536000" always;`（带注释说明）；`/downloads/` location 内重复声明一次（该 location 自带 `add_header` 会切断 server 级继承，沿用 xiaofanzhuo 同款处理，NGXHRD 已在该 location 下沉过 `X-Content-Type-Options`，先例一致）。
3. **语法检查**：`sudo nginx -t` → `syntax is ok / test is successful`（通过后才 reload）。
4. **加载**：`sudo systemctl reload nginx`（仅 reload 未 restart），nginx 保持 `active`，未动任何 systemd unit、未删任何文件。

## 验证留证（前后对比）

变更后 curl（服务器视角，2026-10-06 04:03 UTC，reload 后）：

```
===== lekao.asterforge.top (after) =====
HTTP/2 200
server: nginx/1.24.0 (Ubuntu)
date: Tue, 06 Oct 2026 04:03:11 GMT
content-type: text/html; charset=utf-8
content-length: 66254
vary: Accept-Encoding
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
x-powered-by: Next.js
cache-control: s-maxage=31536000
etag: "72h5jz98b41bi4"
strict-transport-security: max-age=31536000   ← 新增

===== xiaofanzhuo.asterforge.top (after) =====
HTTP/2 200
server: nginx/1.24.0 (Ubuntu)
date: Tue, 06 Oct 2026 04:03:11 GMT
content-type: text/html; charset=utf-8
vary: Accept-Encoding
set-cookie: xfz_device=60bca53...; Path=/; Expires=Wed, 06 Oct 2027 04:03:11 GMT; Max-Age=31536000; HttpOnly; SameSite=lax
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
link: </_next/static/chunks/0c72tk-ov0vvi.css>; rel=preload; as="style"
x-powered-by: Next.js
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
strict-transport-security: max-age=31536000   ← 86400 升级
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
content-security-policy: frame-ancestors 'self'
```

差异对比：lekao 头部唯一变化 = 新增 `strict-transport-security: max-age=31536000`；xiaofanzhuo 唯一变化 = 该值 86400 → 31536000。其余头部逐项一致，无 5xx。

补充验证：
- location 级 `always` 头覆盖（404 场景）：`/downloads/__hsts_probe__.apk` 与 `/uploads/__hsts_probe__.png` 均返回 `HTTP/2 404` + `strict-transport-security: max-age=31536000`；
- http→https 强制跳转保持：两站 80 端口均 `HTTP/1.1 301 Moved Permanently`；
- nginx reload 后 `systemctl is-active nginx` = `active`。

## 仓内同步与提交

- **模板核查**：`configs/nginx-templates/` 仅含 tencent-all / alyun 参考模板，**无 lekao / xiaofanzhuo 模板**（两站生产配置的仓内权威镜像在 `backups/production/tencent/nginx/`）；`tencent-all.template` 主站 HSTS 本就是 31536000，无需动。
- **镜像同步**：从服务器拉取改后原文覆盖 `backups/production/tencent/nginx/nginx-lekao.conf`（+4 行）与 `nginx-xiaofanzhuo.conf`（3 行改），diff 逐行核对全部为 HSTS 相关（反向确认生产与镜像此前无 drift）。
- **README 同步**：§8 变更记录新增一行 2026-10-06（HSTSUP）条目，位于 2026-10-05（NGXHRD）条目之前。
- **提交**：`efd2987` `feat(nginx): HSTS 升长周期 / raise HSTS max-age to one year`，3 files changed, +8/−3，`git diff --cached` 全程自查仅含上述改动，无 ssh-keys 变更、无密钥、无其他文件混入。
- 过程说明：会话 SessionStart 的 `git pull --rebase` 将上一任务文档改动拉为父提交 `9e4251a`（即本仓 README 等遗留 M 的去向），确认工作区相对 HEAD 仅剩本任务改动后才提交，提交边界干净。当前工作区仅剩 `docs/audits/` untracked（并行审计任务产物，未动）。

## 自评

- **验收对照**：①两站 `max-age=31536000` + 200 ✓；②备份留证 + `nginx -t` 留证 ✓；③仓内同步 + commit 仅含该改动 ✓；④前后完整 curl 头对比 ✓。回滚预案未启用。
- **范围控制**：仅 HSTS 相关行变动（xiaofanzhuo 3 行、lekao 新增 4 行），`includeSubDomains` 等未引入（两站现行均无该指令，保持原样），其余 nginx 指令零触碰；镜像 diff 逐行为证。
- **与任务描述的偏差如实记录**：现状是 xiaofanzhuo 86400（非 604800）、lekao 无 HSTS（非 604800）；lekao 按"新增"达成两站 31536000 的任务目标，`/downloads/` 重复声明是 nginx add_header 继承切断语义下的必要补全，超出"改一个值"字面但属任务意图内，特此说明。
- **观察期说明**：86400 观察期实际运行约 1 天（任务背景已确认所有者权衡后直接升级，授权在案）。
- **剩余风险**：HSTS 1 年周期意味着两域名 1 年内须持续保持 https 可用（换域/回退 http 将受浏览器强制 https 约束）；两站均无 `includeSubDomains`/`preload`，未来若上子域可再评估。
