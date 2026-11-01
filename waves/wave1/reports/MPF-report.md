# MPF 体检报告：my-portfolio 架构与资产引用完整性

## 1. 项目概况与检查时间

- **检查时间**：2026-11-01
- **对象**：`my-portfolio`（主站 asterforge.top，个人主页 / 商业矩阵入口）
- **技术栈**：Next.js 16.3.7 + React 19.2.4 + Prisma 6（SQLite），standalone 输出，pnpm 管理依赖（唯一锁文件 `pnpm-lock.yaml`）
- **检查时工作区状态**：分支 `codex/character-motion-m1`，HEAD `059b710`，领先 `origin` 8 个提交；另有 10 个 docs 下 Markdown 文件带未提交改动（角色首页/导航收尾相关文档 WIP，属并行会话在途工作，本次体检未触碰）
- **检查方式**：只读体检——类型检查、结构审计、静态资产与 manifest 交叉比对、sha256 完整性校验、本地 SQLite 只读查询、部署链路文档核对；未修改任何数据库内容、原画资源或既有代码

## 2. TypeScript 类型检查与仓库结构审计

| 检查项 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `pnpm run typecheck`（tsc --noEmit） | ✅ PASS（退出码 0，零报错） |
| 仓库结构规范 | `pnpm run check:structure` | ✅ PASS：697 个本地 import + 159 个 Markdown 链接，0 错误 |

**环境前置说明**：检查开始时本机无 `node_modules`，两项检查首次运行均因依赖缺失失败（报错全部为 Cannot find module 类）。执行 `pnpm install`（1m32s，含 Prisma Client 生成与 husky 初始化）后重跑，两项全绿。首次失败属环境未安装，非代码缺陷。

## 3. 静态资产与原画动效引用完整性走查

public 共 850 个文件；本次重点走查 `public/character-motion/`（9 个子目录，77MB）。

### 3.1 代码 → 资产方向（引用的文件都存在）

- **字面路径**：src / scripts / docs 中全部 34 个静态字面引用（poster、pose、mascot、works 图等）逐一比对磁盘，**全部存在，0 缺失**。
- **主 manifest（`/character-motion/manifest.json`）**：声明 60fps 变体 193 帧（frame-0000 ~ frame-0192）＝磁盘实际 193 文件；120fps 变体 385 帧（frame-0000 ~ frame-0384）＝磁盘实际 385 文件；首尾帧名与数量完全对齐；`stills` 两张 poster 存在。
- **art-directed-v1 manifest**：6 个姿势帧 + ring + ribbons 共 8 个文件全部存在，manifest 内记录的字节数与元数据齐全。
- **pointer-frames-v1（鼠标动作图集）**：up / down / right / idle 四个图集的 **sha256 实测值与 manifest 记录值 4/4 完全一致**——资产自 manifest 生成以来未损坏、未被篡改。
- **home-v1 / reading-v1 assets.json**：两个场景清单各 6 项资产，磁盘 12/12 存在，且清单保留了原始/优化字节数与像素一致性标记。
- **works 场景动态 id**：`WorksScene` / `ReadingStory` / `OpeningGate` 三处组件引用的 `nebula-survivor`、`shoot-them-all`、`merge` 三个 webp 全部存在。

### 3.2 资产 → 代码方向（磁盘上的文件都有归属）

- `pose-03-back.webp`（未入 manifest）：**有意保留**。设计文档明确记录其为「失败动作路径记录，不参与演出」，且 `verify-art-preview.mjs` 断言运行时**不**请求该文件。非孤儿缺陷。
- `works-v2/`（3 个 PNG，约 5MB）与 `works-v1/` 下 2 个 PNG 原图（约 3.9MB）：仅被历史 Stage 文档引用，是迭代中被 webp 版本取代的旧资产。属可清理的历史残留（约 9MB），非引用断裂。
- 测试/诊断脚本中的 `k0.webp`、`k3.webp`、`${n}.webp`、`fixture-${i}.webp`、`/../private` 等路径：均为 `cache.test.ts` 与 `verify-preview.mjs` 的**合成测试数据**（用于验证 manifest 校验会拒绝缺帧与越界路径、诊断脚本自建 fixture），不发起真实请求，非缺陷。

