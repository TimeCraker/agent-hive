# EDIT 编辑器深度走查报告（Stage 31 · 清单第 4 项）

- **执行**：EDIT 走查任务（独占 Playwright 浏览器）
- **仓库**：`C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`（分支 main）
- **走查时间**：2026-10-12 14:14–17:12（旧库主链）· 18:55–19:15（PGFIX 新库补测+回归）
- **开工**：HEAD `368390c`，Web BUILD_ID `fiIliIi1Ih466KgpySJP3`（五服务全绿，Redis 6380 PONG，AI 3002 / Export 3003 存活）
- **收工**：HEAD `7cd5933`，重建后 BUILD_ID `hsD9tOD4bU_YUeTmLODyQ`（type-check 零错误、build 成功、3100 重启探活 200）
- **PGFIX 断点**：17:12–18:35 旧隔离 PG 死亡不可恢复；18:42 全新重建（commit `92a763a`）。旧库证据简历（【E2E】EDIT-design `cmv51hzer…` / EDIT-legacy `cmv52qtbo…`）丢失，其上结论与截图在案不受影响；新库重建【E2E】EDIT-n2（`cmv550yb1000kuvmox8fpq251` + 副本 `cmv552cl3000muvmo8wgiwqaq`）完成剩余补测与回归。E2E 账号重注册（同邮箱同密码，余额 200）。

## 一、逐项结果（handoff 第 4 项 1–9：9/9 过，0 未测）

| # | 项目 | 结论 | 关键证据 |
|---|------|------|----------|
| 1 | 三态切换（基础↔AI↔预览） | ✅ 通过 | 互切内容零丢失（教育 2 段+章节顺序跨切换保持）；AI 编辑态 Vibe 四模式（对话/计划/工坊/Agent）+ 专项工具四入口（评分 2T/润色 2T/策略 3T/JD 匹配 2T）界面正常，按红线零 AI 调用；预览态编辑面板收起 |
| 2 | 自由/引导制作 | ✅ 通过 | 首访默认引导；引导 01→02→03→04 前进/返回/侧栏直达全通；**引导可返回**（见二） |
| 3 | 结构操作（拖拽/排序/展开/富文本/增删） | ✅ 通过 | 章节拖拽键盘 dnd（技能 05→02，drop 确认，sectionOrder 落库刷新持久）；条目排序（教育 2→1，刷新持久）；两级展开字段完整；富文本 Enter/加粗（键盘+按钮）/列表/内部 undo/redo；增删通过 |
| 4 | 自动保存 | ✅ 通过 | 2 秒防抖 PATCH 全 200（全程约 20 次零失败）；dirty 态「有未保存的更改」指示；beforeunload 拦截在案 |
| 5 | 撤销重做 | ✅ 通过（富文本多步语义交回） | Ctrl+Z 恢复条目删除、重做生效；跨保存点语义见二；富文本多步撤销双栈问题=S31-EDIT-04 交回 |
| 6 | 侧栏缩放 | ✅ 通过 | 放大 82% / 适宽 100% / 适应 72% 四档+按钮态，排版不破（截图目检） |
| 7 | 建议采纳/忽略/撤回语义 | ✅ 通过（四断言全过） | 手工构造存档建议经 workflow PATCH 注入（零 AI 调用），语义见二 |
| 8 | 视口与键盘 | ✅ 通过 | 390 零横向溢出（scrollWidth 390）、侧栏收纳底部 tab、工具条可达；Esc 关分享弹层焦点归还触发按钮且不连带收起编辑面板；Tab 序顺 DOM 流；富文本 Enter 不误提交 |
| 9 | 缺陷修复+回归 | ✅ 完成 | 3 commit + rebuild + 同条件回归全过（见四） |

版本对比页（#14）✅：单版本空态提示 + 两版本 diff（修改/新增/删除标记、双下拉默认选中最近两版，版本链经「创建副本」产生 V2）。

legacy 线 ✅：UI 无 legacy 创建路径（`POST /api/resumes` 固定 design），经 DB 置 legacy fixture 后测试并如实记录——外观抽屉 12 模板/22 主题色/字体/字号/边距控件齐全，赤陶主题色预览联动+辅助色自动生成+切回恢复。

## 二、关键语义断言结论

