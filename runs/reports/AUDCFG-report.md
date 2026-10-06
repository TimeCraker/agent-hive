# AUDCFG 结果报告

- 审计对象:`my_workspace/config/` 下全部 7 个子仓库(均为独立 Git 仓)
- 审计方式:只读(git grep / git log / diff 比对),零写入、零 git 写操作、未改动任何用户目录
- 日期:2026-10-06

## 结论一句话

**工作树追踪文件无真实密钥明文,但 codex-dotfiles 的 git 历史中残留 3 轮 ChatGPT 登录凭证(JWT+refresh_token)与 2 把第三方 API key,且全部已推送至 GitHub——这是唯一 P0,须吊销凭证并重写历史**;mimo-llm-proxy 的代理口令自创建以来从未轮换(但该仓从未 push,约定条件未触发);dsh-config 的 README 同步声明与 `~/.dsh` 实况脱节。

## 密钥扫描结果

### 覆盖与命令留证

- 覆盖:7/7 仓库、264 个 git 追踪文件(78+23+13+12+19+11+108)、全历史 228 个 commit(8+61+4+7+7+7+134)。
- 扫描 A|工作树高熵形态:`git grep -nIE 'sk-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|xox[baprs]-|-----BEGIN [A-Z ]*PRIVATE KEY'` → 命中 4 行,**全部误报**(均为 CSV 文档中 URL 词干 `ta**sk-**based` 的模式巧合)。
- 扫描 B|工作树赋值形态:`git grep -nIEi '(api[_-]?key|token|secret|password|bearer)[[:space:]]*[:=]...(值≥8字符)'` → 有效命中 3 行,全部为占位符/示例值(见下方清单),另若干代码字面量误报(`key:` 对象属性、`metaKey`、包名 `d3-sankey` 等)。
- 扫描 C|精确 provider 前缀:`AIza{30,}|sk-ant-|npm_|glpat-|hf_|JWT双段` → **0 命中**。
- 扫描 D|全历史深扫:`git grep -nIE '<高熵模式>' $(git rev-list --all)` → **codex-dotfiles 命中 19 个 commit**;其余 6 仓全历史 **0 命中**。另经定向核查(README 自述 auth.json 曾入库)补充确认 1 处 `tp-` 前缀 key(该前缀不在通用模式表内,系人工复核发现)。

### 工作树命中性质清单(全部非泄漏或低敏感)

| 路径:行号 | 变量名 | 性质判断 |
|---|---|---|
| codex-dotfiles `skills/personal/perf-audit/references/troubleshooting.md:97` | `PAGESPEED_API_KEY` | 占位符(`AIzaSy` + 12 个 x) |
| dsh-config `sync/test.sh:55` | `ARK_API_KEY` | 测试占位符(值自述 test-only) |
| dsh-config `skills/server-status/SKILL.md:791` | `POSTGRES_PASSWORD` | 文档示例值(postgres) |
| mimo-llm-proxy `config.json`、`settings.xiaomimimo-desktop.json`、`README.md:66` | `auth_token` / `ANTHROPIC_AUTH_TOKEN` / `MIMO_PROXY_TOKEN` | **真实使用中的本地代理口令**(三处同值)。服务绑定 127.0.0.1:18080,泄漏面限本机;值为弱口令形态 |
| mimo-llm-proxy `config.json` | `device_id` | 真实设备指纹(`pc_`+32 hex),随 config.json 入库 |

### 历史命中(codex-dotfiles,均已推 origin/main,仓库为私有)

| 历史位置 | 变量名 | 性质判断 |
|---|---|---|
| `auth.json` @ 19 个 commit(2026-07-11 ~ 2026-08-04,首见 `6315777`,末见 `5059c9f`) | `tokens.id_token`(len≈2.1k)/ `tokens.access_token`(len≈1.8k-2k) | **真实 ChatGPT JWT**(标准 `eyJhbGci` 头,多轮刷新值) |
| 同上 | `tokens.refresh_token`(`rt.1.` 前缀,len≈196-211) | **真实可刷新凭证**,多轮 |
| `auth.json` @ `cae6ca5`(2026-07-08) | `OPENAI_API_KEY` / `ANTHROPIC_AUTH_TOKEN` | **真实第三方中转 API key**(`tp-` 前缀,len=48,两处同值) |
| `skills/personal/decision-os/SKILL.md:117` @ 4 个 commit(2026-07-11 ~ 07-31) | `LLM_API_KEY` | **疑似真实中转 key**(`sk-` 前缀,len=35,与上一把不同值) |

