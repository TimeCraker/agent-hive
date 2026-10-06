# 任务 FIXPSF:独立验收主站部署脚本引号修复(b6101c1)

一句话任务:独立验证已提交的 `scripts/deploy-portfolio-safe.sh` 引号修复(commit `b6101c1`,2026-10-06 00:00,深夜无监督会话产物,从未被独立复核)——验证通过则出验收留证;发现修复不正确/不完整则补修。**不执行真实部署、不碰服务器。**

## 背景(已核实事实,勿重新考古)

- 本仓是 TimeCraker 个人主站 asterforge.top(Next.js 16 standalone + Prisma/SQLite,腾讯云)。**push ≠ 部署**,部署是手动跑 `scripts/deploy-portfolio-safe.sh`(本地段打包/scp → 远程段解压/装依赖/断言/构建/重启/验证)。
- 原始 bug:脚本把一段 bash 经 heredoc/SSH 透传远端执行,**L175 next 版本断言行引号转义缺失**,2026-09-30 起每次部署必挂在断言步,10-03/10-05 两次部署均靠人工手动补完(asterforge-deploy/backups/production/perf-baselines/retests/RETEST-2026-10.md L71 佐证)。
- 已有修复:commit `b6101c1` 将 L175 `require("next/package.json")` 改为 `require(\"next/package.json\")`(1 行 diff)。
- **修复正确性存疑点(你要查的核心)**:远端段由 heredoc 透传,`\"` 在远端变成 `"` 的前提是 heredoc 定界符**未加引号**;若定界符带引号(如 `<<'EOF'`),`\"` 会字面透传,远端收到的反而是错的。深夜会话未留任何验证留证,正确性没人复核过。
- 结构参考:L1-149 为本地段(打包/scp),L150 起为透传远端的命令段(`\$`、`\"` 是透传转义层)。

## 步骤

1. **读懂透传机制**:通读脚本,确认远端段的 heredoc 定界符形态(加引号与否)、转义层数,报告用 3-5 句话说清。
2. **提取验证(修复后)**:以与脚本相同的方式提取远端段文本,检查 L175 断言行在远端实际收到的形态是否为语法正确的 `node -p 'require("next/package.json").version'`;对提取文本跑 `bash -n`。
3. **语法**:`bash -n scripts/deploy-portfolio-safe.sh` 全绿。
4. **最小等价复现**:在系统临时目录写小脚本模拟"heredoc 透传 → 远端执行"(本地 bash 扮演远端,可用本仓 node_modules 的 next 真实版本号),证明透传后版本断言能取到值且比较逻辑可走通。临时文件用完即删。
5. **结论二选一**:
   - ✅ 修复正确 → 报告出验收留证,零代码改动,不 commit;
   - ❌ 修复不正确/不完整 → 最小补修(只动引号/转义相关字符),重复步骤 2-4 验证,提交 Conventional Commits 中英对照如 `fix(deploy): 补正远程段引号透传 / correct remote quoting passthrough`。

## 红线

- **不执行真实部署、不 SSH 服务器、不触发任何生产变更。**
- 修复正确时不做任何代码改动、不 commit(验收留证写进报告即可);只有发现实际缺陷才允许最小 diff。
- 仓内有所有者/并行会话未提交改动时原样保留,只提交自己的最小修复(如需)。
- 不改 `my-portfolio/.next/` 下任何文件(构建产物)。
- Windows 11 + PowerShell;bash 走 Git Bash 语法;提交前 `git diff --cached` 自查。

## 验收标准

1. 透传机制说明 + L175 远端实际收到形态的提取证据(命令与输出留证);
2. 三项验证(bash -n / 提取文本 bash -n / 最小等价复现)各留证;
3. 明确结论:修复正确(验收通过)或补修 diff + 提交哈希。

## 报告要求

完成后**整文件覆盖写入**:
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FIXPSF-report.md`

模板:`# FIXPSF 结果报告` / `## 结论一句话` / `## 透传机制说明` / `## L175 远端形态提取验证` / `## 三项验证留证` / `## 结论(验收通过 / 补修记录)` / `## 自评`
