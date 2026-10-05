# VMBL 结果报告

任务：video-motion Remotion 升级安全网（still 基线 + 升级 + 全链对照）
日期：2026-10-05 · 执行：Claude（glm-5.3）

## 结果摘要：升级采纳

**4.0.518 → 4.0.533**，全链对照全绿，未触发回滚：

- `npm run typecheck` exit 0（升级后）
- compositions 前后 7/7 逐项一致（id/fps/宽高/帧数）
- 同帧号 still 重渲 PSNR 10/10 全部 **inf dB**（逐位一致；MD5 抽查 4/4 IDENTICAL 旁证）
- API 探针四条形状不变（浏览器内实测，fitText 的 fontSize 连数值都一字不差：83.67653788324509）
- check-docs.py：0 fail / 0 warn（3.7 断言对新版本号绿）

环境波折（均已按预案处理）：
- `npx remotion browser ensure` 首跑 600s 无进展（`~/.remotion` 未创建），按工单停掉重试 1 次；重试发现首次下载实际已落在 `node_modules/.remotion/`（模板内路径，非 `~/.remotion`），202MB chrome-headless-shell 就位，未动用系统 Chrome 兜底。
- 模板 `public/` 无 footage.mp4（素材不进 git 是仓规）。用 ffmpeg 生成同规格 demo 底材 `testsrc2 2560x1440@60fps 30.5s`，FootageOverlay 的 `getVideoMetadata` 实测读出 1830 帧与 cues 注释的 30.5s 一致；CoverV3 默认 props 依赖的 `cover/hero.png` 同样以 ffmpeg 占位图补齐。核查完已随清场删除。

## 基线清单与 PSNR 表

帧号按 `src/cues.ts` demo 时间轴 × footageParams(60fps) 计算；「进」=出现后 0.3s，「出」=消失前 0.3s。基线目录 `skills/video-motion/templates/remotion-app/.baseline/`（两版本各一套，PNG 已 gitignore）。

| 帧 | 帧号 | 内容 | PSNR |
|---|---|---|---|
| fo-sub1-in-f66 | 66 | 字幕1「上隧道出口推进」出现后 0.3s（1.1s） | inf dB |
| fo-sub1-out-f150 | 150 | 字幕1 消失前 0.3s（2.5s） | inf dB |
| fo-sub8-in-f1638 | 1638 | 末条字幕「击杀贡献」出现后 0.3s（27.3s，与数据柱同屏） | inf dB |
| fo-bars-in-f1626 | 1626 | 数据柱组（t=26.8s）升起后 0.3s | inf dB |
| fo-bars-late-f1770 | 1770 | 数据柱后段稳定相位（29.5s） | inf dB |
| fo-box-in-f270 | 270 | 圈注 box「双杀时刻」（t=4.2s）出现后 0.3s | inf dB |
| fo-box-out-f384 | 384 | 圈注 box 消失前 0.3s（6.4s） | inf dB |
| fo-circle-in-f690 | 690 | 圈注 circle「安放 C4」（t=11.2s）出现后 0.3s | inf dB |
| fo-arrow-in-f1002 | 1002 | 圈注 arrow「倒计时 40 秒」（t=16.4s）出现后 0.3s | inf dB |
| cover3-f60 | 60 | CoverV3 默认 props（独立入口 src/cover3-index.ts） | inf dB |

覆盖度：字幕 3 帧（进/出/末条）、数据柱 2 帧、圈注 4 帧（box 进出 + circle 进 + arrow 进），共 9 帧 FootageOverlay + 1 帧 CoverV3 = 10 帧（≥8 达标）。

PNG 绝对路径（CVIX 工单读图目检用，两版本同名同帧号）：

```
C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app\.baseline\4.0.518\fo-sub1-in-f66.png
C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app\.baseline\4.0.518\fo-sub1-out-f150.png
C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app\.baseline\4.0.518\fo-sub8-in-f1638.png
C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app\.baseline\4.0.518\fo-bars-in-f1626.png
C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app\.baseline\4.0.518\fo-bars-late-f1770.png
C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app\.baseline\4.0.518\fo-box-in-f270.png
C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app\.baseline\4.0.518\fo-box-out-f384.png
C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app\.baseline\4.0.518\fo-circle-in-f690.png
C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app\.baseline\4.0.518\fo-arrow-in-f1002.png
C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app\.baseline\4.0.518\cover3-f60.png
C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio\skills\video-motion\templates\remotion-app\.baseline\4.0.533\（同清单 10 张，同名同帧号）
```

说明：底材为 ffmpeg testsrc2 彩条噪声图，动效层（字幕/数据柱/圈注/CoverV3 全部矢量与文字渲染）才是 Remotion 渲染管线的考查对象；PSNR inf 证明新版对该层的渲染逐位等价。目检时忽略底材内容，看动效层相位即可。

