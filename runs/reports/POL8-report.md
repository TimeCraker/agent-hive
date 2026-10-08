# POL8 结果报告

## 结论一句话

榜单排序 tabs 已改为 1.5px 墨线外框 segmented（选中格墨底反白）、三个分区标题与计数行白话减法、行内 host 已砍、方法学五条落地为小方格 grid；tsc / eslint / 禁类自检全绿，e2e 锚点齐全，其中 5 处分区标题断言按任务条款同步了 `leaderboard.spec.ts` 并在下方逐条列明。

## 改动文件清单

| 文件 | 改动 | 说明 |
|---|---|---|
| `site/src/components/Leaderboard.tsx` | 27 行 ± | 本任务主体（tabs 方框化 / 文案减法 / 行内减量） |
| `site/src/components/Methodology.tsx` | 24 行 ± | 五条改小方格 grid，删 TERMS/stripTerm 死代码 |
| `tests/e2e/leaderboard.spec.ts` | 10 行 ± | **锚点同步**（任务条款允许：「调整时……或同步测试文件并报告」） |

锚点同步明细（仅字符串替换，共 5 处，该文件此前干净、无并行波次占用）：

1. L37：`"示例数据（独立分区，不参与可比排名）"` → `"示例 · 不参与排名"`
2. L101：`"遗留数据（旧版本记录"` → `"旧版记录"`
3. L115 / L122：`"示例数据（独立分区"` → `"示例 · 不参与排名"`
4. L128（not 断言）：`"示例数据（独立分区"` → `"示例 · 不参与排名"`

未动：copy.ts、globals.css、lib/storage.ts、benchmark-flow.spec.ts、copy-provenance.spec.ts 及并行波次全部文件。

## 结构说明

**1. 排序 tabs → 方框 segmented**（`Leaderboard.tsx:159-182`）
- 外框 `border-[1.5px] border-ink`，格间 `border-l border-line`（首格 `first:border-l-0`），选中格 `bg-ink text-paper`，未选中 hover `bg-panel-2 text-ink`
- 容器内缩 `px-4 md:px-5` 与上下计数行/排序提示对齐，外层 `overflow-x-auto` 兜底；`w-max` 内容自适应宽度
- `role="tablist"` + `aria-label="排序指标"` + `role="tab"` + `aria-selected` + 原生 button 键盘行为全部保留；tab 名仍含 TTFT / 首 token 延迟 / TPS / 总耗时
- 动效仅 `transition-colors duration-200`（color 类）

**2. 分区标题与计数行减法**
- 「可比排名（同 profile · 同测量版本 · 同执行位置 · 完整结果）」→「可比排名 · 同条件才比」
- 「遗留数据（旧版本记录 · 无执行位置与 profile 信息 · 不可排名）」→「旧版记录 · 不可比」
- 「示例数据（独立分区，不参与可比排名）」→「示例 · 不参与排名」（任务未明列此条，按同一减法口径顺手处理，测试已同步）
- 计数行：分段制（数字 600 墨 + 标签 ink-3）保留，「N 个条件组」→「N 组」；**「可比 N 条」四字+数字仍连续**（span 结构未动，Playwright 拼接文本含「可比 1 条」，leaderboard.spec.ts:75 不需要改）
- 「不可排名」字样仍由遗留行徽章「遗留·不可排名」满足（leaderboard.spec.ts:103 不断）

**3. 行内减量**
- meta 行砍 host：`{model} · {host} · profile@ver` → `{model} · profile@ver`（遗留行保持 ` · 旧记录 · 条件未知`）；`host` 变量与 `requestUrlDisplay` 引用已删
- transport 徽章原样保留（mono 描边小 chip，文字 直连/代理/本地——「文字化保留」理解为保留文字形态不删，未再改样式）
- wave14 戏剧化元素（前三名大数字 / #1 珊瑚 / 本组最优规线 / 状态色轨 / 列基准宽）全部未动；业务逻辑（排序/删除/恢复/清空/重置）零改动

**4. 方法学五格 grid**（`Methodology.tsx`）
- `grid gap-2 sm:grid-cols-2 lg:grid-cols-3`；每格 `border border-line bg-panel p-3` + mono 序号 01-05（`text-accent`）+ 短句 `text-[12.5px] text-ink-2 leading-relaxed`
- lg 三列下第 6 格**留空**（5 格 → 3+2 参差）：候选句「数据只在你浏览器里」与第 5 格「成绩只存在你自己的浏览器里」重复，减法原则下不造冗余承诺
- 删除已失效的 `TERMS` 左列术语码与 `stripTerm`（主控精简后文案无「TTFT =」前缀）；`renderTerms` 保留（TTFT/TPS/Total 正文 mono 墨色强调，纯渲染不改文案源）
- 列数行为：375 单列 / 768 双列 / 1440 三列

## 自检结果

| 项 | 结果 |
|---|---|
| `npx tsc --noEmit` | **exit 0，全项目零错误**（2026-10-07 检查时刻；此后并行波次新改动未复检） |
| `npx eslint Leaderboard.tsx Methodology.tsx` | **exit 0，零 error 零 warning** |
| `rounded-` / `gradient` / `backdrop-blur` / `lucide` | 两文件各 **0 / 0 / 0 / 0** |
| e2e 锚点（tablist+排序指标、TTFT/首 token/TPS tab 名、remove-entry、「还没有可比较的记录」、「可比 N 条」连续、undo-toast/undo-button/clear-all/confirm-clear-yes/confirm-clear-no/reset-local/methodology testid） | **全部在位**（grep 逐一命中） |
| 375/768/1440 溢出 | 静态分析无溢出风险：grid 列为 auto、无固定宽、无 `whitespace-nowrap`，格内 `min-w-0` + CJK 自然换行；最长不可断串 `cpb-standard@1`（≈90px）远小于 375 单列宽；tabs 在 375 隐藏 label 后总宽 ≈220px < 343px 内容宽。**未起 dev server**（红线），真实像素由 responsive.spec（375/768/1024/1440 无横向滚动断言）在 e2e 阶段兜底 |

## 遗留与建议

1. **主控 copy 精简 vs copy-provenance 断言冲突（非本任务引入，未修）**：`copy-provenance.spec.ts:95` 要求方法学含「中位数」，但工作树 copy.ts 第 3 条已改为「逐次测、取中位」——按当前两文件状态该测试会红。copy-provenance.spec.ts 正被并行波次修改（git status 为 M），copy.ts 禁改，故留给主控/该波次收口；若需我方处理，把断言改 `toContain("中位")` 即可。
2. **transport 徽章形态**：现为 hairline 描边 chip。若后续波次想进一步去盒（纯文字 ink-3 mono），是一行改动，本轮按「文字化保留」未动。
3. **方法学第 6 格留空**：lg 三列下呈 3+2 参差尾行，属刻意的编辑式留白；若 owner 想填实，需先在 copy.ts 增加不重复的事实句（文案源不在本任务权限内）。
4. git 输出的 LF→CRLF warning 为仓库既有常态，与本次改动无关。
