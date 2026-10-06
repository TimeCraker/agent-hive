# HIVE · agent-hive 文档保鲜度审计报告（Wave 8）

- **审计日期**：2026-10-06
- **审计范围**：AGENTS.md、README.md、docs/design.md 全部可验证陈述，逐条对照 `app/server.mjs`、`app/launcher.ps1`、`app/archive.ps1`、`app/public/`（index.html / app.js / theme.css / brand/）、`batches/wave1~9/`、`.gitignore` 实况与 git log（d38dff7 及此前 30 条）
- **结果**：**过期/缺失 10 处，全部当场修正（均在 AGENTS.md）**；README.md 与 docs/design.md 核对零过期，未改动

## ① 过期点清单（已全部修正）

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---|---|---|---|
| 1 | AGENTS.md 目录约定表 `app/public/` 行 | 前端三件套（index.html / app.js / theme.css） | + `brand/`（主站圆徽标记 SVG） | `ls app/public/` 有 `brand/timecraker-mark-v1.svg`；index.html:9 引用 `/brand/timecraker-mark-v1.svg` |
| 2 | AGENTS.md 页首规范 1 | 「太木」做珊瑚底合文字标（**自绘 SVG：两字共用中竖**） | 圆徽直接继承主站 BrandMark（44px 深墨圆）+ 字标堆叠（副行 TAIMU HIVE · 并行派发） | index.html:8-14 实况为 brand-seal 圆徽 + img + 字标堆叠；design.md v3 收敛终案明确自绘 SVG 已被用户否决（「别画你的 svg 了」）；theme.css:46 `.brand-seal{width:44px;height:44px;border-radius:50%}` |
| 3 | AGENTS.md 页首规范 3 状态词汇 | 词表缺「待派发」 | 补入「待派发(pending)」 | app.js:10 `STLBL` 含 `pending:'待派发'`，为现行显示词 |
| 4 | AGENTS.md 字段表 `code` 注释 | 代号：大写短码，**全仓唯一** | **波内唯一**；跨波复用代号时先把旧报告改名 `<代号>-report.<旧波>-archived.md`（报告为覆盖写） | wave8 复用 wave2 十个代号（HIVE/XFZ/MPF/CPB/GAM/AFD/VBS/VSW/PWA/CFG）；`runs/reports/` 存在对应 10 份 `*.wave2-archived.md`（mtime 2026-10-05 19:09–19:45，wave8 开波前腾位改名） |
| 5 | AGENTS.md 字段表 `status` 注释 | `done/cancelled` 为旧波次历史值 | `cancelled`=人工取消**现行**终态（手改 batch.json 记 cancelledAt/cancelReason，server 无取消 API）；仅 `done` 为旧波次历史值 | server.mjs 全文无取消路由（仅 dispatch/accept/kill/status/logs/events）；wave8 RES 任务实况 `status:"cancelled"` + `cancelledAt` + `cancelReason`（2026-10-06 03:46） |
| 6 | AGENTS.md 扩展字段表 | 漏 `outTok` | 补：收档收获字段，成本台账（抽屉 tok/s 的分子） | server.mjs:213 `if (res.outTok != null) bt.outTok = res.outTok`；wave8 XFZ 实况 `outTok:11710`；design.md v3 已提「turns/outTok/costUsd 收档字段」而字段表漏列 |
| 7 | AGENTS.md 扩展字段表 | 漏 `cancelledAt` / `cancelReason` | 补：人工取消记录 | wave8 RES 实况两字段俱在（同 #5 证据） |
| 8 | AGENTS.md 派发与验收 API 段 | 缺收档自愈机制 | 补：exit 回调丢失（如服务重启）时 `/api/status` 扫描发现日志已有 result 事件而 batch 仍 running → 就地收档 | server.mjs:139-146（buildStatus 内自愈分支，带注释「自愈：exit 回调丢失…就地收档」） |
| 9 | AGENTS.md 派发与验收 API 段 | 只说「failed 重跑会重写日志」，缺 resume 日志语义 | 补：fresh 重写（`w`），resume 续派**追加同一 ndjson**（`a`）——续派后抽屉从头读会含前次会话事件 | server.mjs:287 `fs.openSync(logPath(wave, code), opts.resume ? 'a' : 'w')` |
| 10 | AGENTS.md 会话启动规范 5 | env 注入只讲 BASE_URL + AUTH_TOKEN 两项 | 补：同批 env 另注入 1M 上下文档（AUTO_COMPACT_WINDOW / MAX_CONTEXT_TOKENS = 1000000）与 API_TIMEOUT_MS=600000、EFFORT_LEVEL=max | server.mjs:303-307 spawn env 实况（决定无头会话行为的关键参数，文档原先缺失） |

## ② 核对无误条目（抽查可复现）

**README.md（全文核对，零过期）**：

