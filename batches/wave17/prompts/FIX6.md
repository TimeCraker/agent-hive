# 任务 FIX6：免责去重 + 横幅语境 + hero meta 精简（EYE2 P1-5 / P2-12 / P2-13 / P2-14）

一句话任务：按 EYE2 密度体检报告（`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\EYE2-report.md`，可读）修 `App.tsx` 与 `SecurityBanner.tsx` 的四条：免责语系统性重复、安全横幅语境错位与移动端冗长、hero meta 重复。

## 背景（已核实事实）

- 「非本机实测/行业参考」类免责在 global 视图 5 处、「本地存储/不可比」在 bench 视图 3 处（EYE2 P1-5 有逐处定位）；**测试对 FOOTER_BENCH/免责语零断言**（主控已核实），可自由去重。
- SecurityBanner 当前双视图渲染（能力榜视图不需要「连接方式」语境横幅，EYE2 P2-13）。
- 本仓 `C:\Users\TimeCraker\Desktop\my_workspace\coding-plan-bench`；Swiss 契约 `globals.css` 冻结禁改；并行 FIX7/8/9 在改其他文件。

## 改造指令（EYE2 处方）

1. **P1-5 免责去重**——每视图保留两处（hero desc 首次告知 + footer 收尾）：
   - bench 视图：footer 只留 colophon mono 制式行（含「数据仅存浏览器本地」一次），**删除 FOOTER_BENCH 段落渲染**（import 一并删；方法学 05 格已承载该事实）；hero 副标题保留
   - global 视图：hero desc（已含「不是本机实测」）+ footer 一行免责（App.tsx 内 global footer 文案）——删除 hero meta 行里的重复口径句（若 App.tsx:104 附近有「TTFT · TPS · TOTAL — 同条件三指标对比」且副标题已解释三指标，meta 行只留页码记号 `BENCH — 01` / `GLOBAL — 02`，即 P2-14）
   - 注意：`GlobalLeaderboard.tsx` 内的免责（面板右标/SRC 尾句）归 FIX9，你不碰
2. **P2-13 横幅语境**：SecurityBanner 仅 `view === "bench"` 时渲染
3. **P2-12 横幅紧凑**：横幅主体压至最多两行可见（文案 `line-clamp-2` 或排版收紧），移动端不再折 3-4 行；「关闭安全说明」钮与「下载本地版」链接保持可达
4. 动效铁则照旧（150-300ms 只动 transform/opacity/color）

## 红线

- **只改 2 文件**：`site/src/App.tsx`、`site/src/components/SecurityBanner.tsx`。copy.ts/globals.css/其他组件禁碰
- 不做 git 操作；不起 dev server；不跑 npm install
- e2e 锚点：button「测速台」「能力榜」、link「GitHub」、button「关闭安全说明」保留（FOOTER_BENCH 渲染删除不影响任何测试——已核实零断言）
- Windows 11 + PowerShell；China 网络重试 ≤2

## 验收标准

1. `npx tsc --noEmit` 自文件零类型错误；eslint 两文件零 error
2. 免责计数：bench 视图可见「本地/浏览器存储」语义 ≤ 2 处、global 视图「非本机实测/行业参考」≤ 2 处（报告 grep 实证）
3. SecurityBanner 在 global 视图零渲染（报告说明实现方式）
4. hero meta 行无指标重复句

## 报告要求

完成后**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FIX6-report.md`

模板：`# FIX6 结果报告` / `## 结论一句话` / `## 改动清单` / `## 免责计数前后对照` / `## 自检结果` / `## 遗留`
