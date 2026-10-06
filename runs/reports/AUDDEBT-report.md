# AUDDEBT 结果报告

> 任务：xiaofanzhuo / my-portfolio / agent-hive / coding-plan-bench / pwa-hw-voice 五仓只读技术债盘点
> 日期：2026-10-06 · 方式：`git grep` / `git status` / `git stash list` / `git log` 全只读，未改任何仓内文件

## 结论一句话

**五仓代码内真 TODO/FIXME/HACK/XXX 债务标记为 0**（原始 grep 29 处命中全部定性为误报：订单号占位符、设计文档讨论、任务提示词自引用、二进制字节巧合）；真实技术债只有 4 条半——1 条 P1（my-portfolio `vault-auth.ts` 注释自述的密钥静默退化弱点）加 3 条 P2 仓卫生项，整体技术债负担极轻。

## 对账总表

| 仓 | 原始命中① | 真债务标记 | 误报构成 | 未提交改动 | stash |
|---|---|---|---|---|---|
| xiaofanzhuo | 7 | **0** | 7×`ORD-MMDD-XXXX` 订单号格式占位符 | 0 | 0 |
| my-portfolio | 9（2 文本+7 二进制） | **0** | 2×`## / XXX` 设计讨论 + 7×二进制巧合 | 0② | 0 |
| agent-hive | 12 | **0** | 12×wave9 任务提示词自引用（含本任务 AUDDEBT 自身） | 12 M + 8 ??③ | 0 |
| coding-plan-bench | 1（二进制） | **0** | 1×PNG 视觉快照字节巧合 | 0 | 0 |
| pwa-hw-voice | 0 | **0** | — | 0 | 0 |
| **合计** | **29** | **0** | 29 逐条定性完毕 | — | — |

① 命令 `git grep -nE "TODO|FIXME|HACK|XXX\b"`（各仓 exit 码：0/0/0/0/1）。复核命令 `git grep -nE "TODO|FIXME|HACK"` 与 `git grep -nE "\bXXX\b"` 分离交叉验证，结论一致。
② FIXPSF 任务的部署修复已提交为 `b6101c1`，按任务约定忽略该增量。
③ **并行波次运行态改动，非技术债**——详见下文 agent-hive 小节定性。

---

## 各仓盘点

### 1. xiaofanzhuo（已上线 · 社区小饭桌点餐）

**TODO 明细（7 处命中，0 真债）**：全部是订单号规格 `ORD-MMDD-XXXX` 的占位符文本——`docs/PRD.md:386`、`docs/stages/stage-2026-08-p0-mvp.md:38`、`docs/stages/stage-2026-08-p1-ux-fixes.md:109`（「尾号 XXXX」产品文案）、`prisma/schema.prisma:77`、`src/lib/__tests__/order-no.test.ts:23`、`src/lib/order-no.ts:2-3`。`XXXX` 在此是**产品规格**（4 位随机码、剔除易混字符），不是债务标记。

**未提交改动**：`git status --porcelain` 空，`git stash list` 空——干净。

**最近活动**：`228f3e9`（2026-10-06 11:44）docs 保鲜审计修复；近 5 条全是 docs 提交。上线仓代码零债标记、工作区零残留，健康。

### 2. my-portfolio（已上线 · 个人主站）

**TODO 明细（9 处命中，0 真债）**：
- 文本 2 处：`docs/stages/stage-2026-08-project-pages-redesign.md:41` 与 `src/components/project-detail/SectionMark.tsx:2`——均为对「`## / XXX` eyebrow 套路」的**设计讨论/替代说明**（SectionMark 正是为消灭该套路而生的组件），描述性文字非债。
- 二进制 7 处：`public/avatar-96.png`、`avatar-source.png`、`config/asterforge-hub.exe`、`config/clash-config-export.zip`、`images/contact/qq-group-fallback-v1.png`、`wechat-group-fallback-v1.png` 及另 1 处——字节巧合，无意义。

**未提交改动**：porcelain 空、stash 空——干净（FIXPSF 已提交 `b6101c1`）。

**最近活动**：`41fd7ba`（2026-10-06 11:49）docs 过期陈述修正；`b6101c1` 部署脚本修复。活跃维护中。