1. 默认端口 17879、`$env:PORT` 覆盖 —— server.mjs:12 `Number(process.env.PORT || 17879)`
2. 满员转 queued 自动补位、上限 `HIVE_MAX_CONCURRENT` 默认 4 防 429 —— server.mjs:17、271-274、245-253
3. 收档规则「干净退出且有报告 → reported；出错/无报告 → failed」 —— server.mjs:207-220 settleTask
4. 面板按钮文案「查看终端 → / ✓ 验收 / ✗ 打回 / ▶ 续派重做 / ⏹ 强制结束」 —— app.js:90、111、114、180
5. resume 派回原会话 ≤3 次 —— server.mjs:263-264
6. `app/launcher.ps1` 为 legacy、派发已内置 server —— README:33 与 AGENTS.md 目录表一致；launcher.ps1 功能即 env 注入 + stream-json 落盘，server.mjs:283 起自带 spawn

**docs/design.md（v3 今日 11:32 刚提交，重点复验全符）**：

7. 圆徽 44px、字标 22px/-0.03em、Wave 徽章 `rgba(204,120,92,.13)` + `--accent:#A8513C` —— theme.css:46、34-35、39、9
8. SSE 2s 心跳 + fs.watchFile 即时推、客户端 30s 慢速兜底 —— server.mjs:386-395、app.js:343
9. 台账两阶段（运行中轮/动作真实计数；收档 turns/outTok/costUsd） —— app.js:290-307
10. Git 动态按仓库路径去重分组、组名=目录名、徽章=贡献代号 —— app.js:127-152
11. usage 遥测卡片预览滤除 —— server.mjs:135-136
12. 归档脚本 `-Wave/-All` + 活跃任务守卫、logs 是唯一膨胀源 —— archive.ps1:19-39；`runs/archive/` 现为空与「当前直接清理」拍板一致

**AGENTS.md 其余陈述（修正部分之外）**：

13. API 六路由（events/status/logs/dispatch/accept/kill）与代码一一对应 —— server.mjs:399-471
14. dispatch fresh 门 `pending/queued/failed`、resume 门 `reported/failed/rejected` + 需 prompt —— server.mjs:263-268
15. accept 终裁门、reject 强制 note（作续派提示词预填） —— server.mjs:336-343、app.js:172
16. kill 走 `taskkill /PID <pid> /F /T`，exit 回调随后收档 —— server.mjs:357、317-327
17. stale 阈值 `HIVE_STALE_MINUTES` 默认 5 分钟 —— server.mjs:19
18. prompt 走 argv、stdio[0]='ignore' —— server.mjs:289-291、309
19. stderr 落 `<代号>.ndjson.launcher.err` —— server.mjs:288
20. 后台轻任务固定 `glm-5.3-flash[1m]`（HAIKU/SMALL_FAST） —— server.mjs:298-299
21. 「范例：batches/wave1/prompts/ 下 10 份」 —— `ls | wc -l` = 10
22. meta 徽章描边 —— theme.css:58-59 `border:1px solid var(--line2)`
23. 统计带口径（进行中=running+queued+pending）、完成率（已验收÷(全部−已取消)）、进度条五段色 —— app.js:40-60
24. `.gitignore` 含 `runs/logs/` —— .gitignore:2

## ③ commit 说明

**跳过 commit**。原因：仓库存在他人未提交改动——`git status` 显示 `runs/reports/XFZ-report.md` modified，且审计期间主控/并行会话仍在改 `batches/wave8/batch.json`、`batches/wave9/*`、`runs/reports/VBS-report.md`（wave8 在跑、wave9 在备）。按任务红线「有他人未提交改动时绝不 commit」，AGENTS.md 的修改（`git diff AGENTS.md`，17 行变更）留在工作区待主控验收，建议随波次收口一并提交：

```
docs(agents): 修正 10 处过期陈述——波内代号/取消终态/品牌圆徽/自愈收档等 / fix 10 stale claims: per-wave code, cancelled state, brand badge, settle self-heal
```

## ④ 待人工确认（非 .md 文件，红线内不可改，仅记录）

- `app/launcher.ps1:1` 首行注释仍是旧名「agent-console 派发器」
- `.gitignore:1` 首行注释「agent-console 运行态不入库」同为旧名残留
- design.md v1 段「旧 `claude -p`（纯文本输出）无法实时观测」为历史叙事简写（launcher.ps1 中间形态本就 stream-json 落盘），作为决策记录保留未动

## 自评

- **一致性**：修正后三份文档的全部可验证陈述均与仓库实况核对一致；过期点集中在 AGENTS.md（v2 时代表述未随 v3 品牌收敛与 wave8 流程演进更新），README/design.md 零过期。
- **抽查复现**（任选 5 条）：① `grep -n brand-seal app/public/theme.css` → 44px；② `ls runs/reports/ | grep wave2-archived | wc -l` → 10；③ `grep -n "opts.resume ? 'a' : 'w'" app/server.mjs` → :287；④ `grep -n outTok app/server.mjs` → :191/213/237；⑤ wave8 batch.json RES 任务含 cancelledAt/cancelReason。五条均与修正后文档对应。
- **边界遵守**：仅改 agent-hive 内 1 个 .md（AGENTS.md）+ 本报告；未碰代码/配置/依赖；未 push、未改历史；根目录 CLAUDE.md/AGENTS.md 与其他仓库未动。
- **残余风险**：修正基于当前 HEAD（d38dff7）与工作区实况；wave8/9 进行中的改动落定后若再有流程变化（如新增取消 API），字段表需同步。
