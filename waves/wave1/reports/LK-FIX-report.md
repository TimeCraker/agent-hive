# LK-FIX 修复报告：CI 流水线补充 prisma generate 步骤

- **日期**：2026-11-01
- **任务**：修复 `.github/workflows/ci.yml` 缺失 Prisma Client 生成步骤导致 CI Typecheck 阶段失败
- **Commit**：`a27c2fc4616270392e62c8ed9821d15f2c6967f3`（main 分支，1 file changed, 5 insertions）

## 根因

CI 在 `pnpm install --frozen-lockfile` 后未执行 Prisma 生成。pnpm 默认不运行 `@prisma/client` 的 postinstall 脚本，导致 CI 环境缺少生成的 Prisma Client 类型，`tsc --noEmit` 报 `TS7006: Parameter 'tx' implicitly has an 'any' type` 等错误，连续多次 push 的 CI 卡死在 Typecheck 阶段。本地因已生成过 client 而不受影响。

## 改动 Diff

`.github/workflows/ci.yml`（在 `Install dependencies` 之后、`Lint` 之前插入）：

```diff
       - name: Install dependencies
         run: pnpm install --frozen-lockfile

+      # pnpm 默认不跑 @prisma/client postinstall，必须显式生成 client，
+      # 否则 typecheck 缺类型（TS7006 等）失败
+      - name: Generate Prisma Client
+        run: pnpm db:generate
+
       # lint 已是硬门槛（2026-10：react-hooks 22 error + 3 warning 债务清零）
       - name: Lint
         run: pnpm lint
```

## 本地验证结果

| 检查项 | 命令 | 结果 |
|---|---|---|
| Prisma 生成 | `pnpm db:generate` | ✔ Prisma Client v6.19.3 生成成功（229ms） |
| 类型检查 | `pnpm typecheck` | ✔ 0 错误（exit 0） |
| Lint | `pnpm lint` | ✔ 0 错误 0 告警（exit 0） |
| 单元测试 | `pnpm test` | ✔ 33 个测试文件、**335/335 用例 100% 通过**（7.52s，exit 0） |

Git 提交边界已核验：`git status` 仅 `.github/workflows/ci.yml` 一个文件改动，无密钥、无临时产物；commit 经 husky lint-staged（prettier）钩子处理后内容不变。

## 健康状态结论

**FIXED / 健康**。CI 缺失 prisma generate 的根因已消除，本地全量验证（typecheck + lint + 335 单测）全绿，等效于 CI 四阶段中前三阶段的本地预演。预期下一次 push 到 main 后 CI 全流程（Lint → Typecheck → Test → Build）通过；Build 阶段使用占位 env 本就不依赖生成顺序以外的状态，风险极低。若 CI 仍失败，属新问题（与本根因无关），需另开任务排查。

## 遗留风险

- 无（改动仅 CI 配置 5 行，不触达业务代码）。
- 备注：Prisma 提示 6.19.3 → 8.0.0-rc.29 大版本升级可用，与本次修复无关，不建议在修复任务中顺手升级。
