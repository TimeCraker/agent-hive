# BMI 结果报告

> 任务：模型信息只读调研（B 站模型世界 + 官方文档交叉核验）· 日期：2026-10-05
> 快照对象：coding-plan-bench `engine/models.ts`（6 项预置矩阵）。本任务零写入本仓、零 git 操作。
> （10-06 追加任务后扩展为含能力榜数据更新，见文末「能力榜更新（追加任务）」章节；原报告保持原样。）

## 结论一句话

预置矩阵 6 项全部仍在线、无需移除；但矩阵已落后市场约两个月：智谱多了 **glm-5.3-flashx**（官方 ¥2/¥7、主打 200 tps，天然适配 TPS 测速台），火山方舟 coding 端点已于 2026-08-14 上线 **glm-5.3[1m]**，百度千帆 anthropic 端点可直接调 **glm-5.3 / glm-5.3-flash**，DeepSeek 官方已支持 Anthropic 协议（README 声称的 DeepSeek 覆盖至今矩阵里没有对应渠道）——共建议新增 4-5 项、更新 1 项字段、移除 0 项；另有一处 B 站与官方的硬冲突（GLM-5.3-Prime 仅 B 站有、智谱官方无此模型，以官方为准不采信）。

## 现状快照（读取时间 2026-10-05 20:45 前后）

`engine/models.ts` 完整可解析（85 行，无中间态残迹；并行 S01 会话当时未造成读到半成品）。`MODEL_MATRIX` 共 6 项：

| # | id | model | endpoint | 协议 | era |
|---|---|---|---|---|---|
| 1 | zhipu-glm53 | `glm-5.3` | open.bigmodel.cn/api/anthropic | anthropic | glm-5.3 |
| 2 | zhipu-glm53-flash | `glm-5.3-flash` | 同上 | anthropic | glm-5.3 |
| 3 | baidu-deepseek-v41-flash | `DeepSeek-V4.1-Flash` | qianfan.baidubce.com/anthropic/tokenplan/personal | anthropic | glm-5.3（占位未实测） |
| 4 | zhipu-glm52 | `glm-5.2` | open.bigmodel.cn/api/anthropic | anthropic | glm-5.2 |
| 5 | volcengine-glm52 | `glm-5.2[1m]` | ark.cn-beijing.volces.com/api/coding | anthropic | glm-5.2 |
| 6 | baidu-glm52 | `glm-5.2` | qianfan…/anthropic/tokenplan/personal | anthropic | glm-5.2 |

消费方：site 快选（`site/src/components/BenchForm.tsx:5` 直接 `import { MODEL_MATRIX }`，无独立副本）与 bench runner 共用——**改 `models.ts` 一处即全端生效**。README L5 声称覆盖「智谱、火山、百度、OpenAI、DeepSeek、Claude」，但矩阵实际无 OpenAI/DeepSeek 官方/Claude 渠道。

## 各厂商现行模型总表

价格单位：¥ = 人民币元/百万 token，$ = 美元/百万 token。「↘」= 即将下线。

### 智谱（open.bigmodel.cn，官方模型概览 + 定价页核验）

| 模型 ID | 上下文/最大输出 | 输入/输出 | 缓存命中 | 能力 | 状态 |
|---|---|---|---|---|---|
| `glm-5.3` | 1M / 128K | ¥8 / ¥28 | ¥2 | 旗舰文本，软件工程/Agent | 在售 |
| `glm-5.3-flash` | 1M / 128K | ¥0.8 / ¥2.8 | ¥0.23 | 原生多模态（图/视频理解） | 在售 |
| `glm-5.3-flashx` | 1M / 128K | ¥2 / ¥7 | ¥0.57 | Flash 加速版，官方宣称 200 tps | **在售（矩阵缺失）** |
| `glm-5.2` | 1M / 128K | ¥8 / ¥28 | ¥2 | 长程任务 | 仍售（推荐模型在列） |
| `glm-5.1` | 200K / 128K | ¥6-8 / ¥24-28（按档） | — | 编码对齐 Opus 4.6 | 在售 |
| 免费档 | `glm-4.7-flash` / `glm-4.5-flash` / `glm-4-flash-250414` 等 | — | 免费 | — | 在列 |

