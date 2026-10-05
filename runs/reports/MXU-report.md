# MXU 结果报告

> 任务：预置模型矩阵更新（消费 BMI 调研建议，基于 S01I 后主干）· 日期：2026-10-06
> 仓库：coding-plan-bench @ commit `67b8634`（parent：S01 链尾 `ab538e2`）

## 结论一句话

BMI 全部建议落地：新增 5 渠道项（矩阵 6→11，glm-5.2 存量三渠道保留不动）、1 处模型 ID 修正、2 处 note 更新，其中 BMI 标注待核验的 A4/A5 两个端点已由 MXU 直接核验官方文档后消除疑点再落库；`npm run typecheck && npm run build` 退出 0，单提交只含 `engine/models.ts` + `README.md`。

## 采纳/未采纳清单（对 BMI 建议）

### 采纳（全部 8 条建议无一遗漏）

| # | BMI 建议 | 处理 | 说明 |
|---|---|---|---|
| A1 | 新增 zhipu-glm53-flashx（P0） | ✅ 原样 | BMI 片段可直接用；与 glm-5.3/flash 同 key 三档直对比 |
| A2 | 新增 volcengine-glm53 `glm-5.3[1m]`（P0） | ✅ 原样 | era glm-5.3，envVar 沿用 VOLCENGINE_CODING_API_KEY |
| A3 | 新增 baidu-glm53（P0） | ✅ 原样 | 千帆端点官方确认（BMI 已核） |
| A4 | 新增 deepseek-flash（P1，endpoint 待核验） | ✅ 疑点已消除 | MXU 抓取 api-docs.deepseek.com/guides/anthropic_api：base URL 逐字确认 `https://api.deepseek.com/anthropic`，官方示例 model 即 `deepseek-flash`，按 BMI 预判填入 |
| A5 | 新增 moonshot-kimi-k3（P2，endpoint 留空待核验） | ✅ 疑点已消除 | MXU 抓取 platform.kimi.ai/docs/api/messages（官方 Messages API 文档）：base URL 逐字确认 `https://api.moonshot.ai/anthropic`（`POST /anthropic/v1/messages`），model 枚举仅 `kimi-k3`；note 由「勿直接上线」警告改为事实描述 |
| U1 | baidu-deepseek-v41-flash model 改小写 | ✅ | `"DeepSeek-V4.1-Flash"` → `"deepseek-v4.1-flash"`（千帆官方原文） |
| U2 | volcengine-glm52 加存量对照 note | ✅ | 按 BMI 原文 |
| U3 | baidu-deepseek-v41-flash note 更新 | ✅ | 按 BMI 原文（去掉「矩阵占位」） |

建议移除：无（BMI 核实 6 项全在线，零删除）。glm-5.3 家族默认对比组按要求保留不动。

### 未采纳（均非 BMI 建议，为 BMI 自身裁定或 MXU 主动范围裁定）

| 项 | 理由 |
|---|---|
| GLM-5.3-Prime | BMI 差异清单 #1 已裁定：仅 B 站有、智谱官方无此模型，以官方为准不采信 |
| Kimi K2.8 Preview | BMI 差异清单 #3 已裁定：官方定价页无此模型，不采信 |
| `.env.example` 增补 `DEEPSEEK_API_KEY` / `KIMI_API_KEY` 条目 | 任务红线「不碰 `.env*`」；替代方案：README 矩阵表已列全各渠道 envVar 名，CLI 注释同步说明 |
| `wrangler.toml` / `deploy-worker.yml` 的 ALLOWED_UPSTREAMS 扩容 | allowlist 是运营方安全面决策（S01 spec 定位为部署配置），BMI 亦未建议；README 已加提示「新渠道走浏览器直连或本地 App，代理 allowlist 由运营方配置」 |

### BMI 连带提示的落实

- site 快选直接 import `MODEL_MATRIX`，零额外改动 ✅（BenchForm 芯片区为 flex 布局自动容纳 11 项，构建通过）
- `era` 类型 `"glm-5.3" | "glm-5.2"` 无需扩展 ✅（按 BMI 预判，未动）
- README 模型矩阵段（L57-69）已重写为渠道表 + envVar 一览 + **「新增渠道项均未经本台实测」声明** ✅

## 提交与验证

- **提交**：`67b8634` `feat(matrix): 更新预置模型矩阵至 2026-10 调研 / refresh preset model matrix from 2026-10 research`；`git show --stat HEAD` 仅 `README.md`（+18/-3 行段内）与 `engine/models.ts`（+64/-7），无夹带；提交后工作区 clean；未 push。
- **验收命令**：`npm run typecheck && npm run build` 退出 0（tsc 两遍通过，vite 1615 modules、built in 2.32s；有一条 storage.ts 动/静态双导入的既有构建提示，与本次无关）。
- **加测（超验收下限）**：`npm run test:unit` → 171 passed / 2 skipped；**1 个测试文件失败 `tests/config/deploy-config.test.ts`（构建产物）**，经 stash 对照实验证实为**既有环境问题**：干净 HEAD `ab538e2` 上同样失败，根因是 esbuild 在 Windows 临时目录清理报 `Access is denied`（触发于 `node_modules/react-dom/client.js` 解析，与本改动零关联；同一 `npm run build` 命令手动执行成功）。该失败非本任务引入、不阻塞验收标准。
- **端点核验（MXU 补做，BMI 遗留的两个待核验点）**：DeepSeek 官方 Anthropic 指南、Kimi 官方 Messages API 文档各一次抓取，均拿到逐字 base URL；未跑任何真实测速（红线），无付费调用。

## 自评

- **逐条可对账**：BMI 8 条建议（5 增 1 改 2 注释）全部落地且字段级与建议一致，唯二改动是 A4/A5 按核验结果填实 endpoint（BMI 明示「MXU 实施前查证后填入」，属授权范围内的补全而非偏离）；2 条 BMI 自裁定排除项 + 2 条 MXU 范围裁定（.env*、allowlist）均列明理由。
- **诚实边界**：新增 5 项零实测（本任务禁真实测速），models.ts 的 A5 note 与 README 表格均显式标注「未实测」，未虚构任何 BMI 标「未获取到」的数据（千帆各模型上下文明细等未落库——`ModelTarget` 结构本无该字段）。
- **验证超过验收线**：验收只要求 typecheck+build，另跑了单测并做了 stash 对照实验，把唯一失败项的根因钉死在「既有环境问题、与本改动无关」并留了可复现证据（干净 HEAD 同败）。
- **遗留风险**：① 新渠道（DeepSeek/Kimi）是否开放浏览器 CORS 未知，需实测确认，若不支持则只能走本地 App/CLI；② 代理 allowlist 未扩容，新渠道在「项目代理」位置不可用（README 已提示）；③ `deploy-config.test.ts` 的 esbuild 临时目录 Access denied 在本机持续复现，建议 owner 侧排查（杀毒/索引服务锁 Temp 目录），与本任务无关。
