# agent-hive · UI/UX 设计决策记录

## 2026-10-05 · v1（从 AGENT-BOARD 临时看板升格）

### 三次错位复盘（旧看板时代的教训，永不再犯）
1. 字符画卡片（╔═╗）混排中英文：聊天 GUI 字体栈里 CJK/ASCII 宽度比 ≠ 2.0，结构性无法对齐 → 状态卡改 Markdown 表格，本控制台直接用 HTML 表格/网格（渲染端对齐）
2. emoji 状态图标（✅🟡）：宽度随字体回退漂移 1/2 列 → 全站文字状态（OK/WARN/进行中/已完成）
3. 每行 emoji 数量不同 → 各行漂移量不同。结论：**混合宽度字符的字符画在 web 环境永远不可靠**

### 视觉世界：Swiss Industrial Print（浅色）
- 纸感底 `#F4F4F0` + 极淡点阵纹理；油墨黑 `#111` 文字（非纯黑）
- 发丝线边框、零圆角、网格排版；红色 `#E61919` 仅作品牌强调（页首色块、focus 环）
- 状态色是数据语义（非装饰）：进行中 墨蓝 `#2D5A88` · 已完成 印刷绿 `#3A7D44` · 排队 琥珀 `#B07D1A` · 已取消 灰 `#8A8F98`
- 等宽字体只用于数据/哈希/时间/代号（遥测场景正当），中文正文用系统 sans（PingFang/雅黑）

### 结构决策（截图实测驱动）
- 桌面在办任务**行式全宽布局**（v6 固定宽卡片在任务少时右侧大片留白——实测截图诊断）
- 移动端横向溢出（kv nowrap 无约束）→ min-width:0 + max-width:100% 约束
- 单一导航（sticky + 状态色实底选中），砍掉一切重复计数导航（v6 双导航顺序不一致被用户指出）
- Git 动态默认**按项目**全宽列表（v6 三列小卡+全局时间线被否）
- 状态词汇定稿：已完成 / 进行中 / 排队中 / 已取消（"干得正欢"、"思考中/进行中之分"均被用户否决）

### 终端视图方案
- 旧 `claude -p`（纯文本输出）无法实时观测 → 派发改为**服务端直接 spawn claude.exe**（零 PS 包装层），stdout 落 `runs/logs/<wave>/<代号>.ndjson`（stream-json 每动作一行），stderr 落 `<代号>.ndjson.launcher.err`
- 服务端 `/api/logs/<代号>?since=字节偏移` 增量尾读（不完整行留到下次）
- 前端终端面板：黑底 #0C0E10、工具调用琥珀 #E3B341、结果绿 #7EE787、自动跟随滚动（用户上滚即暂停）
- legacy 会话（旧 launcher 派发）无流式日志，面板明示「LEGACY」，文件活动信号兜底

### 派发链路教训（2026-10-05 实战四连）
1. **PS 5.1 + `$ErrorActionPreference='Stop'` + native stderr = 秒杀**：claude 一吐 unrecognized_model 警告，重定向管道即被 NativeCommandError 终止（instant death、null exit、零输出）。修法：launcher 去 `2>&1` + EAP 改 Continue；最终方案直接 spawn claude.exe 彻底绕开 PS 层
2. **prompt 必须走 argv**：`stdio[0]='ignore'` 且无 prompt 参数时 claude 报「Input must be provided」秒退——任务包提示词从 batch 声明的文件读出后作为位置参数传入
3. **Turbopack 持久缓存测量失真**（GW 会话发现）：改完 import 图后 `.next/cache` 复用旧模块图——凡改 import 图后测性能，先清缓存
4. **批量派发的互斥**：dispatch API 只接受 pending 状态，天然防双跑；但多会话同机时注意 spawned claude 会被外部进程清理波及（SMK 曾被外部 kill，见 server-snapshot）

### 时间正确性
- 「已运行」曾随面板重启漂移（STARTED_AT 取服务器启动时刻）→ 根治：派发时刻持久化进 batch.json（dispatchedAt），elapsed = now − dispatchedAt

## 2026-10-05 · v2（验收状态机 + Wave 2/3 实战 + 美术迭代）

