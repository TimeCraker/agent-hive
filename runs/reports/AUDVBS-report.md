# AUDVBS 结果报告

审计对象:vibe-studio 7 个 skill(ppt / humanizer / video-motion / narration / auto-subtitle / publish / web-capture)。只读审计,未改仓内任何文件。审计日 2026-10-06。

## 结论一句话

7 个 skill 整体成熟度高:30 个脚本语法检查全过、3 个只读校验器实跑全绿、skill 间契约衔接严密;唯一结构性缺陷是 video-motion 的「封面出图」线入口断裂(文档命令指向不存在的文件与未注册的 composition,照跑必报错),外加 3 条 P2 文档/依赖缺环。

## Skill 逐项审计(7 小节)

### 1. ppt

- **完整性:通过**。五步工作流(取材文案 → 设计系统 → 生成 → 三级渲染核查 → 交付)无断头;降级路径(无 MS Office 转 LibreOffice、两者皆无则明确报告)写明;改现有 pptx 的 `deck_replace` / `deck_recolor` 与动画 `auto_deck` 均有代码块示例。
- **可执行性:通过**。`primitives.py` / `verify.py` / `animate.py` py_compile 全过。SKILL.md 声明的 15 种页面范式函数(`slide_cover` 到 `slide_closing` 共 13 个 slide_* + `growth_chart/line/donut` + 原生 `bar/line/donut_chart`)在 `primitives.py` 中逐一实存;动画词表 11 个效果名(fade/wipe/appear/float_up/float_down/zoom/grow_turn/ease_in/split/wheel/stretch)在 `animate.py:31-36` 映射表全命中;`Anim` 类的 `apply/auto_deck/fx/stagger/chart` 方法、`use_theme`/`THEMES`、`check_fit`、`P.set_transition/auto_show/shape_groups` 全部实存。
- **依赖真实性:通过**。python-pptx / pymupdf / pywin32 均写明清华镜像安装命令(SKILL.md:42 与 CLAUDE.md);`templates/` 三件套与文档引用一一对应,无孤儿、无缺件。

### 2. humanizer

- **完整性:通过**。纯文档 skill:Phase 1-4 处理流程 + L1-L4 自检 + 三种输出模式(Pasted/File/Embedded)+ 中英双模式库 + TimeCraker 偏好覆盖层,规则全部落到可操作粒度(词表、密度阈值、逐毒修法、示例对照)。
- **可执行性:通过(无脚本,设计如此)**。无代码可查,规则本身可判定(如黑话密度每千字分级、心理词占比 >25% 判重度)。
- **依赖真实性:通过**。零外部依赖;引用的 blader/humanizer v2.11.2 与 unclecheng v4.1 是血统说明不是运行依赖;MIT LICENSE 文件在仓。

### 3. video-motion

- **完整性:不通过(1 处断头)**。FootageOverlay 五步、DeckVideo 五步、scene-kit 工艺 + 四级验收均完整自洽;但「封面出图(Cover,第四种产物)」一节的渲染命令入口失效,详见 P1。
- **可执行性:基本通过**。`build-deck-params.mjs` / `verify-cues.mjs` / `probe-footage.mjs` node --check 过,`extract_pages.py` py_compile 过;`verify-cues.mjs` 对模板 fixtures 实跑 PASS(0 error 0 warning,chain=footage subtitles=8 dataBars=1 spotlights=3)。Root.tsx 注册 8 个 composition(Stage0Test/FootageOverlay/DeckVideo/DeckVideoV2/四个 Demo),与 SKILL.md 渲染命令全部对得上;唯独 v1 `Cover` 无任何注册入口。
- **依赖真实性:通过**。17 个 Remotion 系包全部精确 4.0.533 无 `^`,与「版本铁律」自洽;`.npmrc` 托管 npmmirror 镜像;typescript devDependency + `npm run typecheck` 脚本在;SKILL.md 引用的 `docs/2026-08-30-motion-grammar.md`、`assets/patterns.md`、`assets/component-catalog.md`、`src/vendor/README.md`、`assets/lottie/`、`assets/art/` 全部存在;scene-kit「24 组件」口径与 24 个 .tsx 实况一致(check-docs 3.7 断言看管)。
- 附带:Chrome Headless Shell 大文件下载「失败即报不重试」的中国网络纪律写明,符合仓规。

