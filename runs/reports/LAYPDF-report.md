# LAYPDF 走查报告：版式历史 + 投递检查/分享/PDF（清单第 6+7 项）

- **任务时间**：2026-10-12 20:45–21:40
- **仓库**：`C:\Users\TimeCraker\Desktop\my_workspace\ResumeAIX`（分支 main）
- **开工 HEAD**：`c4051d4`（Web BUILD_ID `hsD9tOD4bU_YUeTmLODyQ`）→ **收工 HEAD**：`0308093`（2 修复 commit 重建后 Web BUILD_ID `DsduBMp2C7jTHGbLt_FCG`）
- **服务**：开工时 3002/3003 被沙箱收割（runbook 已知偶发），按 runbook WMI/CIM 方式拉起恢复；期间 3002/3003 各再死一次均同法恢复；PG(5434)/Redis(6380) 全程健康；收工时五项全绿
- **测试账号**：`e2e-stage31@resumeaix.test`（E2E 专用，余额全程 183 T-Coin：设计稿 8 币扣后全额返还，净零消耗）
- **走查台账**：`docs/stages/stage-31-browser-audit.md` LAYPDF 分区 + 缺陷台账 S31-LAYPDF-01~10（commit `0308093`）

## 一、版式与历史（handoff 第 6 项）

### 1.1 legacy 模板与外观抽屉

- **模板数量核对**：外观抽屉实况 **12 套模板**（经典/现代双栏/极简/创意/高管/杂志/极客/金融/学术/密集/雅致/侧边栏），与 `registry.ts` 运行时注册的 12 个 id（academic/classic/compact/creative/editorial/elegant/executive/finance/minimal/modern/sidebar/tech）一一对应 ✅
- 配套控件齐全：**22 主题色**（经典蓝…莫兰迪紫）、12 种字体（含 Google Fonts 按需加载）、3 档页边距（紧凑/标准/宽松）、模块间距、AI 智能外观（1 币）；「经典✓」选中态与 DB `_appearance.templateId='classic'` 一致 ✅

### 1.2 模板三轮切换（换版式语义核心断言）

- 切换序列：**经典 → 现代双栏 → 极客 → 经典**，每轮验证：
  - 按钮获得 ✓ 选中态（联动正常）✅
  - 自动保存链路：「保存中 → 刚刚保存」2 秒防抖 PATCH 落库 ✅
  - 预览内容完整性：14 个内容键（姓名/6 段工作/3 项目/2 教育/技能组等）跨三次切换零丢失 ✅
  - 切回「经典」后 DB 终值 `templateId=classic` 落库正确，**切换可逆** ✅
- **岗位字段保留**：`basicInfo.intention='高级前端工程师'` + `targetJD`（74 字）逐字保留（DB 断言）✅

### 1.3 design 风格工坊与标价

- 工坊实况：**16 主题卡**（「推荐」筛选 8 张★ / 「全部」16 张：铜板刊头/通顶侧栏/杂志编辑风/极简留白/学院蓝谱/子夜侧栏/横幅刊头/青瓷科技/暖沙人文/石墨单色/窄边工程栏/对开切色/绛紫模块/居中刊头/双栏对等/橄榄时间线），与首页「16 版式主题库」文案一致 ✅
- 标价与上限文案实况在位：「预览用你的真实数据 · **8 T 币 / 次**」「不达标自动重试（**最多 3 轮不另扣币**）· 失败按实际扣币返还积分」「保存风格 **0/8**」（与 UserStylePreset 每用户 8 个上限注释一致）✅
- 四步结构（01 版式结构/02 配色/03 微调提示/04 版面微调）+ 分栏/页数选择器完整 ✅

### 1.4 副本版本链（创建副本 = 新版本）

- 5 份上限触顶状态下实测「创建副本」：确认弹层「创建副本将以『(副本)』后缀克隆此简历与其设计稿」→ 确认 → toast「已创建副本」，卡片数 5→6
- **版本语义 DB 断言**：副本 `version=源+1`（v1→v2）、`parentId=源 id`、`pipeline='legacy'` 继承、status 重置 DRAFT ✅（该路径绕过存储上限的缺陷另记台账 S31-LAYPDF-01）
- 设计稿克隆逻辑（route 内 active design 复制为副本 v1）在案，因源无稿未实测

