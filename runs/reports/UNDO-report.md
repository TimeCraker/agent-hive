# UNDO 任务报告 — S31-EDIT-04 + S31-LAYPDF-02 修复与回归

日期：2026-10-13。仓库 ResumeAIX（main），五个 commit 全部落库未 push。五服务全绿（PG 5434 / Redis 6380 / Web 3100 / ai 3002 / export 3003；ai-service 中途假死一次，按 runbook 重启恢复）。

## 交付摘要

| 缺陷 | 结论 | Commit |
|---|---|---|
| S31-EDIT-04 富文本撤销/重做双栈冲突 | ✅ 已修 + 六场景回归全过 | `ef67700`（主修）+ `11c8b98`（撤销栈同内容去重）+ `5f33988`（撤销回初始值 remount 修复） |
| S31-LAYPDF-02 版本对比无 id 条目假差异 | ✅ 已修 + 单测 14 断言 + 页面实测 | `eb6e4a0` |
| 台账 / Spec / PLAN_LIST 登记 | ✅ | `b61989f` |

## S31-EDIT-04 修法（单一撤销权威）

三处交互逐一处理（对应 Spec 要求的快捷键监听 / 历史结构 / setContent 三点）：

1. **快捷键监听**：`useUndoRedo` window 监听在 `e.target.isContentEditable` 时让位，富文本内 Ctrl+Z/Shift+Z 由 Tiptap 内部栈单一负责；新增 `globalUndoBridge` 扩展，编辑器栈耗尽时回落全局栈（UndoRedo 扩展先响应、栈空才轮到 bridge，一次按键只有一套历史生效）。
2. **外部内容同步**：废弃 `setContent`（实测确认其事务会记入 Tiptap history——重做被旧快照覆盖的根因），改为**重建编辑器实例**（React key epoch），内部撤销栈随实例清空；自身输入回流（value === getHTML()）不触发。
3. **历史结构**：富文本字段 onChange 的全局历史推送按「输入阵粒度」合并（同字段 1s 窗口内改写栈顶，`lastCoalesce` 元数据）；同内容快照不入栈（消除撤销空步）；普通字段逐字历史不变（既有观察项不扩scope）。

保留项全部未破坏：顶栏撤销/重做按钮（store 纯路径）、非富文本字段撤回、自动保存服务器跟随客户端终态、wave27 的大小写快捷键修复。

### 六场景回归证据（真实浏览器，构建 BUILD_ID m_P7fziry0NiOZn30wcWp 之后的最终构建）

| 场景 | 结果 | 证据 |
|---|---|---|
| 连续输入 + 格式 + 列表（加粗→输入→列表三步） | Ctrl+Z×3 逐步复原（列表→粗体→原文），0 跳变 0 丢字；重做×3 精确回终态 | s1/s2 截图 + DOM 断言序列 |
| 自动保存 | 全程 13 笔 PATCH 全 200；API 读回与编辑器终态**逐字节一致** | network 列表 + evaluate fetch match:true |
| 跨字段编辑（富文本↔普通字段） | Ctrl+Z 在公司输入框先撤公司最后一步、再撤富文本一步，无空步、DOM 同步（含回退到初始值的 remount 场景） | 第 5 轮实测断言 |
| AI 采纳后撤销 | 润色专项工具（ai-service 3002 真实链路）生成建议→采纳落库→一次 Ctrl+Z 整体回退采纳、redo 可回；DOM 与服务器同步 | API 读回前后对照 |
| 顶栏按钮 | store undo/redo 点击各回退/恢复一步，按钮 disabled 状态随栈位联动 | DOM 断言 |
| 大写 Z 形态 | keylog 捕获 `key:"Z", shift:true` 重做成功（EDIT-02 回归不破） | keylog 记录 |

过程中发现并追加修复两个次生问题（各自独立 commit）：

