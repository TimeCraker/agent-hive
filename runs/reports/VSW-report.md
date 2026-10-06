# VSW 审计报告：video-script-workflow 文档保鲜度

- **日期**：2026-10-06（Wave 8 · VSW）
- **仓库**：`C:/Users/TimeCraker/Desktop/my_workspace/video-script-workflow`（独立 Git 仓，远端 `github.com/TimeCraker/video-script-workflow`，main 分支）
- **基线**：`0a81e1a`（审计前 HEAD），工作区 clean，无他人未提交改动
- **结果**：修正 3 处过期点并提交 `1ed0fcf`；2 处矛盾需人工裁决，未擅改；其余核对全部一致

---

## ① 过期点清单

### 已修正（commit `1ed0fcf`，docs: 前缀 + 中英对照）

| # | 文档位置 | 改前 | 改后 | 证据 |
|---|---|---|---|---|
| 1 | `agent.md` §八 目录树 | `阅读器/` 下只列 `更新章节.bat` | 补 `build.mjs`（构建脚本注释）与 `src/`（ui.html / style.css / app.js / motion-fallback.js） | `find` 实际文件清单：阅读器/ 下有 build.mjs、src/{app.js,motion-fallback.js,style.css,ui.html}、更新章节.bat；`.gitignore` 也引用「阅读器/build.mjs 扫描全部 md 一键重建」 |
| 2 | `agent.md` §八 目录树（视频生成器行注释） | 未说明该目录 md 的阅读器归属 | 补「目录内 md 会被阅读器收录进『大纲与分镜』书架」 | `阅读器/build.mjs` `groupOf()`：非 characters 前缀且文件名不含「生成提示词」子串 → ②组；实跑 `node build.mjs` 输出 12 篇 md 含视频生成器 2 篇，构建成功（总字数 24,925） |
| 3 | `stories/暑假·温泉合宿/outline.md` §切分 | 「5 条，每条约 18～25 秒」 | 「5 条，每条约 14～25 秒」 | `grep '^## 第' script.md`：第1条约18s / 第2条约16s / 第3条约16s / 第4条约14s / 第5条约25s——两条低于 18，下界应为 14 |

### 待人工确认（有确凿矛盾，但修正方向是创作/结构决策，不属文档保鲜度范围）

| # | 位置 | 矛盾 | 证据 | 不改的理由 |
|---|---|---|---|---|
| A | `characters/*/角色设定.md` vs `视频生成器/动漫流/C Users TimeCraker D/` 两个 md | 角色档案 6 人全部「高二 · 16~17 岁」；视频生成器产出（测试片分镜 + 最终提示词）声明「五人均明确为已满18岁的大学生」 | `grep '年龄/年级\|岁' characters/*/角色设定.md` 全部命中高二；两份视频生成器 md 的「制作简报/全局基准」节原文 | 两边都是内容文档：角色档案是设定真相源，视频生成器 md 是工具（Hilo）产出的合规化改写记录。统一口径（改档案还是改生成声明）是创作决策，须用户裁决 |
| B | `视频生成器/动漫流/C Users TimeCraker D/` 两个 md 的**文件名** vs 内容 | 文件名带「10秒」，内容标题与规格均为「15秒」「时长：15秒」；`.gitignore` 中样片 mp4 亦名「十秒样片」 | 两份 md 首行标题及「时长与画幅」字段 | 重命名文件超出本次「只改 .md 内容」红线；且改名会让 `.gitignore` 的 mp4 路径条目失配（.gitignore 不许动）。建议人工确认后统一重命名（含 .gitignore 同步） |

---

## ② 核对无误条目（抽验可复现）

