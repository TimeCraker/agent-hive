# 任务 RDLC：README 记 Remotion license 口径

## 背景（已核实事实，勿重新考古）
- 仓库：`C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio`（Git 仓，master，工作树应干净）
- `skills/video-motion` 用 Remotion（source-available，非开源 OSI 意义）：**个人与 ≤3 人团队免费，4 人及以上公司用于商业用途需购买 license**（Remotion 官方 license 页口径；Remotion 4.x 一直如此）
- vibe-studio 服务商业矩阵（AsterForge 产品线），团队扩大前要把这行提醒固化进 README，避免未来踩雷
- README.md 是仓库结构/skill 清单的单一事实源，`python scripts/check-docs.py` 对它有结构树/安装循环/计数断言——改动不得破坏这些

## 任务一句话
vibe-studio README 合适位置加一行 Remotion license 提醒（含查证口径来源），check-docs 保持 0 fail。

## 步骤
1. 读 `README.md` 全文，选最合适的位置（使用/依赖/边界说明附近，不破坏结构树围栏与技能表）
2. 尝试联网核对最新口径（remotion.dev 的 license 页）；**网络不通就用上述已知口径写，并注明「以 remotion.dev/license 页为准」**，不许编造具体价格数字
3. 一两行内写完：免费界限（≤3 人）、公司用途需授权、查证来源指引
4. `python scripts/check-docs.py` 必须 0 fail 0 warn（临时增改不得引入新断言失败）
5. 提交：只 `git add README.md`，如 `docs(readme): 记 Remotion license 口径 / note remotion licensing terms`

## 红线
- 只改 README.md 一个文件
- 不许写具体价格/版本号细节（拿不到一手来源就保持口径级表述）
- 不动其他文件；并行施工 `index.lock` 冲突等 10 秒重试 ≤3 次

## 验收标准（数字化）
- README 有 license 提醒行，位置合理（不破坏表格/结构树）
- check-docs 0 fail 0 warn（证据进报告）
- 1 个 commit，`git status` 干净

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\RDLC-report.md`
结构：# RDLC 结果报告 / ## 结果摘要 / ## 改动内容 / ## 验证证据 / ## 提交 / ## 自评（达标|部分达标|未达标 + 原因）
