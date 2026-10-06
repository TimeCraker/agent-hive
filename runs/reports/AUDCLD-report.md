# AUDCLD 结果报告

- **对象**:`C:\Users\TimeCraker\.claude`(git 仓,远端 `github.com/TimeCraker/claude-config` 私有,HEAD `fcaa819` = origin/main,133 commits,239 个追踪文件)
- **日期**:2026-10-06 | **方式**:只读(未执行任何 switch/sync 脚本、无 git 写操作、`~/.claude` 零写入)
- **红线遵守**:报告全文零密钥值(值一律 `<redacted>`,掩码仅为字符类别);`projects/`、`file-history/`、`sessions/`、`shell-snapshots/`、`todos/` 等运行时目录仅做 stat/find 统计,内容未读;`.credentials.json` 与 4 个 `.env` 仅 stat 权限。

## 结论一句话

无 P0:切换脚本无硬编码密钥、凭证 env 文件与会话转录均未进 git、MCP 共享配置无凭证;但根 `settings.json` 的**活跃智谱 API key 以明文随 9 个提交存在于私有远端**(README L9 已明文豁免该做法,属"已知接受风险"),且 **3 个不同 Zhipu 形态 key 永久留存于 git 历史**;一致性总体良好(核对 6 处,仅 2 处小漂移);磁盘大头是 `projects/` 转录 592MB,常规可清理项约 26MB。

## 被追踪文件密钥检查(最高优先)

**方法**:逐文件读 + PowerShell `ConvertFrom-Json` 分类(值只输出 性质/长度/字符掩码);`grep -nEi 'AUTH_TOKEN|apikey|secret|bearer|sk-|\.env'` 扫 12 组切换脚本并经脱敏管道输出。

### 逐文件结论

| 文件 | 字段 | 性质判定 |
|---|---|---|
| `settings.json`(追踪,工作树=HEAD) | `env.ANTHROPIC_AUTH_TOKEN` | **真实 key**(Zhipu 形态 `32hex.16alnum`,len=49,字面量)`<redacted>` |
| `settings.json` | 其余 env / model / hooks / enabledPlugins | BASE_URL、模型名、数值、官方插件名,非敏感 |
| `mcp-servers-shared.json`(追踪) | 3 个 server 的 env | 空 `{}` 或常量(`BLENDER_HOST/PORT`),**无凭证** |
| `cc-toolkit/settings/` 9 份模板(zhipu/zhipu-flash/baidu/deepseek/minimax/openrouter/volcengine/volcengine-coding/xiaomimimo-desktop) | `env.ANTHROPIC_AUTH_TOKEN` | **全部为占位符**:纯大写字母+下划线(分隔符字符码=95),零数字零小写,不构成凭证;切换脚本运行时以真实 key 覆写此字段(如 `switch-to-deepseek-payg.ps1:171`) |
| `cc-toolkit/switches/settings.xiaomimimo-desktop.json`(追踪,与上者双副本) | `env.ANTHROPIC_AUTH_TOKEN` | `mimo-proxy`(布尔验证 TRUE)——本地回环 `127.0.0.1:18080` 代理占位,非云端凭证 |
| 12 组切换脚本(`switch-to-*.{ps1,bat}`,23 个追踪文件) | — | **无硬编码密钥**。统一三级取 key:`$env:VAR` → `~/.claude/<provider>.env` 缓存 → 现有 settings.json,校验格式后确认写入 env 缓存(未追踪)并覆写 settings.json;openrouter 脚本校验 `sk-or-v1-` 前缀(:51) |
| `zhipu.env` `baidu.env` `volcengine.env` `volcengine-coding.env` `.credentials.json`(均未追踪) | — | 仅 stat:64–2951 bytes,ACL 为 Windows 默认继承(SYSTEM/Administrators/本机用户 Full);内容未读 |
| `deepseek.env` `minimax.env` `openrouter.env` | — | 当前不存在(脚本对缺失缓存有优雅降级,非问题) |

**脚本引用路径核对**:`cc-toolkit/settings/` 9 份被引用模板全部存在 ✓;xiaomimimo 脚本主模板路径 `Desktop\my_workspace\config\mimo-llm-proxy\...`(含旧路径)均不存在,靠脚本内 fallback 到 switches 本地副本(内容与 settings/ 版一致)。

## git 历史扫描

**方法**:`git log --all -p`(133 commits)管道 grep 分类计数 + `git grep -E <模式> $(git rev-list --all)` 定位 + `git log --all -S"$TOKEN"` 溯源(token 经 shell 变量传递,命令行与输出均未出现明文)。

