# 任务 PRAV：probe-anchors 支持非默认视口（anchor-targets.json 可选 viewport）

## 背景（已核实事实，勿重新考古）
- 仓库：`C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio`（Git 仓，master，工作树应干净）
- 今日 WCBP（`7b54d22`）已给 web-capture 的 shots.json 加镜头级可选 `viewport`（优先级 shot > CLI > 顶层 > 1920×1080，非法值整组忽略+warn 回落；解析函数 `resolveShotViewport` 在 `templates/paths.mjs`，单测 10 例）
- **遗留缺口**：`templates/probe-anchors.mjs` 归一化仍硬编码 W=1920/H=1080——对非默认视口采集的页面量锚点，坐标归一化分母错。它读 anchor-targets.json 的 A/B 条目、输出归一化比例坐标
- WCBP 报告遗留原话：「若下个项目对非默认视口的 shot 量锚点，需要给 anchor-targets.json 也加 viewport 或接受归一化坐标换算」

## 任务一句话
anchor-targets.json 条目支持可选 `viewport` 字段，probe-anchors 归一化按条目视口走，缺省 1920×1080 行为零变化，解析逻辑单测正反过。

## 步骤
1. 读 `skills/web-capture/templates/probe-anchors.mjs`（锚点条目结构、归一化计算处）与 `SKILL.md` 契约节 anchor-targets 相关段落
2. 最小设计：anchor-targets.json **条目级**可选 `viewport: {width, height}`；归一化分母取条目 viewport，缺省/非法（warn+回落）用 1920×1080；语义与 WCBP 的 resolveShotViewport 对齐（优先复用 paths.mjs 里的函数或同款判断，不复制粘贴分叉）
3. 单测（不开浏览器，纯 node，≥4 例）：显式 viewport 生效 / 缺省回落 1920×1080 / 非法值（缺一半、负数）warn+回落 / 数值字符串接受。证据进报告
4. `skills/web-capture/SKILL.md` 契约节补 2-3 行（字段形态 + 缺省行为 + 与 shots.json viewport 的关系：采集视口与量锚视口要一致才可直接复用归一化坐标）
5. 提交：只 `git add skills/web-capture/**`，如 `feat(skills): probe-anchors 支持条目级视口 / per-entry viewport in probe-anchors`

## 红线
- 不开浏览器、不采集外网（真机验证留给下个 C 线项目首采，报告里写明）
- 不动其他 skill、不动 `docs/**`；并行施工 `index.lock` 冲突等 10 秒重试 ≤3 次
- 不新建抽象层；与 WCBP 实现同构优先

## 验收标准（数字化）
- 单测 ≥4 例正反证据
- 缺省行为零变化论证（改动点列表）
- SKILL.md 字段文档就位；`python scripts/check-docs.py` 0 fail
- 1 个 commit，`git status` 干净

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PRAV-report.md`
结构：# PRAV 结果报告 / ## 结果摘要 / ## 字段设计 / ## 验证证据 / ## 提交 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