### 1.5 v1/v2 版本对比（versions 页）

- 双下拉选择器：默认选中最近两版、切换重算 ✅；390px 视口下拉 311px 全宽不裁切、页面 scrollWidth=clientWidth=385 零横向溢出 ✅
- **v1（完整态 6 工作/3 项目）vs v2（删减态 1 工作/2 项目）diff**：
  - 工作经历 5 处「删除」判定全部正确（青梧云/白泽数据/未来职位/白鹭智库/空日期条目）✅
  - 项目经历「修改/删除」判定正确（有 id 条目判定可靠）✅
  - 技能章节报「新增/删除」假阳性——**同内容报差异、同版本自比也报**，交回 S31-LAYPDF-02（根因见台账）
- diff 差异数与操作历史对账一致（删减操作 → diff 恰好反映）✅

### 1.6 legacy「历史」与恢复语义（如实登记）

- 编辑器侧栏「历史」tab = CONTENT HISTORY 入口面板（「选择两个内容版本，查看新增、修改与删除的经历」+「打开版本对比」按钮跳 `/resume/[id]/versions`）
- **legacy 内容版本无「恢复」按钮/语义**：全编辑器组件 grep「恢复/还原/revert/restore」仅命中 Vibe Agent 撤销（另一功能）；恢复语义仅存在于 design 线设计稿回滚（DesignPanel「回滚到此版本(免费)」，因无稿未实测）。**如实登记：legacy 版本链为对比用途，不提供恢复**
- 版本创建入口：dashboard「创建副本」（UI 确认层 + `POST /api/resumes/[id]/version`）；编辑器内无「另存为新版本」入口（versions 页原空态文案指向不存在的入口，已修，见台账 S31-LAYPDF-03）

### 1.7 数量与上限说明核对

- dashboard「**5 份职业档案**」与实际 5 份（副本前）一致 ✅；卡片版本徽章 V1/V2 与 DB `version` 一致 ✅
- 工坊「保存风格 0/8」= UserStylePreset 上限 8（API 层校验）✅；上传 5 份上限行为已在 UPLD 分区登记（403 + 错误面板）
- legacy 升级 design 入口存在性：dashboard legacy 简历卡「**升级 AI 设计稿**」按钮在位 ✅（Stage 20 入口，未点击执行升级——保持资产状态）

## 二、设计稿生成（单次真实 AI 调用，真实失败路径）

- **调用**：工坊选「铜板刊头」（旗舰主题）→ 点「生成设计稿（铜板刊头）· 约 1-4 分钟」→ 扣 8 T-Coin（流水 DEDUCTION -8，13:14:09）
- **失败详情**：SSE 流推送 3 轮自动重试全部失败，终态错误码 **`[S4_NON_TEXT]` 槽位 "basicInfo.phone" 绑定到非文本值，需配 data-transform**——AI 生成 HTML 时把 `basicInfo.phone` 槽位绑定到非文本值（我的合成资料无 phone 字段，属 AI 幻觉绑定），渲染校验器拦截
- **退币四对齐** ✅：
  1. UI 失败面板：「设计稿生成失败…（已尝试 3 次…）；本次 T-Coin 积分已返还」+「重试」按钮
  2. 流水：REFUND +8（13:14:34，25 秒后到账），余额 183 净不变
  3. ai-service 日志：`/api/ai/design-generate` 恰好 3 次 incoming request（与「已尝试 3 次」一致）
  4. DB：`ResumeDesign` 未落库（append-only 版本链未被失败污染，count=0）
- **单次原则**：「重试」按钮未再点（避免第二次扣币风险；失败反馈+退币正确性本身已构成该次调用的有效验收）
- **定性交回（S31-LAYPDF-10）**：属设计稿生成契约/收敛率问题（DESIGN_TODO F1 收敛率观察同类），非 UI 缺陷
- **成功路径子项全部未测**：设计稿版本链 append、回滚、换版式重新生成、设计稿分享页 iframe 渲染、design 单页 PDF、422 页数守卫（PAGE_OVERFLOW toast + 去删减按钮）——原因=生成失败 + 单次原则不重试，交回主会话

