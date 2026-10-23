# VISION2 · 视觉渠道恢复 + 真实扫描解析全链路（S32-VISION 补完）

> 接力说明:VISION 前会话(2026-10-15 21:00–23:17)完成配置诊断修复与场景 A 全链路,夜间死亡于场景 B 的 pdfjs 双版本混载。本会话(2026-10-16 10:13 起)接力:完成 pdf-parser 改造收尾验证、场景 B 全链路、场景 C 失败/重试回归,汇总本任务全部结论。工作区 4 文件在途改动审阅后**保留原样**(见 §3),未 commit(待主控审查)。

## 1. 诊断结论:旧 SiliconFlow 配置为何生效(前会话,证据链复核)

视觉通道 401 的根因是**三层配置叠加把旧 SiliconFlow 压在了智谱默认之上**:

| 层 | 实测值 | 判定 |
|---|---|---|
| DB `siteConfig.ai_config`(10-13 更新的存量行) | 只有 `api.baseUrl/apiKey`(智谱,真 key 尾 `pxoX`)+ `models.vibe`,**无 vision 三项** | DB 层不知道 vision 配置 |
| `ai-client` 合并逻辑 `{...defaults.api, ...(db.api)}` | vision 项落到 envDefaults | 合并后 vision 仍走 env |
| `.env`(仓库根) | `VISION_BASE_URL=https://api.siliconflow.cn/v1`、`VISION_API_KEY=<占位符 your-...-key>`、`AI_VISION_MODEL=Qwen/Qwen3-VL-8B-Instruct` | **占位 key 打旧端点旧模型 → 401** |

文本渠道走 DB 的智谱 key 所以一直正常——这正是「文本正常、视觉 401」分裂现象的解释。
修复前 401 复现铁证(前会话直调脚本):`model=Qwen/Qwen3-VL-8B-Instruct, baseURL=siliconflow, key 尾=-key → FAIL status=401`。

**附带发现(spec 要求核对的「后台默认值不一致」实锤)**:
- admin 路由 `DEFAULT_CONFIG` 的 vision 默认仍是 SiliconFlow + Qwen3-VL,与 ai-service 代码默认(智谱 glm-5.3-flash)不一致;
- DB 行缺 `visionApiKey` 键时 admin GET 里 `config.api.visionApiKey.startsWith` 对 `undefined` 调用 → **admin 配置页 500,无法从界面修配置**(隐藏 bug,已一并修)。

## 2. 配置修正动作(仅视觉渠道,文本渠道不动)

1. **DB 数据层**(密钥同值复制,不经过输出/代码/报告):`ai_config.api` 补 `visionBaseUrl=https://open.bigmodel.cn/api/coding/paas/v4`、`visionApiKey:=apiKey`(同值)、`models.vision={model:'glm-5.3-flash',maxTokens:4096}`。当前持久状态(2026-10-16 复核,密钥只显尾 4 位):

   ```
   api.baseUrl       = https://open.bigmodel.cn/api/coding/paas/v4
   api.apiKey        = ****pxoX (len=49)
   api.visionBaseUrl = https://open.bigmodel.cn/api/coding/paas/v4
   api.visionApiKey  = ****pxoX (len=49)
   models.vision     = { model: 'glm-5.3-flash', maxTokens: 4096 }
   ```

2. **`.env`**:旧 VISION 三行已注释(0 残留),防未来 DB 行变动时旧值复活。
3. **admin 代码最小对齐**(工作区改动):vision 默认值对齐智谱 + `visionApiKey/apiKey` 可选链防御(undefined 不再 500)。
4. **载荷形态**:`image-parser` 已是 `image_url` 数组 + `thinking:disabled`,智谱兼容,**零代码改动**。
5. 修复后验证(前会话):同脚本重跑 → `model=glm-5.3-flash, baseURL=智谱 → HTTP 200 正确识别图中五位数字 "86291"`;本次场景 B 视觉链路真实 OCR 558 字符再证。

**model 补充**:design 任务模型 DB 已切 `glm-5.3`(前会话决策,flash 跑 16K 长输出不稳;主控若要回 flash 改 DB 即可)。

## 3. pdfjs 双版本混载修复(本次接力完成的代码收尾)

**问题**:场景 B 首跑(10-15 23:11)死于 `The API version "4.10.38" does not match the Worker version "5.4.296"`。根因:`pdf-parse@2.x` 内嵌 pdf.js worker 5.4.296,而其 API 解析到被 hoist 的项目内 `pdfjs-dist@4.10.38`——双版本混载必然崩。

