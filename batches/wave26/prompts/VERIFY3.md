# VERIFY3 · 线上核验与收尾证据（前置：DEPLOY3 已验收）

## 范围（线上最终版本，全只读）
1. **锚点终验**（ANCHOR 修复的线上版）：新标签+页内 ×4 锚点；#tech 前进后退 ≥5 次全程记录；
   慢加载落点 ≤10px 偏差；#vote 专项（原 81px 偏移是否消除）
2. **切换回归**：第 2/3/4/6 幕动态⇄静态+减少动态，章节保留
3. **宽度与布局**：320/390/899/900/1440 无横向溢出；手机配图与项目入口可用；六幕关键定格截图
   对照上轮线上基准（含 Codex SVG 改动的画面无退化——正反向各 ≥2 幕）
4. **899↔900 往返 ≥10 次**：资源无持续增长（contexts 去重恒 1 口径）
5. **线上性能终测**（PERFCAL 同法对最终版本）：桌面真节流 CPU4x 三轮 + 手机冷加载三轮；
   与 PERFCAL（7bee441 线上）和 Codex 本地基线三方对比
6. 构建/单测结果复核引用（不重跑已过的门禁）；日志健康 + 短时探测 3×3
7. 汇总证据清单供主控写 HANDBACK（不写 HANDBACK 本身）

## 红线
只读；自动化副作用披露；真机项维持未测清单

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\VERIFY3-report.md`。
证据：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-closeout-2026-10-12/verify3/`
