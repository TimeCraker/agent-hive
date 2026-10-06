# BMI 结果报告

> 任务：模型信息只读调研（B 站模型世界 + 官方文档交叉核验）· 日期：2026-10-05
> 快照对象：coding-plan-bench `engine/models.ts`（6 项预置矩阵）。本任务零写入本仓、零 git 操作。
> （10-06 追加任务扩展为能力榜数据更新；同日打回返工一次。原报告保持原样，两轮追加见文末章节。）

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

## 能力榜更新（追加任务 · 第一版，已被打回）

> 追加日期：2026-10-06 · 产出：提交 `7882a85`（第一版）→ 所有者打回 → 返工为提交 `d13f03d`（终版，见下章）。
> 本章节保留第一版记录与打回原因，供验收追溯。

### 第一版做法（简述）

重抓 B 站（v22387 → v22787）提取文本榜 100 名全量；因 B 站「综合智力」为 Epoch AI 口径、与本榜 AAII v4.1 不同，第一版将新模型以 score=0「暂无评分」置尾部、note 附 Epoch 分参考；value 榜 cost 按每百万价折算；plans 榜补渠道更新。验证（JSON/typecheck/build）与单提交均完成。

### 打回意见（所有者原文要旨）

智能榜把 Opus 5.5 排在 rank 19 / score=0，而其 note 自记「Epoch 综合 167.3 全场 #1」——用两个月前的旧指数把当前最强旗舰压到 19 名，榜单失去意义。要求：去 AA 拿现行真实分并重排；拿不到则按 Epoch 重排或加旗舰提示结构；agent 榜同查；红线不变。

---

## 打回处理（追加任务 · 终版）

> 返工日期：2026-10-06 · 产出：提交 `d13f03d`（105 insertions / 83 deletions，单文件）· 验证全绿 · 未 push

### 处理路径：选项 1 成功落地（选项 2 结构作为兜底一并采用）

**拿到 AA 现行真实分**：`artificialanalysis.ai/leaderboards/models` 为 Next.js **SSR 静态渲染**，curl 直接解析出 **259 行全量表**（模型/厂商/智能分/**官方单任务成本 Cost per Task**/tokens per s/延迟），无需接口逆向。另从 AA 官方 Opus 5.5 文章拿到 **GDPval-AA v2.1 Elo**。每个分数来源见 meta.sources 逐条声明。

### 核心发现与口径裁定

1. **AA 现行智能分尺度与 v4.1 不同**（Opus 5.5 max = 58 为现行最高，而 v4.1 时代 Opus 5 = 61；MiniMax-M3 旧 44 → 现行 29、Nemotron 3 Ultra 旧 48 → 现行 23），证实已换版重标定——**新旧分绝不能同字段混排**，否则重演「Opus 5.5 被旧分压到 19 名」。
2. **旧模型已全部被移出 AA 在测榜**（Opus 5、Fable 5、GPT-5.6 Sol、GLM-5.2、Kimi K2.6 等 259 行中均无），现行口径拿不到它们的分 → 采用指令选项 2 的分区结构兜底：**旧模型归入各榜尾部「v4.1 存量区」**，note 附 Epoch 综合智力（两期通吃，作跨期衔接）。
3. Agent 榜 GDPval 同样是 **v2 → v2.1 换版**（旧 Opus 5 = 1862 是 v2 分；官方文章 v2.1 下 Opus 5.5 = 1846、对 Opus 5 差 −138 → 1708）→ v2.1 区（3 条，来源：官方原文 + 2 个官方差值推算）+ v2 存量区（11 条）。

### 四榜终版结构