**顺带核查（重要排除项，有台账条目）**：
- `public/config/clash-config-export.zip`（49.6MB）曾疑为凭证外泄——已读 `public/config/guides/clash.md` 核实：明示「**订阅/节点需你自备（不入包，隐私）**」，包内仅安装器+导入说明，**排除 P0**。
- `public/config/` 是有 Stage Spec 的「工具配置中心」功能（`docs/stages/stage-2026-08-tool-config-center.md` 等 + `ConfigCenter.tsx` + `tool-configs.ts` + admin 后台元数据），`public/config/README.md` 明示「文件手动 commit（方案 A）」——**有意设计，非意外入库垃圾**。GitHub 仓为 **PRIVATE**（gh 核实），但 `/config` 页 canonical 指向 `asterforge.top/config`，页面本身设计为公开下载中心（下载计数是功能）；vault-auth 只守保险箱区（`/config/files`，`src/app/config/files/page.tsx:18,33,121`），架构自洽。
- 但 `src/lib/vault-auth.ts:29-41` 注释自述一个安全弱点 → 见台账 P1。

### 3. agent-hive（太木控制台 · 本任务所在仓）

**TODO 明细（12 处命中，0 真债）**：全部位于 `batches/wave9/batch.json:128-131`、`batches/wave9/prompts/AUDDEBT.md`（本任务提示词自身，9 行）、`batches/wave9/prompts/AUDGM.md:14`——任务定义文本自我引用「TODO/FIXME」，meta 级误报。

**未提交改动（12 M + 8 ??，全部定性为并行波次运行态，非技术债）**：
- `M` 12 个：`AGENTS.md`（所有者对品牌圆徽/状态机词汇的规范迭代 WIP，diff 核实为 wave9 定稿内容）+ `batches/wave{4,8,9}/batch.json` ×3（波次状态机推进，AGENTS.md 明示「状态的唯一真相源，派发/状态变更时写」）+ `batches/wave9/prompts/FIXPSF.md` + `runs/reports/*.md` ×7（并行波次更新各自报告）。
- `??` 8 个：`runs/reports/{AUDGM,AUDVBS,AUDVSW,FIXPSF,HSTSUP,LEK,ROOTDOC,SEX}-report.md`——并行波次新产出报告。
- 以上属「波次收口提交」既定节奏（wave4 `2f961c5`、wave8 `eec2b4a` 均有收口 commit 先例），**按任务要求单独标注：并行波次文档/状态改动，非技术债**。
- 附带发现：`git diff` 对 13 个文本文件全程刷 LF→CRLF 警告——`core.autocrlf=true` 且仓内**无 `.gitattributes`**（双命令核实）→ 台账 P2。

**最近活动**：`eec2b4a`（2026-10-06 11:47）wave8 RES 跳过收口。运行中波次仓，节奏正常。

### 4. coding-plan-bench（已上线 · 模型测速台）

**TODO 明细（1 处命中，0 真债）**：`tests/e2e/visual.spec.ts-snapshots/workbench-375-light.png`——二进制快照字节巧合。

**未提交改动**：porcelain 空、stash 空——干净。

**最近活动**：`5d46bd7`（2026-10-06 11:57）docs 保鲜修正；此前 4 条全是 CI 视觉快照修复。零债标记。

### 5. pwa-hw-voice（未启动 · 归档协议）

**TODO 明细**：0 命中（grep exit 1）。

**未提交改动**：porcelain 空、stash 空——干净。

**最近活动**：`16331da`（2026-08-29）唯一一次提交（仓库初始化归档协议）。纯归档仓，零债零漂移，符合「未启动仅归档」定位，无需动作。

---

## 分级技术债台账（P0-P3）

合并规则：同模式多处合并为一条。**P0/P1 每条附路径:行号。**

### P0（安全/线上正确性）—— 0 条

两个候选已排查排除：①clash 包凭证泄露（指南明示订阅不入包，见 my-portfolio 小节）；②vault-auth 弱密钥降为 P1（条件触发、未证实线上已漏配）。

### P1（功能正确性/部署链路）—— 1 条