### 状态与口径
- 验收状态机落地：pending → queued → running → reported/failed → accepted/rejected；**终态只出自验收**（进程退出最多到 reported）
- 统计带与 Tab 顺序对齐：进行中 · 待验收 · 已验收 · 失败 · 已取消（「排队中」并入进行中计数，口径 = running+queued+pending）
- 完成率分母剔除已取消（取消=移出范围，不是未完成）——用户指出旧算法永远到不了 100%

### 列对齐铁律（S01I vs MXU 错位教训）
- **代号列曾按内容伸缩**：4 字符代号（S01I）把列撑到 96px+，3 字符（MXU）只有 82px → 行行边界错位
- 铁律：**多行卡片的每一列用固定 flex-basis + `min-width:0` + 内容省略**，宽度由基准决定、与内容无关
- LIVE 预览列恒渲染（无事件显示 `—` 占位），不得按需出现

### 终端渲染（markdown-lite + 工具行紧凑化）
- assistant 文本走 markdown-lite：标题琥珀左轨、表格 mono 底框、`code` 高亮、列表虚线
- 工具行紧凑化：**徽章（工具名）+ 短提示 + ×N 连击合并**——文件只留 basename、命令中段截断；完整 Windows 路径刷屏是 v3 最大的丑源
- 工具行左侧琥珀轨道（2px 半透明），与文本块形成交替节奏
- 新事件行 200ms 渐入（respects prefers-reduced-motion）

### 抽屉 v3
- 蒙层聚焦：打开时背景暗化 + 微模糊（点击蒙层/ESC 关闭）
- 页头层级：大号代号 + 任务中文名 + 彩色状态药丸（随状态变色）+ 模型 chip + session 短码
- 台账 footer 两阶段：运行中 `⟳ N 轮 · M 动作 · ≈X tok · ≈Y tok/s`（实时计数+估算，≈ 标注）；收档后 `⟳ N 轮 · X tok · Y tok/s · $Z`（result 真实数自动替换）
- 已知边界：zhipu 端点流内 usage 全零（61/61 实测），运行中 tok 只能估算；真实数收档后才有

### 实时推送
- `/api/events?wave=` SSE 长连接替代 5s 轮询：2s 心跳走秒 elapsed + batch.json 变化即时推（fs.watchFile）
- 客户端 EventSource + 30s 慢速轮询兜底；页首徽章 `LIVE · SSE`
- Git 动态按**实际仓库路径**去重分组（同仓多任务合并，组名=仓库目录名，徽章=贡献任务代号）——按任务分组时同仓任务会重复展示同一份提交（S01I/BMI/MXU 三重重复教训）

## 2026-10-05 · v3（更名太木 + 品牌锁定 + 生命周期）

### 品牌更名与圆徽收敛（四轮用户反馈驱动的迭代轨迹）
1. 更名「太木控制台」（用户起名，取「太木」二字）
2. 印章字体轮换（楷体→隶书阳刻）→ 用户仍不满意
3. 自绘 SVG 篆印合文（两字共用中竖）→ 用户：「别画你的 svg 了」
4. **收敛终案：主站同款 BrandMark**——深墨圆徽 + `timecraker-mark-v1.svg`（T+断 C+珊瑚裂隙），控制台作为品牌家族产品直接继承主标识
- 教训：**子产品品牌不该另行发明，直接继承母品牌标识**；四轮字体/图形实验的根因是没先看「母品牌长什么样」

### 珊瑚色板对齐
- 印章/强调色从大红 `#D64523` 换为 **`#A8513C`**（主站 globals.css `--signal-solid`，白字 5.4:1 AA）——控制台暖纸底与主站 `--parchment` 同族，色板同源后页面一体感成立
- 状态色（蓝/绿/琥珀/红/灰）是数据语义，不随品牌色变动

### 品牌锁定结构（对齐主站 navbar 同构）
- 三段式：圆徽（44px 深墨圆 + 主站标记 img）→ 字标堆叠（**太木控制台** 22px 粗体 -0.03em / 副行 `TAIMU HIVE · 并行派发` mono）→ meta 徽章列
- **[Wave N] 珊瑚徽章**：`rgba(204,120,92,.13)` 底 + `--accent` 字，动态取 batch.json wave 字段

