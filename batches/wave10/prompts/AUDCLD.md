# 任务 AUDCLD:~/.claude 配置仓安全与卫生审计(只读)

一句话任务:对 `C:\Users\TimeCraker\.claude`(Claude Code 配置根目录,本身是 git 仓)做**只读**安全与卫生审计——**被追踪配置文件的密钥检查为最高优先**、一致性抽查、磁盘体积台账——产出分级清单。**报告零密钥明文;会话转录内容绝对禁读。**

## 背景(已核实事实,勿重新考古)

- 本目录是 git 仓:远端 `github.com/TimeCraker/claude-config`(私有),HEAD `fcaa819`,追踪 239 文件。
- **白名单 .gitignore 模式**:`/*` 默认忽略一切,仅放行 `.gitignore / README.md / CLAUDE.md / settings.json / mcp-servers-shared.json` 五文件 + `rules/ commands/ skills/ cc-toolkit/` 四目录。
- 凭证文件(`zhipu.env` / `baidu.env` / `volcengine.env` / `volcengine-coding.env` / `.credentials.json`)**未被追踪**(白名单设计如此)——不要重新验证结论,但可 stat 其权限。
- cc-toolkit/ 是根仓子目录(非独立仓,158 个追踪文件):含 `settings/`(settings.zhipu.json 等 5 份 provider settings)、`switches/`(switch-to-zhipu-codingplan.ps1 等 12 个切换脚本)、sync 引擎等。工作区文档称它对应 claude-config 仓。
- 运行时大目录(均被 ignore):`projects/` 590.5MB(会话转录)、`security/` 13.1MB、`plugins/` 10.6MB、`file-history/` 9.7MB。
- rules/ 曾于 2026-09 重组(旧 coding-conduct.md 与 feedback_*.md 下线,新 engineering-conduct.md / interaction-conduct.md)。

## 步骤

1. **被追踪文件密钥检查(最高优先)**:
   - 逐份读 `settings.json`、`cc-toolkit/settings/settings.*.json`(5 份)、`mcp-servers-shared.json`,查 `ANTHROPIC_AUTH_TOKEN` / `apiKey` / `token` / `Bearer` / `sk-` 等形态。**关键判定**:值是真实 key(高熵/前缀形态)、环境变量引用(`${VAR}`/`$env:`)、还是占位符——报告只写 路径+字段名+性质,值脱敏 `<redacted>`。
   - 检查 12 个 switch 脚本:是否从 env 文件读 token(安全)还是硬编码(危险);脚本引用的 settings 路径是否都存在。
2. **git 全历史扫描**:`git log --all -p` 管道 grep 密钥形态(参考:config/codex-dotfiles 审计曾用高熵模式全历史扫描);`git grep <模式> $(git rev-list --all --max-count=200)` 或等价方式;历史中 settings 文件是否曾含真实 key。
3. **一致性抽查**:
   - README.md / CLAUDE.md 声明的结构与实际目录逐条核对;
   - rules/ 实际文件 vs "重组后"声明(旧文件应已删);
   - skills/ 目录 vs settings.json 或 CLAUDE.md 的注册/索引;
   - cc-toolkit 内 README/同步说明 vs 实际 sync 脚本行为(静态读码)。
4. **磁盘卫生台账**:对 projects/ security/ plugins/ file-history/ debug/ paste-cache/ 等**只做统计**(文件数/总大小/mtime 最早-最新分布),给出"哪些可安全清理、预计回收多少"的建议;`history.jsonl`(504KB)与 `settings.previous.backup.json` 只查结构不逐行读。
5. 汇总写报告。

## 红线

- **报告零密钥明文**:任何 token/key 只以 `路径:字段 + 性质判断` 出现,值一律 `<redacted>`。
- **会话转录绝对禁读**:`projects/`、`file-history/`、`sessions/`、`shell-snapshots/`、`todos/` 等运行时目录的内容一个字节都不读(隐私),只允许 stat/du 类统计;`.credentials.json` 与四个 `.env` 文件同样禁读内容,只 stat 权限。
- 只读:除报告文件外零写入;无 git 写操作;不执行任何 switch/sync 脚本(它们会改 settings.json);不 install。
- 报告写入工作区路径(见下),不在 ~/.claude 内留任何文件。
- Windows 11 + PowerShell;China 网络重试 ≤2。

## 验收标准

1. 密钥检查覆盖全部被追踪的 json/脚本(命令与逐文件结论留证);
2. git 历史扫描命令 + 命中数(或 0 命中)留证;
3. 一致性抽查至少覆盖 README/CLAUDE.md/rules/skills 四处;
4. 磁盘台账含 7 个运行时目录的 文件数/大小/mtime 跨度;
5. 分级清单 P0-P3 每条附路径或命令输出证据;报告全文无密钥值(自检后交付)。

## 报告要求

完成后**整文件覆盖写入**:
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AUDCLD-report.md`

模板:`# AUDCLD 结果报告` / `## 结论一句话` / `## 被追踪文件密钥检查` / `## git 历史扫描` / `## 一致性抽查` / `## 磁盘卫生台账` / `## 分级问题清单(P0-P3)` / `## 自评`