注：官方概览与定价页均**无 prime 变体**；GLM-5V/OCR/Image/ASR/TTS 等非文本模型本表略。Anthropic 兼容端点 `https://open.bigmodel.cn/api/anthropic` 与矩阵现值一致，未变。

### DeepSeek（api-docs.deepseek.com/quick_start/pricing，官方核验）

| 模型 ID（API 调用名） | 对应版本 | 上下文/最大输出 | 输入（未命中 非高峰/高峰） | 输出（非高峰/高峰） | 能力 | 状态 |
|---|---|---|---|---|---|---|
| `deepseek-flash` | V4.1-Flash | 1M / 384K | $0.15 / $0.30 | $0.60 / $1.20 | 视觉+思考+工具调用+**Anthropic API** | 当前模型 |
| `deepseek-v4-pro` | V4-Pro-0813 | 1M / 384K | $0.66 / $1.32 | $1.98 / $3.96 | 思考+工具调用+Anthropic API（无视觉） | 当前模型 |

注：旧名 `deepseek-v4-flash` / `deepseek-v4-flash-vision-exp` **已退役**（仍可调用但路由到 V4.1-Flash 按 Flash 计费）；峰谷计价（高峰=UTC 工作日 01:00-04:00、06:00-10:00）；缓存命中输入 $0.003-0.006/$0.022-0.044。

### Kimi / Moonshot（platform.kimi.com/docs/pricing/chat，官方核验）

| 模型 ID | 上下文 | 输入（未命中） | 输出 | 状态 |
|---|---|---|---|---|
| `kimi-k3` | 1M | ¥20 | ¥100 | 在售（缓存写入 ¥20-40 另计） |
| `kimi-k2.7-code` | 256K | ¥6.5 | ¥27 | 在售 |
| `kimi-k2.7-code-highspeed` | 256K | ¥13 | ¥54 | 在售 |
| `kimi-k2.6` | 256K | ¥6.5 | ¥27 | 在售 |

注：官方定价页**无 kimi-k2.8-preview**（B 站有，见差异清单）。

### 百度千帆（cloud.baidu.com/doc/qianfan/s/rmh4stp0j 模型列表，页面更新 2026-09-16 + Token Plan 个人版文档 Dmrabu8b6）

Token Plan 个人版可调模型（model 参数，官方原文小写）：

| model 参数 | 上下文/最大输出 | 状态 |
|---|---|---|
| `deepseek-v4.1-flash` | 1M / 393K | 在线（原生视觉） |
| `deepseek-v4-pro` / `deepseek-v4-pro-0813` | 1M / 393K | 在线（旗舰推荐） |
| `deepseek-v4-flash-0731` | 1M / 393K | 在线 |
| `glm-5.3` | 1M / 131K | 在线（千帆侧 5.3 已可用） |
| `glm-5.3-flash` | 1M / 131K | 在线 |
| `glm-5.2` | 1M / 131K | 在线 |
| `glm-5.1` | 198K / 131K | 在线 |
| `qianfan-code-latest` | — | Auto 模式（实际模型在控制台选） |

千帆通用模型列表另有：`ernie-5.1`（128K，旗舰推荐）、`kimi-k2.6`（↘ 即将下线）、`deepseek-v4-flash`（↘）、`deepseek-v3.2` / `-think`（↘）、`glm-5`（↘）、`qwen3.5` 系列（256K）。
Anthropic 端点官方确认：`https://qianfan.baidubce.com/anthropic/tokenplan/personal`（messages 路径 `…/v1/messages`），与矩阵现值一致。计费为订阅制（¥9.9-600/月四档，Token 制不区分输入输出；夜间低至 2 折、闲时活动 0.5 折），无按 token 单价。

### 火山方舟 Coding Plan（官方文档 + 多源交叉）

