# 任务 PF：my-portfolio 移动端性能优化

你在 `C:\Users\TimeCraker\Desktop\my_workspace\my-portfolio` 目录工作（当前目录）。这是个人主站 asterforge.top（Next.js 16 App Router + Prisma/SQLite + standalone），**移动端性能分数 56 / LCP 5.91s / FCP 3.26s / TBT 480ms**（2026-10-03 六站基线实测，桌面端 98 健康）。你来把移动端拉起来。

## 已知事实（勿重复摸索）
- 包管理器 **pnpm 单源**（pnpm-lock.yaml 是唯一 lockfile，磁盘上的 package-lock.json 是历史产物别碰）；`hub/` 是独立 npm 包不参与
- 基线档案：`..\asterforge-deploy\backups\production\perf-baselines\2026-10\asterforge.top.md`（含截图与指标明细）
- **方法论已被姊妹项目验证可行（ResumeAIX Stage 24）**：① Lighthouse 本地 CLI + 网络记录做字节归因（重点查字体占比）→ ② 若字体是大头：构建期解析产物 CSS 的 @font-face 生成 `<link rel=preload as=font>` 清单注入 layout（子集命中提前，hero 字体 swap 不被队列卡）→ ③ render-blocking/total-byte-weight 审计逐项清
- 主页是 server component + ISR 60s，`src/data/home-chapters.ts` 硬编码章节；DB 读取全部有 try/catch 兜底约定（新代码必须保持）
- 改缓存策略前先读 next.config.ts 注释（每条有踩坑理由）；CLAUDE.md 有完整项目规则

## 步骤
1. `pnpm install` → 本地起 Lighthouse（npx lighthouse http://localhost:3000 移动档，dev 不行就 build+start）复现基线
2. 字节归因：总字节/字体字节占比/前 5 大资源（表格写进报告）
3. 实施优化（字体 preload 子集 / 懒加载章节动效库 / 图片尺寸与优先级 / 移除阻塞资源），每项独立提交
4. 复测：Lighthouse 移动端两轮取稳定值 + **首屏截图目检**（你是多模态会话，必须亲自看截图确认无白屏/字体破相/布局崩）
5. `pnpm typecheck && pnpm lint && pnpm build` 全绿后 push origin master

## 红线
- **push ≠ 部署**：不跑任何部署脚本、不 SSH 服务器（部署由用户手动走 deploy-portfolio-safe.sh）
- DB 兜底模式不得破坏；`hub/` 不碰；锁文件单源 pnpm
- 路径限定提交；Conventional Commits 中英对照

## 验收标准（达成任一即达标）
- 移动端 Perf ≥ 70，或 LCP ≤ 4.2s（较 5.91s 改善 ≥30%）
- 附前后对比表 + 首屏截图（目检通过）

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\AGENT-BOARD-2026-10\reports\PF-report.md`
模板：# PF 结果报告 / ## 字节归因表 / ## 优化项清单（每项：改动+提交哈希+收益） / ## 前后 Lighthouse 对比 / ## 截图目检结论 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
