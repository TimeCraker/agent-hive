# LK 体检报告 · LeKao AI 助教工作台质量门回归与健康度审计

> Wave 30 · 派发自太木控制台 · 只读诊断，未改动任何业务代码与配置

## 1. 项目概况与检查时间

| 项 | 值 |
| --- | --- |
| 项目 | LeKao（K12 机构 AI 助教工作台，线上 lekao.asterforge.top） |
| 版本 | v2.7.0（`package.json` 与 `CHANGELOG.md` 一致，无漂移） |
| 技术栈 | Next.js 16.3.7 + React 19 + Prisma 6.19 + PostgreSQL + next-auth v4 + vitest 4.1.11 |
| 检查基线 | `main` @ `3b43c41`（2026-10-29 18:34 +0800），working tree clean |
| 检查时间 | 2026-11-01（本地 Windows 11 / pnpm 9.15.9） |
| 环境准备 | 首查发现 `node_modules` 缺失 → `pnpm install`（1m35s）→ `pnpm db:generate`（见 §4 风险 R1） |

## 2. 单测执行结果（`pnpm test` = vitest run）

| 指标 | 数值 |
| --- | --- |
| 测试文件 | **33 个，全部通过** |
| 测试用例 | **335 / 335 通过，0 失败，0 跳过** |
| 总耗时 | 3.46s（纯测试 1.68s / transform 2.09s / import 11.33s） |
| 结论 | ✅ PASS |

## 3. 类型检查与 Lint 检查结果

| 质量门 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| 类型检查 | `pnpm typecheck`（tsc --noEmit） | **0** | ✅ **0 错误 / 0 警告**（Prisma Client 生成后） |
| 代码规范 | `pnpm lint`（eslint） | **0** | ✅ **0 error / 0 warning** |

> typecheck 首跑曾报 ≥14 条 TS7006/TS2305（`Parameter 'tx' implicitly has an 'any' type`、`@prisma/client has no exported member 'UserRole'`），全部为 Prisma Client 未生成的连锁症状，补跑 `pnpm db:generate` 后归零。**代码本身无类型错误**——该现象本身构成一项重要发现，见 §4 R1。

### 活文档一致性审计（README.md vs 代码实况）

逐项核对结论：**README 无实质性漂移**。

- ✅ 15 个 package.json scripts 全部真实存在；README 部署/迁移命令（`deploy-production.ps1`、`prisma migrate deploy`）有效
- ✅ 目录树声明与实况吻合：`api/{auth, lekao/{summarize,feedback,ideas,history,templates}, checkin, admin}`、dashboard 7 子页、admin 8 子页、`lib/{ai,mistake,deliver,workflow,summary,storage}` 全部在位
- ✅ `.env.example`、`public/lekao-mark.svg`、端口 3007 约定均与实况一致
- ⚪ 微小省略（非漂移）：README 目录树未列 `api/client-error` 与 `dashboard/history-mgmt`，属摘要式树形的合理省略
- ⚪ 范围外发现：仓库 `CLAUDE.md` 写「src/lib 单测 241 个」，实际已增长至 335 个，属陈旧快照（非 README 问题，仅记录）

## 4. 潜在风险与健康度评级

### R1（高）main 分支 CI 连续失败 6 天，质量门在推送侧失效

**事实链**（gh CLI 取证）：

- 最近 2 次 main push 的 CI 均 **failure**：`40859924363`（2026-10-29，57s）、`39942655685`（2026-10-23，52s），均挂在 **Typecheck** 步骤；此后 Test / Build 步骤被短路未执行
- 上一次绿的是 `39903853717`（2026-10-23 05:05，2m24s 完整跑完）
- 根因：`.github/workflows/ci.yml` 在 `pnpm install` 后**没有 `prisma generate` 步骤**；pnpm 9 默认拦截 `@prisma/client` 的 postinstall 构建脚本（`package.json` 无 `pnpm.onlyBuiltDependencies` 放行），导致 CI 环境里 Prisma Client 类型缺失 → tsc 报与本地首跑完全相同的 TS7006/TS2306 连锁错误
- 本地已验证：补跑 `pnpm db:generate` 后 typecheck 归零 → 修复只需 CI 增加一步 `pnpm db:generate`（或在 `package.json` 放行 `@prisma/client` 构建脚本），业务代码零改动

**影响**：10-23 之后合入 main 的 2 个提交实际未通过完整推送质量门（Test/Build 未跑），恰逢其时本次本地回归补上了这一验证（全绿）。

### R2（低）CI Actions Node 20 弃用警告

`actions/checkout@v4` 等被迫跑在 Node 24 上，当前仅告警，建议后续顺手升 action 大版本。

### R3（低）CLAUDE.md 单测计数陈旧

241 → 实际 335，下次文档维护时同步。

### 健康度评级：**B+**

| 维度 | 评价 |
| --- | --- |
| 代码质量（单测/类型/规范） | A —— 三门全绿，335 用例 3.46s，零类型错误零 lint 问题 |
| 文档一致性 | A —— README 与实况逐项吻合，版本号无漂移 |
| 交付流水线 | C —— main 连续 2 红 6 天，推送质量门事实失效（R1） |
| 综合 | **B+**（代码健康，流水线失血；R1 修复后可回 A） |

## 5. 自评结论

**达标 ✅**，附一项高优先级移交事项：

1. 验收标准逐条满足：单测有明确 PASS 统计（335/335 / 3.46s）、typecheck 有明确退出状态（exit 0 / 0 错误）、lint 0/0、报告自包含落盘
2. 全程只读诊断：未修改任何业务代码、配置与密钥；`node_modules` 安装与 `prisma generate` 为环境准备副作用，`git status` 前后均 clean
3. 移交事项：R1（CI 补 `prisma generate` 步骤）建议作为独立小修尽快排期——修复方案已验证，属一行流水线编排，不涉业务代码；本报告按红线未代为执行