| 模式 | 命中 | 判定 |
|---|---|---|
| `sk-[A-Za-z0-9_-]{16,}` | 2 行 | **误报**:`skills/ui-ux-pro-max/data/stacks/{winui,wpf}.csv` 文档 URL 中 `ta`+`sk-based-async…` 子串;无真实 sk- key |
| Zhipu 形态 `[A-Fa-f0-9]{32}\.[A-Za-z0-9]{16}` | 28 行 / 119 个 (commit,settings.json) 对 / **去重 3 个不同值** | 唯一载体文件 = `settings.json`;3 key = 2 个已轮换 + 1 个当前活跃 |
| `Bearer …{16,}` | 0 | 无 |
| 被排除 skills(cc-chat-curate/change-brief)历史追踪 | 0 | 从未进 git ✓ |
| 40+ 字符高熵串 | 926 个唯一 | 模式级复核均为数据文件内容(CSV/base64/哈希),无凭证形态;未逐条人工复核(见自评) |

**`ANTHROPIC_AUTH_TOKEN` 历史值形态分布**(awk 掩码分类,65 行):len=49 × 3 组真实形态(16/8/4 行,其中 16 行组掩码与当前活跃 key 一致);len=46(7 行)与 len=77(2 行)为其他 provider 历史 key;len=44(2 行)主体为非字母数字字符,疑似历史中已被人工掩码的值;len=18–30 大写占位(模板)与 len=10(`mimo-proxy`)为非凭证。

**溯源**:当前活跃 key 出现于 **9 个提交**,最早 `3a504a0`(2026-08-17 sync auto),引入提交 `591ed7d`(切换 Provider 至智谱);`git grep -F origin/main` 命中 1 行 → **已存在于 GitHub 私有仓**。仓库首提交 `a7474df`(2026-08-08)的 settings.json 即含 1 行 Zhipu 形态 key——该做法自建仓起持续。settings.json 自始至今是唯一含真实 key 的文件。

## 一致性抽查

| 核对项 | 结论 |
|---|---|
| README「关键路径」表 11 项 vs 实际 | 10 ✓;**`cc-toolkit/legacy/` 声称存在、实际缺失 ✗**(install/ 存在) |
| README 声明 sync 行为 vs `cc-toolkit/sync/sync.mjs`(252 行,静态读) | ✓ MCP 提取脱敏:`/KEY\|TOKEN\|SECRET/i → ${VAR}`(sync.mjs:78,当前 shared 文件 env 全空未触发);push=add+commit+push、pull=`git pull --rebase` ✓;`spawnSync` 参数数组防注入(:56-58);另有"复活野文件/脏写回"拦截(:164-194) |
| CLAUDE.md vs 实际 | ✓ 用户画像 + 10 条工作规则,与会话注入版本一致 |
| rules/ vs 重组声明 | ✓ 仅 `engineering-conduct.md` + `interaction-conduct.md`;旧 `coding-conduct.md`、`feedback_*.md` 已从树与追踪中清除 |
| skills/ vs 索引 | ✓ 8 个追踪目录全部含 `SKILL.md`;settings.json 无 skill 注册项(enabledPlugins 仅 4 个官方插件);.gitignore 排除的 cc-chat-curate/change-brief 本机不存在(跨设备规则) |
| commands/ | ✓ 2 个(claude-code-config、server-status) |
| projects/ 追踪物 | `projects/CLAUDE-projects/Rag-Enterprise-Knowledge-Base.md` 为跨项目业务知识文档(.gitignore 白名单有意放行),密钥形态命中 0;含商业信息(客户/预算/演示地址),私有仓内自担 |
| 工作树状态 | 2 个未提交修改:settings.json(model 字段 `claude-fable-5-1[1m]`→`glm-5.3[1m]`)、xiaomimimo 脚本(模板路径更新,但新路径同样不存在,仍走 fallback) |

## 磁盘卫生台账

| 目录 | 文件数 | 大小 | mtime 跨度 |
|---|---|---|---|
| projects/(会话转录) | 739 | 592MB | 2026-08-08 .. 2026-10-06 |
| security/ | 1004 | 15MB | 2026-09-07 .. 2026-10-06 |
| plugins/ | 567 | 11MB | 2026-08-08 .. 2026-10-06 |
| file-history/ | 912 | 11MB | 2026-06-07 .. 2026-09-30 |
| debug/ | 3 | <1MB | 2026-09-26 |
| paste-cache/ | 43 | <1MB | 2026-09-07 .. 2026-09-30 |
| shell-snapshots/ | 10 | <1MB | 2026-09-10 .. 2026-10-06 |
| sessions/ | 4 | <1MB | 2026-10-06 |
| todos/、stats-cache/ | — | 不存在 | — |