### 4. narration

- **完整性:通过**。契约(meta + segments,id/kind/text/ref 字段封闭)→ 受众预算 → 分段成稿 → 程序校验 → 人工打磨 → 交付五步完整;Step 5 写明三个下游去向(剪映配音、video-motion cues.subtitles、auto-subtitle 校准)。
- **可执行性:通过**。`verify_narration.py` py_compile 过;对官方 `script.example.json` 实跑 PASS(fail=0 warn=0,total 18.4s vs budget 22.0s);`--cps` / `--budget-seconds` 参数与文档声明一致(argparse 实存)。
- **依赖真实性:通过**。纯 Python 标准库,零外部依赖;example json 与契约字段一致。
- 小瑕疵:校验器 print 段文本含中文,GBK 控制台下乱码(见 P3-5),判定行 RESULT: PASS 为 ASCII 不受影响。

### 5. auto-subtitle

- **完整性:通过**。确认素材 → venv 装依赖 → 转写 → 三级核查(L1 程序 / L2 准确性 / L2.5 时间轴)→ 交付 → 复跑命令留档,六段完整;切分规则(>20 字标点切、<0.3s 并前条)与词级时间戳 rationale 写到可复现粒度。
- **可执行性:通过**。`transcribe.py` py_compile 过;输出契约三方对齐:代码实际产出 `{"start": s, "end": e, "text": t}` 且 `round(s, 3)`(transcribe.py:73,134-135),与 SKILL.md 声明、video-motion `SubtitleCue`(cues.ts:1-5,秒制三字段)逐字一致。
- **依赖真实性:通过**。`requirements.txt`(faster-whisper)存在;venv 建仓外 `~/.cache/vibe-studio/asr-venv` 的理由(284MB 构建产物不进库)写明;HF_ENDPOINT 换源 fallback 与优先级写明;模型体积与估时写明。两处小缺口见 P3-6/7。

### 6. publish

- **完整性:通过**。人机分工硬约束表(登录与点发布归人,上传填表归脚本)→ 依赖 → run.mjs 多平台入口 → 三平台各一节(字段上限表、特有坑逐条)→ pw/ 填表层 → 交付留痕,链路无断头;「脚本不提供发布命令」的设计边界反复申明。
- **可执行性:通过**。`bili/douyin/xhs/run.mjs` + `pw/` 全部 9 件共 13 个 JS 文件 node --check 全过;基础层 4 个 mjs 的 import 全部 `node:` 前缀,「不装任何 npm 包」声明与实现一致(grep 证明);pw 九件清点与 SKILL.md:94 声明逐一对应。
- **依赖真实性:通过**。Node ≥18 声明在;`templates/package.json` pin playwright 1.63.0 与 SKILL.md「pin 1.63.0」一致;三份 example.json 模板齐;选择器失效风险自带 `--dry` + 逃生口命令(inspect/popup/eval/taps)的应对说明。

### 7. web-capture

- **完整性:通过**。虚拟时钟机制 → 项目契约(目录树 + 导演页四函数 `__boot/__frame/__debug/__cover`)→ 命令 → 实测坑 → 边界,完整;首例参考 pelican-test 已归档 `products/pelican-test/`(存在)。
- **可执行性:通过**。7 个 mjs + vclock.js 共 8 个文件 node --check 全过;HERE(工具自身位置,找 cdp.mjs/vclock.js)与 ROOT(--project)分离机制在代码(capture-all.mjs:19-20)与 SKILL.md「别把 HERE 当项目根」互证一致;模板目录无 package.json,「零 npm 依赖」成立。
- **依赖真实性:不通过(缺 2 项声明)**。`cdp.mjs:2` 注释明示要求 Node ≥22(全局 WebSocket),`render-director.mjs:61` spawn 系统 PATH 的 ffmpeg;SKILL.md 无 Node 版本声明、无 ffmpeg 获取方式(对照:publish 写了 Node ≥18)。详见 P2-3。