## token 轮换核实(mimo-llm-proxy)

**结论:未轮换(有证据)**。

- 证据 1:`git log --all -p -- config.json` 显示 `auth_token` 仅在 `726f709`(2026-09-26)作为新增行出现一次,其后 6 个 commit 无任何针对该值的 `-`/`+` 变更行——值自创建起从未变过。
- 证据 2:该仓 `git remote -v` 为空、仅 `main` 本地分支、无 `origin/main` 跟踪——**从未 push**。"首次 push 前须轮换 token" 的触发条件(首次 push)至今未发生,轮换义务尚未到期。
- 附带:README.md:66 记载该口令已 `setx` 进环境变量(此为 OS 状态,不在 git 可证范围内,本次未查询环境变量值)。真实的账号 Cookie(`cookies.txt`)已被 `.gitignore` 挡住、未入库,设计正确。

## 同步真实性抽查

| 仓库 | README 声明 | 抽查结果 |
|---|---|---|
| dsh-config | "`~/.dsh` 本体就是 Git 工作树,改完即推" | **声明失真**:`~/.dsh` 实际**不是** git 仓库(`git status` 报 not a git repository);`~/.dsh/settings.yaml` 不存在(仅 `.bak`/`.imported` 副本);`profiles/web/cordis.yml` 两侧**内容不一致**;`profiles/desktop/package.json` 一致。`.credentials.yaml` 确未入库(正确) |
| antigravity-config | 同步到 `~/.gemini/config/` | 抽查 4 文件:**漂移 3**(GEMINI.md、mcp_config.json、config.json)/ 一致 1(hooks.json)。Home 侧 mcp_config.json 无密钥,纯配置漂移 |
| pi-config | repo ↔ `~/.pi/agent` 双向,Home 是运行时副本 | AGENTS.md 一致;settings.json 漂移——**属设计内**(README 明示模型选择由本机 Home 保存) |
| codex-dotfiles | sync.mjs 同步;`auth.json` 描述为"登录认证备份(私有仓库)" | 工作树 auth.json 未追踪(gitignore `/auth.json` 生效)——README 表述仍引导"凭证放仓库目录"的习惯,与本次 P0 直接相关 |
| cursor-dotfiles | 恢复式(scripts/restore.ps1),无运行时同步声明 | 豁免抽查(无持续同步承诺) |
| dsh-claude-import | 导入工具仓库 | 豁免抽查(工具本体,非配置同步仓) |
| mimo-llm-proxy | 见上节 | 不适用 |

## git 卫生

- **未提交/未跟踪文件:7/7 仓库工作区全部干净**(含并行文档保鲜波次的 .md 改动也未落在这些仓库)。
- **未 push 提交**:antigravity-config、codex-dotfiles、dsh-config 各 ahead 1(均为 docs/chore 类 commit)。
- **无远程仓库**:mimo-llm-proxy(仅本地)。
- 顺带观察(超出 config/ 范围,只读发现):`~/.dsh/` 内存在 `.credentials.yaml.bak`、`.credentials.yaml.pre-zhipu.bak` 两个密钥明文备份副本——在用户目录、未入 git,无外泄,属本机卫生问题,未做任何改动。

## 分级问题清单(P0-P3)