- Anthropic 端点确认不变：`https://ark.cn-beijing.volces.com/api/coding`（OpenAI 兼容走 `/api/v3`）。
- **`glm-5.3` / `glm-5.3[1m]` 为官方文档确认的有效模型名**（2026-08-14 上线方舟 Coding Plan；1M 需 `[1m]` 后缀 + `CLAUDE_CODE_AUTO_COMPACT_WINDOW=1000000`）。
- 套餐内其他模型：GLM-5.2/5.1/4.7、Doubao-Seed-2.0-Code / `doubao-seed-2.1-turbo`、Kimi-K2.7-Code/K2.6/K2.5、DeepSeek-V4 系列、MiniMax-M3/M2.7/M2.5、Auto 模式。
- 2026-09 已知坑：Claude Code 3.14.3-27/28 下 `glm-5.3-flash` 上下文被砍回 200K，官方建议显式 `glm-5.3[1m]`。
- 方舟模型列表文档页为 JS 渲染壳（docs.volcengine.com/docs/82379/1330310 静态抓取为空），上表来自官方 Claude Code 接入文档摘要 + 知乎/官网多源交叉，置信度中高。

### OpenAI（developers.openai.com/api/docs/models，官方核验）

| 模型 ID | 上下文/最大输出 | 输入/输出 | 知识截止 | 状态 |
|---|---|---|---|---|
| `gpt-6-astra` | 1.05M / 128K | $10 / $50 | 2026-04-30 | GA 旗舰 |
| `gpt-6.1-sol` | 1.05M / 128K | $2 / $10 | 2026-04-30 | GA |
| `gpt-6-luna` | 1.05M / 128K | $0.1 / $0.5 | 2026-05-18 | GA（B 站清单无此项） |

三款均支持工具/图像输入；页面上唯一标 Deprecated 的是 GPT-Realtime Mini。

### Anthropic（platform.claude.com models overview，官方核验）

| 模型 ID | 上下文/最大输出 | 输入/输出 | 退役承诺不早于 | 状态 |
|---|---|---|---|---|
| `claude-fable-5-1` | 1M / 128K | $10 / $50 | 2027-09-01 | 现行（深度推理/长程 Agent） |
| `claude-opus-5-5` | 1M / 128K | $4 / $20 | 2027-09-22 | 现行主力 |
| `claude-sonnet-5-5` | 1M / 128K | $2 / $10 | 2027-09-28 | 现行 |
| `claude-haiku-4-5-20251001`（别名 `claude-haiku-4-5`） | 200K / 64K | $1 / $5 | 2026-10-15 | 现行（注意退役较早） |

Legacy 仍在列：Opus 5/4.8/4.7/4.6/4.5、Sonnet 5/4.6、Fable 5。

### B 站模型世界全景（www.bilibili.com/toy/ai-model-world）

真实数据页为壳内 iframe：`www.bilibilitoy.com/toy/ai-model-world/34090174887936-v22387/index.html`（Next.js 静态导出，数据每 12 小时自动同步自 models.dev，开源仓库 github.com/liyupi/ai-model-world）。共收录 **76 个模型**（全清单已提取至临时目录，slug 列表见来源节），重点核验 20 个（上文各厂商已覆盖）。B 站特色字段：参数量（开源模型给实值，闭源标估算）、开放权重/开源许可、AIME/GPQA/ARC-AGI-2 成绩、支持输入模态。

## 预置矩阵更新建议（新增/移除/更新，字段级）

以下全部按 `ModelTarget` 结构给出，MXU 可直接粘贴进 `engine/models.ts` 的 `MODEL_MATRIX`。

### 建议新增（5 项，按置信度排序）

**A1 · 智谱 GLM-5.3-FlashX（P0，端点/价格官方全核验；「200 tps」卖点与本台 TPS 榜单强契合）**