1. **引导可返回**：✅ 双段验证——步骤 02「← 返回核对内容」后姓名/勾选态保持；引导→自由→再回引导内容保持。
2. **未采纳建议不写入**：✅ 忽略/未采纳建议经保存与刷新，API 读回 `content.location=杭州`、`summary=原文`，三条建议以 pending 持久于 workflow.reviewDraft。
3. **冲突不覆盖新内容**：✅ 建议 before 与现值不一致时应用 →「原文已变化或事实未确认。请重新核对标记的建议；本次没有应用任何修改」零写入，建议重置 pending。
4. **已应用修改可撤回**：✅ 应用后 header 出现「撤回已应用修改」，撤回后原文恢复（预览右栏同步）。
5. **撤销跨保存点语义**：撤销/重做均置 dirty → 2 秒防抖 PATCH，服务器永远跟随客户端最终态（PATCH #184 删除版 / #190 恢复版实测），无「撤销越保存点被弹回」问题。

## 三、缺陷台账摘要（详见 stage-31-browser-audit.md 台账总表）

| 编号 | 定性 | 根因 | 提交 | 回归 |
|------|------|------|------|------|
| S31-EDIT-01 | 复核定级：信息（非缺陷） | 原判「工具栏吞字」实为选区存在时按 Enter 的标准替换语义（可撤销）；`be53b9f` mousedown preventDefault 为选区保持改进，保留 | `be53b9f` | ✅ 重放序列焦点保持编辑器内 |
| S31-EDIT-02 | 已修：中 | 撤销重做快捷键 `e.key==='z'` 在真实键盘 Shift 修饰（上报大写 Z）下永不命中 | `153ef60` | ✅ toLowerCase 冒烟+静态确认 |
| S31-EDIT-03 | 已修：低 | 版本 diff 直出富文本 HTML 字面 | `48890e2` | ✅ diff 单元格纯文本、`<p>` 零匹配 |
| S31-EDIT-04 | **交回主会话**：中 | window useUndoRedo 与 Tiptap history 双栈同响应 Ctrl+Z/重做，onChange pushHistory 交叉污染，多步场景终态不可预期（属「内容合并/撤回逻辑」红线类，只取证） | — | 不修 |

低危观察（不修，已登记）：条目级删除无确认弹层（依赖撤销兜底，与简历级删除有确认不一致）；章节排序不入全局撤销栈（条目排序可撤销，行为不一致）；design 线风格工坊预览槽位顺序由模板决定不随章节拖拽；全局撤销栈以 onChange 逐字符为粒度（50 步上限被富文本输入快速刷满）；design 无稿 404 console 噪音（同 S31-PUB-02）。

## 四、验证命令与结果

```
pnpm --filter @resumeaix/web type-check   → tsc --noEmit 零错误
pnpm --filter @resumeaix/web build        → 成功，BUILD_ID hsD9tOD4bU_YUeTmLODyQ
status-all.mjs                            → PG/Redis/Web/AI/Export 五项 OK
git log --oneline -5（收工）              → 7cd5933 / 48890e2 / 153ef60 / be53b9f / 92a763a
```

## 五、截图（全部读图目检）

目录 `C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/EDIT/`：

1. `edit-design-firstvisit-1440-01.png` — 首访默认引导台（1440）
2. `edit-guided-step02-1440-01.png` — 引导步骤 02 优化表达
3. `edit-free-basic-1440-01.png` — 自由编辑三态+内容工坊+风格工坊
4. `edit-richtext-loss-1440-01.png` — S31-EDIT-01 吞字序列复现现场
5. `edit-legacy-preview-zoom-1440-01.png` — legacy 外观抽屉+缩放 72%
6. `edit-legacy-accent-terracotta-1440-01.png` — 赤陶主题色预览联动（含 dirty 指示）
7. `edit-editor-390-01.png` — 390 视口编辑器（零横向溢出）

## 六、自评与遗留

- **已测口径**：本地通过、生产未测（按红线不连生产）；真实 AI 调用未发起（建议语义用存档注入验证，入口存在性已确认，真实链路归 AIFLOW）；真实实体键盘未实测（Playwright 事件模型 e.key 恒小写，S31-EDIT-02 按静态确认+冒烟定性）。
- **遗留交回**：S31-EDIT-04 双栈抢占（中，撤回逻辑红线类）——建议方向：富文本聚焦时抑制 window 层 useUndoRedo，或全局栈在富文本场景降级为段粒度。
- **测试资料保留**：新库简历【E2E】EDIT-n2 及其副本保留供核对；UPLD materials 未动；独占文件（五个基础表单、content-section-draft.ts 等）零改动。
- **工作区纪律**：他人改动（interview-helper/next-env.d.ts、scripts/eval-*）未触碰；repo 根临时截图已哈希比对后清理；未 push 未部署。
