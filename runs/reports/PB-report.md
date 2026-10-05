# PB 结果报告

> 任务：coding-plan-bench 升级为 glm-5.3 多模型对比台 · 日期：2026-10-05
> 仓：https://github.com/TimeCraker/coding-plan-bench · 提交 `ec0f774`（已 push 到 main）

## 框架改动说明

从 git 历史找回 v1 被删的 `bench/` 编排思路，适配 v2 同构引擎，升级为「模型矩阵」架构：

| 改动 | 文件 | 说明 |
|---|---|---|
| 模型矩阵单一事实源 | `engine/models.ts`（新增） | glm-5.3 / glm-5.3-flash（智谱同 key）+ 百度 DeepSeek-V4.1-Flash 占位 + GLM-5.2 三渠道存量；含 endpoint/协议/envVar/品牌色/世代 |
| CLI 矩阵跑分 | `bench/run.ts` + `bench/prompts.ts`（新增） | `npm run bench:matrix`：串行 × 2s 频控间隔 × 失败重试一次 → 中位数汇总 + 原始 JSON 落 `results/data/`；输出前置泄密守卫（检测到 key 片段即中止写入） |
| 用例集 | `bench/prompts.ts` | 4 条区分档位的用例：生成 LRU（中难）/ 生成类型安全事件总线（高难，泛型联动推导）/ 改错合并区间（埋 2 个 bug）/ 解释事件循环输出（预测精确顺序）；每条带评分 rubric |
| 引擎补强 | `engine/bench.ts` + `types.ts` | 新增 `stopReason` 采集（Anthropic `message_delta` / OpenAI `finish_reason`），机器可识别截断样本 |
| 网站快选 | `site/src/components/BenchForm.tsx` | 表单顶部矩阵芯片，点击预填 endpoint/model/协议，**key 永不预填** |
| 种子榜单 | `site/src/lib/storage.ts` | 首访示例从 v1 GLM-5.2 三家换成 glm-5.3 vs flash 当日实测中位数 |
| 文档 | `README.md` / `.env.example` / `package.json` | 模型矩阵章节 + `bench:matrix` 命令 + `ZHIPU_API_KEY` 条目 |

**发现并修掉一个框架级坑**：thinking 模型的思考占 max_tokens 预算——首轮统一 4096 时，两模型在改错题上把预算全花在思考、**正文 0 字被截断**（flash 在高难生成题同样中招）。修复：用例级 maxTokens 覆盖（难题 6144/8192）+ stopReason 采集，正式轮 32/32 全部 `end_turn` 零截断。

## 实测数据表

设置：智谱官方 Anthropic 兼容端点，`ZHIPU_API_KEY` 进程注入（两模型同一把 key），temperature=0，每用例×模型 2 次，2026-10-05，China 直连。

**速度（每模型 8 样本取中位数）**

| 模型 | TTFT ↓ | TPS ↑ | Total ↓ | Wins | 成功率 |
|---|---|---|---|---|---|
| **GLM-5.3** | 1389 ms | **89** | **19.9 s** | **3/4** | 100% |
| GLM-5.3-Flash | **892 ms** | 64 | 34.7 s | 1/4 | 100% |

**分用例总耗时（中位数）**：LRU 生成 7.8s vs 27.5s（旗舰 3.5×胜）；事件总线 30.6s vs 24.0s（Flash 唯一一胜，靠旗舰单次思考离群）；改错 56.5s vs 65.6s（旗舰胜）；解释 19.3s vs 36.5s（旗舰 1.9×胜）。

**质量粗评（首跑输出按 rubric 打分）**

| 用例 | GLM-5.3 | Flash | 要点 |
|---|---|---|---|
| 生成 LRU 缓存 | 4/4 | 4/4 | 双双正确 O(1) Map 实现 + 泛型完整 |
| 生成类型安全事件总线 | 4/4 | 4/4 | 双双正确的 K 联动泛型推导 + 含编译错误演示的示例 |
| 改错 合并区间 | 4/4 | 4/4 | 两档都找全 2 个埋点 bug，且都额外发现空数组守卫/原地排序/引用共享三个隐藏问题 |
| 解释 事件循环输出 | 3/3 | 3/3 | 双双给出精确顺序 1 6 8 3 5 7 2 4，解释到位 |

**核心结论**：中高难用例上两档**质量打平（正确率均 100%）**，档位差体现在——① 端到端速度旗舰快 1.7×、TPS 快 1.4×；② 思考纪律：Flash 对简单题也会思考 35s+（LRU 单次 36.5s vs 旗舰 8s），且更易把 thinking 预算想爆；③ Flash 唯一优势是首 token 快约 0.5s（但 thinking 模型的 TTFT 只是思考开始时刻，体感意义有限）。

## 提交与推送

- 提交：`ec0f774` `feat(matrix): glm-5.3 多模型对比矩阵 + 首轮实测 / add glm-5.3 model matrix + first measured round`（13 files, +932/−41）
- 推送：`78a17a3..ec0f774 main -> main`（经 127.0.0.1:7897 代理）
- 验证：`tsc -b` 零错误、`npm run build` 通过、32/32 请求成功（含 1 次频控 429 自动重试）
- 泄密自查：`git diff --cached` 三重扫描（`sk-` 模式 / key 全值 / key 前 12 位）全 CLEAN；key 仅经 `ZHIPU_API_KEY` 环境变量进程注入，runner 还有落盘前运行时守卫

## 遗留问题

1. **百度 DeepSeek-V4.1-Flash 未实测**：已进矩阵占位（无 `QIANFAN_API_KEY` 自动跳过），模型 ID 未经验证，有 key 后 `npm run bench:matrix` 一条命令即可补测
2. GLM-5.2 三渠道（智谱/火山/百度）本轮无 key 未复测，v1 数据保留在 `site/public/results.json`
3. 根 `tsconfig.json` 仍是 v1 残留（include `src`+`bench`，不含 `site/`），site 代码实际只靠 vite 打包不做类型检查——本次未动（超出任务边界），后续可补 site 的 tsconfig project references
4. 官网 `coding-plan-bench.pages.dev` 的快选芯片需下次 Cloudflare Pages 部署后才上线（push 不自动部署前端，与该仓既有人工部署流程一致）
5. 质量评分为人工按 rubric 粗评（每用例 3-4 条判据），样本为 temp=0 下首跑；未做多轮一致性统计

## 自评

**达标**。验收两项硬指标均完成：① 框架支持新模型矩阵——`engine/models.ts` 单一事实源 + 网站快选 + CLI 跑分，且顺带修复 thinking 截断的框架级问题（stopReason + 用例级预算）；② 两模型实测数据表（速度 4 指标 × 质量 rubric）已写入 `results/2026-10-05-glm-5.3-matrix.md` 并随 `ec0f774` push。红线全守：key 零入库（三重扫描 + 运行时守卫）、频控有间隔有重试、用例区分度经过两轮实跑验证（中难题两家全对、速度拉开 1.7×，高难题曾拉开截断差异）。
