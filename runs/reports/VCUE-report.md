# VCUE 结果报告

任务：新增 `skills/video-motion/templates/remotion-app/scripts/verify-cues.mjs`（cues 渲染前校验器）。执行日期 2026-10-05。

## 结果摘要

- 交付 1 个零依赖校验器（Node 原生 TS 直载，338 行），**1 个 commit `72dba39`，`git status` 干净**（仅剩并行工单的在途 `public/cover/`，未触碰）
- 正测：模板 demo cues **PASS，0 error / 1 warn，退出码 0**；deck 链 demo（deck-cues.ts）同样 PASS 退出 0
- 反测：sabotaged cues（临时目录，已删）**14 error + 2 warn，退出码 1**，覆盖全部 6 类指定 error 规则 + 2 类 warn 规则
- 实现中发现并修正一个任务描述与现场不符的点：**总时长不能跨链取**（详见遗留问题）

## 规则清单（error/warn 分级）

### ERROR（退出码 1）

| 规则名 | 判定 |
|---|---|
| `subtitle-duration` | 字幕时长 >2s（SKILL.md Step 1；仅 footage 链，deck 字幕由音频派生不设上限） |
| `subtitle-overlap` | 字幕时间重叠（按 start 排序滚动 max-end 扫描，链式重叠可全查） |
| `subtitle-negative` | start/end 为负 |
| `subtitle-order` | end ≤ start（零/负长度字幕，契约自洽性扩展） |
| `subtitle-beyond-total` | 字幕 end 超总时长（总时长可得知时） |
| `databar-beyond-total` / `spotlight-beyond-total` | 数据柱 t / 圈注 t+ttl 超总时长 |
| `databar-coords` | 数据柱锚点 x/y 越出 1920×1080 设计坐标（x,y ≥ 0 且 ≤ 1920/1080） |
| `spotlight-coords` | 圈注 x/y/w/h 越界（x,y ≥ 0，x+w ≤ 1920，y+h ≤ 1080，w/h ≥ 0） |
| `field` | 必填字段缺失或类型错（三段 cue 全字段 + bars 非空 + kind 枚举 + ttl/scale > 0 等契约完整性） |

### WARN（只打印，不计错）

| 规则名 | 判定 |
|---|---|
| `subtitle-duplicate-text` | 完全相同的字幕文本出现 ≥2 次 |
| `spotlight-arrow-h` | kind=arrow 且 h≠0（仓内约定 h:0、w=箭头长度） |
| `duration-unknown` | 总时长拿不到（文件缺失/读不出/无字段），跳过时长窗口类规则 |

### 总时长解析（链配对，不跨链）

- footage 链（`cues.ts`，`cues` 导出）→ `src/footage-params.ts` 的 `durationInFrames/fps`
- deck 链（`deck-cues.ts`，`deckCues` 导出，仅字幕段）→ `src/deck-params.ts` 的 `totalSeconds`
- 拿不到 → WARN + 跳过 beyond-total 规则；可用 `[cues路径] [params路径]` 两参显式指定

## 验证证据（命令 + 输出）

正测（demo，期望全绿）：

```
$ cd skills/video-motion/templates/remotion-app && node scripts/verify-cues.mjs; echo $?
verify-cues: ...src\cues.ts
duration: unknown -> beyond-total rules skipped
[WARN] duration-unknown - footage-params.ts lacks durationInFrames/fps or totalSeconds -> beyond-total rules skipped
--------
PASS: 0 error(s), 1 warning(s) (chain=footage subtitles=8 dataBars=1 spotlights=3)
EXIT=0
```

deck 链配对（第二顺带验证）：

```
$ node scripts/verify-cues.mjs src/deck-cues.ts; echo $?
duration: 8.4s (deck-params.ts totalSeconds=8.4)
PASS: 0 error(s), 0 warning(s) (chain=deck subtitles=2 dataBars=0 spotlights=0)
EXIT=0
```

