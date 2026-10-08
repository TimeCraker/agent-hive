# FONT · 中文字体 LCP 专项优化

## 背景
ResumeAIX 首页加载 ~2.14MB 中文字体（26 个 preload 资源），慢网下 LCP 严重。
相关文件：`scripts/generate-hero-font-preloads.mjs`（生成 preload 清单，--check 校验）、
`apps/web/src/app/layout.tsx`（preload 注入）、字体 CSS（font-display 设置）。

## 目标
1. 审计当前 26 个 preload 资源：哪些真正首屏关键（hero 标题字重/字符集），哪些可延迟
2. 收紧 preload 集合到**首屏关键子集**（预期 ≤8 个），其余改 async/swap 加载
3. 确认所有 @font-face 有 `font-display: swap`（或 swap 语义等价）
4. **红线**：改完后 `node scripts/generate-hero-font-preloads.mjs --check` 必须仍通过
   （如需改该脚本的清单生成逻辑，同步更新其期望值）
5. 不引入新依赖（不装 cn-font-split 等工具）；纯配置/清单层面的优化

## 禁止
- 不删字体文件本身
- 不 git commit
- 不碰 resume-cover.tsx / editorial.css（另一并行任务在做，避免冲突）
- 不碰 apps/interview-helper/、scripts/eval-* 等无关 dirty 文件

## 报告
写 `runs/reports/FONT-report.md`：审计结论（26 个资源各自去留）、改动文件、
优化前后 preload 数量对比、--check 结果。
