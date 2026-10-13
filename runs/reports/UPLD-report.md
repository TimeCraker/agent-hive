# UPLD 上传解析全链路走查报告（Stage31 清单第 3 项）

- **走查时间**：2026-10-12 16:00–17:10
- **仓库**：`C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`，分支 main，开工 HEAD `cc889a3`
- **交付 commit**：`368390c`（docs(stage31): 登记 UPLD 走查结果与缺陷台账 / record UPLD audit results and defect ledger，仅走查文档，未 push）
- **Web BUILD_ID**：`fiIliIi1Ih466KgpySJP3`（与 stage-31-browser-audit.md 登记一致，含 9caec05 重建）
- **环境**：PG 5434（隔离僵尸库 pid 24696，全程未动）· Redis 6380 PONG · ai-service 3002（BullMQ parse worker 在线）· export 3003 · Web 3100 正式构建预览
- **测试账号**：`e2e-stage31@resumeaix.test`（密码登录实测通过）
- **AI 渠道**：文本渠道就绪（智谱 Coding Plan，parsing 用 glm-5.3-flash）→ 解析类用例全部走真实 AI；vision 渠道未就绪（SiliconFlow key 过期 401）→ 扫描图片走失败路径
- **浏览器**：Playwright MCP 独占；所有关键截图均 Read 目检

## 一、六类文件逐个链路表

口径声明：以下「真实AI通过」均为新上传 → BullMQ 真实队列 → 真实 AI 结构化 → 核对页逐字段核对，非 fixture 回显核对。队列证据 = `POST /api/resumes/:id/parse` 200（网络日志）+ ai-3002.log Job 行 + DB `createdAt→updatedAt` 时间差。

| # | 文件（materials/） | 队列证据 | 耗时 | 字段级核对明细 | 结论 |
|---|---|---|---|---|---|
| 1 | e2e-upld-base.txt（2181B，UTF-8 中文，复姓「欧阳」、6 段工作、2 段教育、日期区间、技能 4 组、证书 2、奖项 1） | Job 1：decoded 2181B(type=txt) → extracted 1088 字 → AI parsing done → completed；DB 08:23:01.163Z → 08:23:15.679Z | 14.5s | 姓名复姓完整；手机/邮箱/城市/意向一致；工作 6 段公司/职位/日期逐一精确（云帆 2022-03 至今、星河 2019-07~2022-02、蓝鲸 2016-08~2019-06、白泊 2015-09~2016-05、青崖 2015-03~2015-08、麒麟 2013-10~2014-06），「至今」正确联动 isCurrent（结束时间禁用+勾选）；STAR 成就逐字一致；教育 2 段精确到月；项目 2；技能 4 组逐项；证书 2/奖项 1 | **真实AI通过**，字段全对 |
| 2 | e2e-upld-base.docx（38KB，python-docx 1.2.0 生成） | Job 2：decoded 38155B(type=docx) → extracted 1036 字（Mammoth）→ completed；DB 08:38:58.001Z → 08:39:13.262Z | 15.3s | 同基准全对（姓名/联系方式/6 段工作/教育 2 精确日期/项目 2/技能 4 组/证书 2/奖项 1）；源无自我评价 → selfEval EMPTY，**不误造**；个人简介无 BASE 标记（DOCX 源本就没有，正确） | **真实AI通过** |
| 3 | e2e-upld-twocol.pdf（双栏+题头版） | Job 3：decoded 166712B(type=pdf) → extracted 1006 字（pdf-parse 文字层直接提取，未走视觉渲染）→ completed | 16.1s | **核心亮点：文字层姓名为带空格「欧 阳 揽 月」（letter-spacing 所致，上传前 pdf-parse 直读验证 name 计数=0），入库归一化为完整「欧阳揽月」（无空格）——Stage31 姓名保真链路实测生效，复姓未丢字**；双栏左栏 6 段工作 + 右栏简介/项目/教育/技能/证书全部抓到，日期全对 | **真实AI通过** |
| 4 | e2e-upld-multipage.pdf（2 页，第 2 页含独有内容） | Job 4：decoded 191857B(type=pdf) → extracted 1222 字（上传前直读 1224，一致）→ completed | 16.2s | 第 2 页独有内容全部识别：第 3 个项目「智能问卷分析平台」（含【E2E-UPLD-P2】标记行）、续页 2 段工作（青崖/麒麟）、整段自我评价；工作 6 段跨页全抓到；教育 2/技能 4/证书 2/奖项 1 全对 | **真实AI通过**，多页不截断 |
| 5 | e2e-upld-missing.pdf（刻意无邮箱、无教育背景） | Job 5：decoded 110237B(type=pdf) → extracted 492 字（直读 494，一致）→ completed | 6.8s | **零误造**：email=空串（未伪造）、education=0 条（页脚「无教育背景」说明文字未被当数据）、项目 0/证书 0/奖项 0/自评空（源都没有→全不无中生有）；正确字段全对（姓名/电话/城市/意向/3 段工作/技能 3 组：语言/框架/其他） | **真实AI通过** |
| 6 | e2e-upld-scan.png（整页简历截图模拟扫描件） | Job 6：decoded 162637B(type=image) → FAILED ×2（BullMQ attempts=2 重试均 401）；DB 08:49:15.629Z → 08:49:19.079Z | 3.4s 落定 | content.error=「图片解析 API 认证失败，请检查 VISION_API_KEY 是否有效」；UI 正确显示 FIG.ERROR 面板（这次没有解析成功 + 精确原因 + 重新上传/改从零构建双出口）；顶栏 200 T-Coin 全程未扣 | **失败路径通过**（环境限制：vision key 过期 401，与 PREP 登记一致，非 UI 缺陷）；**成功路径未测**（渠道未就绪） |

