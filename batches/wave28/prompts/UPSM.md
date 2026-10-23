# UPSM：小项——上传断网保存中文提示 + 零字节文件前后端拦截

## 任务一句话

修复 S31-UPLD-02（核对页断网保存显示英文 "Failed to fetch"）与 S31-UPLD-03（零字节文件前端不拦、直接 POST 创建占位记录），修完负例回归。

## 共享背景

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。**开工三件事**：`git log --oneline -1` → `node C:/Users/TimeCraker/AppData/Local/ResumeAIX/stage31-runtime/status-all.mjs` 五服务核对 → 读 `docs/stages/stage-31-remediation.md`（小项 1、2 的验收标准）+ 台账 S31-UPLD-02/03 行。
- 环境：E2E 账号 `e2e-stage31@resumeaix.test / E2eStage31!2026`；上传测试用【E2E】合成文件（素材可参考 `C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/UPLD/materials/` 或自建小文件）；**注意简历配额 5 份上限**——库中可能已有【E2E】简历，触顶时先删除自己创建的测试件再测；改 web 代码 rebuild 流程见 runbook。
- 浏览器 Playwright MCP 独占；截图存 `.../ResumeAIX-stage31-audit/UPSM/`（自建），关键截图读图目检。
- 修复纪律：一个缺陷一个 commit（中英文，不 push）；修完 rebuild 同条件前后对照；台账行更新「已修+回归」+ Spec 打勾；lint/type-check 过。
- **收尾纪律**：最后一步 Write 报告到 `.../runs/reports/UPSM-report.md`。

## S31-UPLD-02 修复要求

- 台账根因：`apps/web/src/app/(main)/upload/upload-workspace.tsx` 的 `handleSave` catch 分支优先取 `err.message`（TypeError: Failed to fetch），中文兜底永不命中。
- 修法：断网/网络类失败显示友好中文（如「保存失败：网络异常，修改已保留在本页，请检查网络后重试」）；**修改内容保留**、停留本页、可重试成功。
- 注：upload-workspace.tsx 原属上一轮「独占文件」，**用户本次指令已明确解除（限本修复范围）**——只做该缺陷的最小修改，不顺手重构。

## S31-UPLD-03 修复要求

- 前端：`file-upload.tsx`（或实际上传入口组件）校验补 `size===0` 拦截，提示明确（如「文件为空，请检查后重新选择」）；拦截后**零请求零记录创建**（network 断言）。
- 服务端：BFF 上传/创建解析记录的路由也校验（防直连 API 绕过）：空文件 → 400/422 明确错误，不创建 Resume 行（DB 断言）。
- 负例：0B TXT、0B PDF、0B PNG 各一次；正常小文件上传仍通（回归不破坏）。

## 红线

不动面试线与他人工作区改动；不 push；零密钥；【E2E】数据；删除只删自建测试件。

## 验收标准

1. 断网保存三断言（中文提示/输入保留/恢复后重试成功）有前后对照截图。
2. 零字节三类文件前端拦截零请求 + 服务端直连 400 不建记录（DB 证据）；正常上传回归通过。
3. 两个 fix commit + 台账/Spec 更新 commit；lint/type-check 过。
4. 报告落盘 UPSM-report.md。
