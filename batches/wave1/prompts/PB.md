# 任务 PB：coding-plan-bench 升级为 glm-5.3 多模型对比台

先把这个仓 clone 到当前工作区（若 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench` 已存在则直接用）：
`git clone https://github.com/TimeCraker/coding-plan-bench.git`，然后在其目录内工作。

## 背景
这是你的 GLM 订阅套餐测速台（TypeScript），目前测的是 **GLM-5.2 三个渠道**（Zhipu/Volcengine/Baidu coding plans）。现在要升级成 **glm-5.3 时代的多模型对比**：
- 智谱官方端点：`glm-5.3` 与 `glm-5.3-flash`（同一 key 可调两个模型，对比旗舰 vs flash 的速度/质量）
- 有余力再加：百度千帆 `DeepSeek-V4.1-Flash`（若原框架已支持百度渠道）

## 已知事实
- 智谱 Anthropic 兼容端点：`https://open.bigmodel.cn/api/anthropic`；API key 环境变量可用 `ZHIPU_API_KEY`（本机 `C:\Users\TimeCraker\.claude\zhipu.env` 里有，**你自行读取使用，严禁把 key 写进任何代码/配置/报告/提交**）
- 仓是 PUBLIC——任何 key 泄漏进提交都是事故，提交前自查 `git diff --cached` 无 key 痕迹

## 步骤
1. 读 README/源码理解现有跑分框架（怎么定义渠道/模型/用例/输出）
2. 扩展模型矩阵：glm-5.3、glm-5.3-flash（智谱端点，key 走 env 注入）
3. 实跑一轮小规模对比（每模型 3-5 个编码用例：生成/改错/解释类），记录首 token 延迟/总时长/质量粗评
4. 结果写入仓内结果文档（README 或 results/），提交推送（Conventional Commits 中英对照）
5. 用例设计要能区分模型档位（太简单的题拉不开差距）

## 红线
- key 只从 env 进程注入；产物/提交零 key
- 跑测注意频控：智谱有并发/速率限制，用例间加间隔，失败重试一次
- push 前自查缓存区无敏感串（grep sk- 模式）

## 验收标准
- 框架支持新模型矩阵 + 实测一轮数据表（两模型对比）已入库 push

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\AGENT-BOARD-2026-10\reports\PB-report.md`
模板：# PB 结果报告 / ## 框架改动说明 / ## 实测数据表 / ## 提交与推送 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
