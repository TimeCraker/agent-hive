# 任务 BMI：最新模型信息调研（B 站模型世界 + 官方文档交叉核验）

一句话任务：**只读调研**当前主流大模型信息，对照本测速台的预置矩阵，产出一份可直接执行的矩阵更新建议报告。除报告文件外零写入。

## 背景（已核实事实，勿重新考古）

- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench` 是模型测速台（TTFT/TPS/Total 榜单），支持 Anthropic / OpenAI 双协议。**本任务不实施、不改代码**——产出建议报告，由后续任务（MXU）消费。
- 注意：同仓此刻有另一个实施会话（S01 任务）在并行改造 engine/，**你只读不写，互不干扰**；对 engine/ 的读取尽早做快照，读到中间态就以读到的为准并在报告注明。
- 用户指定的权威参考：**https://www.bilibili.com/toy/ai-model-world**（B 站「AI 模型世界」）。

## 信息源与优先级

1. **B 站模型世界**（用户指定参考）：抓取该页面。若 HTML 是 JS 渲染壳：找内嵌 `__INITIAL_STATE__`/JSON 数据、或页面 XHR 的接口地址再抓接口。若网络不可达或拿不到数据：**如实记录失败原因**，转入第 2 源，不要硬编。
2. **各厂商官方文档交叉核验**（以此为准校正 B 站数据的时效误差）：智谱 open.bigmodel.cn（模型列表与定价）、DeepSeek api-docs.deepseek.com、火山方舟 www.volcengine.com/product/ark、百度千帆 cloud.baidu.com/qianfan、OpenAI platform.openai.com/docs/models、Anthropic docs.anthropic.com、Moonshot platform.moonshot.cn 等——覆盖本测速台声明的目标厂商。
3. B 站与官方**不一致时标注差异并以官方为准**，逐条列出。

## 步骤

1. 尽早快照我们的现状：`engine/models.ts`（预置矩阵）、`README.md` 模型矩阵相关段、`results/2026-10-05-glm-5.3-matrix.md`、site 前端快选数据（在 `site/src/` 搜 presets/models 相关）。
2. 抓取 B 站模型世界，提取其模型清单字段（名称/厂商/上下文/价格/能力标签等，以页面实际有的为准）。
3. 逐厂商查官方文档，核验并补全：模型 ID、上下文窗口、输入/输出价格（每百万 token）、多模态/推理能力标签、状态（GA / preview / deprecated / 下线）。
4. 与我们预置矩阵做 diff：**建议新增**（含字段级示例）、**建议移除**（已下线/更名）、**建议更新**（价格/上下文/状态过期）——精确到 `engine/models.ts` 的字段结构。
5. 写报告（见文末）。

## 红线

- **只读**：除报告文件外不写、不改、不建任何文件；不做 git 操作。
- 不调用任何付费 API（读公开文档/页面可以）；不输出任何密钥。
- 网络失败有限重试（每源 ≤3 次），失败如实记录并继续其他源。
- 拿不到的数据宁缺毋假，标「未获取到」。

## 验收标准

1. 报告含四要件：各厂商现行模型总表 / 与我们预置的 diff 建议（字段级）/ B 站 vs 官方差异清单 / 来源 URL 清单。
2. 每条建议可被 MXU 任务直接执行（无需再查资料）。
3. 仓内 `git status` 前后一致（clean）。

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\BMI-report.md`

模板：`# BMI 结果报告` / `## 结论一句话` / `## 各厂商现行模型总表` / `## 预置矩阵更新建议（新增/移除/更新，字段级）` / `## B站 vs 官方差异` / `## 未获取项与原因` / `## 来源 URL` / `## 自评`
