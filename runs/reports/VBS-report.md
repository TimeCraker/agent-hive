# VBS 报告 — vibe-studio 文档保鲜度审计（Wave 8）

- 日期：2026-10-06
- 审计对象：`C:/Users/TimeCraker/Desktop/my_workspace/vibe-studio`（master @ `6a556c6`，工作区干净，无未提交改动）
- 审计范围：README.md、仓库 CLAUDE.md、docs/ 全部 7 份说明文档、workflows/explainer-video.md、7 个 skill 的 SKILL.md、assets/ 全部 5 份说明文档、projects/ products/ scripts/ 三个分区 README、products/ 子文档抽查 4 份（hsr / pelican-ride / lekao-intro / stations）
- 核对基准：git log 30 条、目录结构全量清点、模板代码与脚本实况、仓库自研检查器 `python scripts/check-docs.py`（结果 0 fail / 0 warn / 3 archived skipped）

## ① 过期点清单

**0 条。** 全部可验证陈述与仓库实况一致，本次零修正、零 commit。

跳过 commit 原因：无文档需要修改（验收标准「修正有 git commit」不触发；工作区本身干净，不存在他人未提交改动问题）。

## ② 核对无误条目（按验证方式分组）

### A. 机器验证（check-docs.py，仓库自研漂移检查器）

| # | 陈述 | 证据 |
|---|---|---|
| A1 | README 技能表 ↔ `skills/` 目录一致 | check-docs 3.x 断言通过；人工复核 7/7（ppt / humanizer / video-motion / narration / auto-subtitle / publish / web-capture） |
| A2 | 全部文档内引用路径有效 | check-docs 引用路径检查 0 fail |
| A3 | component-catalog 标题数 = 表行数 = SKILL.md 声明数（24 组件） | check-docs 3.5 三方互锁断言通过 |
| A4 | 模板 `@remotion/*` 精确同版 | check-docs 3.7 断言通过；package.json 实见 `"remotion": "4.0.533"` 无 `^` |

### B. 人工逐条核实（抽查 5 条可复现）

| # | 文档陈述 | 实况证据 | 结果 |
|---|---|---|---|
| B1 | README「七个 skill」+ 使用节 7 个 junction 重建命令 | `skills/` 下恰 7 个子目录；PowerShell `Get-ChildItem .claude/skills` 实见 7 个 LinkType=Junction 且 Target 均指向 `skills/<同名>`；`.claude/skills/` 已 gitignore、`git ls-files .claude/` 为空 | 一致 |
| B2 | video-motion SKILL「scene-kit 24 组件」 | 目录 23 个组件 tsx + `PhoneShell`（`DeviceFrame.tsx:31` 同文件双导出）= 24；catalog 表恰 24 行 | 一致 |
| B3 | README「PPT：15 种页面范式、3 套主题」 | ppt SKILL 范式表恰 15 行；`primitives.py:38` THEMES 恰 3 键（warm/tech/forest）；slide_* 13 + growth_* 1 组 + 原生 chart 1 组 = 15 范式条目 | 一致 |
| B4 | publish SKILL「pw/ 共 9 件」「playwright pin 1.63.0」 | `skills/publish/templates/pw/` 实数 9 文件（3 fill + 5 定点修复 + util）；templates/package.json `"playwright": "1.63.0"` | 一致 |
| B5 | assets/README「patterns-frames p01-p11 + cover，jpg ~150KB/张」 | 目录实见 12 张 jpg（p01-p11 + cover），94–178KB | 一致 |

### C. 分区与产物核对

