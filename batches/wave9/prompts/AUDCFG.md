# 任务 AUDCFG:config/ 配置中心安全审计(只读,重点密钥)

一句话任务:对 config/(工作区统一配置与工具中心)做**只读**安全与卫生审计——**密钥泄漏扫描为重点**、README 同步方式真实性抽查、git 卫生盘点——产出分级清单。**报告里严禁出现任何密钥明文。**

## 背景(已核实事实,勿重新考古)

- `config/` 内含 6 个子目录:`antigravity-config/`、`codex-dotfiles/`、`cursor-dotfiles/`、`pi-config/`、`dsh-config/`(对应 `~/.dsh`)、`dsh-claude-import/`、`mimo-llm-proxy/`(小米 MiMo 免费额度反代,端口 18080,**首次 push 前须轮换 token** 的历史约定)。
- 各子目录有自己的 README.md/AGENTS.md 说明同步方式。
- 同工作区另有并行波次在做各仓**文档保鲜审计**(只改 .md);`git status` 里的 .md 未提交改动是他们的,原样保留。

## 步骤

1. **密钥泄漏扫描(最高优先)**:对 git 追踪的全部文件做模式扫描(`git grep -nE` 常见密钥形态:sk-、api[_-]?key、token[:=]、secret[:=]、AKIA、ghp_、-----BEGIN 等;`git grep` 不会漏历史暂存)。命中即记录:文件路径+行号+变量名+**性质判断**(真实值/示例值/占位符)。**报告只写路径与判断,绝不抄值。**
2. **mimo-llm-proxy token 轮换核实**:README 说"首次 push 前须轮换 token"——用 `git log --oneline --all -- <相关文件>` 与 diff 判断轮换是否发生过(时间线证据),不下绝对结论,给"已轮换/未轮换证据/无法判断"三选一。
3. **同步真实性抽查**:各子目录 README 声称的同步方式(如 dsh-config ↔ ~/.dsh),抽查 2-3 个文件两侧是否实际一致(diff),不一致即漂移条目。**注意:只读比对,不改任何一侧。**
4. **git 卫生**:各子目录 `git status` 未提交/未跟踪文件盘点(子目录可能是独立仓或共享仓,以实况为准)。
5. 汇总写报告。

## 红线

- **报告零密钥明文**:任何 token/key/password 只以 `路径:行号 + 变量名 + 性质判断` 形式出现,值一律脱敏为 `<redacted>`。
- **只读**:除报告外零写入;无 git 写操作;不改 ~/.dsh 等任何用户目录(只读比对可以)。
- 不碰兄弟仓;Windows 11 + PowerShell;China 网络重试 ≤2。

## 验收标准

1. 密钥扫描覆盖 6 个子目录全部 git 追踪文件,扫描命令与命中数留证;
2. 报告全文无任何疑似真实密钥值(自检一遍再交);
3. 分级清单 P0-P3,每条附路径证据。

## 报告要求

完成后**整文件覆盖写入**:
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AUDCFG-report.md`

模板:`# AUDCFG 结果报告` / `## 结论一句话` / `## 密钥扫描结果` / `## token 轮换核实` / `## 同步真实性抽查` / `## git 卫生` / `## 分级问题清单(P0-P3)` / `## 自评`
