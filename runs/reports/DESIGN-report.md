# DESIGN-report — 设计稿生成 S4_NON_TEXT 根修 + 真实成功全链（S31-LAYPDF-10 · 31.5.2）

日期：2026-10-13。Spec：[stage-31-remediation.md](../../docs/stages/stage-31-remediation.md) 第 2 项。Commits：`9228e3b`（fix）+ `b92b4fe`（docs）。

## 1. 根因（代码级证据链，三者对上）

**结论先行：不是 AI 幻觉，是校验端把「缺失的可选值」误判为「非法对象值」。**

| 环节 | 证据 |
|---|---|
| 槽位定义 | `packages/design-doc/src/slot-path.ts:42` — phone ∈ basicInfo 合法字段；`skeleton.ts:132` 骨架自带 `<p data-slot="basicInfo.phone" data-optional="true">` |
| prompt 诱导 | `packages/ai-prompts/src/prompts/design.ts:22`（合法槽位清单含 phone）、`:187/:202`（copper-plate/slate 主题规格明确「联系行放 phone」）、`:299`（few-shot 示例直接给出 `<li data-slot="basicInfo.phone">手机</li>`）——AI 绑 phone 是被三处教出来的正确行为 |
| content 现场 | 走查同款简历 `cmv59aebn000luvj87drd0qrr` 的 basicInfo **无 phone 键**（仅 name/email/summary/location/intention 五键，DB 直查确认） |
| 解析分支 | `slot-path.ts:150-153` — resolveSlot 对 basicInfo 恒返回 `{value: undefined}`（永不返回 null），故不触发 S4_UNRESOLVED 而落到 NON_TEXT 检查 |
| 误判点 | `slot-path.ts:191-192` — valueToString 把 **nullish**（合法缺失）与**对象**（非法值）混同返回 null；`validator.ts:150` 判 S4_NON_TEXT error → 不可入库 |
| 渲染端对照 | `binder.ts:190-213` — fillSlots 对空值走 rawMissing 分支按 data-optional 隐藏，**明确不是错误**（校验端与渲染端语义矛盾） |

重试必败机制：前端 3 轮自动重试时 AI 每轮都按 prompt/骨架绑 phone → 每轮都被同一误判拦截 → 0/3。

## 2. 修法（两头修的判定）

- **校验端（根修，`validator.ts`）**：S4_NON_TEXT 只拦「有值（非 nullish）且 valueToString 为 null」——三形态分类对齐 binder：
  1. 缺失可选值（键不存在 / null / 空串）→ **放行**（渲染端 data-optional 隐藏/清空）
  2. 合法文本（string/number/boolean）→ 放行（现状保持）
  3. 非法对象值（对象/数组绑标量槽）→ **照拦**（对象值另有 Zod 层 `z.string().nullable().optional()` 前置拦截，validator 层防线主要针对数组形态）
- **prompt 端：不动**。用户指令条件「若 prompt 诱导了**错误**绑定形态」不成立——绑定形态（文本槽绑文本路径）本身正确，错在校验；收紧为「无值时不绑定」反而与骨架/主题规格三处冲突，扩大不遵循面。

## 3. 验证结果（全部真实链路，非模型声称）

### 3.1 单测（三形态分类，验收 1）

`packages/design-doc` vitest **155/155 全过**（新增 4 用例）：

| 用例 | 断言 |
|---|---|
| phone 键不存在 / null / 空串 ×3 | 0 个 S4_NON_TEXT |
| phone='13800001234' | 0 个 S4_NON_TEXT（合法文本放行） |
| phone={text:'…'}（绕过类型直测防线） | 含 S4_NON_TEXT（照拦） |
| `workExperience:{id}.achievements` 数组无 `.*`/transform 绑标量槽 | 含 S4_NON_TEXT（既有防线不回归） |

touched 文件 eslint 0 error；design-doc `tsc --noEmit` 过；ai-service 为 tsx 直跑 TS 源码，重启 3002 后生效（`start-ai.mjs` 幂等拉起，/health 200）。

### 3.2 真实收敛（验收 2 前半，走查同款简历 = 现场）

走查同款简历（content 无 phone，复杂度 2 工作 + 1 项目 + 1 教育 + 2 技能 + 证书/奖项/自评）经工坊**连续 3 次生成 3/3 成功，0 次 S4_NON_TEXT**（走查基线 0/3）：

| 次 | 结果 | 版本链 | 扣币 |
|---|---|---|---|
| 1 | ✅ toast「设计稿 v1 已生成」 | v1 copper-plate 9634B active | -8（1 笔 DEDUCTION，无返还） |
| 2 | ✅ v2 展示 | v2 copper-plate 9538B active | -8 |
| 3 | ✅ v3 展示 | v3 copper-plate 9650B active | -8 |