## 衔接一致性

| 链路 | 上游 → 下游 | 结论 |
|---|---|---|
| 字幕契约 | auto-subtitle `{start,end,text}`(秒,3 位小数)→ video-motion `SubtitleCue`(cues.ts:1-5) | 一致,三方(两文档 + 两实现)逐字对齐 |
| 口播稿 | narration `script.json` 的 `ref:"page N"` → `build-deck-params.mjs:28` 正则聚合,ref 不可解析即报错 | 一致,且有失败护栏 |
| 音频目录 | narration Step 5 `public/deck/audio/` ↔ video-motion DeckVideo 节同路径 | 一致 |
| PPT 取材 | ppt 产物 pptx → video-motion `extract_pages.py` 出 `public/deck/pages/p-<N>.png` | 一致 |
| 场景施工 | workflow B 线第 4 步 `deck-scenes.tsx (SCENES/DARK_PAGES)` | 实存(deck-scenes.tsx:41-42) |
| 成片落点 | video-motion 渲染 `products/<项目>/deck.mp4` → publish `--path products/...` | 一致,五区纪律统一 |
| C 线配乐 | workflow 引 `scripts/make_music.py` / `contact_sheet.py` / `audio_report.py` / `probe_frame.py` | 全部实存于 scripts/ |
| 文档口径 | README 产品表 ↔ 各 SKILL.md description | 一致;唯一冲突是 Cover 三预设(README:28 与 video-motion SKILL.md 同指向已无入口的 v1,见 P1) |

## 分级问题清单(P0-P3)

**P0:无。**(无断头工作流、无缺失依赖导致主流水线不可用、无语法错误)

**P1(1 条,照文档执行必报错)**

1. **封面出图线入口断裂**:`skills/video-motion/SKILL.md:109` 命令 `npx remotion still src/cover-index.ts Cover ...` 双重失效:其一,入口文件不存在(实际是 `src/cover3-index.ts`);其二,composition id `Cover` 无注册(cover3-index.ts 只注册 `CoverV3`,Root.tsx 的 8 个 composition 里也没有 Cover)。v1 组件 `Cover.tsx`(props 三预设 photo/dark/clean)仍在模板里但无任何入口引用。`README.md:28`「只要一张标题封面走 Cover json 三预设」同源失效。上一条命令在 4.0.533 实跑必报 composition not found。

**P2(3 条,文档与实现漂移、依赖缺环)**

2. **check-docs 盲区放走 P1**:`scripts/check-docs.py` 实跑 0 fail 0 warn,但 SKILL.md 代码块内嵌路径(`src/cover-index.ts` 这类形态)不在其引用有效性检查范围,P1 恰好从自检网眼里漏过。
3. **web-capture 运行环境要求未声明**:`skills/web-capture/templates/cdp.mjs:2` 要求 Node ≥22(全局 WebSocket,Node 18/20 会 ReferenceError),`render-director.mjs:61` 依赖系统 PATH 的 ffmpeg;SKILL.md 两者均未写(对照 publish SKILL.md 明写 Node ≥18)。
4. **DeckVideo v1 定位无取舍回声**:`skills/video-motion/SKILL.md:50` 仍平铺「PPT 逐页成片(DeckVideo,第二种成片)」;而 `README.md:25` 明令新介绍片禁走 DeckVideo(走 DeckVideoV2)、CLAUDE.md 同。单读 SKILL.md 的会话缺这条裁决信息,可能选错引擎。

**P3(5 条,打磨项)**