**解析成功五轮「打开核对页不自动调 AI」**：解析落 review 页后 network 过滤 `api/ai|score|polish` **零请求**（TXT 轮专测硬断言，后续各轮同构）。

**解析成功轮耗时带**：6.8s–16.2s（随文本量 492–1222 字）。

## 二、扫描 PNG 失败路径详情

- 上传 → 进入 `/upload?review=cmv50gc4t000buvmotjkvxhxn` → 队列 2s 轮询。
- Job 6 以 image 通道调用 vision 模型：SiliconFlow 返回 401（key 过期）→ BullMQ 按 attempts=2 重试第二次 → 仍 401 → 任务 FAILED，状态落库耗时 3.4s。
- UI 呈现：FIG.ERROR — 解析未完成面板，「这次没有解析成功」+ 具体原因文案 + 「重新上传」「改从零构建」双出口按钮；无崩溃、无白屏。
- 计费：顶栏 T-Coin 全程 200，失败未扣费。
- 日志证据：`[ParseWorker] Job 6: decoded 162637 bytes (type=image)` + 两轮 `FAILED: 图片解析 API 认证失败…`。
- 截图：`error-1440-02-scan-vision-fail.png`（已目检）。
- 定性：环境限制（vision 渠道未就绪），非产品缺陷；修复 vision key 后需补测成功路径。

## 三、核对页四组交互断言（handoff 第 3 项原文要求）

1. **修改 + 加经历持久化** ✅
   - 操作：改名（欧阳揽月→欧阳望舒）、改日期（白泊开始 2015-09→2015-10）、改成果（蓝鲸第一条追加【E2E改】）、添加第 7 段工作经历（玄鸟智研科技/前端专家/2024-10）→ 保存核对结果 → 保存并继续编辑 → 编辑器 `/resume/:id` → 整页刷新。
   - 断言：刷新后编辑器表单姓名框=欧阳望舒、实时预览标题=欧阳望舒、预览含新经历「玄鸟智研科技·前端专家·2024-10」；API `GET /api/resumes/:id` content 逐字段一致（name=欧阳望舒、workCount=7、baipoStart=2015-10、蓝鲸成果含【E2E改】、新 entry 字段完整），updatedAt 随每次 PATCH 推进。
2. **无效邮箱** ✅
   - 操作：邮箱改为 `not-an-email@bad` → 点保存核对结果。
   - 断言：alert「邮箱格式不正确，请修改基本信息后重试保存」、停留本页（URL 不变）、输入保留（截图佐证）、network 零保存请求（仅既有 GET）。
3. **断网保存** ✅
   - 操作：改所在地=杭州·断网测试 → `setOffline(true)` → 点保存 → 观察失败 → `setOffline(false)` → 重试保存。
   - 断言：失败时 console `net::ERR_INTERNET_DISCONNECTED`（PATCH #171）、输入保留、页面报错；恢复网络重试 PATCH #172 成功，API 证实 location=杭州·断网测试 落库。
4. **重复点击保存** ✅
   - 操作：改求职意向制造脏状态 → 双击「保存核对结果」。
   - 断言：network 日志仅 1 个 PATCH（#174；#171/#172 为断网轮请求）、无重复记录（同 id 单条更新）、无误跳转（URL 保持 review 页）、值正确落库。

附加断言：**打开核对页不自动调用 AI**——上述全流程 network 记录中评分/润色类请求为零（评分仅在手动点击后出现 1 次）。

## 四、beforeunload 未保存离开提示 ✅

