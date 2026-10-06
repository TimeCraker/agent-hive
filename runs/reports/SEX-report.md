# SEX-report · sex-workspace 文档保鲜度审计（Wave 8）

- 审计日期：2026-10-06
- 审计范围：`sex-workspace/`（根目录非 git 仓；活跃区 `sex2/` 为独立私有 git 仓，remote `github.com/TimeCraker/sex2`，gh 实测 `isPrivate: true`）
- 审计对象：仓内全部说明性文档 = `sex2/AGENT.md`、`sex2/小说阅读器/README.md`；`_archive/`（old-sex2 / sex / sexpro）内归档文档已通读、按归档语义不列入修正范围
- 修正文件：`sex2/小说阅读器/README.md`（+3 行 / -1 行，仅 .md）
- Commit：**跳过**——sex2 工作区存在任务开始前既有的他人未提交改动（`小说阅读器/阅读器.html` 为 M 状态），按任务红线「他人未提交改动时只动 .md 并跳过 commit」执行。修正保留在工作区，待该 html 改动归属落定后随下次 docs commit 一并入库。

---

## ① 过期点清单

本次审计未发现「陈述错误」型过期；发现 3 条「文档缺失的重要事实」——阅读器近三个 feature commit（dcc01ef 双页精读与金句卡、58752fc 金句卡多风格、78e486c 书眉/HUD）落了代码没落文档，当场补齐。

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---|---|---|---|
| 1 | `sex2/小说阅读器/README.md` 功能一览表（「划线」行后） | 功能表无「金句卡」条目 | 新增：`金句卡｜选中文字浮动条「金句卡」：生成典藏书摘卡，鎏金/宣纸/柔樱三风格切换，保存 PNG 或复制到剪贴板` | `src/app.js:1815`「典藏金句卡与二级菜单」整段实现；`src/ui.html:327-331` `#qc-themes` 三按钮 data-qctheme=gold/paper/sakura（鎏金/宣纸/柔樱）；`app.js:2382` 下载 `Aster-金句-*.png`、`app.js:2398`「已复制金句卡到剪贴板」；选中浮条触发 `#sel-card`（app.js:2359-2366）；e2e 步骤 AP/AP2 覆盖（e2e.mjs 尾部）；commit dcc01ef、58752fc |
| 2 | `sex2/小说阅读器/README.md` 功能一览表（「竖排精读」行后） | 功能表无「双页对开」条目 | 新增：`双页对开｜设置「双页对开精读（大屏）」或「更多」菜单开启：大屏（≥1100px）正文双栏对开、中缝细线，如摊开的精装书` | `src/style.css:1546-1568` `@media (min-width:1100px)` 下 `body.spread-mode #ch-body { column-count:2; column-gap:64px; column-rule:1px solid }`；设置开关 `src/ui.html:443`「双页对开精读（大屏）」`#set-spread`、悬浮菜单 `ui.html:183`「双页对开 (大屏)」`#pm-spread`；构建产物 `阅读器.html` 内 9 处 spread-mode；commit dcc01ef |
| 3 | `sex2/小说阅读器/README.md` 设计说明第一条 | 「……红泥章印式『第 N 篇』角标、书脊质感进度条。」（无书眉） | 句尾补「、章首书眉（书名 ✦ 章名细线页眉）」 | `src/app.js:445-448` 生成 `.book-running-header`（书名 ✦ 章名三段结构）；`src/style.css:266-277`「出版级经典书眉系统」flex 细线页眉样式；commit 78e486c「典藏书眉」 |

## ② 核对无误条目（抽查可复现）

### AGENT.md（逐节核对，全部与实况一致，未改动）

