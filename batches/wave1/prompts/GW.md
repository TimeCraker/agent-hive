# 任务 GW：games web-client 移动端性能优化

你在 `C:\Users\TimeCraker\Desktop\my_workspace\games` 目录工作（当前目录，AsterNova 游戏 monorepo，PUBLIC 仓，main 分支）。目标目录是子目录 `asternova/web-client/`（Next.js 16 游戏官网 + Arcade 小游戏站）。**移动端 Perf 39 / LCP 11.32s / TBT 10.5s；桌面端 TBT 11s / TTI 87s**（2026-10-03 基线实测）。

## 已知事实（勿重复摸索）
- web-client 包管理器 **npm 单源**（package-lock.json；pnpm-lock.yaml 已删除禁用）
- 首页有 WASM 挂载点 `public/godot/`（~50MB，游戏本体按需加载——挂载协议不能动）；Arcade 页引 pixi.js / matter-js / three / framer-motion / howler
- 基线档案：`..\asterforge-deploy\backups\production\perf-baselines\2026-10\game.asterforge.top.md`
- 仓根有 CI（`.github/workflows/ci.yml`，npm ci + lint 非阻塞 + build 门槛），你的 push 会触发
- **有并发美术会话在本仓工作**（white/purple/orange 角色返工，.blend/GLB 大文件）

## ⚠️ 并发避让红线（最高优先级）
- 只允许改动 `asternova/web-client/**` 路径
- 提交必须路径限定：`git add asternova/web-client/... && git commit -- asternova/web-client/...`，**严禁 git add -A / commit -a**（本仓发生过误扫并发会话暂存文件的事故）
- 绝不触碰：`asternova/art/`、`asternova/client-godot*/`、`asternova/docs/stage-specs/`、任何 .blend/.glb
- 动手前后各做一次 `git status` 快照，发现工作区出现大量非你改动的变化属正常（美术会话），忽略即可

## 优化方向（按 Lighthouse 审计数据自行定夺）
- 首页/落地页：拆掉不必要的重库引入（three/pixi 若仅游戏页用 → dynamic import 按路由拆分）
- WASM 加载策略：确认首页是否预载了 godot 资源（应该按需）
- 字体/图片资源：子集化与优先级
- TBT 长任务： hydration 与动效库初始化延后

## 步骤
1. `cd asternova/web-client && npm ci`，本地 build+start，Lighthouse 移动档复现基线
2. 归因：前 5 大 JS 包/长任务清单（表格进报告）
3. 逐项优化，每项独立提交；每步 `npm run build` 保持可构建
4. 复测两轮 + **首屏与一个 Arcade 页截图目检**（你是多模态会话，亲自看图确认游戏站无破相）
5. push（CI 会跑，报告里记录 CI 结论；若 CI 失败要修到绿）

## 验收标准（达成任一）
- 移动端 Perf ≥ 55，或 LCP ≤ 8s（较 11.32s 改善 ≥30%）
- build + CI 绿 + 截图目检通过

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\AGENT-BOARD-2026-10\reports\GW-report.md`
模板：# GW 结果报告 / ## 归因表 / ## 优化项（改动+哈希+收益） / ## 前后对比 / ## 截图目检 / ## CI 结论 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