| 榜 | 主区（现行口径） | 存量区 | 观察区 |
|---|---|---|---|
| intelligence | **rank 1-23 全员 AA 现行分**：Opus 5.5 **58** 榜首 → Sonnet 5.5 56 → Fable 5.1 / GPT-6 Astra / **Gemini 4 Argon**（新发现）53 → GPT-6.1 Sol 52 → … → GLM-5.3 **45**（开源第一梯队）→ GLM-5.3-Flash 42 | rank 24-36：13 条 v4.1 旧分 + Epoch 参考位次 | —（score=0 条目已清零） |
| agent | rank 1-3 GDPval-AA **v2.1**：Opus 5.5 **1846**（官方原文）/ Fable 5.1 1735（1846−111）/ Opus 5 1708（1846−138），推算依据逐条标注 | rank 4-14：v2 存量 11 条 | **watchlist 4 条**（GPT-6 Astra / GPT-6.1 Sol / Sonnet 5.5 / GLM-5.3，无 v2.1 数据，不占 rank） |
| value | rank 1-18 **AA 原生 Cost per Task**（弃折算口径）：GPT-6 Luna(high) $0.03 → MiMo-V2.6-Pro 46 分仅 $0.13 → GPT-6.1 Sol(low) 42 分 $0.13 → … → Opus 5.5(max) $5.98 | rank 19-28：10 条 v4.1 时代数据标注 | — |
| plans | score 全部对齐现行 AA 口径：Claude Max=**58**（Opus 5.5）、ChatGPT Pro=52（GPT-6.1 Sol）、GLM 套餐=45、Kimi=44、Google=30、MiniMax=29 | 阿里百炼 Qwen3.7-plus 标 v4.1 存量 | Cursor score=0 惯例保留 |

### 打回问题逐项对账

| 打回要点 | 终版处理 |
|---|---|
| Opus 5.5 被压 rank 19 / score=0 | **rank 1 / score 58**（AA 官网现行分，一手来源）；全榜 score=0 条目数 = 0 |
| 旧指数失义 | 主区整体换现行口径；旧模型进存量区且 note 标「已下 AA 在测榜」+ Epoch 参考位次，两期互不冒充 |
| Agent 榜漏 Opus 5.5 / Fable 5.1 | 已补：v2.1 区 rank 1-3 就是这俩 + Opus 5；无 v2.1 数据的 4 个新模型进 watchlist 不占排名 |
| 不编数字 | 1846 为官方原文；1735/1708 由官方文章明示的差值（−111/−138）推算并在 note 写明算式；其余全部分数来自 AA SSR 表格原值 |
| 只动两个文件 / 一个提交 / 验证 | 仅 `site/public/leaderboards.json` + 本报告；单提交 `d13f03d`；JSON.parse ✓（36/14/28/10 条 + watchlist 4）· typecheck ✓ · build ✓（2.37s） |

### 方法论沉淀（供后续轮次复用）

- **AA 数据获取通道**：`/leaderboards/models` 页 SSR 全量（curl + 表格正则即可，无接口逆向成本），含智能分 + 官方单任务成本 + 速度三件套；单模型文章页给 GDPval v2.1 Elo 与差值。下次更新直接走此通道。
- **跨口径三原则**：换版必换区（不混排）、旧分必标注（口径+下榜状态）、差值推算必写算式。
- **watchlist 模式**：无分新模型不进 items 数组、不占 rank，放独立 `watchlist` 字段（前端 `Record<string, unknown>` 宽松类型天然兼容，不渲染；将来可做展示组件）。

### 遗留提醒

1. AA 后续出 v2.1 全量 Elo 后，agent 榜 watchlist 4 条与 v2 存量区可整体迁移；AA 出 GPT-6 系/Gemini 4 Argon 官方成本页后 value 榜可持续追踪。
2. `tier` 分段已按现行尺度重划（≥56 T0 / 50+ T1 / 44+ T2 / 38+ T3 / 其余 T4），AA 若公布官方 tier 体系可再对齐。
3. 前端暂不渲染 watchlist 与存量区分隔线（数据已就位），如需视觉区分是纯前端小改动（不在本次红线内，未动）。
4. AA 榜 259 行全量已留存本机临时目录（$TEMP/aa-lb-models.html），需要归档请指示。

### 终版自评

- 指令目标 1（拿真实分重排）**完成**：AA 官网一手数据，Opus 5.5 以 58 分登顶，全榜无 score=0 排名条目；目标 2 的分区结构作为旧模型兜底同时落地。
- 最强的点：没有停留在「拿到分就填」，而是识别出**口径换版**这一根本问题，用主区/存量区双结构同时满足「新王登顶」与「旧数据不丢」；所有推算都留了算式。
- 最弱的点：Fable 5.1 / Opus 5 的 v2.1 Elo 是官方差值推算而非直读值（AA agent 榜页是 JS 壳拿不到全量），已在 note 写明推算依据；GPT-6 系的 v2.1 Elo 缺失只能进 watchlist。
- 红线复述：仅动 leaderboards.json + 本报告；单提交 `d13f03d` 未 push；工作区 clean；typecheck/build 全绿。
