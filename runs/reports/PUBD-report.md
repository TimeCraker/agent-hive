# PUBD 结果报告

## 结果摘要

publish skill 依赖自足化完成并已提交（`15d6d1e`）。`skills/publish/templates/` 新增 package.json 托管 playwright（pin 1.63.0），SKILL.md 依赖节改为双轨制并写明安装步骤。隔离验证全绿：模板复制到系统临时目录、hsr 项目改名隔离的状态下，`npm install` 1.4s 零浏览器下载、`run.mjs --dry` 三端计划全打印 exit 0、`require('playwright')` 可加载且 `chromium.connectOverCDP` 为 function、脚本内零 hsr 引用。

**重要前提修正**：工单背景两条「已核实事实」已被今天 18:42 的清场提交 `140127c`（重构 projects 为临时作业流水线并清场已交付工程）推翻——

1. `products/hsr-currency-war/pw/` 从不存在（pw 挂的是 `projects/hsr-currency-war/pw/`），且整个目录连同 node_modules 已被该提交删除；
2. pw 脚本族（`projects/pelican-ride/pw/` 九个文件，三端 live 实测版）同批删除，**从未收录进 skill 模板**——`skills/publish/templates/` 至今是零依赖的 CDP 手写版（bili/douyin/xhs/run，全部只 import node: 内建模块，grep 验证）。

即「填表层已迁移到 Playwright」只在临时施工区成立过，随清场铁律消失，本体现在只活在 git 历史（pelican-ride 清场前快照 commit `7277880`）。依据工单步骤 2「若调研后发现更简方案，如实论证后实施」条款，本次交付相应调整为：**把收录 pw 脚本所需的依赖地基正经化**（这正是 SKILL.md 坑节 2026-10-03 条「收录为正式模板前先解决其 playwright 依赖统一管理」指的那件事），脚本本体的收录是后续工单。

## 依赖决策与理由

**决策：`templates/package.json` 声明 `playwright` 精确 pin `1.63.0`；不 vendoring node_modules、不装浏览器、不建新抽象。**

- **装包而非 vendoring**：仓库铁律「产物不进 git」，`.gitignore` 全局覆盖 `node_modules/`；vendoring 与现有秩序冲突且体积约 19MB×历史。装包方案换机只需一条 `npm install`。
- **包名 `playwright`（非 playwright-core）**：实测脚本（`7277880:projects/pelican-ride/pw/util.js`）require 的就是这个包名，保持收录时零改动。
- **版本 1.63.0**：npm 当前 latest（2026-10-05 `npm view` 查证）；hsr 当年装包从未留下版本记录（其 package.json 全文仅 `{ "name": "pw-drive", "private": true }`），无法复刻实测版，故取最新稳定版。connectOverCDP 是稳定 API，实测脚本用法（connectOverCDP + newCDPSession + locator）在 1.63 均在。沿用 video-motion 模板先例（精确 pin，见 `skills/video-motion/templates/remotion-app/package.json` 的 remotion 4.0.518 全 pin）。
- **无需浏览器下载**：connectOverCDP 附着 `launch` 命令开的用户自己的 Chrome，不用 playwright 内置浏览器。实测 `npm install` 仅 2 包 19MB、1.4s，无 `.local-browsers` 目录——与 util.js 注释「不下载浏览器」一致。
- **CDP 基础层保持零依赖**：现有 bili/douyin/xhs/run 是 launch（开窗口）、探针与逃生口，裸 Node 即跑，任何机器无网也能开窗登录——这层不绑 npm。

## 改动清单

| 文件 | 动作 | 内容 |
|---|---|---|
| `skills/publish/templates/package.json` | 新增 | name=publish-templates / private / engines node>=18 / dependencies: playwright 1.63.0 |
| `skills/publish/SKILL.md` 依赖节 | 改写 | 双轨制：基础层零 npm 包不变；Playwright 层指明由 templates/package.json 托管 + 一条安装命令 `cd skills/publish/templates && npm install` |
| `skills/publish/SKILL.md` 坑节 2026-10-03 条 | 更新 | 「收录前先解决依赖统一管理」改为「依赖已正经化」；记下 pw 脚本本体在 git 历史 7277880、收录时退役 loadPlaywright 的 hsr 硬路径改直连 require('playwright') |