## 三、分享三态（handoff 第 7 项，仅本地合成资料）

| 态 | 操作 | 结果 | 证据 |
| --- | --- | --- | --- |
| 私有（基线） | `curl` 无凭证 GET `/r/cmv59aeab000juvj8xtvrkxv8` | **404**，不可见内容 | 弹层声明「仅自己可见，链接访问返回 404」与实测一致 |
| 公开 | 编辑器顶栏分享按钮 → 点「私有」切换为「已公开」，链接生成 | `curl` → **200**；新标签打开渲染断言 **7 键全 HIT**（姓名/6 段工作/未来日期条目/空日期条目/页脚「由 ResumeAIX 呈现」）——渲染的是**已保存内容**（非编辑中草稿；v1 当时无未保存修改） | `share-dialog-public-1440-03.png`、`share-public-page-1440-04.png` |
| 已关闭 | 弹层点「已公开」切回「私有」 | `curl` 复归 **404** + DB `visibility=PRIVATE` 终态复验 | `share-dialog-private-again-1440-05.png` |

- **分享终态：已关闭（PRIVATE）** ✅（红线要求：结束保留或关闭并报告实际操作——实际操作为关闭）
- 补充：分享页 design 线渲染 isActive 设计稿 iframe、legacy 线渲染 `ResumeHTMLPreview`（interactive=false）——本次验证 legacy 路径；design iframe 路径因无稿未测（随设计稿成功路径交回）
- 未登录访问以 curl 无凭证等价验证（SSR 层 `visibility !== 'PUBLIC'` → notFound，与登录态无关）

## 四、PDF 导出（export-service 3003）

### 4.1 导出链路

- 入口：编辑器顶栏「PDF / 投递检查」→ 引导第四步「排版与导出 / RESUME DESK」投递检查清单 →「生成实际 PDF 预览」→ POST `/api/export/pdf`（Puppeteer 渲染）→「下载这份 PDF」（blob 下载，文件名=简历标题）

### 4.2 多页导出（legacy v1：6 工作/3 项目/2 教育/技能 3 组/证书 2/奖项 2）

- 状态渲染「**实际 PDF · 2 页**」+「服务实测未发现文字出界或裁切；仍需核对正文完整性」
- 响应头硬证据：`x-resume-pages: 2`、**`x-resume-crop-status: passed`**、`x-resume-crop-details: []`（URL 编码空数组）——服务端逐页出界/裁切自检通过
- export-service 日志：POST /api/export/pdf 200，渲染耗时 2.9s
- **零分页裁切问题登记**：pdfjs 渲染图目检 page1/page2，两页断点均落在条目之间（page1 末尾「空日期实验条目」完整结束），无元素跨界裁切、无文字截断

### 4.3 单页导出（v2 副本删减后：1 工作/2 项目/紧凑页边距）

- 经编辑器真实 UI 删减（工作 6→1、项目 3→2、技能 3→2 组、自评清空、页边距切紧凑——顺带二次验证外观切换与自动保存）后导出
- 状态渲染「**实际 PDF · 1 页**」+ 下载成功 ✅（单页+多页各一次达成）

### 4.4 文字层可复制性（pdfjs 验证）

- **2 页 PDF**：pdfjs `getTextContent` 提取，15/16 中文键 HIT（陆知远/玄鸟智研/青梧云/白泽数据/未来职位/白鹭智库/空日期实验条目/沪上理工/三个项目名/高级前端工程师/TypeScript 等）；3 个 MISS（系统架构设计师/数学建模/自我评价标题）为证书/奖项章节未渲染所致，与 DOM 预览断言完全一致——是渲染层章节缺失（台账 S31-LAYPDF-05），非 PDF 文字层问题
- **1 页 PDF**：numpages=1、515 字符、核心键全 HIT
- 早期 pdftotext（Git Bash 老 poppler）中文乱码为工具 CMap 局限，经 pdf.js 内核复核排除

### 4.5 无编辑标记