### 3.3 成功链六环节（验收 2 后半）

1. **生成** ✅（上表 3 次，编辑器预览渲染真实绑定内容非空壳）
2. **迭代** ✅ — 指令「联系方式一栏排版更紧凑，装饰细节再克制一点」→ design-iterate 200（190s）→ v4 落库 active（-4T designIterate 流水）
3. **换版式** ✅ — 铜板刊头 → 子夜侧栏：v5 `midnight-rail` 落库 active（10241B，-8T）；深墨蓝左栏反白版式渲染正确（runStyleTask 骨架路径同过新校验）
4. **版本选择/恢复** ✅ — 历史 6 版本完整（v1-v3 生成/v4 迭代/v5 生成/v6 回滚）；回滚到 v3 → 落库为 v6 copper-plate active、原版本全保留（符合「回滚免费、原版本仍保留」）；恢复后铜板刊头版式+内容正确
5. **分享** ✅ — visibility=PUBLIC 落库；公开页 `/r/cmv59aebn000luvj87drd0qrr` 完整渲染设计稿（刊头+左栏+主栏）
6. **设计稿 PDF** ✅ — 「实际 PDF · 2 页 · 服务实测未发现文字出界或裁切」；导出件 335.7KB 可打开，**文字层全部关键词可提取**（沈疏桐/栖梧网络/鹤鸣信息/AI 排版引擎/CET-6 等逐命中），版式与预览一致，**无编辑标记**

phone 空槽全链语义一致：编辑器预览/公开页/PDF 联系方式区均只有 email+杭州，**0 空行**（data-optional 隐藏）。

证据截图：`ResumeAIX-stage31-audit/DESIGN/`（01 工坊现场 → 02-04 三次生成成功 → 05 迭代 → 06 换版式 → 07 恢复 → 08 分享弹层 → 09 公开页）+ `design-final.pdf`（文字层验证原件）。

### 3.4 失败容错回归

断网（context offline）点生成 → 错误态「设计稿生成失败」+ **重试**按钮 + **返回当前设计稿（v6）**出口，不白屏；DB 断言：**0 新扣币**（余额 195 不动，断网时请求未出网无扣费）、**0 脏数据**（无半成品 ResumeDesign，最新仍 v6 active）。恢复网络后正常返回。「渠道断开退币」机制代码路径未动（走查 S31-LAYPDF-10 已实测 8 币全额返还，本次未破坏）。

## 4. T-Coin 消耗对账（验收 4）

| 时间序 | feature | amount | balance | 说明 |
|---|---|---|---|---|
| 16:13 | designGenerate | -8 | 223 | 生成 #1 ✅ |
| 16:17 | designGenerate | -8 | 215 | 生成 #2 ✅ |
| 16:20 | designGenerate | -8 | 207 | 生成 #3 ✅ |
| 16:28 | designIterate | -4 | 203 | 迭代 v4 ✅ |
| 16:29 | designGenerate | -8 | 195 | 换版式 v5 ✅ |
| — | （断网失败） | **0** | 195 | 0 扣币 0 返还 |

**合计 36T**（231→195），生成类调用 **5 次 ≤ 6 次预算**；全程 0 返还流水、0 差错笔。E2E 账号 e2e-stage31@resumeaix.test。

## 5. 改动清单

| 文件 | 改动 |
|---|---|
| `packages/design-doc/src/validator.ts` | S4_NON_TEXT 判断加 nullish 豁免（根修，+9/-1 行） |
| `packages/design-doc/src/__tests__/design-doc.test.ts` | 新增「S4_NON_TEXT 三形态分类」describe（4 用例） |
| `docs/stages/stage-31-remediation.md` | 第 2 项状态完成 + 进度 9/11 |
| `docs/stages/stage-31-browser-audit.md` | S31-LAYPDF-10 复核定正 + 已修结论回写 |
| `docs/PLAN_LIST.md` | 31.5.2 勾选、31.5 进度 8/11 |

不动他人改动（interview-helper/next-env.d.ts、scripts/eval-* 保持原样）；不 push；零密钥（渠道经 start-ai.mjs 封装注入，全程未打印 env）。

## 6. 观察项（记录不修，不属本项验收）

- **style-picker 断网错误显示英文原文「Failed to fetch」**：S31-UPLD-02（断网保存中文提示）已修 upload-workspace 的同族问题，style-picker 的错误映射（`/503|Service Unavailable/`→中文）未覆盖网络类错误。反馈存在（错误态+重试+出口），仅文案语言问题。建议归 DESIGN_TODO 或后续小修。
- 设计稿内容少时第 2 页仅剩装饰水印字（「内容约 1.6 页自动排成两页」的既有表现），非本次引入。