未动：其他 skill、`docs/**`、`products/**`（临时改名验证除外，已恢复）。

## 验证证据（命令+输出摘要）

装置：`mktemp -d` 于系统临时目录 → 复制 `skills/publish/templates` → 造假项目（publish-plan.json 三端 + touch 空 mp4，满足 run.mjs 对视频存在性的前置检查）；同时 `mv products/hsr-currency-war products/hsr-currency-war__hold` 隔离旧依赖路径。

```
$ npm install --no-audit --no-fund        # 在临时副本 templates/ 内
added 2 packages in 1.4s                  # EXIT=0；node_modules 19M
ls node_modules/playwright-core/.local-browsers → 不存在（零浏览器下载）

$ node run.mjs --project <临时proj> --dry
平台     bili + douyin + xhs
模式     DRY（只打印各平台将执行的步骤）
━━ bili (port 9222) ━━   1. goto 投稿页 … 7. check 自检（发布按钮由你点）
━━ douyin (port 9223) ━━ 1-7 步骤全打印
━━ xhs (port 9224) ━━    1-7 步骤全打印
RUN_EXIT=0                               # 不开浏览器、不登录、零报错

$ node -e "require('playwright')…"
playwright 1.63.0 | chromium.connectOverCDP: function    # PW_EXIT=0

$ grep -rn "hsr" . --include=*.mjs --include=*.json（排除 node_modules）
zero hsr references in scripts           # 脱 hsr 证明
```

收尾：`rm -rf` 临时目录 → `mv` hsr 目录名还原（5 个文件与改名前一致）→ `git status` 除本次两文件外无变化 → `python scripts/check-docs.py` 0 fail 0 warn。

## 提交

- `15d6d1e` fix(skills): publish 依赖自足化 / make publish skill self-contained（2 files, +25/−3；只 add 了 `skills/publish/SKILL.md` 与 `skills/publish/templates/package.json`）
- 提交后 `git status`：仅剩 `skills/video-motion/` 下两个未跟踪路径（`templates/remotion-app/public/cover/`、`templates/remotion-app/scripts/verify-cues.mjs`），为并行会话施工中产物，验证期间亲眼看到第二个路径新出现，未触碰。hsr 目录已恢复原名的证据：`ls products/hsr-currency-war` → PUBLISH.md + 双封面 + 双成片，与初始状态逐文件一致。

## 遗留问题

1. **pw 脚本本体尚未收录**（本次范围外，工单前提修正后明确为后续工作）：本体在 git 历史 `7277880`（pelican-ride pw/ 九文件，含三端 live 修复）；收录时需做两件事——`loadPlaywright` 的 `../../hsr-currency-war/pw/node_modules` 硬路径退役改 `require('playwright')`、`qa/` 截图输出路径适配。SKILL.md 坑节已留指引。
2. playwright 1.63.0 未经三端 live 复测（旧实测版号无记录）；收录后第一次真实投稿前建议先 `--dry` 探针核对。
3. `skills/video-motion/` 两个未跟踪文件属并行会话，主控知悉即可。

## 自评

**达标**。三条验收标准全部满足：①模板脱离 hsr 独立 dry-run（完整命令与输出摘要见上，含 hsr 改名隔离与零引用证明）；②SKILL.md 安装步骤就位（依赖节一条 `cd skills/publish/templates && npm install`）；③1 个 commit、提交后 git status 干净（本工单范围内零残留，hsr 目录名已恢复并有逐文件比对证据）。偏差仅一处且已如实论证：工单「填表层已迁移、node_modules 挂在 products/hsr-currency-war/pw」的前提被今日清场提交推翻，按工单自带的最简方案条款将交付聚焦为依赖地基，未擅自扩到脚本收录。
