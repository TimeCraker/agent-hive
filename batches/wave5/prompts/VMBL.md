# 任务 VMBL：video-motion Remotion 升级安全网（still 基线 + 升级 + 全链对照）

## 背景（已核实事实，勿重新考古）
- 仓库：`C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio`（Git 仓，master，HEAD 71a320b，工作树应干净）
- 模板：`skills/video-motion/templates/remotion-app/`（Remotion 应用；今天 71a320b 刚完成：17 个 remotion/@remotion/* 依赖**精确锁 4.0.518 不带 ^**、devDependencies 有 typescript 5.9.3 与 @types/react 19.2.18、`npm run typecheck` 可用且当前 0 错、engines node>=18）
- `scripts/check-docs.py` 第 3.7 断言强制 @remotion/* 精确同版无 ^（改版本必须 17 个一起改，且全部精确）
- `skills/video-motion/SKILL.md` 的「版本铁律」条目（MG 武器库一节，约 L89-90）记录了 **4.0.518 的 API 实测事实**：`evolvePath` 返回 dash 属性对非裁剪 path；`interpolatePath(value, from, to)` 三独立参数；`fitText` 只吃 withinWidth 且返回 `{fontSize}` 对象；`parseSrt` 返回 `{captions:[{text,startMs,endMs}]}` 毫秒制
- 本机 **无 Remotion 浏览器缓存**（`~/.remotion` 不存在），首次渲染需 `npx remotion browser ensure` 从 Google 源下载数十至百 MB（China 网络风险）；系统 Chrome 在 `C:\Program Files\Google\Chrome\Application\chrome.exe`，渲染命令加 `--browser-executable` 可指过去兜底
- 机器有 ffmpeg/ffprobe；npm registry 走模板 `.npmrc` 指定的 npmmirror
- 官方最新版本本环境只确认到 ≥4.0.520，精确版本号由你现场查

## 任务一句话
先用 4.0.518 渲一组 still 基线，再升级 Remotion 到最新并全链对照（typecheck / compositions / API 形状 / PSNR），最后更新 SKILL.md 版本事实；升级被证伪则回滚并保留证据。

## 步骤
1. `cd skills/video-motion/templates/remotion-app && npm install --no-audit --no-fund`（缓存可能已热）
2. `npx remotion browser ensure`：失败重试 ≤1 次；仍失败则渲染命令统一加 `--browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"`；两条路都不通 → 跳过一切渲染步骤（仍完成升级/typecheck/compositions/API 探针），渲染对照标「受阻」并写明
3. **基线（4.0.518）**：
   a. `npx remotion compositions remotion/index.ts` 记录每个 composition 的 id/durationInFrames/width/height/fps（存文本）
   b. 选 demo 数据渲 **8~10 张关键帧 still**，覆盖三类动效的进出相位：FootageOverlay 的字幕/数据柱/圈注各至少 2 张（帧号按 src/cues.ts 的 demo 时间轴算，含出现后 0.3s 与消失前 0.3s），外加 `src/cover3-index.ts` 的 `CoverV3`（默认 props，`--frame=60`）1 张；命令形如 `npx remotion still remotion/index.ts FootageOverlay <out>.png --frame=<n>`
   c. 基线存 `.baseline/4.0.518/`（模板目录下）
4. **查新版**：`npm view @remotion/cli version`；然后逐个确认 17 个 remotion 族包（remotion + 16 个 @remotion/*，以 package.json dependencies 现有清单为准）在该版本都存在（`npm view <pkg>@<版本> version`）
5. **升级**：package.json 17 个版本全部改为新精确版本（保持无 ^）→ `npm install` → `npm run typecheck` 必须 exit 0
6. **API 探针**：node 实测四个 API 返回形状（@remotion/paths 的 evolvePath/interpolatePath、@remotion/layout-utils 的 fitText、@remotion/captions 的 parseSrt），与 SKILL.md 记录逐条对照，结论写报告（「记忆里的 API 不可信，先打真实返回形状」是本仓铁律）
7. **对照**：
   a. `npx remotion compositions` 与步骤 3a 记录逐项一致（帧数/宽高/fps 不变）
   b. 同帧号重渲 still 到 `.baseline/<新版>/`，ffmpeg PSNR 逐帧对比（`ffmpeg -i a.png -i b.png -filter_complex psnr -f null -`）：**≥36dB 过**；30~36dB 需附差异定性说明（抗锯齿级噪声可过，结构性差异不过）；**<30dB 或结构性差异 → 回滚 4.0.518**（恢复 package.json/lock + npm install + typecheck 复验），升级判「不采纳」
8. **SKILL.md 版本事实更新**（本工单唯一允许改 video-motion SKILL.md 的内容）：版本铁律里的示例版本号、MG 节「4.0.518 API 事实」改为新版本号与实测结论；其余内容一字不动
9. **gitignore**：`.baseline/` 目前不在忽略规则内（vibe-studio/.gitignore 只全局忽略 mp4/pptx/pdf 等）——给 .gitignore 加一行 `skills/video-motion/templates/remotion-app/.baseline/`（核查产物不入库是仓规）
10. **清场**：删 node_modules；`git status` 确认除预期改动外无未跟踪残留
11. **提交**：package.json / package-lock.json / SKILL.md / .gitignore；Conventional Commits 中英对照，如 `build(skills): video-motion 升级 Remotion <旧>→<新> / bump remotion with baseline verification`。若升级被回滚：提交基线设施（.gitignore 行 + 说明进报告），SKILL.md 无版本变化则不入提交，如实报告

## 红线
- 不碰 skills/web-capture、skills/publish 等其他 skill；不动 `docs/**`（workorder-log 主控补记）
- 结束前必须删 node_modules（模板纯净态）；.baseline/ PNG 不入 git
- 大文件下载/渲染失败不无限重试（浏览器下载重试 ≤1 次）
- 并行施工：同仓有其他会话在别的目录工作，只 add 自己清单内文件；`index.lock` 冲突等 10 秒重试 ≤3 次

## 验收标准（数字化）
- 基线 ≥8 帧 + PSNR 逐帧行的对照表（或受阻证据链）
- `npm run typecheck` exit 0（升级后）
- compositions 前后一致表（每行 id/帧数/宽/高/fps）
- API 探针四条逐项结论（形状不变/已变+新形状）
- SKILL.md 版本事实更新（或回滚完整证据）
- 1 个 commit（或回滚情形的替代提交），`git status` 干净

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\VMBL-report.md`
结构：# VMBL 结果报告 / ## 结果摘要（升级采纳|回滚|部分受阻）/ ## 基线清单与 PSNR 表 / ## compositions 对照 / ## API 探针结论 / ## 改动清单 / ## 提交 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
**注意**：报告里写清 `.baseline/` 下所有 PNG 的绝对路径（后续 CVIX 工单要读图目检）。