- 两份 PDF 渲染图目检：无建议高亮、无 AI 标记、无草稿水印 ✅
- 实现侧一致：模板 `render(content, appearance)` 只吃内容与外观，AI 建议不进渲染输入；模板层 grep「水印/watermark/DRAFT/草稿」零命中；「未采纳的 AI 建议不会写入 PDF」为投递检查清单明示语义

### 4.6 真实失败态（export-service 死亡窗口）

- 3003 被收割窗口内点击导出：POST `/api/export/pdf` → **503** → toast「**导出服务不可用**」、状态停留「尚未生成实际 PDF」，不假装成功 ✅；按 runbook CIM 恢复后重试导出成功（同一按钮全链闭环）

### 4.7 投递检查（同页清单，无独立路由）

- 保存态三态实测：进入显「有未保存的更改 · 最近保存：21:03:48」→ 点「重试保存」→「当前内容已保存」✅
- 日期检查双向对照：legacy 简历「**1 条日期需要检查**」（我清空的空 endDate 非在职条目被实时检出，附「核对 空日期实验条目」定位按钮）；design 简历「日期格式与顺序已检查」✅
- 日期检查规则（`resumeDateIssues`）=格式解析失败/非在职空区间/开始晚于结束三类；**未来日期（2027）不在检测范围**（规则不查时间合理性，观察 S31-LAYPDF-06）
- 章节核对口径「0 / 8 有内容章节已核对」（含证书/奖项的 8 章节口径，与编辑器 6 节的断层见 S31-LAYPDF-05）

## 五、缺陷台账（10 项，完整版见 stage-31-browser-audit.md）

### 已修（2，commit + rebuild + 回归通过）

| 编号 | 缺陷 | 修复 commit | 回归 |
| --- | --- | --- | --- |
| S31-LAYPDF-03（低，文案误导） | versions 空态文案「在编辑器里『另存为新版本』后再来对比」——编辑器无此入口，实际入口为简历列表「创建副本」 | `836b434` 改为「在简历列表「创建副本」后再来对比」 | ✅ 重建后截图 `versions-empty-fixed-1440-06.png` 目检确认 |
| S31-LAYPDF-04（低，可访问性） | 编辑器顶栏分享按钮仅 `title="分享"` 无 aria-label，读屏不可达 | `a72a350` 补 `aria-label="分享"` | ✅ 重建后 `aria-label` 读回确认 |

### 交回（3，只取证不修）

- **S31-LAYPDF-01（中）副本绕过存储上限**：`POST /api/resumes/[id]/version` 全文无 plan/maxResumes 校验，与 `POST /api/resumes`（plan.ts 403 拦截）不对称；5 份触顶仍成功创建第 6 份（DB total=6 实测）。存储限额属计量边界；副本版本语义本身正确
- **S31-LAYPDF-02（中）diff 技能章节假阳性**：DB 逐键一致的克隆报「技能 6 处差异」，同版本自比也报。根因已定位：`version-diff.ts` diffArray 的 `keyOf` 对无 id 条目生成 `fallbackId + '_L'/'_R'` 侧别后缀键，左右键永不相等→配对必失败（SkillSchema 无 id 全走 fallback）。建议修法：fallback 键去掉 side 后缀。有 id 章节（工作/项目/教育）判定正常
- **S31-LAYPDF-10（中）设计稿生成契约**：`[S4_NON_TEXT]` 3 轮全败（AI 幻觉绑定槽位），退币正确，未落库；成功路径全链未测（见第二节）

### 观察（5，登记不修）

- **S31-LAYPDF-05（中）证书/奖项全链断层**：解析/核对页 8 章节含证书奖项，编辑器 SectionId/sectionOrder 仅 6 节，预览/分享/PDF 全链不渲染（DB 数据完好、API 返回正常）；template-sections MODULE_ICONS 有 📜🏆 预留图标未接入。章节系统级改动交回
- **S31-LAYPDF-06（信息）**未来日期不在日期检查范围（规则防误报设计，是否告警属产品决策）
- **S31-LAYPDF-07（低）**空 endDate 非在职条目渲染悬空「2016-07 -」（模板无兜底占位）
- **S31-LAYPDF-08（信息）**design 无稿简历导出点击：内联 error 文案「还没有设计稿，请先选择版式并生成。」出现（点击前无、点击后出现，复验断言 errorTextBefore=false→afterClick=true）——反馈存在但形式为内联非 toast，与成功路径 toast.success 不对称
- **S31-LAYPDF-09（低）**空字符串成就渲染空 bullet（删除操作可产生空成就，模板未过滤）

