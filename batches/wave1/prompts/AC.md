# 任务 AC：auto-content 复活与产线整合方案

先把仓 clone 到工作区（若已存在则直接用）：
`git clone https://github.com/TimeCraker/auto-content.git`，然后在其目录内工作。
这是「自用 AI 文案自动流——一键产出小红书/知乎/闲鱼三平台草稿与封面图」（TypeScript，PUBLIC），停在 2026-09-03。你的任务：把它修活、跑通、出样例，并产出与 vibe-studio 发布管线的整合方案（二期桥接用，本轮不动 vibe-studio 仓）。

## 已知事实
- 智谱 key：环境变量 `ZHIPU_API_KEY`（本机 `C:\Users\TimeCraker\.claude\zhipu.env` 里有，自行读取注入，**严禁写进任何文件/提交**——本仓 PUBLIC）
- 智谱 Anthropic 兼容端点 `https://open.bigmodel.cn/api/anthropic`，模型 `glm-5.3` / `glm-5.3-flash`
- vibe-studio（`..\vibe-studio`，只读参考勿改）有三平台发布工具 `skills/publish/`（douyin/xhs/bili，Playwright 驱动、登录态在仓外）——整合方案的对接端
- 你是多模态会话：生成的封面图必须亲自看图验收

## 步骤
1. 读 README/源码，理清输入（选题/文案需求）→ 输出（三平台草稿 + 封面图）的管线与配置方式
2. `pnpm install`（或其约定的包管理器）修依赖问题到能跑
3. 用 ZHIPU_API_KEY 跑通一次完整流程：选一个真实小选题（例如「AsterNova 游戏开发日志」或「AI 简历工具使用技巧」），产出小红书/知乎/闲鱼三种文案 + 至少 1 张封面图
4. **封面图目检**：文字清晰、无乱码、排版正常（贴进报告路径）
5. 修复过程中发现的 bug（独立提交）；依赖升级最小化
6. 写整合方案 `docs/integration-with-vibe-studio.md`：auto-content 产物目录 ↔ vibe-studio skills/publish 输入约定 的对接设计（格式/路径/触发方式），二期实施清单
7. 提交推送（Conventional Commits 中英对照；样例产物若含生成图，确认 .gitignore 策略与仓的既往惯例一致）

## 红线
- key 零入库：提交前 `git diff --cached` 自查（grep sk- 等模式）
- 不动 vibe-studio 仓；不真发布任何平台
- API 频控：失败重试一次，间隔调用

## 验收标准
- 一次完整跑通（三平台文案 + 封面图），封面目检通过
- 整合方案文档存在且含二期实施清单

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\AGENT-BOARD-2026-10\reports\AC-report.md`
模板：# AC 结果报告 / ## 复活过程（修了什么） / ## 样例产物（路径+封面目检结论） / ## 整合方案摘要 / ## 提交与推送 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