| # | 债 | 证据 | 建议 |
|---|---|---|---|
| P1-1 | **vault 会话密钥静默退化**：production 漏配 `ADMIN_SESSION_SECRET` 时，HMAC 签名密钥退化为 `ADMIN_PASSWORD` 派生（注释自述该密码仅 4 位、token 被捕获后可离线穷举 10⁴ 还原密钥），**只 console.warn 不 fail-fast**——vault 会话存在被伪造面。代码注释自我承认的已知弱点 | `my-portfolio/src/lib/vault-auth.ts:29-41`（`getSecret()`：`return ADMIN_SESSION_SECRET \|\| ADMIN_PASSWORD \|\| ""`）；注释自称「镜像 admin-auth 模式」，同模式疑存在于 admin-auth（未逐行核实） | production 下缺配置/长度<32 直接抛错拒启；顺手核查线上 `.env` 是否确已配置（若已漏配则本条升 P0） |

### P2（质量/卫生）—— 3 条

| # | 债 | 证据 | 建议 |
|---|---|---|---|
| P2-1 | **my-portfolio 约 60MB 二进制入库**：克隆与 standalone 构建产物膨胀；README 自约「>100MB 改外链」，clash 单文件 49.6MB 已达半线。定性：方案 A 有意设计，债在趋势非行为 | `public/config/clash-config-export.zip`（49.6MB）、`asterforge-hub.exe`（5.9MB）、`hibit-uninstaller-setup.exe`（4.5MB）+ 20 余个 zip（`git ls-files` 全量留证）；约定见 `public/config/README.md` | clash 安装器改外链或 LFS；新增大文件前先过 README 约定 |
| P2-2 | **构建产物手动同步无校验**：`asterforge-hub.exe` 由 `hub/` 源码手动打包入库（最后同步于 `d2ee569` v0.1.18），源码再改而忘重打包即版本漂移，无哈希/版本对账 | `public/config/asterforge-hub.exe` ↔ `hub/package.json`；入库提交 `d2ee569` | 打包脚本化（版本号写入 exe 元数据，admin 侧展示并对账） |
| P2-3 | **agent-hive 无 EOL 统一配置**：`core.autocrlf=true` + 仓内无 `.gitattributes`（双命令核实），13 个文本文件 diff 刷屏 LF→CRLF 警告，跨机协作有整文件假差异风险 | `git diff --stat` 输出 13 条 warning；`ls .gitattributes` 不存在 | 加 `.gitattributes`（`* text=auto eol=lf` 或按类型声明），一次性归一 |

### P3（锦上添花）—— 2 条

| # | 债 | 证据 | 建议 |
|---|---|---|---|
| P3-1 | agent-hive 波次运行态文件（batch.json 状态 + 16 个报告 M/??）在波次进行期保持未提交——**既定收口节奏，非债**；仅波次并行数高时收口周期拉长 | wave4/wave8 收口 commit 先例；当前 20 个未提交文件全为波次产出 | 可选：多波并行时按日中途提交一次 runs/ 快照 |
| P3-2 | pwa-hw-voice 纯归档单提交仓——零债零漂移，符合定位 | 唯一提交 `16331da`（2026-08-29） | 无动作；启动开发时再建 Stage Spec |

**台账合计：6 条（P0=0 / P1=1 / P2=3 / P3=2），对账：原始 grep 命中 29 行 → 真债务标记 0；台账 6 条中 1 条（P1-1）为扫描期间发现的注释自述安全弱点（非 TODO 标记），其余 5 条为仓卫生/流程项（源自未提交改动盘点与二进制入库核查）。**

---

## 自评

- **覆盖**：五仓 × 四项检查（grep / status / stash / log）全部执行，关键定性均有二次命令交叉验证（TODO 与 XXX 分离 grep、gh 可见性、clash 指南全文、vault-auth 源码、.gitattributes 存在性），报告内留证。
- **误报处理**：29 处原始命中逐条定性为四类误报（订单号占位符 / 设计讨论 / 提示词自引用 / 二进制巧合），无一处「疑似」悬置。
- **红线遵守**：全程只读（git grep / status / stash list / log / ls / gh view / 文件头读取），除本报告外零写入，无任何 git 写操作，未进入排除目录。
- **局限**：①P1-1 是否线上实际触发未验证（需服务器 `.env`，超出本地只读范围），admin-auth 同模式疑点未逐行核实；②二进制命中未解包逐字节核对，以文件性质 + 指南 + Stage Spec 交叉定性；③`\bXXX\b` 理论上仍可能漏极少数句中变体，但在五仓 TODO/FIXME/HACK 均为零命中的交叉证据下，漏检风险可忽略；④my-portfolio 部署侧（nginx 是否直拦 `/config/*` 直链）未探，因页面设计本为公开下载中心，不构成债。
