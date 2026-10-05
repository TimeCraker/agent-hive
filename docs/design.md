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
