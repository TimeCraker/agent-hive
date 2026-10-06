# LEK · lekao 文档保鲜度审计报告（Wave 8）

- **日期**：2026-10-06
- **基线**：lekao `main` @ `347ba8c`（审计起点），修正提交 `ace742d`（未 push，本地 ahead 7）
- **范围**：lekao 仓全部 60 份已跟踪 .md 中的**活文档**（README / CLAUDE.md / CHANGELOG / DESIGN / .claude/skills/lekao.md / ai-delivery 索引 / 各状态头）；带日期的历史快照（audits / stages / handoffs / 2026-\* 报告 / lekao-android docs）按仓规「真相源优先级」不回改
- **修正文件**：`CLAUDE.md`、`README.md`、`.claude/skills/lekao.md`，共 11 处过期点
- **commit**：`ace742d` `docs: 修正活文档与代码实况漂移 / fix living-doc drift against code reality`（工作区起点干净，无他人未提交改动；不 push）

---

## ① 过期点清单（已全部当场修正）

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---------|------|------|------|
| 1 | CLAUDE.md §2 标题+正文 | 「T-Coin 扣费——两套模式并存，待收敛」；⚠️ 两个付费 API 扣费时机不一致（summarize 先扣后生成 / batch 成功后扣）；「S01 **要**把…收敛成 reserved→settled\|released」 | 「幂等计费状态机（S01 T-002 **已收敛**」：coin.ts 门面 + coin-ledger.ts 账本，`(userId, idempotencyKey)` 唯一，两路由均已接入 | `src/lib/coin-ledger.ts` 头注（S01 T-002 状态机）；`summarize/route.ts:328,500` + `feedback/batch/route.ts:245,293` 均 reserve/settle/release；`schema.prisma:287` `@@unique([userId, idempotencyKey])` |
| 2 | CLAUDE.md 常用命令 | 「package.json 暴露 **11** 个脚本（src/lib 单测约 **197** 个）」，脚本块缺 test:red / test:e2e / perf:audit | 「**15** 个脚本（src/lib 单测 **241** 个）」，块内补齐三个脚本及用途 | `package.json` scripts 共 15 键；`grep -E "^\s*(it\|test)\(" src/lib --include="*.test.ts" \| wc -l` = 241 |
| 3 | CLAUDE.md scripts 段 | 「只保留运维/生成类」5 项清单 | 补 `perf-audit.mjs`、`e2e-env.mjs`/`e2e-fullflow.mjs`、`diagnose-ai-latency.mjs`/`diagnose-profile-reload.mjs`/`measure-first-load.mjs`、`capture-visual-baselines.mjs` | `ls scripts/` 实况 12 项 |
| 4 | CLAUDE.md Android 段 | 「Android 客户端 lekao-android/ 复用 Web API…」——未提 web-only 决策 | 移动端定版 **web-only**（2026-10-03 owner 决策，S02 CANCELLED，hero APK 入口已移除）；lekao-android/ 冻结于 V1.0.0 仅存档 | `docs/ai-delivery/handoffs/S02-platform-foundation.md`（CANCELLED）；`grep -rn apk src/components/landing/` 为空；`lekao-android/README.md` 冻结注记 |
| 5 | CLAUDE.md 目录速查 | 「Android APK 走 GitHub Releases…（**hero 下载按钮指向 release URL**）」 | 「hero 下载入口已随 web-only 决策移除，见 public/downloads/README.md」 | 同 #4；`public/downloads/README.md` 已有移除注记 |
| 6 | README 项目定位 | 「作业/堂测反馈…（**4 挡**字数：标准/×1.5/×2/×3）」 | 「**5 挡**字数：×0.5/标准/×1.5/×2/×3」 | `src/lib/ai/prompts.ts:178` `summaryLength?: "0.5x"\|"1x"\|"1.5x"\|"2x"\|"3x"`；CHANGELOG v2.3.0 已记 0.5x 档补齐 |
| 7 | README 目录结构树 | dashboard 列「summary / feedback / mistake / **usage-guide**」（usage-guide 非路由）；api 注「auth + summarize + mistake + coin + admin」（coin 顶级目录不存在）；admin 无子项；scripts 仅 2 文件；components/lib 缺 deliver / workflow / coin-ledger / checkin；无 e2e/ | 对齐实况：dashboard 列 7 真实路由；api/admin 子项列全；scripts 补 perf/e2e；加 e2e/、deliver/、workflow/、coin-ledger.ts、checkin.ts | `ls src/app/dashboard/`（feedback/history/history-mgmt/ideas/mistake/profile/summary/weekend-mistake，无 usage-guide——它是 components 下的组件）；`ls src/app/api/`（admin/auth/checkin/client-error/lekao）；`ls scripts/ src/lib/deliver src/lib/workflow` |
| 8 | README 核心安全设计 #4 | 「banned **双层防护**：authorize + signIn callback + verify-code + proxy.ts **四层拦截**」——标签与内容自相矛盾 | 「banned **四层拦截**：authorize + signIn callback + verify-code + proxy.ts」 | 四层实存：`auth.ts:35,59`（authorize+signIn）、`verify-code/route.ts:48`、`proxy.ts:17`；CHANGELOG v2.0.0 亦记「4 层」 |
| 9 | README 致谢 | 「**流式响应**：motion」——motion 是动画库，与流式无关 | 「**界面动效**：motion」 | `package.json` `"motion": "^12.40.0"`（framer-motion 后继动画库）；SSE 流式为自研协议 |
| 10 | .claude/skills/lekao.md 项目事实表 | 「客户端：Web + lekao-android；Android 复用 Web API」 | 「Web（移动端 web-only，2026-10-03 owner 决策）；lekao-android/ 冻结于 V1.0.0 仅存档」 | 同 #4 |
| 11 | .claude/skills/lekao.md 数据与安全约束 #5 | 「现有收费生成流程**仍需**按 S01 收敛为…」 | 「**已由** S01 收敛为 reserve→settle\|release（coin.ts 门面 + coin-ledger.ts 账本）；新消耗场景直接复用」 | 同 #1 |