其它:`.git` 1.9MB;`history.jsonl` 516,109B / 1469 行(结构 `display/pastedContents/timestamp/project/sessionId`,密钥形态命中 0,保留);`settings.previous.backup.json` 1,696B;`~/.claude` 总计 638MB。

**清理建议**(保不保留你拍板):①安全清理——file-history(912 文件≈11MB,止于 09-30)+ paste-cache(43)+ debug(3)≈ **11MB**;security/ 15MB 扫描产物清旧留新、plugins/ 11MB 市场缓存可再取,合计常规可回收 **约 26MB**;②需决策——projects/ 592MB 为活跃会话转录,建议归档压缩而非删除,可另回收最多空间。

## 分级问题清单(P0-P3)

**P0:无。**

- **P1-1 活跃 API key 明文存在于私有远端**。证据:`git grep -F "$TOKEN" origin/main` 命中 1 行;`git log --all -S"$TOKEN"` 9 个提交(最早 `3a504a0` 2026-08-17)。README L9 已声明"私有仓允许明文凭证"——定性为**已知接受风险**;残余面:协作者/token 泄露时无法从历史撤除。可选缓解:改 `${VAR}` 引用 + `settings.local` 化,或至少准备"轮换即止损"流程。我的建议/你拍板。
- **P1-2 历史永留 3 个 Zhipu key + ≥2 个其他 provider 历史 key(len46/77)**。证据:H4 掩码分布(3 组 len49 + len46×7 行 + len77×2 行)。旧 key 若未在对应控制台撤销则暴露持续。建议:到各控制台确认旧 key 已失效;如需彻底清除须改写历史 + force push + 各端重克隆,成本高,默认不做。

- **P2-1 本地明文副本**:`settings.previous.backup.json`(未追踪)含活跃 key(Zhipu 形态命中 1,掩码与活跃 key 一致)——switch 脚本设计产物,仅本机;建议纳入定期清理或权限收紧。
- **P2-2 README 漂移**:声明 `cc-toolkit/legacy/` 存在,实际缺失(上表 ✗ 项)。
- **P2-3 xiaomimimo 模板三重不稳**:主模板路径(config/ 与旧 mimo-llm-proxy/ 均 ABSENT)依赖 fallback;switches/ 与 settings/ 双副本漂移风险;相关修复仍是未提交脏改动。
- **P2-4 追踪 0 字节空文件**:`cc-toolkit/switches/Baidu`、`Volcengine`(git ls-files 可见);.gitignore 只排除了 `/cc-toolkit/switches/Zhipu`,规则与现状不一致。

- **P3-1 磁盘清理**:见台账,常规约 26MB,projects/ 592MB 归档另计。
- **P3-2 .gitignore 陈旧规则**:`/skills/cc-chat-curate/`、`/skills/change-brief/` 本机无对应目录(跨设备防护规则,无害,仅记录)。
- **P3-3 凭证文件 ACL 默认继承**(SYSTEM/Admins/本机用户 Full):单人单机可接受;如需收紧可 `icacls` 去继承仅留本机用户。

## 自评

1. **验收对照**:①密钥检查覆盖全部被追踪 json/脚本(10+1 份 settings 逐文件结论 + 23 个脚本文件,命令与结论留证)✓;②历史扫描命令 + 命中数全留证(sk- 2 行误报、Zhipu 形态 28 行/3 值、Bearer 0、高熵 926)✓;③一致性覆盖 README/CLAUDE.md/rules/skills + sync 引擎/commands/projects 共 8 处 ✓;④磁盘台账 8 个现存运行时目录(超 7 个要求)均含 文件数/大小/mtime 跨度 ✓;⑤P0-P3 每条附路径或命令输出证据 ✓。
2. **密钥自检**:交付前对报告文件 grep `Zhipu 形态/sk- 真实形态/Bearer` 正则,命中数 0(见下);全文值仅 `<redacted>`、长度与字符类别掩码。
3. **限制与如实声明**:①PowerShell 解析 history.jsonl 首行报错时,错误流回显了 1 行用户历史(约 1 条提问文本),已进入审计会话上下文,但**未写入本报告**;②946→926 个高熵串为模式级复核,未逐条人工判定;③len=44 历史值"疑似人工掩码"为形态推断;④未运行 `node --check` 等任何执行类验证(只读约束);⑤历史密钥"已轮换"依据是形态去重,是否已在 provider 侧失效需控制台确认(P1-2 建议)。