```ts
{
  id: "zhipu-glm53-flashx",
  name: "智谱 GLM-5.3-FlashX",
  endpoint: "https://open.bigmodel.cn/api/anthropic",
  model: "glm-5.3-flashx",
  protocol: "anthropic",
  envVar: "ZHIPU_API_KEY", // 与 glm-5.3 同一把 key，零新增配置
  color: "#F59E0B", // amber，示高速；可在 results 中与 flash 形成三档直对比
  era: "glm-5.3",
},
```

**A2 · 火山方舟 GLM-5.3[1m]（P0，官方文档确认模型名与端点；矩阵现有 glm-5.2 存量项的世代对齐）**

```ts
{
  id: "volcengine-glm53",
  name: "火山方舟 GLM-5.3",
  endpoint: "https://ark.cn-beijing.volces.com/api/coding",
  model: "glm-5.3[1m]",
  protocol: "anthropic",
  envVar: "VOLCENGINE_CODING_API_KEY", // 沿用现有环境变量
  color: "#FB923C", // 与 volcengine-glm52(#EA580C) 同系区分
  era: "glm-5.3",
},
```

**A3 · 百度千帆 GLM-5.3（P0，千帆官方文档确认 model 参数与 anthropic 端点）**

```ts
{
  id: "baidu-glm53",
  name: "百度千帆 GLM-5.3",
  endpoint: "https://qianfan.baidubce.com/anthropic/tokenplan/personal",
  model: "glm-5.3",
  protocol: "anthropic",
  envVar: "QIANFAN_API_KEY", // 沿用
  color: "#60A5FA", // 与 baidu-glm52(#3B82F6) 区分
  era: "glm-5.3",
},
```

**A4 · DeepSeek 官方 deepseek-flash（P1，协议支持官方确认；补上 README 声称却从未有渠道的 DeepSeek 覆盖）**

```ts
{
  id: "deepseek-flash",
  name: "DeepSeek V4.1-Flash（官方）",
  endpoint: "https://api.deepseek.com/anthropic", // ⚠ 唯一待核验点：官方确认支持 Anthropic API，但 base URL 本轮未逐字核验，MXU 实施前查 api-docs.deepseek.com 的 Anthropic 章节确认（常见写法即此）
  model: "deepseek-flash",
  protocol: "anthropic",
  envVar: "DEEPSEEK_API_KEY", // 新增
  color: "#2563EB", // 与千帆侧 DeepSeek 项(#4D6BFE)区分
  era: "glm-5.3",
  note: "官方 Anthropic 兼容渠道；峰谷计价",
},
```

**A5 · Kimi kimi-k3（P2 可选，官方定价/ID 已核验，Anthropic 兼容端点未核验）**

```ts
{
  id: "moonshot-kimi-k3",
  name: "Kimi K3",
  endpoint: "", // ⚠ 留空待 MXU 核验：platform.kimi.com 文档确认 Anthropic 兼容端点后填入（若确认则 protocol: "anthropic"，envVar: "KIMI_API_KEY"）
  model: "kimi-k3",
  protocol: "anthropic",
  envVar: "KIMI_API_KEY",
  color: "#8B5CF6",
  era: "glm-5.3",
  note: "Anthropic 端点未核验，勿直接上线",
},
```

### 建议更新（1 项 + 2 处注释）

**U1 · `baidu-deepseek-v41-flash` 的 model 字段大小写**：`"DeepSeek-V4.1-Flash"` → **`"deepseek-v4.1-flash"`**。千帆官方两份文档（模型列表 + Token Plan）的 model 参数均为小写；矩阵同端点的 glm-5.2 项也是小写，此项为唯一不一致。若实测大写也能调通，此修正仍建议做（以官方文档为准）。

**U2 · `volcengine-glm52` 加 note**：`note: "方舟已上 glm-5.3[1m]，此项保留作 v1 存量对照"`（配合 A2）。

**U3 · `baidu-deepseek-v41-flash` 的 note 可去「矩阵占位」改为**：`note: "千帆侧确认在线（2026-09-16 文档）；官方 Anthropic 渠道见新增项 deepseek-flash"`。

### 建议移除

