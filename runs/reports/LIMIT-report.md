# S32-LIMIT 素材生成原子数量限制 — 完成报告

**日期**：2026-10-15 · **Commit**：`d11e8dd`（main 本地，未 push 按红线）· **结论**：✅ 全部验收项通过，无遗留

## 改动（最小实现，1 个业务文件）

`apps/web/src/app/api/career-assets/generate-resume/route.ts`：

1. **保留** AI 调用前 `canCreateResume` 快速预检查（省模型调用）
2. 入库由裸 `prisma.resume.create` **改接 `createResumeWithinLimit`**（`plan.ts` 原子闸门：SELECT FOR UPDATE + count + create 同事务）。AI 调用在闸门外完成，事务内无外部网络调用，不长期持锁
3. 触顶 `ResumeLimitExceededError` → 403 `{ error: reason }`，与普通创建/副本入口共用 `resumeLimitMessage` 文案源；不落库、无假成功
4. 响应形态 `{ resumeId, title }` 201 不变 → **前端零改动**（`assets/page.tsx:58` 既有 `!res.ok → data.error` 处理天然兼容，已静态核实）

`plan.ts` 闸门本身、`registry.ts` 均未触碰（红线遵守）。计量规则未动（该路由公测期免费无扣币；触顶时 AI 已消耗如实保留，不退不补）。

## 验证证据（`C:/Users/TimeCraker/Desktop/my_workspace/ResumeAIX-stage32/LIMIT/`）

### 1. 闸门层三方并发（不耗模型调用）— 3 轮 × 10/10 全 PASS

`concurrency-test.mts` 直接打 `createResumeWithinLimit`（三条路由最终入库的同一函数），独立测试账号预置 4/5（FREE 上限 5）后，「素材生成 / 普通创建 / 副本创建」三种入口数据形态并发入库：

- 恰好 1 方成功，**成功方轮换**（素材生成→副本→素材生成，证明 FOR UPDATE 真串行化而非固定顺序侥幸）
- 最终恰好 5 份、无超额记录；触顶方均 `ResumeLimitExceededError` 且文案与普通创建同源；文案字面值未漂移
- 成功方按其入口字段形态完整落库（如 REVIEWING + design）
- 触顶后 `canCreateResume` 预检查提前拦截（下次请求 AI 前即 403）
- 库内其他用户数据零扰动；测试数据清理无残留

### 2. 真实链路（live 路由 + ai-service:3002 + 智谱 LLM）— 12/12 全 PASS

`real-e2e.mts`，独立测试账号（FREE，2 条资产 + 4/5 预置）NextAuth 登录走真实路由：

- 素材生成 201（真实 AI 调用**一次即止**，7.0s）→ DB 落库 5/5、`REVIEWING`、`design` 线
- 再次生成：403 + 同源文案「免费版最多存储 5 份简历，请删除不需要的简历后重试」+ **53ms 快速返回**（AI 前预检查拦截，无模型消耗）；count 仍 5 无多余记录
- 账号清理无残留

### 3. UI 走查（Playwright 真机，dev:3000）

登录 → /assets 正式页面点「从素材生成简历」→ ~15s 成功跳转 `/resume/<id>`（成功保存；编辑页 `/design` 404 系新简历无设计稿的正常业务流，与本改动无关）→ 触顶后再点 → 页面展示完整触顶文案（截图 `ui-limit-hit.png`）。

### 4. 静态检查

type-check 通过；lint **0 errors**（1 条存量 warning 在本次未触碰的 restore effect）。

## 环境备注（供主控与并行任务参考）

- 本地无 Docker/WSL/Postgres 安装；复用 **Stage31 嵌入式 PG（127.0.0.1:5434）+ Redis（6380）**，库内共享数据零改动（测试均用独立账号，测毕级联清理）。
- ai-service/export-service 中途被并行任务重启过一次（我的首次 real-e2e 被打断，500 系 fetch ECONNREFUSED 而非本改动问题）；后经 `stage31-runtime/start-ai.mjs`（幂等）拉起后重跑全绿。
- 共享账号 `e2e-misc2` 期间被并行任务改动（简历 4→3），故真实链路改用独立自建账号，避免竞争；其密码曾临时重置、**已恢复原 hash**。
- web dev(:3000) 为本任务拉起，现保持运行未停（避免打断可能在使用它的并行任务）；Stage31 旧构建 next start(:3100) 亦仍在跑，不含本次修复。
- `pnpm db:generate` 因 Windows DLL 占用（并行 node 进程持有旧 engine）刷新失败，但既有 client 与 schema 一致（本任务未改 schema），不影响验证。

## 红线遵守

未 push 未部署；未清库（仅自建账号级联清理）；未动 `registry.ts`；未动 `plan.ts` 闸门（未发现其缺陷）；密钥零输出零落盘。