- **撤销空步**：旧 pushHistory 不做同内容去重，受控回填产生重复快照，一次按键「无反应」。修：入栈前与栈顶内容比对，相同跳过（`11c8b98`）。
- **DOM 不跟随**：外部值替换 guard 以首挂载值为初值，撤销回退到与初始值相同的内容时被误判跳过重建。修：改记「已触发重建的外部值」（初值 null），同一份外部值只重建一次（防 parse→serialize 字符串差异循环），任何新外部值必重建（`5f33988`）。

已知固有行为（非缺陷，台账备注）：PM 撤销删除焦点所在节点时浏览器焦点落到 BODY，后续按键自动落全局栈路径——两栈语义都是「一次按键退一步」，可预期。

## S31-LAYPDF-02 修法（三段式配对）

旧实现 fallback 键追加 `_L`/`_R` 侧别后缀导致左右键永不相等。新 diffArray 配对：

1. 有 id 条目按 id 配对（有 id 章节的修改/新增/删除判定不变）；
2. 无 id 条目先按**内容指纹**（title/subtitle/detail，与渲染口径一致）做多重度配平——同内容跨顺序配对、重复条目按份数配对；
3. 两侧剩余无 id 条目按顺序两两配对为「修改」，单侧落单报「删除/新增」。

展示键保留侧别后缀（仅保证 React key 同侧唯一，配对不再经过它）——直接去掉后缀会让同侧重复 fallback 键互相覆盖、增删条目展示键冲突。

### 验证

- **单元**（tsx 临时脚本，跑完即删，无新增依赖）：14 断言全 PASS——自比/副本零差异（含全简历 hasChange 全 false）、改一个技能名恰 1 条 changed、增删一组各 1 条、重排 0 差异、重复分类交叉重排 0 差异/改一条恰 1 条 changed、undefined≈[] 等价、有 id 三类标记正确。
- **页面**：创建副本（V3，与 V2 逐键一致）→ versions 页默认对比 V2↔V3 显示「**两个版本内容完全一致**」0 处差异（走查时 6 处→0）；V1↔V2 真实差异如实报告（技能 1 处=被删组 + 工作经历/项目经历真实差异）。证据 s4/s5 截图。

## 口径说明

- **AI 采纳场景链路**：Vibe 工坊渠道 503（`POST /api/resumes/[id]/vibe-chat`）是 S31-AIFLOW-01 已知渠道问题（归 VIBE 任务），本任务改走**润色专项工具**（ai-service 3002 真实模型链路，2 T-Coin 实扣）完成「AI 采纳→撤销」验证。applyAIContent 代码路径与 Vibe 采纳一致。
- 测试数据：复用【E2E】EDIT-n2（desc 残留「UNDO测试A」痕迹标记）与【E2E】LAYPDF-版式多页系列；为验证创建的 V3 副本已删除（API 404 确认），公司名等中间态已清理还原。未动真实用户资料与他人工作区文件（interview-helper/next-env.d.ts、scripts/eval-* 保持原样）。
- 不 push 不部署；`pnpm --filter @resumeaix/web type-check` 全绿，lint 由 lint-staged（eslint+prettier）逐 commit 通过。

## 验收标准对照

1. ✅ 六撤销场景终态可预期（每场景截图+DOM/API 断言，见上表）
2. ✅ 版本对比五验证全过（自比/副本/增删改/重排/重复分类），零差异有硬断言（单测 + 页面双确认）
3. ✅ 两个独立 fix commit（实为 4 个 fix + 1 个 docs，次生修复独立成 commit 不混提交）+ rebuild 回归；lint/type-check 过；台账与 Spec 已更新
4. ✅ 报告落盘本文件

## 遗留与移交

- 无本任务范围内的遗留项。台账两行已更新为「已修」，供 VFINAL 统一回归复测。
- 提醒 VIBE 任务：/vibe 与编辑器 Vibe 工坊的渠道 503/500 仍待 S31-AIFLOW-01 修复。