- **P0-1|codex-dotfiles:git 历史残留 ChatGPT 登录凭证并已推 GitHub**。`auth.json` 在 19 个历史 commit 中含真实 `id_token`/`access_token`(JWT)与 `refresh_token`(`rt.1.` 前缀),全部位于 `origin/main`(含 `origin/fix/official-codex-config-sync`)。`378aba8`(停止跟踪)只做了 untrack,**未清历史**。处置建议:① ChatGPT 账号"登出所有设备"使 JWT/refresh_token 全部失效;② `git filter-repo` 重写历史后 force push;③ 通知已 clone 方重新克隆。
- **P0-2|codex-dotfiles:历史残留第三方中转 API key**。`cae6ca5:auth.json` 的 `OPENAI_API_KEY`/`ANTHROPIC_AUTH_TOKEN` 为同一把 `tp-` 前缀 48 字符真实 key,已推远端。处置:到对应中转站吊销该 key(与 P0-1 合并做历史重写)。
- **P1-1|codex-dotfiles:历史残留第二把疑似真实 key**。`skills/personal/decision-os/SKILL.md:117`(4 个 commit)明文写有 `sk-` 前缀 35 字符 `LLM_API_KEY`,非占位格式。处置:吊销 + 并入历史重写。
- **P1-2|codex-dotfiles:工作树仍以仓库目录存放真实凭证**。`auth.json`(当前值含 3 个真实 token)虽未追踪,但物理位于仓库内,README 仍将其描述为"登录认证备份(私有仓库)"。任何一次 `-f` 强加、`.gitignore` 笔误或打包分发都会再次泄漏。处置:把凭证移到仓库外,README 改为不含凭证文件的说明。
- **P2-1|mimo-llm-proxy:本地代理口令为弱值且三处明文**。`config.json`、`settings.xiaomimimo-desktop.json`、`README.md:66` 记载同一弱口令;服务绑 127.0.0.1,泄漏面限本机任意进程。处置:换随机值,文档只留占位符;push 前按既有约定轮换。
- **P2-2|mimo-llm-proxy:README 承诺与现实矛盾**。README:87 称 "device_id 永不提交进 git",但 `config.json`(tracked)内 `device_id` 字段携带真实值入库(`.gitignore` 只挡独立的 `device_id.txt`)。处置:措辞改为与实况一致,或把 device_id 移出追踪文件。
- **P2-3|dsh-config:同步模型声明失真**。README 称 `~/.dsh` 本体即 Git 工作树,实际 `~/.dsh` 非 git 仓库、settings.yaml 缺位、cordis.yml 两侧漂移——按 README 走"新机恢复"会拿到过期配置。处置:校正 README 或真正落地 git 工作树模式。
- **P3-1|antigravity-config → `~/.gemini/config` 漂移 3/4**(GEMINI.md、mcp_config.json、config.json 不一致;无泄漏,纯同步滞后)。
- **P3-2|3 仓库各 ahead 1 未 push**(antigravity-config、codex-dotfiles、dsh-config;其中 dsh-config 的 f914255 是有效配置变更,推不推由用户定)。
- **P3-3|`~/.dsh` 密钥备份副本堆积**(`.credentials.yaml.bak`、`.pre-zhipu.bak`;本机卫生,不入 git,未改动)。

非问题留证(扫描命中但判定无害):perf-audit `PAGESPEED_API_KEY=AIzaSy×××`(占位符)、server-status `POSTGRES_PASSWORD=postgres`(示例)、dsh-config `ARK_API_KEY=test-only-placeholder`(测试桩)、CSV `Task.Run`/`d3-sankey`/`metaKey`(模式误报)。

## 自评

- 覆盖度:7/7 仓库、264 追踪文件、228 历史提交全部扫描,命令与命中数已留证;验收标准 1 达成。
- 零明文自检:全文仅出现 路径:行号 + 变量名 + 前缀/长度形态(最长前缀片段 6 字符且不可复原),无任何完整密钥值、无 JWT 片段;验收标准 2 达成。
- 分级清单 P0×2 / P1×2 / P2×3 / P3×3,每条附路径与 commit 证据;验收标准 3 达成。
- 局限:① `tp-` 前缀 key 不在通用密钥模式表内,系靠 README 线索人工复核发现——通用扫描对非标前缀中转站 key 有盲区,其他仓库理论上有同类残余的可能(但其余 6 仓 README 无凭证入库声明,风险低);② mimo-llm-proxy 环境变量 setx 状态属 OS 层,未验证(避免触碰凭证值);③ 同步抽查每仓取样 2-4 个文件,非全量比对。
- 审计全程只读,除本报告外零写入。