- 操作：所在地改为「杭州E2E离开提示」（dirty，状态行出现「有未保存的修改」）→ `page.goto('/dashboard')`。
- 断言：beforeunload 对话框真实弹出，导航被拦截（URL 保持在 `/upload?review=…`）；`handle_dialog(accept=false)` 取消后留在本页，所在地输入值保留（find 断言通过）。
- 收尾：值复原为「杭州」并保存，状态行回到「当前内容已保存」（run_code 内 1.2s 检测误报 false，find 复核为已保存态）。

## 五、在职切换禁用/启用结束日期 ✅（快速回归）

- 对象：星河互联条目（第 2 个「目前仍在职」checkbox，对应第 2 个结束时间输入框）。
- 三态断言：before `{checked:false, disabled:false}` → 勾选后 `{checked:true, disabled:true}`（结束时间禁用）→ 取消后 `{checked:false, disabled:false}`（恢复可编辑）。
- 截图：`review-1440-03-current-toggle-on.png`（勾选态+禁用输入框灰化，已目检）。
- 同组回归：「去修改经历」按钮（评分卡 3 条建议各带）点击后工作经历组展开 + 滚动定位（scrollY=1066，首公司输入框 top=246 入视口，6 个公司输入框渲染）。

## 六、视口结论（上传页与核对页 390/768/1440）

| 页面 | 390 | 768 | 1440 |
|---|---|---|---|
| /upload（空闲态） | 无横向溢出（docScrollW 385=clientW 385）；格式标签/选择文件完整；截图目检通过 | 762=762 无溢出；双栏布局正常；截图目检通过 | 基准视口，全程主要走查视口 |
| /upload?review=…（核对态） | 无溢出 385=385；姓名/邮箱/意向输入高 **44px**；邮箱、意向 **303px 全宽单列**；71 个输入框完整渲染；截图目检通过 | 762=762；44px；两列 328px；截图目检通过 | 表单两列、评分卡、明细区正常 |

390 必过项全部达标（无横向溢出、输入 ≥44px、邮箱/意向全宽），滚动条口径与前次验证一致（文档宽略小于视口）。

## 七、异常路径与负例（4 组 + 上限）

| 负例 | 行为 | 网络断言 |
|---|---|---|
| e2e-upld-bad.exe | 前端拦截，alert「暂不支持该格式 — 请转存为 PDF/DOCX/TXT/MD，或截图后以 JPG/PNG 上传」 | 零请求（无记录创建） |
| e2e-upld-bad.zip | 同款拦截提示 | 零请求 |
| e2e-upld-big.pdf（20MB） | 前端拦截「文件不能超过 10MB — 请压缩后重试，或改用「从零开始构建」粘贴文本」 | 零请求 |
| e2e-upld-empty.txt（0B） | **前端不拦空文件**，POST /api/resumes 照发 → 403（5 份上限遮蔽） | 403 记录在案（S31-UPLD-03） |
| 第 6 份简历上传 | 403 + FIG.ERROR 面板（这次没有解析成功 + 重新上传/改从零构建） | 行为正确；文案见 S31-UPLD-01 |

评分入口附带证据（AIFLOW 边界顺带取证）：`POST /api/resumes/:id/score` 200 真实单次调用，顶栏 200→198（扣 2 T-Coin），评分 7/10 与内容对应（「分析对应当前内容」），3 条改进建议各带「去修改经历」。

## 八、缺陷台账摘要（含独占文件问题清单，只记不修）

| 编号 | 页面/操作 | 期望/实际 | 根因 | 严重度 | 证据截图 |
|---|---|---|---|---|---|
| S31-UPLD-01 | /upload 第 6 份上传（5 份上限触发） | 期望提示与全站免费叙事一致 / 实际「当前套餐最多存储 5 份简历，请删除不需要的简历或**升级套餐**」 | BFF 限额分支文案为付费时代遗留；行为本身正确（403+错误面板+双出口） | 低 | error-1440-01-quota403.png |
| S31-UPLD-02 | 核对页断网保存 | 期望友好中文兜底「保存失败，修改仍保留在本页，请重试。」 / 实际显示英文原始错误「Failed to fetch」 | upload-workspace.tsx `handleSave` catch 分支优先取 `err.message`（TypeError），中文兜底永不命中 | 低（行为正确：报错+保留+可重试，仅文案语言） | review-txt-1440-05-offline-save-error.png |
| S31-UPLD-03 | /upload 上传 0 字节文件 | 期望前端拦截空文件 / 实际无校验直接 POST 创建记录（本轮被 403 上限遮蔽；名额未满时会留下占名额的 FAILED 记录） | file-upload.tsx 校验只覆盖类型与大小，未覆盖 size===0 | 信息（低频，最终仍有失败报错） | error-1440-01-quota403.png（同款面板） |

