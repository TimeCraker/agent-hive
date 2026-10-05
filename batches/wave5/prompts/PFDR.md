# 任务 PFDR：probe-footage 补 durationInFrames（点亮 verify-cues 时长规则）

## 背景（已核实事实，勿重新考古）
- 仓库：`C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio`（Git 仓，master，工作树应干净）
- `skills/video-motion/templates/remotion-app/scripts/probe-footage.mjs` 用 ffprobe 生成 `src/footage-params.ts`（分辨率/帧率随素材），但**不产出 durationInFrames**
- 同目录 `scripts/verify-cues.mjs`（今日 `72dba39`）是 cues 渲染前校验器：读 footage-params.ts 取总时长，拿不到就 WARN 并跳过 beyond-total 类规则——**当前 demo 恒跳过**。它支持两参显式指定：`node scripts/verify-cues.mjs <cues路径> <params路径>`
- 机器有 ffmpeg/ffprobe；改完约 3 行代码 + 测试

## 任务一句话
probe-footage.mjs 补 ffprobe format=duration → durationInFrames 输出，verify-cues 的时长窗口规则自动点亮，正反测试过。

## 步骤
1. 读 `scripts/probe-footage.mjs`（现有 ffprobe 调用与模板生成方式）与 `scripts/verify-cues.mjs` 的时长解析段
2. 改 probe-footage.mjs：`ffprobe -v error -show_entries format=duration -of csv=p=0 <素材>` 取秒 → `durationInFrames = Math.round(duration * fps)`，按现有风格写进 footage-params.ts（顺带记 durationSeconds 若自然）
3. **模板 demo 文件同步**：`src/footage-params.ts`（已入库的 demo，2560×1440@60、1830 帧/30.5s）补上 `durationInFrames: 1830`，保持新探针输出形状一致；补后 `node scripts/verify-cues.mjs`（无参，demo 链）应不再 WARN duration-unknown
4. 正反测试（证据进报告，临时文件测完删）：
   - 正：ffmpeg 造 5s 1920×1080@30 testsrc2 素材 → 跑 probe-footage → 生成的 params 含 durationInFrames=150 → 造一份合法 cues + 该 params 跑 verify-cues，期望 0 error 且无 duration-unknown
   - 反：同一 params，cues 里造一条 end=6s 的字幕 → beyond-total 红、退出 1
5. 提交：只 `git add skills/video-motion/templates/remotion-app/scripts/probe-footage.mjs skills/video-motion/templates/remotion-app/src/footage-params.ts`，如 `feat(skills): probe-footage 输出总时长点亮校验时长规则 / emit durationInFrames in probe-footage`

## 红线
- **禁 npm install、禁渲染**（模板 node_modules 不在，也不需要）；零新依赖
- **禁改** `skills/video-motion/SKILL.md`（无需动；如认为有必要的文档行，写进报告由主控集成）
- 不动其他 skill、不动 `docs/**`；并行施工 `index.lock` 冲突等 10 秒重试 ≤3 次

## 验收标准（数字化）
- 正反测试各 1 组证据（命令+输出摘要）
- demo 链 verify-cues 无 duration-unknown warn、0 error
- 1 个 commit，`git status` 干净

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PFDR-report.md`
结构：# PFDR 结果报告 / ## 结果摘要 / ## 改动说明 / ## 验证证据 / ## 提交 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
