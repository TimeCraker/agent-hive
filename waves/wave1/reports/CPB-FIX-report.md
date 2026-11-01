# CPB-FIX 修复报告：Tauri / Cargo 客户端版本同步至 0.2.0 + 防漂移回归测试

- **仓库**：`coding-plan-bench`（main 分支）
- **Commit**：`3215563` — `fix(release): 同步 Tauri 与 Cargo 客户端版本至 0.2.0 / align tauri and cargo versions with 0.2.0`
- **改动规模**：4 文件，+22 / -4
- **日期**：2026-11-01

## 1. 问题定性

体检发现 `package.json` 已升至 `0.2.0`（commit `5f03547 chore(release): bump version 0.2.0`），但 Tauri 桌面端两处版本仍停留 `0.1.0`；且现有部署配置测试未对三端版本一致性做断言，存在再次漂移的回归风险。

## 2. 版本变更对比

| 文件 | 字段 | 修复前 | 修复后 |
|---|---|---|---|
| `src-tauri/tauri.conf.json` | `"version"` | `0.1.0` | `0.2.0` |
| `src-tauri/Cargo.toml` | `[package] version` | `0.1.0` | `0.2.0` |
| `src-tauri/Cargo.lock` | `[[package]] name="app"` 的 `version` | `0.1.0` | `0.2.0` |
| `package.json`（基准，未动） | `"version"` | `0.2.0` | `0.2.0` |

> 说明：`Cargo.lock` 已入库且含 `app` 包 `0.1.0` 条目，若不同步，下次 `cargo build` 会自动改写它、产生新的漂移 diff，故作为版本同步本体一并更新（非无关产物）。

## 3. 新增测试用例

`tests/config/deploy-config.test.ts` 新增测试块 `describe("版本号一致性（三端单源）")`，含 1 个用例：

- 读取 `package.json` 的 `version`，断言非空（作为单源基准）；
- 读取 `src-tauri/tauri.conf.json` 的 `version`，断言与 `package.json` 一致；
- 正则提取 `src-tauri/Cargo.toml` 的 `^version = "..."`，断言与 `package.json` 一致。

任一端漂移即测试失败，防止未来发版再漏改。文件头注释同步补充了该覆盖范围。测试块置于「构建产物」（内嵌 300s 构建 `beforeAll`）之前，快断言先跑。

## 4. 验证结果

| 命令 | 结果 | 关键数据 |
|---|---|---|
| `npm run test:unit`（vitest run） | ✅ PASS | **183/183 用例通过**（17 个测试文件，含新增 1 例；原有 182 例无回归），耗时 15.58s |
| `npm run typecheck`（tsc --noEmit） | ✅ PASS | 0 报错，exit 0 |
| `npm run check:clean` | ✅ PASS | 提交后工作区 clean，无未跟踪临时垃圾残留 |

`test:unit` 内嵌真实构建（`npm run build`，CI 同命令），构建产物 `_headers`/`index.html` 断言随套件通过。

## 5. 剩余风险

- `Cargo.lock` 为手工同步（未跑 `cargo build` 复核），条目仅改 `app` 包 version 一行，与 cargo 自动生成结果一致，风险极低。