**修复**(前会话改到一半,本会话审阅确认自洽):`apps/ai-service/src/lib/pdf-parser.ts` 的 `extractPdfTextLayer` 弃用 `pdf-parse`,改用项目内 `pdfjs-dist/legacy/build/pdf.mjs` 的 `getDocument` 直读文字层——与 `image-parser.ts` 的 PDF 渲染(PNG 化)**同一加载方式、同源同版本**,从结构上消灭混载。`STANDARD_FONTS_URL` 常量从 image-parser export 共用。空文字层判定(<50 非空白字符走视觉)、PDF 魔数校验、pageCount 语义全部保留。

**单元级验证**(2026-10-16,TEMP 脚本直调):
- 扫描 PDF(246,760 字节,前会话崩溃同款输入):`Extracted 0 chars → WILL-DEFER-TO-VISION ✓`(不再抛版本错配)
- 对照组(pdf-lib 生成带文字层 PDF):`Extracted 50 chars, "Zhang Huanrui 2018-2022 Backend Engineer ResumeAIX" 完整提取 ✓`——**普通 PDF 解析无回归**

**遗留说明**:`pdf-parse` 依赖仍在 `apps/ai-service/package.json`(死件,不再被 import)。按最小改动原则未移除,建议主控审查时决定是否在下一次依赖清理中删除。

### 工作区在途改动审阅结论(4 文件,保留)

| 文件 | 改动 | 判定 |
|---|---|---|
| `apps/ai-service/src/lib/pdf-parser.ts` | extractPdfTextLayer 改 pdfjs-dist 直读(上文) | 完整自洽,单元+链路双验证 ✓ |
| `apps/ai-service/src/lib/image-parser.ts` | `STANDARD_FONTS_URL` export 给 pdf-parser 共用 | 完整 ✓ |
| `apps/web/src/app/api/admin/ai-config/route.ts` | vision 默认对齐智谱 + apiKey/visionApiKey undefined 防御 | 完整 ✓(修 admin 页 500) |
| `apps/web/src/lib/design-service.ts` | `insertDesignVersion` 事务 `maxWait 10s/timeout 30s` | 完整 ✓(前会话定位的落库事务超时韧性;B 场景真实落库验证) |

另:`scripts/eval-f5-*.json`(2 文件)与 `apps/interview-helper/next-env.d.ts` 为其他任务产物/自动生成,不属本任务改动面,原样保留未动。

## 4. 全链路真实验收(Playwright 驱动正式前端 :3100,五服务本地栈)

链路:上传 → BullMQ → 视觉识别 → 结构化 → 核对页 → 保存 → 编辑器 → 设计稿生成 → PDF 导出 → PDF 下载落盘 + 文本断言。

### 场景 A:合成图片简历 PNG(前会话 2026-10-15 完成)

- 内容核验 **14/14 PASS**:姓名「欧阳睿曦」完整、电话/邮箱归位、教育×2(上海交大 2021-09~2024-06 / 复旦 2017-09~2021-06)、工作×2(杭州云梭 2024-07~至今 / 上海临帆 2021-07~2024-06)、项目×2(NebulaCharts / 校园二手书)、技能 6 项、技能不串栏
- PDF:HTTP 200、2 页、crop=passed、59,369 字节真实下载,文本断言 **6/6**(欧阳睿曦/云梭/复旦大学/NebulaCharts/2024/交通大学)
- 计费:195 → parse+save 195(0 币)→ design −8 → 187 ✓
- 截图:`shots/A-01~A-07`(login/parsing/review/editor/design-ready/pdf-desk)

### 场景 B:无文字层扫描 PDF(本会话 2026-10-16 完成)

- ai-service 日志证据链(修复后的完整视觉兜底):
  ```
  [ParseWorker] Job 1: decoded 246760 bytes (type=pdf)
  [PDF] Extracted 0 chars from 246760-byte PDF (1 pages)   ← 新 pdf-parser:干净返回 0(此前版本错配崩溃)
  [ParseWorker] Empty PDF text layer — vision only          ← 正确分流
  [ParseWorker] Job 1: extracted 558 chars                  ← 智谱 glm-5.3-flash OCR
  [ParseWorker] Job 1 completed for resume cmvacas2u…
  ```