**无。** 6 项现有渠道全部核实仍在线：智谱 glm-5.2 仍在推荐模型列（¥8/¥28）；千帆 glm-5.2 在线；方舟 glm-5.2[1m] 语法仍有效（方舟同时保留 5.2/5.1/4.7）。千帆侧 `glm-5` / `kimi-k2.6` / `deepseek-v4-flash`（无后缀）标「即将下线」，均不在我们矩阵内，无需动作。

### 连带消费方提示（MXU 实施时）

- site 快选无独立数据（直接 import），零额外改动；新增 5 项后快选区会自动出现，注意 BenchForm 换行排版是否容纳 11 个芯片。
- `era` 类型现为 `"glm-5.3" | "glm-5.2"`，无需扩展。
- README L69-81「模型矩阵」段与 results/ 引文需同步新增项说明（A5 若上线也在此列）。

## B站 vs 官方差异

| # | 条目 | B 站说法 | 官方说法 | 裁定 |
|---|---|---|---|---|
| 1 | **GLM-5.3-Prime** | 收录，$2.80/$8.80、1M ctx、闭源 | 智谱模型概览页与定价页**均无任何 prime 变体**（5.3 家族仅 glm-5.3/flash/flashx）；其价格档（≈¥20/¥62）不匹配智谱任何在售档位 | **以官方为准：不新增 prime**。B 站数据源自 models.dev，疑为海外渠道（Z.ai）条目或数据错误 |
| 2 | **glm-5.3-flashx** | 76 模型清单中**无** | 智谱官方在售（¥2/¥7，200 tps） | B 站同步滞后，采纳官方 |
| 3 | **Kimi K2.8 Preview** | 收录（价格未知、字段大量「暂无数据」） | platform.kimi.com 定价页**无 k2.8**（现行 k3 / k2.7-code / k2.7-code-highspeed / k2.6） | 以官方为准：不采信 K2.8 |
| 4 | Kimi K3 价格 | $3 / $15 | ¥20 / ¥100（≈$2.8/$14.1 按汇率 7.1） | 数值换算近似一致（汇率误差），无实质冲突 |
| 5 | DeepSeek V4.1-Flash 价格 | $0.21 / $0.66 单值 | 官方峰谷计价：输入 $0.15-0.30 / 输出 $0.60-1.20（缓存未命中） | 官方为峰谷两档；B 站单值近似非高峰档（$0.15/$0.60）附近，引用时以官方区间为准 |
| 6 | DeepSeek V4 Flash 0731 | 在售 $0.14/$0.28 | DeepSeek 官方 API：`deepseek-v4-flash` 旧名**已退役**（路由至 V4.1-Flash）；但千帆侧 `deepseek-v4-flash-0731` 在线在售 | 分渠道差异：官方直连已退役、聚合平台（千帆）仍在售，两边都不算错，测速台选渠道时须注意 |
| 7 | DeepSeek API 模型 ID | 页面按版本号展示（DeepSeek V4.1 Flash 等） | 官方 API 调用名是 `deepseek-flash` / `deepseek-v4-pro`，版本号只是展示名 | 以官方 ID 为准（已用于建议 A4） |
| 8 | GPT-6 Luna | 76 清单无 | OpenAI 官方 GA 在售（$0.1/$0.5） | B 站缺项 |
| 9 | Claude Fable 5.1 | 76 清单无（Anthropic 仅收 Opus 5.5） | 官方现行旗舰之一（$10/$50） | B 站缺项 |
| 10 | Opus 5.5 / GPT-6.1 Sol / GPT-6 Astra / Grok 4.7 价格与上下文 | 与官方一致 | — | 交叉通过 ✓ |

总体：B 站页面（数据源 models.dev，12h 同步）作为**国际模型全景**参考价值高，但对**国内渠道细节**（智谱 flashx、方舟 coding、千帆 token plan）覆盖不全，且存在 prime 这类孤例条目——凡与官方冲突处本报告均以官方为准。

## 未获取项与原因