5. `skills/narration/templates/verify_narration.py` 输出段文本含中文,GBK 控制台乱码,自违 narration SKILL.md「print 全英文」约定(实测 RESULT 行 ASCII 可读,不阻断判定)。
6. `skills/auto-subtitle/templates/asr/make_fixture.ps1` 未在 SKILL.md 任何处提及(测试 fixture 生成器,头部注释自明,但「模板里有什么」缺一环)。
7. `skills/auto-subtitle/templates/asr/requirements.txt` 对 faster-whisper 不 pin 版本,跨机复现性弱。
8. `skills/video-motion/templates/remotion-app/package.json` 无 `"type": "module"`,node 直跑 .ts 时报 MODULE_TYPELESS_PACKAGE_JSON 警告(纯噪音,Remotion/tsc 不受影响;verify-cues 实跑时出现)。
9. 本地磁盘残留:`skills/video-motion/templates/remotion-app/.baseline/`(4.0.518/4.0.533 两版基线 PNG)与 `skills/ppt/templates/__pycache__/`;均已被 .gitignore 覆盖(.gitignore:2,51),不影响克隆者,仅占工作区。

## 改进 backlog

按优先级排序,均为小改动:

1. **[P1] 修封面线二选一**(我的建议:方案 a,你拍板):(a) 补 `src/cover-index.ts` v1 入口(registerRoot 注册 id `Cover`),保住「三预设轻量封面」场景,SKILL.md:109 命令即恢复可跑;(b) 判定 v1 废弃,SKILL.md「封面出图」节整节改写为 CoverV3 契约(`cover3-index.ts` + `CoverV3Props`:brand/headline/chips/domain/screenshot),同步改 README:28。改完跑 `python scripts/check-docs.py`。
2. **[P2] check-docs 增补断言**:解析各 SKILL.md 正文与代码块中 `` src/xxx.ts(x) `` 形态的路径做存在性检查(正是 P1 逃逸的形态),一处红即拦。
3. **[P2] web-capture SKILL.md 加「依赖」节**:Node ≥22(全局 WebSocket,引 cdp.mjs:2 为证)+ ffmpeg 系统安装一句(winget/scoop 均可)。
4. **[P2] video-motion SKILL.md DeckVideo 节首行加一句取舍**:介绍成片默认 DeckVideoV2,DeckVideo 为翻页 PPT 特殊场景保留(与 README:25 对齐)。
5. **[P3] verify_narration.py 输出 ASCII 化**:保留 id/chars/sec,text 打 unicode 转义或截断省略,守住自家 GBK 约定。
6. **[P3] auto-subtitle 两件**:SKILL.md 补 make_fixture.ps1 一句用途;requirements.txt pin faster-whisper 版本(按当前实测通过版)。
7. **[P3] remotion-app package.json 加 `"type": "module"`** 消除 Node 警告。
8. **[P3] 清磁盘残留**:`.baseline/` 与 `__pycache__/`(已 ignore,删除即净)。

## 自评

- **覆盖**:7/7 skill 三维度(完整性/可执行性/依赖真实性)全查;30 个脚本语法检查全过(6 Python py_compile + 24 Node --check);3 个只读校验器实跑(verify_narration PASS / verify-cues PASS / check-docs 0 fail 0 warn);衔接链路 8 条逐条核对。
- **方法**:所有结论附文件与行号证据;skill 结构先以 git ls-files 盘点再下结论,未凭名字臆断;声明的函数/composition/参数/版本逐一 grep 实证。
- **局限**:TS/TSX 未跑 tsc typecheck(红线禁 install,node_modules 状态未动),以读码 + Root.tsx 注册核对替代;未做任何实际渲染与投稿(红线);publish 三平台选择器的时效性无法离线验证,该 skill 自身已声明此风险并配 `--dry` 与逃生口,审计认可其自管方式。
- **整体**:7 个 skill 契约化程度高(字段封闭、派生值禁手改、失败护栏),skill 间衔接是本仓最强项;封面线入口断裂是唯一的结构性缺陷,修复成本一行到一节之间。
