# 任务：工作区根文档一致性审计（Wave 8 · ROOTDOC）

## 背景与目标
C:/Users/TimeCraker/Desktop/my_workspace 根目录的 CLAUDE.md 与 AGENTS.md 是全部子仓会话的导航地图，今天被多个会话多次改写（video-script-workflow 归属、config 重组、agent-hive 更名太木等）。你的任务：**逐行核对根文档的项目地图与边界描述，过期的当场修正**。

## 步骤
1. 读根 CLAUDE.md + AGENTS.md 全文，摘出全部可验证陈述（项目定位/路径/技术栈/远端名/归档锚点）
2. 逐行实地核对：每个子仓真实存在？定位描述与其实际 git 活动/文档一致？archive/ 锚点指向的仓存在？
3. 过期 → 当场改写；矛盾（如 video-script-workflow 归属两种说法）→ 实地裁决后统一
4. 报告写入 `C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/ROOTDOC-report.md`

## 重点核对
- 项目地图 14 行逐行核对（含刚更新的 agent-hive 太木行）
- video-script-workflow 归属矛盾（并入 vibe-studio vs 独立仓）——以其实际 git 远端为准裁决
- config/ 子目录清单 vs 实际目录
- archive/ 锚点文件 vs 被指向路径的存在性

## 红线
- 只改 `C:/Users/TimeCraker/Desktop/my_workspace/CLAUDE.md` 与 `C:/Users/TimeCraker/Desktop/my_workspace/AGENTS.md` 两个文件；不碰任何子仓
- 不虚构；无法实地验证的标「待人工确认」
- 根目录不是 git 仓库，无需 commit

## 验收标准
- 项目地图每行与实况一致；无归属矛盾；报告含修正清单表

## 报告要求
写入 `C:/Users/TimeCraker/Desktop/my_workspace/agent-hive/runs/reports/ROOTDOC-report.md`：修正清单表 + 核对过无误的条目 + 自评
