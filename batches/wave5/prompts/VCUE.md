# 任务 VCUE：video-motion cues 渲染前校验器（verify-cues）

## 背景（已核实事实，勿重新考古）
- 仓库：`C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio`（Git 仓，master，工作树应干净）
- `skills/video-motion/templates/remotion-app/src/cues.ts` 是动效数据契约：`SubtitleCue {start,end,text}`（秒）、`DataBarGroup {t,x,y,bars[]}`、`SpotlightCue {t,ttl,kind,x,y,w,h,text}`（kind: circle/arrow/box；1080p 设计坐标系，FootageOverlay 内置整体缩放适配任意画布）；SKILL.md Step 1 规则：字幕每条 ≤2s、圈注指实物、坐标以抽帧核实落点
- 总时长来源：`src/footage-params.ts`（探针生成的 durationInFrames/fps）或 deck 派生链——文件不存在或读不出时跳过时长类规则并 warn
- 这是全仓唯一没有程序校验器的核心工件（ppt 有 verify.py、narration 有 verify_narration.py、pelican 线有 validate-plan.mjs）；本任务补齐
- Node 版本 24.16（`node -v` 自验）：原生 type stripping 大概率可直接 `import` .ts（先探针验证；cues.ts 只含 erasable 语法）

## 任务一句话
新增 `skills/video-motion/templates/remotion-app/scripts/verify-cues.mjs`：读 cues.ts 按规则 lint，error 退出码 1 / 全绿退出码 0 / warn 只打印不计错，正反测试过。

## 步骤
1. 读 `src/cues.ts`（类型定义 + demo 数据）、`src/footage-params.ts`、`skills/video-motion/SKILL.md` Step 1-4（理解契约与规则出处）
2. 探针验证加载方式：`node --input-type=module -e "import('file:///C:/Users/TimeCraker/Desktop/my_workspace/vibe-studio/skills/video-motion/templates/remotion-app/src/cues.ts').then(m=>console.log(Object.keys(m)))"`；若原生 strip 不可用且 node_modules 恰在（另一并行工单在装/删它，时序不定）可用其中 esbuild 的 transform 兜底；两者都不可用 → 报告受阻（不许自己 npm install）
3. 实现校验器（规则分级）：
   - **error**：字幕时长 >2s；相邻字幕时间重叠；start/end 为负；start/end 或 t+ttl 超总时长（总时长可得知时）；圈注/数据柱的 x/y/w/h 越出 1920×1080 设计坐标（x,y ≥0，x+w ≤1920，y+h ≤1080）；必填字段缺失或类型错
   - **warn**：完全相同的字幕文本重复出现；kind=arrow 且 h≠0（仓内约定 h:0、w=箭头长度）
   - 输出：每条一行 `[ERROR]/[WARN] <规则名> <定位信息> <描述>`，末行统计；GBK 控制台安全（纯 ASCII 输出）
4. **正反测试**（证据进报告）：对模板 demo cues 跑（预期全绿）；复制一份 sabotaged（超长字幕/越界圈注/重叠时间/缺字段各造至少一处，放临时目录不进 git）跑（预期逐条红、退出码 1）；测完删临时文件
5. 提交：只 `git add skills/video-motion/templates/remotion-app/scripts/verify-cues.mjs`，Conventional Commits 中英对照，如 `feat(skills): cues 渲染前校验器 / add verify-cues linter`

## 红线
- **禁改** `skills/video-motion/SKILL.md`（另一并行工单 VMBL 独占该文件——你把建议的用法一行写进报告，主控代集成）
- **禁 npm install、禁渲染**（VMBL 在动同一目录的 node_modules；你的工具不依赖 node_modules）
- 不动其他 skill、不动 `docs/**`
- 并行施工：`index.lock` 冲突等 10 秒重试 ≤3 次；只 add 自己那一个文件

## 验收标准（数字化）
- demo cues 全绿退出 0；sabotaged ≥4 类规则逐条红退出 1（证据进报告）
- 零新依赖（node 原生能力）
- 1 个 commit，`git status` 干净

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\VCUE-report.md`
结构：# VCUE 结果报告 / ## 结果摘要 / ## 规则清单（error/warn 分级）/ ## 验证证据（命令+输出）/ ## 建议的 SKILL.md 用法行 / ## 提交 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