### 台账 footer 两阶段（估算试验被否）
- 运行中：`⟳ N 轮 · M 动作`（真实事件计数）——zhipu 端点流内 usage 全零（61/61 实测），**tok 估算试验被用户否决：「如果是假的不如没有」**
- 收档后：`⟳ N 轮 · X tok · Y tok/s · $Z`（result 真实数：turns/outTok/costUsd 收档字段）
- 字节数计数已删（无信息量）

### 生命周期管理（logs 是唯一膨胀源）
- 增长实测：logs ~26MB/波，batches ~50KB/波，reports ~300KB/波 → 只需要管 logs
- `app/archive.ps1`：波全终态压缩至 `runs/archive/<wave>-logs.zip` 并删原目录；内置活跃任务守卫（running/queued/pending 存在即拒绝）
- 铁律 #8 入章；用户拍板：当前直接清理（22.1MB→0），归档模式留给想留底的场景

## 2026-10-07 · v4（wave12-17 CPB 三波实战 · 健壮性三件套）

1. **思考看门狗**：GLOBE 两次陷入「27k+ tokens 连续思考、零工具调用」死循环（被迫 kill + fresh 重派）。修法：`tailLog` 解析 `thinking_tokens` 系统事件收获最近思考块 tokens，超 `HIVE_OVERTHINK_TOK`（默认 20000）且 8KB 尾窗零 say/tool 产出 → 状态带 `overthink`，面板 LIVE 列显示「⚠ 深思 Nk · 近窗零产出」。只告警不自动杀——阈值内深思考是 effort=max 正常形态（FORM 16.5k 思考后产出优质），干预归主控。
2. **sessionId 增量落盘**：原只在收档（result 事件）时收获 sessionId——服务重启连带杀会话时 result 永不出现，resume 能力随进程蒸发（wave17 EYE 任务实犯：被迫放弃续派改 fresh）。修法：流式期即从任意带 session_id 的系统事件收获并即时写 batch.json。
3. **孤儿收档自愈**：原自愈只覆盖「日志已有 result 而 batch 仍 running」；新增「进程死亡（pid 探活失败）+ 日志停更超 HIVE_STALE_MINUTES + 无 result」→ `/api/status` 扫描就地收档 `failed`（failReason=`server-restart-orphaned`），batch.json 不再出现永久卡死的 running。


## 2026-11-01 · v5（自包含 Wave 架构升级 · 终结跨目录肢解与平铺污染）

### 历史问题复盘
1. **生命周期割裂**：静态配置/提示词在 `batches/`，过程日志在 `runs/logs/`，验收报告在 `runs/reports/`。一个协作波次的材料横跨两个顶层目录，核查与复盘需来回拼接。
2. **报告平铺命名冲突**：历史报告平铺在 `runs/reports/` 根目录（堆积 110+ 份），导致同名代号（如 QA、FIX、TEST）在跨波复用时会被无情覆盖，被迫在规范中打人工改名补丁。
3. **归档与清理成本高**：清理旧波次时需要在 `batches/`、`runs/logs/`、`runs/reports/` 三处挑拣，难以维持干净的工作区纪律。

### 升级方案：Self-contained Wave（自包含波次单元）
- **目录收敛**：彻底废弃顶层 `batches/` 与 `runs/`，统一收敛为以波次为独立一等公民的 `waves/<wave>/`：
  - `waves/<wave>/batch.json`（任务矩阵定义、状态机、消耗遥测）
  - `waves/<wave>/prompts/<代号>.md`（任务输入提示词）
  - `waves/<wave>/reports/<代号>-report.md`（交付成果与验收自评，波内独立，零命名冲突）
  - `waves/<wave>/logs/<代号>.ndjson`（实时终端流日志，`.gitignore` 忽略）
- **一键自律归档**：波次收口后，运行 `.\app\archive.ps1 -Wave <wave> -Retire` 即可整波压缩存入 `archive/<wave>.zip` 并移出活跃区，工作区永远只保留在研波次。
- **动态路由与容错**：服务与前端全链路支持波次动态发现，无参数访问控制台默认自愈回落至首个有效波次。