- 三个问题均位于**本会话独占文件**（upload-workspace.tsx / file-upload.tsx / BFF 限额分支），按红线只记台账不修改。
- 可修边界结论：本轮未发现不属于独占文件的周边缺陷，故无修复类 commit。
- 附带观察（非缺陷）：ai-service 日志第 19 行有一条启动期 `ERR_MODULE_NOT_FOUND: dist/routes/parse` 旧痕迹（曾以 node dist 直跑失败，现行服务为 tsx 直跑源码，不受影响）；dashboard/编辑器 /design 404 噪音为台账既有 S31-PUB-02。
- 台账登记落点：`docs/stages/stage-31-browser-audit.md` UPLD 分区 + 页面清单 #12 置 ✅ + 缺陷台账总表 3 行，commit `368390c`。

## 九、素材与截图绝对路径

- **合成素材**（含【E2E】标记，零真实简历）：`C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/UPLD/materials/`
  - e2e-upld-base.txt、e2e-upld-base.docx、e2e-upld-twocol.html/.pdf、e2e-upld-multipage.html/.pdf、e2e-upld-missing.html/.pdf、e2e-upld-scan-src.html、e2e-upld-scan.png
  - 负例：e2e-upld-bad.exe、e2e-upld-bad.zip、e2e-upld-empty.txt、e2e-upld-big.pdf（20MB）
  - verify-pdftext.cjs（上传前 PDF 文字层验证脚本，丢字定位前置证据）
- **截图**（约 25 张，全部读图目检）：`C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/UPLD/`
  - upload-1440-01-idle.png、upload-768-01.png、upload-390-01.png
  - review-txt-1440-01.png ~ 05（含 bademail-field/alert、offline-save-error）
  - review-docx-1440-01.png、review-twocol-1440-01.png、review-multipage-1440-01.png、review-missing-1440-01.png
  - review-390-01.png、review-768-01.png、review-1440-02-score-card.png、review-1440-03-current-toggle-on.png
  - error-1440-01-quota403.png、error-1440-02-scan-vision-fail.png、error-1440-03-exe-rejected.png、error-1440-04-bigpdf-rejected.png
- 上传镜像（Playwright 允许根内、gitignored）：`<ResumeAIX repo>/.playwright-mcp/UPLD-materials/`（临时）
- 镜像同步说明：仓库内报告 `ResumeAIX/runs/reports/UPLD-report.md` 同步存在一份（该目录 gitignored）；本文件为 hive 归档正本。

## 十、自评与遗留

- **渠道状态**：文本渠道（智谱 Coding Plan）全程就绪——5 轮解析 + 1 次评分全部真实调用；vision 渠道未就绪（SiliconFlow key 过期 401）→ 扫描图片仅失败路径通过，**成功路径未测**，与 PREP 登记口径一致，非 UI 缺陷。
- **DOCX**：python-docx 1.2.0 本机可用，已真实上传解析通过，无「工具不可用」豁免事项，无遗留。
- **未测项**：① 扫描图片解析成功路径（等 vision key 恢复）；② 空文件在名额未满下的完整行为（本轮被 5 份上限遮蔽，仅证实「前端不拦、直接创建」）；③ 上传中队列态离开页面（仅验证 dirty 态 beforeunload；90s 队列超时与连续 5 次轮询失败的恢复逻辑在案未构造）；④ 生产环境（按红线不连生产、不部署）。
- **数据痕迹**：走查中因 5 份上限删除了 3 份已完成取证的合成简历（TXT/DOCX/双栏轮）；现遗留 multipage/missing/scan(FAILED) 3 份 + PUB 2 份 fixture，均为【E2E】合成数据；e2e 账号 T-Coin 198（评分扣 2，失败未扣）。
- **口径合规**：未把 fixture 核对冒充新解析成功；所有「通过」均有队列日志/网络请求编号/DB 时间戳/目检截图支撑；独占文件零修改；未 push、未部署、零密钥零验证码出证。
- **验收标准对照**：① 6 类文件（≥4 类要求，含 DOCX）完整链路登记 ✅；② 四组交互断言 ✅（另含 beforeunload 与两项快速回归）；③ 打开核对页零 AI 调用 network 证据 ✅；④ 独占缺陷台账 3 条、无可修周边缺陷 ✅；⑤ 报告落盘 ✅（本文件 + 仓库内镜像）。
- **交付 commit**：`368390c docs(stage31): 登记 UPLD 走查结果与缺陷台账 / record UPLD audit results and defect ledger`（仅 docs/stages/stage-31-browser-audit.md，47 insertions/8 deletions；工作区既有无关改动未触碰）。
