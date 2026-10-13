# BUILD · 本地构建门禁 + 动作单测

## 总上下文
- 总任务书必读：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio/docs/handovers/homepage-release-and-acceptance-agent-prompt.md`（本任务覆盖 §6 的静态检查部分）
- 工作目录：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`（分支 `codex/character-motion-m1`，HEAD `8302135`，工作区干净）
- 本地生产预览 http://localhost:3108 已在跑（PID 26776）——**不要动它，不要杀进程**。
- 证据目录（新建）：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/build/`

## 执行项（全部记录命令与输出摘要到报告）
1. 以 package.json 实际 scripts 为准执行：TypeScript 检查、ESLint、生产构建（`pnpm build`）、`git diff --check`
2. 动作回归单测（仓库目录执行）：
   `pnpm exec tsx --test scripts/character-motion/art-motion.test.ts scripts/character-motion/story-motion.test.ts scripts/character-motion/works-motion.test.ts scripts/character-motion/complete-motion.test.ts scripts/character-motion/fluidity.test.ts`
3. 范围外既有 lint/告警问题：**记录不修**；本次范围新增错误才需要处理
4. 若发现本次发布代码导致的失败：做**最小修复**（不顺手重构、不加依赖、不混入其他仓库改动），报告中列出改动文件与 diff 摘要；**不自行 commit**（主控审查后统一提交）

## 红线
- 不部署、不 SSH 服务器、不杀 3108、不 commit、不 reset/clean
- 输出日志脱敏，不输出完整环境变量

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\BUILD-report.md`：
逐项 通过/失败 + 输出摘要 + （若有）修复 diff。
