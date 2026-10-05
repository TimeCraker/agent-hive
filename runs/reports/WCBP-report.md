# WCBP 结果报告

## 结果摘要

shots.json 镜头条目新增可选 `viewport` 字段，采集视口优先级 `shot.viewport > --width/--height（含 shots.json 顶层 width/height）> 默认 1920×1080`。解析函数 `resolveShotViewport` 落在共享模块 `paths.mjs`，独立可导入；单测 10 例正反对证全过（7 正 3 反），fixture 项目 `--dry` 端到端验证三档优先级与非法值回落，全程不开浏览器。缺省路径零变化：无 viewport 字段时行为与输出和旧版一致。已提交 `7b54d22`，本站点 `git status` 零残留。

pelican-ride 遗留的痛点（整页版式 1920×1180 与图版模式 2880×1560 混用只能分批传 CLI 参数、补采漏传即整单元渲错）由此收口：混用视口写进同一份 shots.json，补采前 `--dry` 即可核对每镜生效尺寸。

## 字段设计

```json
{ "id": "plate", "src": "B", "seconds": 6,
  "viewport": { "width": 2880, "height": 1560 } }
```

- **位置**：`capture/shots.json` 每镜条目，可选；两个字段名 `width`/`height` 与现有全局字段、capture-clip 的 CLI 参数同名，零新词汇。
- **优先级**：shot > CLI `--width/--height` > shots.json 顶层 `width`/`height` > 1920×1080。顶层与 CLI 的相对次序维持旧链（CLI > 顶层），仅在其上叠加 shot 一档。
- **非法值策略**：缺一边 / 非正整数（零、负数、小数、非数值字符串）→ **整组忽略 + stderr warn + 回落全局**，不做半合并（shot 的宽配全局的高会出畸形画幅），也不终止整批采集（一个 typo 不该杀掉整晚的采集任务）。数值字符串（`"2880"`）接受，与仓里其余 `Number()` 宽松风格一致。
- **落点**：`resolveShotViewport(shot, cli, cfg)` 放 `paths.mjs`（四个脚本共用的既有共享模块，不新建文件）；`capture-all.mjs` 每镜解析一次存 `Map`，worker argv、`--dry` 输出、clip.json 三处消费同一份结果，坏值只 warn 一次。

## 改动清单

| 文件 | 改动 |
|---|---|
| `skills/web-capture/templates/paths.mjs` | 新增 `DEFAULT_VIEWPORT` 常量与 `resolveShotViewport()`（含非法值 warn+回落），+35 行 |
| `skills/web-capture/templates/capture-all.mjs` | ① 头部注释补 viewport 说明；② 全局 width/height 改走 `resolveShotViewport({}, args, cfg)`（同一函数无 shot 分支 = 旧链原样）；③ shots 过滤后建 `shotViewport` Map（每镜解析一次）；④ `--dry` 输出新增 `viewports` 数组（纯增量键）；⑤ runJob argv 的 `--width/--height` 改传每镜生效值；⑥ merge 段 clip.json 条目的 `width`/`height` 改记每镜生效尺寸（index.json 顶层仍记全局默认） |
| `skills/web-capture/SKILL.md` | 契约节补「shots.json 镜头视口」段（字段形态、优先级、非法值策略、生效尺寸记录处、补采先 `--dry`） |

**不碰旧路径的论证（缺省行为零变化）**：

- 旧全局解析 `Number(args.width ?? cfg.width ?? 1920)` 被替换为 `resolveShotViewport({}, args, cfg)`——空 shot 走 `vp == null` 直返分支，链内取值表达式逐字符等价（单测 #4/#5 对证）。
- 无 viewport 字段的 shots.json：Map 值恒等于全局，argv 传参与旧版相同字符串；dry 输出旧键原样、仅新增 `viewports`（纯增量，旧消费方不受影响）。
- `capture-clip.mjs` / `render-director.mjs` / `probe-anchors.mjs` 零改动：capture-clip 本就按次接收 `--width/--height`（单镜重采路径天然支持，per-shot 值由 capture-all 传参流入）；render-director 的 1920×1080 是导演页输出舞台，与源帧采集视口是两回事（源帧任意尺寸由项目取景窗处理）；probe-anchors 不读 shots.json。

## 验证证据（命令+输出）

**1. 单测（10 例正反，临时目录脚本，已清理）**