| 项 | 原因 | 影响 |
|---|---|---|
| DeepSeek 官方 Anthropic 兼容 base URL 逐字确认 | 未单独抓取 api-docs.deepseek.com 的 Anthropic 章节（本轮只核了定价页，其上确认「支持 Anthropic API」） | A4 的 endpoint 字段标了待核验，MXU 一步可补 |
| Kimi Anthropic 兼容端点 | platform.kimi.com 定价页无端点信息，未追抓 API 文档 | A5 整项标为 P2 可选 |
| 火山方舟模型列表文档正文 | docs.volcengine.com 模型列表页为 JS 渲染壳，静态抓取为空（重试 2 次后转官方 Claude Code 接入文档摘要 + 多源交叉） | 方舟结论置信度中高而非最高；`glm-5.3[1m]` 名字本身有官方文档直接确认 |
| 千帆 Token Plan 各模型上下文明细 | Token Plan 文档仅标注 glm-5.3 的 1M，其余模型未标（需控制台登录） | 千帆新增项仅 glm-5.3（其上下文官方有标），无影响 |
| B 站 76 模型中其余 56 个的详情 | 非本台目标厂商（社区/小众模型为主：mancer-weaver、sao10k-l3-3 等），按「只读调研 + 宁缺毋假」原则未逐个抓取 | 无——slug 全清单已留存 |
| 智谱 glm-5.3 系列的美元价 | 智谱定价页仅人民币计价 | 报告按 ¥ 报告，未擅自换算 |

## 来源 URL

**B 站（用户指定参考）**
- 壳页：https://www.bilibili.com/toy/ai-model-world
- 真实数据页（壳内 iframe）：https://www.bilibilitoy.com/toy/ai-model-world/34090174887936-v22387/index.html
- 模型详情页样例：…/model/zhipuai-glm-5-3-prime/index.html、…/model/deepseek-deepseek-v4-1-flash/index.html 等 20 个（前缀同上）
- 数据源声明（页面自述）：models.dev + github.com/liyupi/ai-model-world

**官方文档**
- 智谱模型概览：https://docs.bigmodel.cn/cn/guide/start/model-overview
- 智谱定价：https://docs.bigmodel.cn/cn/guide/start/pricing
- DeepSeek 定价：https://api-docs.deepseek.com/quick_start/pricing
- Kimi 定价：https://platform.kimi.com/docs/pricing/chat
- 千帆模型列表（2026-09-16 更新）：https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j
- 千帆 Token Plan 个人版：https://cloud.baidu.com/doc/qianfan/s/Dmrabu8b6
- 火山方舟 Claude Code 接入：https://www.volcengine.com/docs/ark/coding-plan-personal-ai-claude-code （+ docs.volcengine.com/docs/82379/1330310 模型列表，JS 壳抓取失败）
- OpenAI 模型：https://developers.openai.com/api/docs/models
- Anthropic 模型总览：https://platform.claude.com/docs/en/docs/about-claude/models/overview

**交叉佐证（搜索摘要）**
- 火山引擎 Coding Plan 官网介绍：https://www.volcengine.com （Anthropic=`/api/coding` 端点原文）
- 千帆 Token Plan 实测文（qianfan.cloud.baidu.com，2026-07-31）：Claude Code 等工具接入确认
- 知乎「程序员的 Coding Plan 完整指南」（2026-08-16 更新）：方舟支持 doubao-seed-2.1-turbo / DeepSeek-V4 / GLM-5.3 等
- IT之家（2026-07-13）：千帆 Token Plan 个人版首购公告（ERNIE-5.1 / GLM-5.2/5.1 / Kimi-K2.6 / DeepSeek-V4）

## 自评

