# BUILD · 本地构建门禁 + 动作单测报告

- **日期**：2026-10-10
- **任务**：`docs/handovers/homepage-release-and-acceptance-agent-prompt.md` §6 静态检查部分
- **仓库**：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`
- **分支 / HEAD**：`codex/character-motion-m1` @ `8302135`（开始与结束时工作区均干净）
- **证据目录**：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/build/`
- **结论**：**全部通过，无需代码修复**。原地 `pnpm build` 因 3108 预览服务的 SQLite 文件锁失败（环境锁，非代码缺陷），同一 HEAD 在隔离副本用同一 script + CI 同款占位 env 构建绿。

## 逐项结果

| # | 检查 | 命令（package.json 实际 script） | 结果 | 证据文件 |
|---|---|---|---|---|
| 1 | TypeScript | `pnpm run typecheck`（`tsc --noEmit`） | ✅ 通过，0 错误 | `build/typecheck.log` |
| 2 | ESLint | `pnpm run lint`（`eslint`，flat config） | ✅ 通过，exit 0；0 error / 70 warning（见下，全部既有范围外） | `build/lint.log` |
| 3a | 生产构建（原地） | `pnpm build`（`prisma generate && next build`） | ⚠️ 环境失败：`EBUSY: resource busy or locked, unlink .next\standalone\prisma\data\dev.db` | `build/build.log` |
| 3b | 生产构建（隔离副本） | 同 `pnpm build` script + CI 占位 env | ✅ 通过：`✓ Compiled successfully in 18.6s`，静态页 49/49，路由表完整（`/` 为 ○ Static 1m/1y ISR） | `build/build-isolated.log`、`build/isolated-install.log` |
| 4 | 空白字符检查 | `git diff --check` | ✅ 通过（工作区干净，无输出） | —（终端记录） |
| 5 | 动作回归单测 | `pnpm exec tsx --test scripts/character-motion/{art,story,works,complete,fluidity}-motion?…`（任务书 5 个文件全量） | ✅ **21/21 pass，0 fail**，duration 5.36s | `build/motion-tests.log` |

## 关键细节

### 3a 原地构建 EBUSY 的定性（非代码缺陷）

- 失败点：`next build` 重建 `.next/standalone` 时 unlink `prisma/data/dev.db` 被拒。
- 锁持有者已只读核实：PID **26776** = `node.exe server.js`，即 **http://localhost:3108 本地生产预览服务**（standalone 内 SQLite 句柄）。任务红线「不动 3108」→ 不杀进程。
- 处置：不改任何代码/配置，改在系统临时目录用 `git archive HEAD` 导出纯净副本（1629 个 tracked 文件）→ `pnpm install --ignore-scripts`（避开 husky prepare，19.6s store 硬链接）→ 同一 `pnpm build` script + CI 同款占位 env（`DATABASE_URL=file:./data/ci.db` 等，与 `.github/workflows/ci.yml` Build 步骤逐字一致，无库构建靠项目 FALLBACK 兜底约定）→ 构建绿。
- 副作用核查：3108 全程未被触碰（结束后 `Get-NetTCPConnection` 确认 3108 仍由 PID 26776 监听）；主仓 `.next` 未被破坏（构建在 unlink 阶段即失败退出）；临时副本已删除。
- ⚠️ **给主控的提示**：后续若需再原地构建（如产出真正部署用的 standalone），需与 3108 的所有者协调一个构建窗口，或先备份再重启该预览。

### 构建告警（3 条，均非本次发布代码引入）

1. `Custom Cache-Control headers detected for /_next/static/(.*)` — `next.config.ts` 刻意配置（CLAUDE.md 注明每条缓存头都有踩坑理由）。
2. ×2 `Dynamic filesystem access causes tracing of the whole project` — 来自 `src/generated/prisma/index.js`（Prisma 生成代码）与 dotenv-vault 打包代码。

### ESLint 70 条 warning 定性（既有，记录不修）

- 0 error，exit 0，门禁通过。
- 分布：49 个文件，规则集中在 `react-hooks/set-state-in-effect`（44）、`react-hooks/refs`（12）、`react-hooks/static-components`（3）、`react-hooks/immutability`（3）、`@typescript-eslint/no-unused-vars`（3）、`import/no-anonymous-default-export`（1）等。
- **范围交叉验证**：将本次发布提交（`7bc1262~5..HEAD` 触碰的全部 src/scripts 代码文件）与告警文件列表做交集 = **空集**。70 条全部位于 admin / vault / config / 旧 sections / mockups / hooks 等未触碰的旧业务文件 → 按任务规则记录不修。

### 动作单测覆盖点（21 项全绿，摘要）

不可信/不完整绘制无法进入六姿态 rig；各原画关键位几何不变；中间手部艺术变形中脸部顶点刚性；反向跳跃无累积畸变；中间配准不折叠/撕裂三角形；60/120Hz 输入停止后动量尾迹衰减；三幕完成前作品幕不出现、链接双向门控；吉祥物全程在画布、收尾位置连续；四→游戏幕手腕独立运动、手指边缘交换、脸部距离保护；缓存关节形变逐顶点匹配参考（正/反）；衣摆 follow-through 在 60/120/144/240 采样率下时间基准正确；换画完全遮蔽、不混合两张脸；中间缩小姿态保持正均匀缩放；反向/中断输入恢复同幕同画；三→四过渡锁定单一身体绘制；关节曲线关键位连续；大标题不交叉淡入成双重排版。

## 修复 diff

无。唯一失败项（3a）为运行中预览服务的文件锁环境问题，非本次发布代码导致，未做代码改动，工作区保持干净（`git status` clean）。

## 红线遵守

- 未部署、未 SSH 服务器、未 commit、未 reset/clean。
- 3108 预览服务（PID 26776）全程存活未动，结束态复验监听正常。
- 日志均为命令输出，无完整环境变量输出（隔离构建仅显式设置 CI 同款 4 个占位值）。