反测（sabotaged fixture + 假 params 300帧@60fps=5s，临时目录 `%TEMP%\vcue-test\`，测毕已删）：

```
$ node scripts/verify-cues.mjs <tmp>/sabotaged-cues.ts <tmp>/fake-params.ts; echo $?
duration: 5s (fake-params.ts durationInFrames=300 fps=60)
[ERROR] subtitle-duration subtitles[1] duration 5.5s exceeds 2s
[ERROR] subtitle-beyond-total subtitles[1] end=35.5s exceeds total 5s
[ERROR] subtitle-negative subtitles[3] start=-1 end=1; both must be >= 0
[ERROR] field subtitles[4] end is required
[ERROR] subtitle-beyond-total subtitles[5] end=21s exceeds total 5s
[ERROR] subtitle-beyond-total subtitles[6] end=23s exceeds total 5s
[ERROR] subtitle-overlap subtitles[0] start=0.5s before subtitles[3] end=1s
[ERROR] subtitle-overlap subtitles[2] start=1s before subtitles[0] end=2s
[WARN] subtitle-duplicate-text subtitles[5],subtitles[6] identical text appears 2 times
[ERROR] databar-coords dataBars[0] anchor x=2000 y=400 outside 1920x1080 design space
[ERROR] field dataBars[1] bars must be a non-empty array, got 0 items
[ERROR] databar-beyond-total dataBars[1] t=6s exceeds total 5s
[ERROR] spotlight-coords spotlights[0] x=1500 y=100 w=600 h=200 exceeds 1920x1080 design space
[WARN] spotlight-arrow-h spotlights[1] kind=arrow expects h=0 (w is arrow length), got h=85
[ERROR] spotlight-beyond-total spotlights[1] t+ttl=7s exceeds total 5s
[ERROR] field spotlights[2] kind must be circle|arrow|box, got undefined
--------
FAIL: 14 error(s), 2 warning(s) (chain=footage subtitles=7 dataBars=2 spotlights=3)
EXIT=1
```

其余断言：

- 纯 ASCII：stdout 过 `grep -P '[^\x00-\x7F]'` 零命中（GBK 控制台安全；定位只用数组下标，cue 中文文本永不入输出）
- FATAL 路径：cues 文件不存在 / 显式 params 不存在 → `[FATAL] ...`（stderr）退出码 2，各验证一次
- 加载探针：`node v24.16.0` 原生 `import('...cues.ts')` 直载成功（`LOAD OK: ['cues']`），esbuild 兜底代码在位但本轮 node_modules 不在，未实测

## 建议的 SKILL.md 用法行（主控代集成，本工单禁改 SKILL.md）

建议加在 Step 3 渲染命令之前（或 Step 2 末尾）：

> 写完/改完 cues 先跑 `node scripts/verify-cues.mjs`（deck 字幕换 `src/deck-cues.ts` 参数），error 清零才进渲染；总时长 warn 只提醒不拦。

## 提交

- `72dba39` `feat(skills): cues 渲染前校验器 / add verify-cues linter`（只含 `scripts/verify-cues.mjs` 1 文件，338 行）
- 提交后 `git status`：仅并行工单在途的 `?? public/cover/`，本工单零残留、临时目录已删

## 遗留问题

1. **任务描述与现场不符的一处修正**：任务说总时长「footage-params 或 deck 派生链」可互为回退，但模板同时内置两条链的 demo（cues.ts 是 30.5s 素材、deck-params.ts 是 8.4s deck），跨链取时长会让 demo 误报 9 个 error。已改为**按文件名配对链**（deck-cues.ts↔deck-params.ts，其余↔footage-params.ts），demo 恢复全绿。
2. **`probe-footage.mjs` 不产出 `durationInFrames`**：footage 链的 beyond-total 规则现在恒为「跳过 + warn」。后续可给探针加 `ffprobe format=duration` 输出（约 3 行改动），校验器无需任何修改即可自动启用该规则。属他人文件，未动。
3. **stderr 噪音**：Node 会对模板 package.json（无 `"type"` 字段）打一条 `MODULE_TYPELESS_PACKAGE_JSON` 提示；已实测 Node 24 下进程内 warning listener 无法抑制默认打印（listener 与默认打印同时输出）。判定输出全在 stdout，不受影响；若 VMBL 工单恰在动 package.json，补 `"type": "module"` 可顺带消除。
4. **esbuild 兜底未实测**：本轮 node_modules 不在（并行工单时序），兜底分支无法构造触发条件；主路径（原生直载）已在 Node 24.16 实测通过，Node <22.6 环境才会走兜底。

## 自评

**达标**。验收数字逐项对上：demo 全绿退出 0；sabotaged 6 类 error 规则 + 2 类 warn 规则逐条红、退出 1（14 error 超额命中，含 2 处计划外的真越界）；零新依赖（node: 原生模块 only）；1 个 commit、只 add 本工单 1 个文件、工作树干净；纯 ASCII 输出有程序断言。外加完成链配对修正与 deck 链支持，报告如实记录了两处与任务书的偏差理由。