## compositions 对照

| id | fps | 尺寸 | 帧数 | 4.0.518 | 4.0.533 |
|---|---|---|---|---|---|
| Stage0Test | 30 | 1920x1080 | 90 | ✓ | ✓ 一致 |
| FootageOverlay | 60 | 2560x1440 | 1830 (30.50s) | ✓ | ✓ 一致 |
| DeckVideo | 30 | 1920x1080 | 252 (8.40s) | ✓ | ✓ 一致 |
| DeckVideoV2 | 30 | 1920x1080 | 252 (8.40s) | ✓ | ✓ 一致 |
| SubtitleDemo | 30 | 1920x1080 | 150 (5.00s) | ✓ | ✓ 一致 |
| DataBarsDemo | 30 | 1920x1080 | 150 (5.00s) | ✓ | ✓ 一致 |
| SpotlightDemo | 30 | 1920x1080 | 150 (5.00s) | ✓ | ✓ 一致 |

原始输出存 `.baseline/<版本>/compositions.txt`。

## API 探针结论

node + 浏览器双环境实测（浏览器内经临时 probe composition 渲一帧、console.log 透传终端；fitText 因 measureText 必须浏览器环境）。两版本形状逐条一致：

| API | 实测返回形状 | vs SKILL.md 记录 | 4.0.533 结论 |
|---|---|---|---|
| `@remotion/paths` evolvePath(0.5, "M 0 0 L 100 0") | `{strokeDasharray:"100 100", strokeDashoffset:50}`（dash 属性对，非裁剪 path） | 一致 | 形状不变 |
| `@remotion/paths` interpolatePath(value, from, to) | 三独立参数 → path 字符串 "M 0 0 L 50 50" | 一致 | 形状不变 |
| `@remotion/layout-utils` fitText({text, withinWidth, fontFamily}) | `{fontSize}` 对象（实例 83.67653788324509，两版本同值） | 一致 | 形状不变 |
| `@remotion/captions` parseSrt({input}) | `{captions:[{text,startMs,endMs,confidence,timestampMs}]}` 毫秒制 | 返回形状一致；**新增实测**：入参是 `{input}` 对象，裸字符串报 `undefined.split` | 形状不变（入参形状已补记 SKILL.md） |

## 改动清单

| 文件 | 改动 |
|---|---|
| `skills/video-motion/templates/remotion-app/package.json` | 17 个 remotion 族依赖 4.0.518 → 4.0.533（精确版本，无 ^） |
| `skills/video-motion/templates/remotion-app/package-lock.json` | 随 npm install 同步 |
| `skills/video-motion/SKILL.md` | 仅两行版本事实：版本铁律示例号 4.0.533；「4.0.518 API 事实」→「4.0.533 API 事实」并附升级对照结论 + parseSrt 入参形状；其余一字未动 |
| `.gitignore` | 增补 `skills/video-motion/templates/remotion-app/.baseline/`（核查产物不入库） |

临时产物（已全部清除）：probe composition（remotion/probe-index.tsx）、demo 底材 public/footage.mp4、占位截图 public/cover/、node_modules（模板纯净态）。

## 提交

```
deb0683 build(skills): video-motion 升级 Remotion 4.0.518→4.0.533 / bump remotion with baseline verification
4 files changed, 393 insertions(+), 355 deletions(-)
```

提交后 `git status` 干净，无未跟踪残留。

## 遗留问题

1. **`.baseline/` 仍在磁盘**（约 7.3MB×2）：按工单保留供 CVIX 读图目检；若后续工单确认不再需要，可整体删除（已 gitignore，不影响仓库）。
2. **浏览器下载落点**：chrome-headless-shell 实际下载到模板 `node_modules/.remotion/` 而非 `~/.remotion`——首次 ensure 卡 600s 无日志但实际已落盘，重试即命中。后续工程再遇「ensure 无输出」先查模板内该路径再判卡死。
3. **demo 底材是 testsrc2**：PSNR 对照证明的是动效层渲染等价；若未来升级出现底材解码层差异，此方法仍能捕捉（OffthreadVideo 解码帧也参与 PSNR），但 inf dB 的结论限定本 demo 素材。

## 自评：达标

验收项逐条：基线 10 帧 ≥8 ✓ · PSNR 逐帧行对照表 ✓ · typecheck exit 0（升级后）✓ · compositions 前后一致表 7/7 ✓ · API 探针四条逐项结论 ✓ · SKILL.md 版本事实更新 ✓ · 1 个 commit + git status 干净 ✓ · 渲染未受阻（浏览器就位）✓ · 红线未触碰（未动 web-capture/publish/docs，node_modules 已删，重试 ≤1 次，只 add 本工单 4 文件）✓
