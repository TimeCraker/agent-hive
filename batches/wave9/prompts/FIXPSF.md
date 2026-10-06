# 任务 FIXPSF:修复主站部署脚本引号 bug

一句话任务:定位并修复 `scripts/deploy-portfolio-safe.sh` 远程执行段的嵌套引号 bug(2026-09-30 起每次部署必挂在 next 版本断言步),本地验证修复正确性,最小 diff 提交。**不执行真实部署、不碰服务器。**

## 背景(已核实事实,勿重新考古)

- 本仓是 TimeCraker 个人主站 asterforge.top(Next.js 16 standalone + Prisma/SQLite,腾讯云 Ubuntu + nginx + systemd)。**push ≠ 部署**,部署是手动跑 `scripts/deploy-portfolio-safe.sh`(上传 tarball → 远程解压 → pnpm install → next 版本断言 → prisma 同步 → build → 重启 → 7 项验证)。
- 脚本把一段 bash 命令经 heredoc/SSH 透传到远端执行。**L173-180 的 next 版本断言步存在嵌套引号 bug**:L175 `INSTALLED_NEXT=\$(node -p 'require(\"next/package.json\").version')` 这类写法在透传后远端收到的命令引号失衡/语义错误,导致断言步每次中断。
- 证据链:2026-09-30 实录(next 16.2.9 残留上线后补此断言);2026-10-03、2026-10-05 两次部署均"在 next 版本断言步因嵌套引号中断,已手动补完"(见 asterforge-deploy/backups/production/perf-baselines/retests/RETEST-2026-10.md L71)。wave7 验收记录将其列为立项修复待办。
- 全脚本结构参考:L1-149 为本地段(打包/scp),L150 起为透传远端的命令段(注意 `\$`、`\"` 是为透传而做的转义层)。

## 步骤

1. **读懂结构**:通读全脚本,搞清远端命令段如何透传(heredoc 定界符是否加引号、转义层数),在报告里用 3-5 句话说明透传机制。
2. **复现根因**:用只读方式提取远端段文本(如模拟 heredoc 展开后输出到临时文件),展示 L173-180 断言步在远端实际收到的命令文本,指出引号失衡的确切位置。
3. **最小修复**:只改引号/转义相关字符,使远端收到的断言命令语义正确。**禁止顺手重构其他部分**;每行改动必须能对应到本 bug。
4. **验证(全部本地,不部署)**:
   - `bash -n scripts/deploy-portfolio-safe.sh` 语法全绿;
   - heredoc 展开验证:再次提取修复后的远端段文本,断言步命令文本经 `bash -n` 通过;
   - 最小等价复现:在系统临时目录(如 `$env:TEMP`)写一个小脚本模拟"透传→远端执行"(本地 bash 扮演远端),证明 `node -p 'require("next/package.json").version'` 在透传后能正确输出版本号字符串。临时文件用完即删。
5. **提交**:检查 `git status` 只提交本脚本改动,Conventional Commits 中英对照,如 `fix(deploy): 修复部署脚本远程段引号 / fix quoting in remote deploy script`。仓内有 husky/commitlint 钩子,遵守即可。**不得混入任何无关文件。**

## 红线

- **不执行真实部署、不 SSH 服务器、不触发任何生产变更**;修复只落在本仓脚本文件。
- 不改 `my-portfolio/.next/standalone/` 下的任何文件(构建产物,build 时自动再生,手改无效且污染)。
- 仓内可能有所有者未提交的改动:`git status` 发现后**原样保留**,只提交自己修复的文件。
- Windows 11 + PowerShell;bash 命令走 Git Bash 语法。
- 提交前 `git diff --cached` 自查无密钥、无无关文件。

## 验收标准

1. 复现证据:修复前远端段断言步的失衡命令文本(报告引用);
2. 修复后三项验证全绿(语法/展开/最小复现)各有命令与输出留证;
3. `git diff` 只含引号修复相关改动(预期 <10 行);
4. commit 落库,工作区干净(除所有者原有改动)。

## 报告要求

完成后**整文件覆盖写入**:
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FIXPSF-report.md`

模板:`# FIXPSF 结果报告` / `## 结论一句话` / `## 透传机制说明` / `## 根因复现(修复前)` / `## 修复内容` / `## 验证留证` / `## 提交记录` / `## 自评`
