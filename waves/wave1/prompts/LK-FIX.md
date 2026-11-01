# 任务：修复 LeKao CI 流水线缺失 prisma generate 步骤

## 背景与问题定性
在近期的 LeKao 体检中发现，GitHub Actions CI 流水线连续多次 push 失败，均卡在 `Typecheck` 阶段（报错 `TS7006: Parameter 'tx' implicitly has an 'any' type` 等）。
经根因分析：`.github/workflows/ci.yml` 在 `pnpm install --frozen-lockfile` 后没有执行 Prisma 生成步骤，而 pnpm 默认不运行 `@prisma/client` 的 postinstall 脚本，导致 CI 环境中缺少 `@prisma/client` 类型，使 `tsc --noEmit` 失败。本地实测补跑 `pnpm db:generate` 后类型检查与 335 个单测立即 100% 全绿。

## 执行要求与验收标准
1. **工作目录**：当前工作目录为 `lekao`。
2. **编辑 CI 配置**：
   - 检查 `.github/workflows/ci.yml`；
   - 在 `name: Install dependencies` 步骤后，`name: Lint` 步骤前，增加：
     ```yaml
     - name: Generate Prisma Client
       run: pnpm db:generate
     ```
   - 保持文件格式规范、缩进对齐。
3. **本地验证**：
   - 运行 `pnpm db:generate`；
   - 运行 `pnpm typecheck`（必须 0 错误）；
   - 运行 `pnpm lint`（必须 0 错误 0 告警）；
   - 运行 `pnpm test`（全部 335 个测试用例必须 100% 通过）。
4. **Git 提交**：
   - 检查 `git status`，确认仅改动了 `.github/workflows/ci.yml`；
   - 严禁提交无关文件、密钥或临时产物；
   - 提交 commit 信息：
     `fix(ci): 在 CI 流水线中补充 prisma generate 步骤 / add prisma generate step in ci workflow`
5. **交付报告**：
   - 将修复结果报告写入 `C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/waves/wave31/reports/LK-FIX-report.md`（或相对路径 `waves/wave31/reports/LK-FIX-report.md`）；
   - 报告需包含：改动 diff、测试与 lint 验证结果、commit sha、健康状态结论。