```
$ node "C:/Users/TimeCraker/AppData/Local/Temp/wcbp-viewport-test.mjs"; echo "exit=$?"
PASS  #1 shot.viewport beats CLI and cfg
      got={"width":2880,"height":1560} want={"width":2880,"height":1560} warn=[]
PASS  #2 no shot viewport -> CLI
      got={"width":2048,"height":1152} want={"width":2048,"height":1152} warn=[]
PASS  #3 no CLI -> cfg (shots.json top-level)
      got={"width":2880,"height":1560} want={"width":2880,"height":1560} warn=[]
PASS  #4 nothing anywhere -> default 1920x1080
      got={"width":1920,"height":1080} want={"width":1920,"height":1080} warn=[]
PASS  #5 CLI beats cfg, missing side filled independently (legacy global chain unchanged)
      got={"width":2048,"height":2160} want={"width":2048,"height":2160} warn=[]
PASS  #6 null viewport treated as absent
      got={"width":1920,"height":1080} want={"width":1920,"height":1080} warn=[]
PASS  #7 numeric strings accepted (matches loose Number() style elsewhere)
      got={"width":2880,"height":1560} want={"width":2880,"height":1560} warn=[]
PASS  #8 viewport missing height -> warn + global fallback (no half-merge)
      got={"width":1920,"height":1080} want={"width":1920,"height":1080} warn=["[viewport] shot s4: viewport needs both width and height; ignoring shot viewport, capturing at 1920x1080"]
PASS  #9 negative width -> warn + global fallback
      got={"width":1920,"height":1080} want={"width":1920,"height":1080} warn=["[viewport] shot s5: viewport width/height must be positive integers (got -100x1560); ignoring shot viewport, capturing at 1920x1080"]
PASS  #10 fractional height -> warn + global fallback
      got={"width":1920,"height":1080} want={"width":1920,"height":1080} warn=["[viewport] shot s6: viewport width/height must be positive integers (got 2880x1560.5); ignoring shot viewport, capturing at 1920x1080"]
ALL 10 PASS
exit=0
```

**2. 端到端 dry（fixture：layout 无 viewport / plate 2880×1560 / bad 缺 height，shots.json 顶层 1920×1180；dry 在 spawn Chrome 前退出，不开浏览器）**

```
$ node skills/web-capture/templates/capture-all.mjs --project <fixture> --dry
[viewport] shot bad: viewport needs both width and height; ignoring shot viewport, capturing at 1920x1180
{ "width": 1920, "height": 1180, "jobs": 3,
  "viewports": [ {"id":"layout","width":1920,"height":1180},
                 {"id":"plate","width":2880,"height":1560},
                 {"id":"bad","width":1920,"height":1180} ] }   # exit=0

$ node skills/web-capture/templates/capture-all.mjs --project <fixture> --width 2048 --dry
[viewport] shot bad: ... capturing at 2048x1180
{ "width": 2048, "height": 1180,
  "viewports": [ {"id":"layout","width":2048,"height":1180},   # CLI 生效
                 {"id":"plate","width":2880,"height":1560},    # shot 仍压过 CLI
                 {"id":"bad","width":2048,"height":1180} ] }   # exit=0
```

**3. 缺省零变化回归（fixture 无任何 viewport 字段）**

```
$ node skills/web-capture/templates/capture-all.mjs --project <fixture2> --dry
{ "width": 1920, "height": 1080, "jobs": 2,        # 旧默认，无 warn
  "viewports": [ {"id":"layout","width":1920,"height":1080},
                 {"id":"plate","width":1920,"height":1080} ] }  # exit=0
```

**4. 语法与文档检查**

```
$ node --check skills/web-capture/templates/capture-all.mjs && node --check skills/web-capture/templates/paths.mjs
SYNTAX-OK
$ python scripts/check-docs.py
--- check-docs: 0 fail, 0 warn, 3 archived skipped
```

未做：真实 Chrome 采集冒烟（红线「不起长时浏览器进程」；视口值经 argv 原样传入 capture-clip 既有 `--width/--height` → `openPage` → CDP `setDeviceMetricsOverride` 路径，该路径未改动）。

## 提交

- `7b54d22` `feat(skills): web-capture 支持 per-shot viewport / per-shot viewport in shots.json`（3 files, +60 −8）
- 仅 add `skills/web-capture/**` 三文件；`git status --short -- skills/web-capture` 为空（零残留）。工作树剩余条目（publish / video-motion）为并行会话在途施工，未触碰。

## 遗留问题

- `probe-anchors.mjs` 仍硬编码 W=1920/H=1080：它按 anchor-targets.json 的 A/B 条目量元素坐标，不读 shots.json，per-shot viewport 到不了那里。若下个项目对非默认视口的 shot 量锚点，需要给 anchor-targets.json 也加 viewport 或接受归一化坐标换算（坐标输出是归一化比例，视口一致时可直接复用）。
- 真机采集验证待下个 C 线项目首采时顺带确认（视口传入链路复用未改动的 CDP 路径，风险低）。

## 自评

**达标**。验收项逐条：单测 10 例（≥4）含回落与三类非法值，证据完整；缺省零变化有代码级论证 + 无字段 fixture 回归 dry 对证；SKILL.md 字段文档就位（契约节 + check-docs 绿）；1 个 commit 且本站点 git status 干净。
