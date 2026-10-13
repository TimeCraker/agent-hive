# PERFF2 · 最后一杠杆：about-poster 发现时刻前移（主控裁决批准）

## 背景（PERFF §6 第 4 条）
PERFF 后冷 LCP 5436ms 停在传输地板；PERFF 已识别但未实施（超其批准范围）：
**LCP 元素 about-poster 是 lazy，发现于 1504ms**——fetchpriority=high 改不了发现时刻。
升级为 eager+preload（media 限定手机）可把发现时刻 1504→~210ms，PERFF 预判 LCP ~4-4.5s。

## 任务（小而准）
1. 实施：about-poster 升级 `priority`（或等效 eager+`<link rel=preload as=image fetchpriority=high
   media=...>` 手法）——**预载限定手机断点**（PERFF 已注代价：桌面动效模式会多预载
   1200w avif ~50KB，用 media/sizes 控制不产生桌面浪费）
2. 同口径复测：CDP 冷缓存 ≥3 轮（与 PERFF §1 完全同环境/节流）——LCP/FCP/字节/请求；
   暖 1 轮确认无退化
3. 快速回归：手机首屏 CLS=0、桌面六幕滚到尾/反向回落一次、899↔900 边界 3 轮抽测
   （contexts 恒 1 口径）
4. 其余 PERFF 改动已在工作树（3 文件）——你的改动叠加其上，**全部不 commit**
5. typecheck + lint + 动作单测 23 个

## 判定口径
- LCP 进入 ≤4.6s（预判区间）→ 采纳；若意外无改善或引入回归（CLS>0 / 桌面多载>100KB）→
  撤回该改动并说明，保留 PERFF 其余成果

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PERFF2-report.md`
（简短：diff、冷/暖数据、回归结果、采纳/撤回结论）。证据并入
`portfolio-release-followup-2026-10-11/perff/`（新子目录 perff2/）。
