# 任务 HSTSUP:lekao + 小饭桌 HSTS 升长周期

一句话任务:把 lekao.asterforge.top 与 xiaofanzhuo.asterforge.top 两站的 HSTS `max-age` 从 604800(7 天观察期)升到 31536000(1 年),服务器验证 + 仓内模板同步提交。**所有者已于 2026-10-06 授权本次生产变更。**

## 背景(已核实事实,勿重新考古)

- 单机腾讯云 Ubuntu(生产服务器),手动 SSH 部署,本仓(asterforge-deploy)是生产部署唯一权威手册。README.md 是架构/服务表/SOP 的单一真相源。
- 2026-10-05 wave7 NGXHRD 任务:lekao 启用 h2、xiaofanzhuo 补齐 4 安全头(顺带 h2),当时 HSTS 特意设短周期 `max-age=604800` 作观察期,验收记录留待办"一周后升长周期"。两站 https-only,nginx 已强制 http→https 跳转,上线以来无 HSTS 相关问题反馈。
- 观察期至今 1 天,所有者权衡后选择直接升级(两站域名与服务稳定,无换域计划)。
- SSH 连接方式以仓内实际为准:服务器 `ubuntu@111.229.200.178`,key 参照仓内脚本惯例(`scripts/deploy/deploy-portfolio-only.ps1` 默认用 `$env:USERPROFILE\Documents\tencent_server_key.pem`;本仓 `ssh-keys/tencent_server_key.pem` 亦在库——用哪个以能连通为准,先测试连通再操作)。
- 同仓有并行只读审计任务(AUDAFD)在工作,忽略它,它也会忽略你。

## 步骤

1. **核实现状(只读)**:SSH 连通后 `curl -sI` 两站,记录当前 `Strict-Transport-Security` 值留证;定位两站 server 块所在 nginx 配置文件与 HSTS 行(`nginx -T` 或 TEMPLATES 目录对应文件)。
2. **备份**:改动前在服务器上 `sudo cp <conf> <conf>.bak-hsts-20261006`,报告记录备份路径。
3. **变更**:两站 HSTS 行 `max-age=604800` → `max-age=31536000`(只动这一处,`includeSubDomains`/`preload` 等其他指令保持原样不动)。
4. **验证**:`sudo nginx -t` 通过才 `sudo systemctl reload nginx`(只 reload 不 restart);`curl -sI` 两站确认 `Strict-Transport-Security: max-age=31536000`,HTTP/2 + 200 正常、无 5xx。
5. **仓内同步**:检查本仓 `configs/nginx-templates/`(如 tencent-all.template)是否记录了 HSTS 值,有则同步为 31536000;README 若记载该值一并同步。改动提交 Conventional Commits 中英对照,如 `feat(nginx): HSTS 升长周期 / raise HSTS max-age to one year`。
6. **回滚预案**(仅在验证失败时执行):恢复步骤 2 的备份 conf → `nginx -t` → reload → 复测,并在报告中如实记录。

## 红线

- **只改 HSTS max-age 这一处**,不动任何其他 nginx 指令、不动其他站点配置。
- `nginx -t` 不通过绝不 reload;变更前后 curl 输出留证。
- 服务器上禁止 restart 业务服务、禁止动 systemd、禁止删除任何文件(备份文件保留)。
- 本仓 `ssh-keys/` 入库为 private-only 刻意约定,不要改动;提交前 `git diff --cached` 自查无密钥新增。
- Windows 11 + PowerShell(SSH 用 OpenSSH 客户端)。

## 验收标准

1. 两站 `curl -sI` 均返回 `Strict-Transport-Security: max-age=31536000`,状态 200;
2. 服务器配置备份存在且路径留证;`nginx -t` 输出留证;
3. 仓内模板/README 同步(若有记载处)且 commit 仅含该同步改动;
4. 报告含变更前后完整 curl 头对比。

## 报告要求

完成后**整文件覆盖写入**:
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\HSTSUP-report.md`

模板:`# HSTSUP 结果报告` / `## 结论一句话` / `## 变更前现状` / `## 服务器变更过程` / `## 验证留证(前后对比)` / `## 仓内同步与提交` / `## 自评`