- 内容核验 **14/14 PASS**(与 A 同款断言:姓名/日期/归位/章节全对,明细同 A 明细)
- 设计稿:glm-5.3 第三轮生成成功(今日智谱长输出波动,前两轮「AI 返回为空」,管线自动重试;1 页,sections: education 2 / work 2 / project 2 / skills 1)
- PDF:HTTP 200、1 页、crop=passed、58,422 字节真实下载,文本断言 **6/6**(欧阳睿曦/云梭/复旦大学/NebulaCharts/2024/交通大学)
- 计费:187 → parse+save 187(0 币)→ design −8 → 179 ✓
- 截图:`shots/B-01~B-04 · B-06 · B-07`(login/parsing/review/editor/design-ready/pdf-desk)

## 5. 失败/重试/退币回归

### 场景 C(本会话):损坏图片 → 失败提示;重新上传 → 空白图片失败;再重试 → 正常成功

全部通过(C-result.json,截图 `shots/C-01~C-04`):

| 步骤 | 结果 | 余额 |
|---|---|---|
| C1 损坏图片上传 | 页面级失败面板:「这次没有解析成功 — 图片解析 API 错误 (400): 400 图片输入格式/解析错误」+「重新上传」「改从零构建」按钮 ✓ | 179 |
| C2 点「重新上传」→ 空白无文字图片 | 失败面板:「上传的文档似乎不是简历，请确认后重试」(结构化阶段合理性判断,非裸错误)✓ | 179 |
| C3 再点「重新上传」→ 正常 PNG | 走到「AI 解析完成」核对页(重试机制可用)✓ | 179 |

计费全程 179 → 179 → 179 → 179:**失败零扣费、重试不重复计费**(parse 免费计量闸门语义正确)。

### 退币路径回归(前会话+本会话,coin_transactions 流水实证)

10-15 当天 5 次 design 生成失败(长输出不稳/PG 池瞬时耗尽)全部自动退币,余额每次 187→195 归位:

```
2026-10-15T14:16:33 REFUND +8 balance=195 designGenerate「AI 功能未完成，返还 8 T-Coin 积分」(流中断)
2026-10-15T14:27:11 REFUND +8 balance=195 (管线异常)
2026-10-15T14:34:58 / 14:47:10 / 14:57:45 REFUND +8 ×3(同型失败均退)
2026-10-15T15:02:20 DEDUCTION −8 balance=187(A 场景最终成功扣费,不再退)
2026-10-16T02:20:13 DEDUCTION −8 balance=179(B 场景扣费;前两轮 AI 空返回由管线内部重试吸收,未产生额外扣费/退款)
```

另:上传解析(parse)**不扣币**(全站免费后 parse 无 coin-guard),失败后余额不变——「计费对齐」= 失败零扣费 ✓(A/B/C 三场景余额记录实证)。

## 6. 工程验证

- `pnpm --filter @resumeaix/ai-service type-check` ✓(干净)
- `pnpm --filter @resumeaix/web type-check` ✓(干净)
- `pnpm --filter @resumeaix/ai-service lint` ✓(干净)
- `pnpm --filter @resumeaix/web lint` ✓ 0 error / 1 warning——warning 在 `upload-workspace.tsx`(react-hooks/set-state-in-effect),**存量**,不在本次改动文件中
- 未 commit / 未 push / 未部署;密钥全程未输出(查询只显尾 4 位)

## 7. 未验项(如实保留)

1. **原始姓名问题文件复验**:用户最初报障所用真实文件无法获取(前会话已声明)。已用合成材料覆盖姓名完整性断言(复姓「欧阳睿曦」全链路 ×2 + PDF 可复制提取 ×2);原始文件到手后按同链路复验。
2. **多页扫描 PDF**:合成材料为单页;`renderPdfPagesToPng` 限前 5 页、逐页 OCR 的逻辑未在 >1 页扫描件上实测。
3. **pdf-parse 依赖删除**:死件未清(见 §3),建议随下次依赖清理处理。

## 8. 证据清单(`C:/Users/TimeCraker/Desktop/my_workspace/ResumeAIX-stage32/VISION/`)

- `A-result.json` / `B-result.json` — 两场景逐步结果与 14 项内容断言明细
- `A-exported.pdf`(59,369 B,2 页)/ `B-exported.pdf`(58,422 B,1 页)— 真实下载的导出 PDF
- `A-pdf-check.json` / `B-pdf-check.json` — PDF 文本断言 6/6 明细
- `C-result.json` — 失败/重试回归记录
- `shots/A-*.png · B-*.png · C-*.png` — 全链路逐步截图
- `fixtures/` — synthetic-resume.png / synthetic-scan-resume.pdf(无文字层,程序合成)/ broken-image.png / blank-image.png
- 退币流水:`coin_transactions` 查询输出见 §5(脚本 `vision2-db.mjs ledger`)
