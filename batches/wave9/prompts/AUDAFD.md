# 任务 AUDAFD:asterforge-deploy 手册真实性审计(只读 + SSH 只读)

一句话任务:核对 asterforge-deploy(生产部署唯一权威手册 + 脚本)的 README/COLD-START 声称与**实际服务器状态、各业务仓现役脚本**的偏差,产出偏差清单,每条附两侧证据。**全只读,不改手册、不改服务器。**

## 背景(已核实事实,勿重新考古)

- 本仓是 AsterForge 生产环境唯一权威部署手册(单机腾讯云 Ubuntu,手动 SSH 部署,push 不自动上线)。`README.md` 是单一真相源(架构/服务表/SOP),`COLD-START.md` 是冷启动手册。
- 已知的一处脱节(作为种子线索,继续扩大战果):主站**现役**部署脚本 `my-portfolio/scripts/deploy-portfolio-safe.sh` 本体在业务仓,本仓 scripts/deploy/ 只有历史脚本(deploy-portfolio-only.ps1 / deploy-portfolio-tarball.ps1 等),手册脚本索引是否反映这一现况——待你核实。
- 2026-10-05/06 近期变更背景:lekao 启用 h2、xiaofanzhuo 补 4 安全头、两站 HSTS 即将/已经升长周期 31536000(同波 HSTSUP 任务在改 nginx 模板与服务器配置)。
- 同工作区另有并行波次在做各仓**文档保鲜审计**(可能正在改本仓 .md);**同波还有 HSTSUP 任务在改本仓 configs/nginx-templates/**——`git status` 看到他们的未提交改动一律忽略,你以 HEAD 基线 + 服务器实况审计。
- SSH 方式以仓内实况为准:服务器 `ubuntu@111.229.200.178`,key 参照仓内脚本惯例(`$env:USERPROFILE\Documents\tencent_server_key.pem` 或本仓 `ssh-keys/tencent_server_key.pem`,以能连通为准)。

## 步骤

1. **手册侧清单化**:从 README 提取可验证陈述——服务表(每个服务:名/端口/systemd unit)、部署 SOP 引用的脚本路径、证书域名清单、关键定时器(systemd timers)。
2. **服务器侧核实(SSH 只读白名单)**:`systemctl list-units --type=service --state=running`、`systemctl list-timers`、`ss -tlnp | grep LISTEN`(或 `sudo ss -tlnp`)、证书(`sudo certbot certificates` 或 `nginx -T` 抽 ssl_certificate 后 `openssl x509 -enddate`)、`df -h`、`free -h`。**只用只读命令。**
3. **本地脚本索引 vs 各业务仓现役脚本**:本仓 scripts/ 声称/索引的部署入口 vs 各业务仓自己的 scripts/(重点:my-portfolio 现役 safe 脚本、lekao/xiaofanzhuo 的部署方式),列出"手册知道但已死"与"现役但手册不知道"两个方向的条目。
4. **逐条比对**:手册声称 vs 实况,一致/漂移/无法核实三态;漂移的给两侧证据(手册行号 + 服务器命令输出摘要)。
5. 汇总写报告。

## 红线

- **SSH 全只读白名单**:上述命令之外一律不执行;禁止任何写/重启/reload/rm/编辑;这是与同波 HSTSUP(它在改配置)的并行避让约定。
- 本地零写入(报告除外);无 git 写操作;不改手册(修正留给下一波,本任务只产出清单)。
- 报告不粘贴任何密钥/key 文件内容;服务器 IP 已在仓内文档公开可引用,SSH 私钥内容绝不引用。
- Windows 11 + PowerShell;China 网络重试 ≤2。

## 验收标准

偏差清单每条 = `手册位置(行号) ‖ 手册声称 ‖ 实况证据(命令+输出摘要) ‖ 严重度(P0-P3) ‖ 建议动作`;至少覆盖:服务表逐行、脚本索引、证书、timers 四类。

## 报告要求

完成后**整文件覆盖写入**:
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AUDAFD-report.md`

模板:`# AUDAFD 结果报告` / `## 结论一句话` / `## 服务表比对` / `## 脚本索引 vs 现役脚本` / `## 证书与定时器` / `## 偏差分级清单(P0-P3)` / `## 自评`
