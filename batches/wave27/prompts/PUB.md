# PUB：公开页 + 工作台走查（清单第 1+2 项）

## 任务一句话

用 Playwright MCP 对 ResumeAIX 公开页面与工作台逐页「定位→操作→断言→截图→亲自目检截图」走查，覆盖导航/跳转/错误提示/多视口/键盘，修复范围内的简单缺陷并回归，结果登记进走查文档。

## 背景（主控已核实；前序任务产出以走查文档为准）

- 仓库 `C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main。先读：`docs/stages/stage-31-agent-testing-handoff.md`（权威规范，尤其「页面与路径覆盖」第 1、2 项与「修复边界与所有权」）、根 `AGENTS.md`、`apps/web/AGENTS.md`、`docs/design-system/resumeaix-web/MASTER.md`（UI 规范，判断样式缺陷时用）。
- **开工第一步**：读 `docs/stages/stage-31-browser-audit.md` 的环境事实与 runbook（PREP 任务产出）：确认 3100（Web）/3002（AI）/6380（Redis）/5434（PG）状态；记录你开工时的 HEAD；若服务挂了按 runbook 拉起（**PG 是僵尸进程 pid 级禁区，禁止 kill/重启**）。
- 浏览器：会话内置 Playwright MCP（browser_navigate / browser_snapshot / browser_click / browser_type / browser_fill_form / browser_take_screenshot / browser_console_messages / browser_network_requests / browser_find / browser_resize / browser_tabs / browser_wait_for 等）。Chrome 已装。**你是当前唯一浏览器使用者，独占它；结束前关闭你开的标签页**。
- 测试账号：走查文档环境事实节记录的【E2E】账号。截图证据目录：`C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/PUB/`（自建），文件名 `页面-视口-序号.png`；**每张关键截图必须自己用读图工具打开目检**（不是只保存）。
- 汇报口径：逐页逐项 通过/失败/未测；区分真实通过/仅模拟/未测原因；不以构建通过冒充验收。

## 步骤

1. **基线**：browser_navigate 打开 http://127.0.0.1:3100 → snapshot 确认渲染 → browser_console_messages 记初始错误基线（后续「新增」错误才算问题）。
2. **公开页逐页走查**（清单第 1 项，路由以 PREP 的路由清单为准，通常含：`/`、`/login`、`/register`、案例列表/详情（按路由清单实际路径）、`/pricing`（免费说明）、隐私、条款、404）：
   - 每页：导航进入 → 断言关键内容与导航元素 → 检查按钮/链接可点、返回行为 → console 无新增错误 → 1440px 截图目检。
   - 登录/注册：表单负例（错误邮箱格式、密码不一致/过短、空提交）有明确提示不误跳转；登录成功跳 dashboard；未登录访问 dashboard 被重定向到 login 且登录后回到目标页。
   - 404：访问不存在路径，确认 404 页与返回首页入口。
   - 案例详情若有数据为空：登记空态表现（不算失败，除非空态页面破损）。
3. **工作台走查**（清单第 2 项，用【E2E】账号登录）：
   - 简历列表：渲染、卡片信息（标题/时间/版式标识）、最近编辑排序合理性。
   - 空态：若账号已有简历，新建一个空简历走创建流后观察列表变化；空列表页（可用新注册的第二个【E2E】子账号，或既有空态截图证据）验证空态文案与引导按钮。
   - 创建：从 dashboard 创建新简历（命名带【E2E】PUB 前缀），进入后确认基础结构正常，返回列表确认出现。
   - 复制：复制一份简历，**逐项核对语义**：内容一致、pipeline 标识一致、版式一致、岗位字段一致、版本历史是否独立（复制件不应共享/丢失版本链）——handoff 明确要求这四项。
   - 删除：**只点出确认弹窗并验证取消/确认文案行为后取消**，保留测试资料。
4. **视口**：对首页、登录、dashboard、案例详情（关键页）分别 browser_resize 到 390、768、1440、1920 截图目检：无横向溢出（可对比 document.scrollWidth 与 clientWidth）、导航折叠可用、触控目标 ≥44px、文字不裁切。768/1920 至少覆盖首页+dashboard，390 必须四页全过。
5. **键盘**：在首页导航与登录表单走 Tab/Enter/Escape：焦点可见、顺序合理、Enter 提交、Escape 关闭弹层后焦点恢复。
6. **缺陷处理**：
   - 简单缺陷（按钮不可达/无反馈、文案错误、label 关联、样式裁切溢出、局部间距、简单加载/失败态）：一个缺陷一个 commit（Conventional Commits 中英文），**修复后 rebuild + 重启 3100（按 runbook）→ 同条件复测截图（前后对照）**。
   - 复杂问题（鉴权/数据隔离/状态污染/跨页逻辑）：只取证（URL、视口、复现步骤、网络请求状态码、console、截图）记台账交回，不修。
   - 独占文件（upload/page.tsx、upload-workspace.tsx、parsed-result.tsx、parsed-content-editor.tsx、resume-score-card.tsx、parsed-resume-save.ts、五个基础内容编辑表单、content-section-draft.ts、ai-service 解析队列/parse-identity.ts/image-parser.ts、ai-prompts/parsing.ts、docs/stages/stage-31-*.md）即使发现简单缺陷也**只记台账不修改**。
7. **登记**：`docs/stages/stage-31-browser-audit.md`：PUB 分区逐页结果表 + 缺陷台账逐条编号（S31-xx，沿用总表追加）。commit（docs 与代码修复分开 commit）。

## 红线

- 不碰面试产品线（interview-helper/interview-audio）；不 push、不部署、不连生产。
- 测试数据一律【E2E】前缀；不上传真实简历；截图/日志/提交零密钥零验证码。
- 保留测试资料（删除只验证确认行为）；不批量消耗 T-Coin；不调 AI 功能（那是 AIFLOW 的事，本任务点开 AI 入口页面确认可进入即可，不发起调用）。
- 不动他人留下的工作区改动；PG 僵尸进程禁区。

## 验收标准

1. 路由清单中归属 PUB 的页面 100% 有登记行：通过/失败/未测 + 证据截图路径。
2. 390px 覆盖全部关键页且无未解释的横向溢出。
3. 复制语义四项（内容/pipeline/版式/岗位）有明确断言记录。
4. 所有修复有 commit + 前后截图 + 回归结论；台账无「已修未测」悬空项。
5. 报告落盘 `runs/reports/PUB-report.md`。

## 报告要求

整文件覆盖写入 `runs/reports/PUB-report.md`：逐页覆盖数量（通过/失败/未测）、完成的链路、缺陷台账摘要（编号/严重度/状态）、修复 commit 列表、截图绝对路径清单、自评与遗留。