### 3.3 状态备注

主 manifest `status: "art-review"`、art-directed-v1 `visualApproval: "pending"`——与当前分支（character-motion-m1）及近期 mascot 动作提交一致，属在途工作的已知中间状态，非资产问题。

**结论：原画/动效资产引用完整性 100%，关键图集通过密码学校验，无损坏、无断链。**

## 4. 综合健康度评估与风险点

### 综合评级：**A**

核心门禁（类型、结构、资产完整性）全绿，资产有 sha256 级验证背书，部署链路文档与实际脚本一致。风险点均为低危、不影响线上：

| # | 风险点 | 等级 | 说明 |
|---|---|---|---|
| 1 | 分支领先远端 8 提交 + 10 个文档未提交 | 中（流程） | 在途 WIP 未推送，存在多会话并行场景下的覆盖/冲突风险（历史上曾发生）。建议该阶段收尾后尽快提交推送 |
| 2 | Dockerfile 陈旧失配 | 低 | 使用 `npm ci` + `package-lock.json`（仓库不存在该文件），真用它构建必失败；但部署手册与所有文档均不引用它（生产走 `deploy-portfolio-safe.sh` + pnpm --frozen-lockfile），属遗留死配置，建议择机删除或改写 |
| 3 | 主页项目矩阵新鲜度 | 低 | seed（7 项）与 FALLBACK（6 项，少 archived 的 rag，sortOrder 相应错位 1）均不含已上线的 xiaofanzhuo（2026-08-23 验收）与 coding-plan-bench；生产 DB 可经 admin 已补（本地 dev.db 该表为空、无法确证），建议下次内容更新时核对线上矩阵 |
| 4 | seed 默认值过时 | 低 | `footer_currently_doing` 种子默认「ResuAIX 商用支付接入」，与 ResumeAIX 已转全站免费（T-Coin）方向不符；seed 为只增不改（`update: {}`），仅影响新环境首次播种的展示文案 |
| 5 | 本地环境依赖缺失 | 低 | 本次开始时 node_modules 不存在；属环境状态非仓库问题，已安装恢复 |

### 配置与活文档一致性核对明细

- 部署手册 `docs/runbooks/deployment.md` → `scripts/deploy-portfolio-safe.sh`：脚本实际执行 `pnpm install --frozen-lockfile`，与仓库唯一锁文件 `pnpm-lock.yaml` 严格一致 ✅；「push 不自动上线、手动 SSH」的约定与工作区规则一致 ✅。
- `next.config.ts`：`output: "standalone"` 与部署脚本构建 standalone 的流程一致 ✅；CSP 生产/开发差异（unsafe-eval 仅 dev）有注释与 Stage 文档对应 ✅。
- 私密原件、SQLite 数据不入 Git 的约定：`.gitignore` 覆盖 `/node_modules`、`/src/generated/prisma` 等，体检全程未产生额外未追踪残留（报告文件本身为指定交付物）✅。

## 5. 自评结论

**达标。** 验收标准逐项对照：

1. ✅ 类型检查与结构检查输出明确（typecheck 0 错误；check:structure 697 import + 159 链接 0 错误）；
2. ✅ 资产完整性核查有具体结论（34 字面引用 0 缺失、帧数 193/385 与 manifest 全对齐、pointer 图集 sha256 4/4 一致、测试假路径与有意保留项均已甄别定性）；
3. ✅ 结构化体检报告已生成（本文件）。

红线遵守：全程只读，未改数据库、未动原画、未修改他人 WIP；除指定报告路径外无任何新增未追踪文件。