---

## ② 核对无误条目（抽核通过，未改动）

1. **README 技术栈/徽章**：Next.js 16.3.7、React 19.2.4、Prisma ^6.19.3、Tailwind 4、next-auth v4 —— `package.json` 逐项一致。
2. **AI 模型**：Qwen3-VL-8B-Instruct（硅基流动）+ deepseek-v4-flash —— `src/lib/ai/provider-config.ts:32,43` 默认值一致（README/Skill/CLAUDE.md 三处口径统一）。
3. **T-Coin 免费模式表述**：签到七日循环 D1–D7=2/3/4/5/6/7/8 币、中断重置；AI 生成 1 币/次；失败退回（release 按原池返还）—— `src/lib/checkin.ts:5-6`、coin-ledger 不变量；全仓「不付费、不充值」口径无残留（前次 fd4a130 已清理）。
4. **本地开发端口 3007**：`.env.example:31` `NEXTAUTH_URL=http://localhost:3007`。
5. **nginx 限流**：`deploy/lekao.nginx.conf:13` `limit_req zone=lekao_perip burst=50 nodelay`（20r/s 注释在 conf 内）。
6. **双层限流**：用户 5 次/60s + 全局并发 5 + 队列 + 60s 超时 —— `summarize/route.ts:42-52,125-127`。
7. **CHANGELOG 时差**：最新条目 v2.7.0（2026-09-29）= `package.json` 2.7.0，版本锚点一致；v2.7.0 之后的 16 个 commit 属未发版工作，按仓规「发版时 CHANGELOG 与 package.json 必须同步更新」不预记；「下阶段规划」段已于 2026-10-05 按免费模式口径更新。**判定：无时差违规**。
8. **BRD / PRD / ARCHITECTURE 历史声明头**：三份均已带「历史背景文档 + 免费模式废止付费路线」警示（前次 doc-sync 加注），本次复核内容仍准确。
9. **ai-delivery/README 索引**：2026-10-05 已按 Handoff 终态同步（S01/S03/S04 SEALED、S02 CANCELLED、脚本入口现状），与 handoff 正文一致。
10. **lekao-android/README + public/downloads/README**：web-only 冻结注记、APK 走 GitHub Releases 的移除说明均已就位。
11. **(marketing) 公开站**：about / privacy / terms 路由实存；landing 组件 Hero/FeatureCards/Stats/FAQ 均在 `src/components/landing/`。
12. **DESIGN.md**：2026-09-29 立法的单一事实源，仲裁基线自洽，无过期陈述。

### 待人工确认（仓库内无证据，未改动）

- README「腾讯云 nginx 终止 TLS」：仓库 conf 仅含 :80 server 块，443/TLS 配置应在服务器主 nginx（asterforge-deploy 仓管辖），本次未登录服务器核实。
- README 监控段（lekao-monitor.sh 每 5 分钟 / QQ SMTP 告警）：服务器侧事实，沿用既有口径。
- v2.7.0 后的 16 个 commit（编辑部营销站 / 四工作流统一 / 交付面板等）是否已部署生产：仓库内不可核实；若已上线，下次发版时 CHANGELOG 需补记。
- CHANGELOG「下阶段规划」的 T42 批量并行生成「等用户拍板」：与 2026-10-05 免费模式深化 spec 草案的方向种子无交集，是否仍有效待 owner 表态。

---

## ③ 自评

- **覆盖度**：60 份 .md 全部过目；活文档逐条核对可验证陈述，历史快照（带日期的 audits/stages/handoffs/tasks/prompts）按仓内真相源优先级约定不回改——这是该仓自己立的规矩（CLAUDE.md 硬约束第一条），不是偷懒。
- **证据链**：11 处修正每条都有代码/配置/ls 实证，无凭感觉改写；表名 `lekao_generation_charges` 写入前对照 `schema.prisma:290` 二次验证。
- **主要发现**：前两轮 doc-sync（fd4a130/ffe248c）修了 README/CHANGELOG/BRD/PRD/Skill/android，但**漏了 CLAUDE.md**——本次 5 处过期里最关键的是 §2 扣费描述（会直接误导下一个改计费的人）。
- **验证**：`git diff --check` 通过；commit 经 husky + commitlint + prettier 钩子成功（首轮因 body 超 100 字符被拒后改短行重提，钩子本身工作正常）；未 push（ahead 7，遵守红线）。
- **风险与残留**：4 项待人工确认如上；CLAUDE.md「15 个脚本 / 241 个单测」这类计数字段会随开发再次漂移，属仓内已知维护成本（原文档同样用约数口径）。

### 抽查复现命令（验收用）

```bash
cd lekao
grep -n 'summaryLength?:' src/lib/ai/prompts.ts | head -1   # → 5 档类型
grep -c 'reserveCoin\|settleCoin\|releaseCoin' src/app/api/lekao/summarize/route.ts src/app/api/lekao/feedback/batch/route.ts  # 两路由均 >0
node -p 'Object.keys(require("./package.json").scripts).length'  # → 15
ls src/app/dashboard/    # 无 usage-guide；有 weekend-mistake/ideas/history/profile
grep -rn 'apk' src/components/landing/ | wc -l   # → 0（hero 无 APK 入口）
```
