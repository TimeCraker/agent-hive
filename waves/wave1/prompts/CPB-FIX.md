# 任务：同步 Coding Plan Bench Tauri 与 Cargo 客户端版本并增加防漂移回归测试

## 背景与问题定性
在近期的 coding-plan-bench 体检中发现：`package.json` 版本号已升至 `0.2.0`，但 `src-tauri/tauri.conf.json` 与 `src-tauri/Cargo.toml` 中的版本号仍停留为 `0.1.0`。
此外，现有的 `tests/config/deploy-config.test.ts` 未对三端版本一致性做断言，存在未来再次漂移的回归风险。

## 执行要求与验收标准
1. **工作目录**：当前工作目录为 `coding-plan-bench`。
2. **版本号同步**：
   - 将 `src-tauri/tauri.conf.json` 中的 `"version": "0.1.0"` 修改为 `"0.2.0"`；
   - 将 `src-tauri/Cargo.toml` 中的 `version = "0.1.0"` 修改为 `"0.2.0"`。
3. **增加版本号一致性测试**：
   - 在 `tests/config/deploy-config.test.ts` 中新增一个测试块（如 `describe("版本号一致性（三端单源）", ...)`）：
     - 读取 `package.json` 的 `version`；
     - 读取 `src-tauri/tauri.conf.json` 的 `version`，断言与 `package.json` 一致；
     - 读取 `src-tauri/Cargo.toml` 中的 `version = "..."`，断言与 `package.json` 一致。
4. **本地验证**：
   - 运行 `npm run test:unit`（包含原有的 182 个用例及新增测试，必须 100% 全部通过）；
   - 运行 `npm run typecheck`（必须 0 报错）；
   - 运行 `npm run check:clean`（确保无未跟踪临时垃圾文件残留）。
5. **Git 提交**：
   - 检查 `git status`，确认仅改动了目标文件；
   - 严禁提交无关产物；
   - 提交 commit 信息：
     `fix(release): 同步 Tauri 与 Cargo 客户端版本至 0.2.0 / align tauri and cargo versions with 0.2.0`
6. **交付报告**：
   - 将修复结果报告写入 `C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/waves/wave31/reports/CPB-FIX-report.md`（或相对路径 `waves/wave31/reports/CPB-FIX-report.md`）；
   - 报告需包含：版本变更对比、新增测试用例说明、测试与构建验证日志数据、commit sha。