- **四要件齐**：厂商总表（7 家 + B 站全景）/ 字段级 diff（5 增 0 删 1 改，含可直接粘贴的 TS 片段）/ 差异清单（10 条，含 1 条硬冲突裁定）/ 来源 URL 全列。
- **可执行性**：P0 三项（flashx、方舟 glm-5.3[1m]、千帆 glm-5.3）端点与模型名均有官方文档直接背书，MXU 无需再查资料；P1/P2 两项的待核验点已收窄到「一个 URL 字段」并标明去哪查。
- **红线遵守**：本仓零写入（报告写在 agent-hive 指定路径）；临时抓取物全部在系统临时目录（$TEMP/bili-*）；无付费 API 调用；无密钥输出；每源重试 ≤3（火山文档壳重试 2 次即转替代源）。
- **诚实声明**：engine/ 读取时 S01 并行会话在途，快照时间 2026-10-05 20:45 前后，读到的是语法完整的 85 行版本；若 S01 已改结构（如 ModelTarget 加字段），MXU 需以彼时 HEAD 为准做字段对齐。智谱 anthropic 端点、千帆/方舟端点均与矩阵现值一致，未被推翻。
- **量化规模**：B 站 76 模型清单全提取、20 个重点模型逐字段核验；官方文档 9 个页面直接抓取 + 4 条搜索佐证；覆盖本台声称的全部 6 家厂商。

---

## 能力榜更新（追加任务）

> 追加日期：2026-10-06 · 产出：`site/public/leaderboards.json` 重写 + 提交 `7882a85`（39 insertions / 17 deletions，单文件）
> 红线遵守：仅改 leaderboards.json 与本报告；未 push；未编造任何评分。

### 数据源与重抓

- 重抓壳页确认应用版本 **v22387 → v22787**（数据确有更新），文本榜（`leaderboard/all/index.html?kind=text`）全量提取：**100 名 × 11 列**（模型/厂商/地区/类型/发布/开源/上下文/输出价格/综合智力/编程/参赛榜数）。
- **口径裁定（本次最重要的决策）**：B 站「综合智力」标注来源为 **Epoch AI（CC-BY 4.0）**，与四榜既有 AAII v4.1（满分 100）与 GDPval-AA v2 Elo 是**不同口径**，`meta.indexVersion` 原本就明令「数字不跨版混用」。因此：**不将 Epoch 分写入 score 字段**；新条目 score=0 表「暂无评分」置尾部（沿用 plans 榜 Cursor 条目 score:0 的仓内惯例），note 附 Epoch 分与名次并标注口径，仅供相对位次参考。

### 四榜逐条变化

**intelligence（18 → 30 条）**
- 原 18 条分数全部保留（B 站/官方均未推翻 AAII v4.1 既有分）。
- 新增 12 条（rank 19-30，score=0，tier="T?"，按 Epoch 名次排）：Claude Opus 5.5（Epoch #1）、GPT-6 Astra（#2）、GPT-6.1 Sol（#3）、Claude Sonnet 5.5（#4）、Claude Fable 5.1（#5）、Gemini 3.8 Flash（#20）、Qwen3.8 Max（#22）、GLM-5.3（#28）、DeepSeek V4 Pro 0813（#30）、DeepSeek V4.1 Flash（#33）、Grok 4.7（#42）、GLM-5.3-Flash（#52）。
- 既有条目修正 1 处：DeepSeek-V4-Flash note 补「0731 正式版 · 旧名已退役、路由至 V4.1-Flash」。

**agent（12 → 17 条）**
- 原 12 条 Elo 不动（GDPval v2 无新快照）。
- 新增 5 条（rank 13-17，score=0）：Opus 5.5 / GPT-6 Astra / GPT-6.1 Sol / Sonnet 5.5 / GLM-5.3（note 附 B 站编程评级与 coding 渠道信息）。
- subtitle 更新为「8/4 快照 + 10 月增补新模型（暂无分）」。

