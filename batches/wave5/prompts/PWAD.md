# 任务 PWAD：pw 填表脚本收录进 publish 模板

## 背景（已核实事实，勿重新考古）
- 仓库：`C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio`（Git 仓，master，工作树应干净）
- 前置工单 PUBD（今日 `15d6d1e`）已完成依赖地基：`skills/publish/templates/package.json` 托管 playwright（精确 pin 1.63.0，connectOverCDP 附着已开窗口，零浏览器下载）；SKILL.md 依赖节已是双轨制（CDP 基础层零 npm 包 / Playwright 层）
- **pw 脚本本体在 git 历史 `7277880`** 的 `projects/pelican-ride/pw/`（9 个文件，三端 live 实测版：2026-10-03 B站/抖音/小红书真实发布走通，Playwright connectOverCDP 填表，含「声明弹窗吞点击」定点修复与 dumpForm 逃生口）——该目录已随清场提交删除，从未收录进 skill 模板
- 已知适配点（PUBD 报告登记）：① `loadPlaywright` 的 `../../hsr-currency-war/pw/node_modules` 硬路径退役，改 `require('playwright')`；② `qa/` 截图输出路径适配项目化

## 任务一句话
从 git 历史捞回 pw 九件套，适配后收录为 `skills/publish/templates/pw/`，模板三层齐备（launch 基础层 / CDP 探针层 / Playwright 填表层）。

## 步骤
1. `git show 7277880 --stat -- projects/pelican-ride/pw/` 清点文件；逐个 `git show 7277880:projects/pelican-ride/pw/<文件>` 取回，落 `skills/publish/templates/pw/`
2. 适配：`loadPlaywright` 硬路径 → `require('playwright')`；qa/ 输出路径对齐现有 `--project` 项目化风格（看 bili/douyin/xhs.mjs 怎么解析项目路径，保持同构）
3. 验证（不开真实浏览器、不登录）：每文件 `node --check` 过；`grep -rn "hsr" skills/publish/templates/` 零命中；临时目录复制 templates → `npm install --no-audit --no-fund`（应仅 2 包秒装）→ 若 pw 脚本有 --dry/--help/无副作用入口则跑一遍证 exit 0，没有就说明原因并只做语法+引用验证
4. `skills/publish/SKILL.md`：快速上手/填表层一节补 pw/ 用法入口（几行，与 PUBD 的双轨依赖节呼应）
5. 提交：只 `git add skills/publish/**`，Conventional Commits 中英对照，如 `feat(skills): 收录 pw 填表脚本进 publish 模板 / vendor pw fill-layer scripts into publish template`

## 红线
- 不真发布、不扫码登录、不起浏览器窗口
- 不动其他 skill、不动 `docs/**`（workorder-log 主控补记）
- 并行施工：可能有别的会话在别的目录；只 add 自己清单文件；`index.lock` 冲突等 10 秒重试 ≤3 次
- 从 git 历史取文件**只取 pw/ 九件**，不恢复整个 pelican-ride 工程

## 验收标准（数字化）
- pw/ ≥9 文件收录，`node --check` 9/9 过，hsr 引用 0 处
- SKILL.md pw 用法入口就位
- 1 个 commit，`git status` 干净

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PWAD-report.md`
结构：# PWAD 结果报告 / ## 结果摘要 / ## 适配点清单 / ## 验证证据（命令+输出）/ ## 提交 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