| 陈述 | 证据 |
|---|---|
| 第 9 节：根目录 `更新章节.bat` 转发到 `小说阅读器/` 执行 `node build.mjs` | 根 bat 实文 `cd /d "%~dp0小说阅读器" + call "更新章节.bat"`；阅读器侧 bat 执行 `node build.mjs` |
| 扫描工作区根目录全部 `*.md` | `build.mjs` `ROOT = path.resolve(DIR, "..")` + `readdir(ROOT)` |
| `AGENT`/`CLAUDE`/`README` 开头的 md 不进书 | `build.mjs:200` `!/^(AGENT\|CLAUDE\|README)/i.test(f)` |
| 配图 png/jpg/webp/gif/svg 自动内嵌、离线可看 | `build.mjs` MIME 表含五种格式 + jpeg |
| 控制台出现 `[OK]` 即成功、完成后自动打开 | 阅读器侧 bat `echo [OK] ...` + `start "" "阅读器.html"` |
| `阅读器.html` 是构建产物、禁止手改 | `build.mjs` `OUT = 阅读器.html` 每次整体重写 |
| 章节 `0XX-第N天-主题.md` 命名、🩷 场景分节、⏸ 暂停点 | sex2 根目录 000-014 文件名实测；013/014 内 `## 🩷 场景 N:`、`## ⏸ 暂停点` 均在 |
| 适用范围「011 及后续章节」 | 011-014 现存于根目录，符合 |
| 拖 md 进页面即时预览 | `app.js:2573-2575` window drop 处理；README「其他」行同述 |

### 小说阅读器/README.md（其余陈述逐条核对一致）

| 陈述 | 证据 |
|---|---|
| 主题 ×7（六预设 + 我的主题） | `app.js:1266` `THEME_NAMES` 恰 7 键：night/dusk/day/sepia/sage/gold/mine |
| e2e「Playwright 100+ 步」 | `e2e/e2e.mjs` 实数 `await R(` 112 处，尾行汇总输出总数 |
| 目录结构（src 四文件 / e2e / bat / build.mjs） | `ls src/` = app.js、motion-fallback.js、style.css、ui.html；e2e/ 有 e2e.mjs + package.json（playwright-core） |
| localStorage 前缀 `sex2-reader.` | `grep -c "sex2-reader\." src/app.js` = 11 |
| 快捷键表（←→/T/H/S///?/F/R/B/X/Ctrl+P/空格/Esc） | `app.js:2504` keydown 处理器键集合实为 `/ ? B F H R S T X`（大小写双写）+ 方向键/打印/空格/Esc 分支，与表一一吻合、无多余键遗漏 |
| 「拖拽导入 md」 | 同上 drop 处理器 |
| 根目录 bat 双击更新流程 | 同 AGENT.md 第 9 节证据链 |

### 独立仓表述

- 仓内文档（AGENT.md / README.md）均**不含**任何 git/远端/独立仓表述，无过期风险；实测 `sex2` remote = `https://github.com/TimeCraker/sex2.git`，`gh repo view` 返回 `isPrivate: true`，与工作区根 CLAUDE.md「独立私有 git 仓」表述一致（该文件归 ROOTDOC 任务，本次未动）。

### _archive/ 归档文档（通读、不改）

- `_archive/sex/docx/AGENTS.md`、`STYLE_GUIDE.md`、`sex/README.md`、`sexpro/AGENT.md`、`old-sex2/*`：均为历史项目快照，位于 `_archive/` 语境自明（其内 AGENTS.md 所写路径 `sex\docx\` 为归档时原路径，属历史记录而非现行指引）。按归档冻结惯例与最小改动原则不动；如需「已归档」标注应由用户拍板。

## ③ 自评

- **覆盖度**：仓内全部活跃说明文档（2 份）逐条过完；归档文档通读定性；红线遵守——只改了 1 个 .md 文件，未触碰代码/配置/依赖/锁文件/.git/根文档/其他仓库。
- **修正性质**：3 条均为「功能已落地、文档未记载」的缺失补录，非纠错型改写；每条都有代码行号 + commit 双重证据，无虚构项，无「待人工确认」项。
- **遗留风险**：① README 修正因他人未提交改动（`阅读器.html`）留在工作区未 commit，若该 html 改动被放弃/回滚，需手动补 `git add 小说阅读器/README.md` 提交；② 工作区根 CLAUDE.md 对 sex-workspace 的「纯 Markdown 创作目录」定位已与实况（含阅读器工具链、bat、e2e）有出入，属 ROOTDOC 任务范围，本报告仅记录不越界。