**value（11 → 14 条）**
- 新增 3 条便宜档，**cost 为透明折算**（note 逐条标明口径，非凭空数）：GPT-6 Luna $0.02/任务（官方 $0.1/$0.5，按 Luna 系 ~0.04M tokens/任务）、GLM-5.3-Flash $0.03/任务（¥0.8/¥2.8，按 GLM 口径 ~0.073M）、DeepSeek V4.1 Flash $0.06/任务（非高峰 $0.15/$0.6，按 DeepSeek 口径 ~0.107M）。折算系数均取自原榜同系模型的 cost÷每百万输出价反推值，可复现。
- score=0 置尾部（rank 12-14）而非按 cost 插前排首——避免「智能 0 排第一」的误导，符合「暂无评分排尾部」指令精神。
- 既有条目补 note 1 处：Kimi K3 补官方价 ¥20/¥100。
- **前端安全检查**：`GlobalLeaderboard.tsx` value 渲染有 `score/cost` 除法，cost=0 会得 Infinity——本次 3 条新条目 cost 均为非零折算值，规避了该风险（这也是不给 value 新条目填 cost:0 的原因）。

**plans（10 条，更新 3 条，不新增）**
- 火山方舟：model `GLM-5.2` → `GLM-5.3 等多模型`，note 补 8/14 GLM-5.3 上线（`glm-5.3[1m]`）与套餐模型清单；score 沿用 GLM-5.2 AAII 分并在 note 声明。
- 百度千帆：plan `轻享 ¥149/月` → `Mini ¥9.9 – Max ¥600/月`（官方 2026-10-05 核验的新四档），model → `GLM-5.3 / DeepSeek-V4.1-Flash`，note 补 anthropic 端点可调模型（2026-09-16 官方文档）。
- Claude Max / ChatGPT Pro：模型换代标注（Opus 5.5 / Fable 5.1、GPT-6.1 Sol），note 声明沿用换代前 AAII 分。
- 不新增订阅条目：本轮核验未发现新的订阅制玩家（DeepSeek/Kimi 均纯按量）。

**meta**
- `updatedAt` → 2026-10-06；`sources` 增 2 条（Epoch AI 经 B 站转录 v22787 + 2026-10-05 七家官方文档核验）；`indexVersion` 追加增补口径说明；`note` 重写（强调 Epoch 分仅参考、冲突以官方为准）。

### B 站独有/我方独有的处理

- 我方独有条目（Muse Spark 1.1、Nemotron 3 Ultra、GPT-5.5、Kimi K2.6 等）：**保守保留**——B 站文本榜均有对应或后继版本（Muse Spark 1.3、Nemotron 3 Ultra 550B、GPT-5.5 在 Epoch 榜 #12），无一被官方判死，不移除。
- B 站 GLM-5.3-Prime：与官方冲突（原报告差异清单 #1），**未收录**进任何榜。
- Kimi K2.8 Preview：官方无此模型，未收录。

### 验证结果（全绿）

1. `node -e "JSON.parse(...)"` → OK，四榜条目数 30 / 17 / 14 / 10，updatedAt 2026-10-06。
2. `npm run typecheck`（tsc --noEmit）→ 零错误。
3. `npm run build` → 成功（3.17s；storage.ts 动态导入警告为仓库既有现象，与本次无关）。
4. 提交 `7882a85`：`feat(leaderboard): 四榜数据更新至 2026-10（B站模型世界+官方核验）/ refresh leaderboards to 2026-10 research`，仅含 `site/public/leaderboards.json` 一个文件，未 push。

### 追加任务自评

- 指令五条全落地：重抓 ✓（版本号变化证明数据新鲜）、四榜逐条对照 ✓、meta 三件套 ✓、三项验证 + 单提交 ✓、报告追加 ✓。
- 最强的纪律点是**口径不混**：Epoch 分只进 note 不进 score，value 榜折算成本逐条标注口径；最弱的数据点是 value 新条目的单任务 token 量取同系口径折算（0.04-0.107M/任务），属有依据的近似而非实测——已全部在 note 与本报告中透明声明，后续若有 AAII 官方 cost 数据可直接替换。
- 遗留提醒：①AAII v4.1 / GDPval v2 出新分后，本次 20 个 score=0 条目需回填并重排（位次参考已在 note 里）；②前端 `tier: "T?"` 渲染为「T? 档」，若观感不佳可改组件文案；③B 站文本榜 100 名全量数据留存于本机临时目录，如需归档请指示。