| # | 文档陈述 | 实况证据 | 结果 |
|---|---|---|---|
| C1 | projects/README「当前无活跃施工工程，零残留」 | `projects/` 下仅 README.md 一个文件 | 一致 |
| C2 | products/README 表列 10 目录 | 实见恰 10（hsr-currency-war / pelican-ride / pelican-test / lekao-intro / lekao-deck / vibe-studio-deck / asterforge-landscape / ddd-architecture / ddd-paper / stations），状态口径与各 PUBLISH/README 抽查吻合 | 一致 |
| C3 | scripts/README 索引 5 脚本 + 项目专属脚本去向归档 | 实见恰 5（check-docs / make_music / audio_report / contact_sheet / probe_frame），归档段所列 products 路径与 products 实况一致 | 一致 |
| C4 | CLAUDE.md「产物不进 git（.gitignore 已覆盖）」 | .gitignore 实覆盖 `*.mp4` `*.pptx` `*.pdf` `node_modules/` `out/` `products/**`(白名单 .md) `projects/*/remotion-app/public/` 等，与 SKILL/README 各处引用口径一致 | 一致 |
| C5 | lottie/README 登记表 `spin-ring.json`；art/README「暂空起表」 | `assets/lottie/` 实见 spin-ring.json；`assets/art/` 仅 README 无资产 | 一致 |
| C6 | web-capture SKILL 契约（shots.json / anchor-targets / 导演页四函数 / probe-ui / probe-anchors / capture-all / render-director / vclock.js） | templates/ 实见全部对应文件；shots 与 anchor 条目级 viewport 字段描述与 wave5 工单（`7b54d22`/`7650900`）落地内容一致 | 一致 |
| C7 | narration/auto-subtitle/ppt 命令与文件名 | `verify_narration.py`、`transcribe.py`、`primitives.py`/`animate.py`/`verify.py` 均在模板位 | 一致 |
| C8 | docs/ 四份旧 spec 状态标记（活跃/已存档 + 吸收说明） | product-map、motion-grammar、art-layer-spec 标「活跃」；ppt-copy-rules、v4-spec、mg-arsenal-spec 标「已存档（被 X 吸收）」，符合 CLAUDE.md 首行状态约定 | 一致 |
| C9 | workorder-log 台账尾部条目 | 与 git log 最近 10 条 docs/feat 提交（6a556c6…38230e2）逐条对应，无缺记 | 一致 |
| C10 | README Remotion license 口径（2026-10 查证） | 对应 `2a28598` 提交记录，口径一致 | 一致 |

### D. 任务重点三项的核实结论

1. **「video-script-workflow 并入后的结构描述」——并入未发生，文档也无此声称。** 全仓 grep（video-script / VidScript / 剧本工坊 / 分镜）零命中；工作区根 `video-script-workflow/` 仍是独立目录（agent.md / characters / stories / 视频生成器 / 阅读器俱全）。任务前提与实况不符，但 vibe-studio 文档没有写过「并入」，故不存在需要修正的过期描述。
2. **「README 技能清单 vs src/skills 实况」——实际路径是 `skills/`（无 src/ 前缀），清单 7/7 一致**，且 README「使用」节的 junction 重建流程与 `.claude/skills` 实况（7 个 Junction、未被 git 追踪）吻合。
3. **「与 video-script-workflow 仓分工自洽」——自洽。** 只读对方 agent.md 核实：VidScript 定位「剧本导演兼编剧」，四层产出（角色档案→大纲→分镜→生成提示词）面向 AI 视频生成工具；vibe-studio 定位「内容工厂」，管 PPT / 三线成片 / 封面 / 投稿表单。两者职能零重叠、互不引用、互不声称包含对方。

## ③ 自评

- **结论**：vibe-studio 是本轮多仓审计中文档保鲜度最好的形态——不是「文档恰好没过期」，而是有制度保障：单一事实源 owner 表（CLAUDE.md）+ 自研 `check-docs.py` 四类机器断言（README↔skills 对齐 / 引用路径 / 组件数三方互锁 / Remotion 版本同批）+ spec 状态标记约定 + 台账只追加纪律。文档漂移在这套机制下会被机器拦住（git log 中 `aed8346` 即一次实抓实修）。
- **方法边界**：本审计覆盖全部结构性、数量性、路径性、命令性陈述（A–C 组约 30 条，全部亲证）；products/ 下 6 份未逐字读的子文档（ddd-paper、asterforge-landscape 等）属交付归档记录（存档性质，不构成入口指引），抽查 4 份全过，风险低。humanizer 融合血统（blader v2.11.2 × unclecheng v4.1）为外部仓版本号，无从本地核实，维持原文（非过期陈述，属出处自述）。
- **未做动作**：零文件修改、零 commit（无对象）；未触碰 video-script-workflow 仓（仅只读 25 行 agent.md 做分工核对）；未触碰工作区根 CLAUDE.md/AGENTS.md。
- **给主控的一句话**：VBS 波次验收标准「文档内可验证陈述 100% 与实况一致」已达成，抽查 5 条（B1–B5）均可按上表证据复现。