1. **四层产出文件名**：agent.md §三/§四（`characters/<角色名>/角色设定.md`、`outline.md`、`script.md`、`P1-生成提示词.md`）与 stories/实际文件一一对应 ✅
2. **角色档案字段模板**：§四模板（基本信息/外貌与身形/衣着按场景/性格/待定）与实际档案结构一致（抽 `月花梨/角色设定.md` 全文比对；个例增补「备注」「心境」字段，属超集不算冲突）✅
3. **三书架阅读器**：agent.md「角色 / 大纲分镜 / 提示词」= build.mjs `groupOf()` 三组（①角色设定/②大纲与分镜/③生成提示词）✅
4. **提示词板块与时长规范**：§七「【画风】【背景】【角色】【镜头】【台词/语气】【BGM/音效】+ 4~30 秒切」与 P1 实际（单元0 约6秒、单元1 约18秒、单元2 约16秒…板块名全对上）✅
5. **characters/README.md 阵容与状态**：6 文件夹与阵容表 6 行一致；读音表抽验月花梨（つき かりん / Tsuki Karin）与档案一致；「当前状态」5 条（女主未定四选一、泳池=月花梨家、夏天、北村一诚配角不沾感情线）与 outline/script 一致 ✅
6. **.gitignore 三类条目**与 agent.md 目录树注释互相印证（`.hilo/`=Hilo 运行时、`阅读器/阅读器.html`=可再生产物、样片 mp4 约12MB 不入库）✅
7. **画风权威图**：视频生成器 md 引用的 `温泉合宿画风参考修订.png` 实际存在（另有一张 `温泉合宿画风参考.png` 为修订前版本）✅
8. **样片 mp4 不在库**：find 无 mp4，与 .gitignore 及目录树注释一致 ✅
9. **远端归属**：`git remote -v` = `https://github.com/TimeCraker/video-script-workflow.git`，与工作区 AGENTS.md/CLAUDE.md 的「私有仓 TimeCraker/video-script-workflow」描述一致 ✅
10. **工作流 ASCII 图**（§三）文件名与 stories 实际文件名逐字一致 ✅

### 重点核对项裁决建议

- **归属矛盾（并入 vs 独立）**：建议**维持独立**。本仓是纯 Markdown 创作资产仓（唯一的工具是零 npm 依赖的本地阅读器，build.mjs 只用 node 内置模块），与 vibe-studio（可复用 skills 集合，内容成片管线）无任何代码依赖、无同步耦合；并入会使私有创作内容混入工具仓的版本流。若未来「剧本→成片」流程要技能化，在 vibe-studio 新建 skill 引用本仓的 agent.md 约定即可，不必搬迁资产。
- **与 vidscript skill 分工**：**不存在 vidscript skill**。`vibe-studio/skills/` 实际 7 个（auto-subtitle/humanizer/narration/ppt/publish/video-motion/web-capture），`~/.claude/skills/` 亦无；「VidScript」只是 agent.md 标题里给本仓协作 Agent 起的名字，非 skill。agent.md 无需为此修改；本仓（剧本/分镜/提示词的 md 资产 + 阅读器）与 vibe-studio（成片管线工具）分工清晰、无重叠。

### 抽查 5 条复现命令（验收标准）

```bash
cd C:/Users/TimeCraker/Desktop/my_workspace/video-script-workflow
ls 阅读器/ 阅读器/src/                                  # 验证过期点1
node 阅读器/build.mjs                                    # 验证过期点2（12 篇含视频生成器 2 篇）
grep -n '^## 第' stories/暑假·温泉合宿/script.md         # 验证过期点3（18/16/16/14/25s）
grep -n '年龄/年级' characters/*/角色设定.md              # 验证待确认项A（高二·16~17岁）
grep -n '15秒' 视频生成器/动漫流/C\ Users\ TimeCraker\ D/*.md  # 验证待确认项B
```

---

## ③ 自评

- **覆盖度**：说明性文档 2/2 全文通读（agent.md、characters/README.md）；内容文档 10 个中 8 个通读或全文比对（outline、script 前 60 行 + grep 取证、P1 前 80 行、视频生成器 2 md 全文、月花梨档案全文），其余 5 个角色档案以 grep 结构化取证（年龄/年级行全部命中）。`.gitignore` 作为带注释配置只读核对未改动。
- **改动克制**：仅 2 个 .md 文件、+5/-3 行，全部有逐条证据；未碰代码/配置/依赖/锁文件，未重命名任何文件，未 push（本地现领先 origin/main 2 commit：`0a81e1a` 为审计前既有未推提交 + 本次 `1ed0fcf`）。
- **验证闭环**：改后实跑 `node 阅读器/build.mjs` 构建成功，确认新注释陈述（视频生成器 md 被收录）与文档改动均不影响阅读器管线；`git diff` 逐行复核后提交。
- **不足**：script.md 与 P1 未逐字通读（依赖 grep 结构化取证，可能漏掉行文级微瑕）；2 项矛盾（年龄口径、10秒文件名）移交人工裁决；「Hilo」工具名仅由 `.gitignore` 的 `.hilo/` 条目间接印证（仓库内无其他一手证据，可信但非直接文档陈述）。
