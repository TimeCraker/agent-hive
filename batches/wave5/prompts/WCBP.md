# 任务 WCBP：web-capture 采集支持 per-shot viewport（shots.json 字段化）

## 背景（已核实事实，勿重新考古）
- 仓库：`C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio`（Git 仓，master，工作树应干净）
- `skills/web-capture` 是「网页/HTML 动画逐帧采集」skill：`templates/` 下 cdp.mjs / capture-all.mjs / capture-clip.mjs / probe-ui.mjs / probe-anchors.mjs / render-director.mjs / vclock.js / paths.mjs
- 工单台账遗留（docs/workorder-log.md 2026-10-03 pelican-ride 节原话）：「scene-* 采集参数（2880×1560）要跟 --width/--height 一起传，shots.json 里没有按镜头视口字段；下个 C 线项目值得把 per-shot viewport 收进 shots.json」——当时同一批采集里整页版式 1920×1180 与图版模式 2880×1560 混用，只能靠分批传 CLI 参数，容易漏（补采漏传 --boot 就渲错过一整单元，实踩）

## 任务一句话
shots.json 的 shot 条目支持可选 viewport 字段（优先级 shot > CLI 全局 > 现默认），缺省行为零变化，解析逻辑可单测、正反测试过。

## 步骤
1. 读 `skills/web-capture/SKILL.md` 与 `templates/` 源码，弄清：shots.json 现有 schema、--width/--height 现在如何流到 CDP 采集、capture-all 与 capture-clip 的参数解析路径
2. 设计最小扩展：shot 条目可选 `viewport`（形如 `"viewport": {"width": 2880, "height": 1560}`，字段名以你读码后最贴合现有风格为准）；解析函数独立可导入（如 `resolveShotViewport(shot, cliArgs, fallback)`）
3. 实施：改 capture-all.mjs / capture-clip.mjs（如 render-director/paths 也消费视口则一并）；**不真开浏览器也能测**——解析函数用 node 单测脚本验证
4. 正反测试（本仓方法论：只验「现在通过」等于没验）：
   - shot 带 viewport → 用 shot 值
   - shot 不带 → 回落 CLI 值
   - 都不带 → 回落现有默认
   - shot 带非法值（负数/缺一半）→ 报错或忽略并 warn（择一实现，测试与实现一致）
   - 证据（命令+输出）进报告
5. `skills/web-capture/SKILL.md` 补字段说明（数据契约一节或使用处，几行）；只动这一个 SKILL.md
6. 提交：只 `git add skills/web-capture/**`，Conventional Commits 中英对照，如 `feat(skills): web-capture 支持 per-shot viewport / per-shot viewport in shots.json`

## 红线
- 不采集外网页面；不起长时浏览器进程
- 不动其他 skill、不动 `docs/**`（workorder-log 主控补记）
- 不引入新依赖、不建新抽象层
- 并行施工：同仓有其他会话在别的目录工作；`index.lock` 冲突等 10 秒重试 ≤3 次

## 验收标准（数字化）
- 解析函数正反测试 ≥4 例（含回落与非法值），证据进报告
- 缺省行为零变化的论证（改动点列表说明为何不碰旧路径）
- SKILL.md 字段文档就位
- 1 个 commit，`git status` 干净

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\WCBP-report.md`
结构：# WCBP 结果报告 / ## 结果摘要 / ## 字段设计 / ## 改动清单 / ## 验证证据（命令+输出）/ ## 提交 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