## 六、修复 commit 前后对照

| commit | 文件 | 修改前 | 修改后 | 验证 |
| --- | --- | --- | --- | --- |
| `836b434` fix(versions) | `apps/web/src/app/(dashboard)/resume/[id]/versions/page.tsx` | 「当前只有 N 个版本——在编辑器里「另存为新版本」后再来对比」（指向不存在入口） | 「当前只有 N 个版本——在简历列表「创建副本」后再来对比」（指向真实入口） | type-check 通过 → rebuild（BUILD_ID `DsduBMp2C7jTHGbLt_FCG`）→ 重启 3100 → 空态页截图目检 |
| `a72a350` fix(share) | `apps/web/src/components/editor/share-dialog.tsx` | 分享按钮仅 `title="分享"` | 增加 `aria-label="分享"`（保留 title 与 aria-haspopup） | 同上构建链 → 编辑器页读回 `aria-label="分享"` 确认 |
| `0308093` docs(stage31) | `docs/stages/stage-31-browser-audit.md` | LAYPDF 分区（空）、#15/#16 ⬜、台账无 LAYPDF 项 | 分区全量登记、#15/#16 ✅、台账 S31-LAYPDF-01~10、环境事实补 BUILD_ID 更新行 | 已提交 |

## 七、产出物路径

- **本报告**：`C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/LAYPDF-report.md`
- **走查台账**：`docs/stages/stage-31-browser-audit.md`（LAYPDF 分区 + #15/#16 + 台账，仓库内 commit `0308093`）
- **仓库内报告副本**：`runs/reports/LAYPDF-report.md`（runs/ 被 gitignore，仅本地留档）
- **截图与 PDF 证据**：`C:/Users/TimeCraker/Documents/ResumeAIX-stage31-audit/LAYPDF/`（13 张截图 + 2 份 PDF + `pdf-legacy-2p/` 3 张 PDF 渲染图，全部读图目检）
  - PDF：`laypdf-legacy-v1-2pages.pdf`（2 页）、`laypdf-legacy-v2-1page.pdf`（1 页）
  - 关键截图：`share-dialog-public-1440-03.png`（公开弹层）、`share-public-page-1440-04.png`（公开页渲染）、`share-dialog-private-again-1440-05.png`（关闭态）、`versions-diff-false-positive-1440-01.png`（diff 假阳性）、`versions-empty-state-1440-02.png`（修前文案）、`versions-empty-fixed-1440-06.png`（修后回归）、`style-gallery-all-themes-1440-02.png`（16 主题）、`design-gallery-before-generate-1440-03.png`（生成前）、`versions-390-01.png`（390 视口）

## 八、自评与遗留

- **覆盖**：handoff 第 6 项全过（除设计稿成功路径子项）；第 7 项全过（分页/裁切零问题登记）；页面清单 #15/#16 置 ✅
- **未测与原因**：①设计稿成功路径（版本链/回滚/换版式重新生成/分享 iframe/design PDF/422 守卫）——生成失败 + 单次原则不重试；②分享未登录访问用 curl 无凭证等价验证（SSR visibility 校验与登录态无关，结论等价）；③legacy「恢复」为确认不存在（非未测）；④升级 AI 设计稿按钮仅验存在性未执行升级（保持测试资产状态）
- **遗留风险**：E2E 账号现有 **6 份简历**（超 5 份上限 1 份，为 S31-LAYPDF-01 缺陷复现现场，保留供主会话核验）；390 视口按任务范围为 versions 页/版式页一轮，分享页 390 未测
- **口径**：本地通过、生产未测（红线不连生产、不部署）；全程零真实简历、零密钥输出、PG 僵尸进程禁区未触碰
