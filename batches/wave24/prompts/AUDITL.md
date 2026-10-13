# AUDITL · 六幕美术多模态审计（本地截图 vs 认可基准）

## 你是多模态审图任务（glm-5.3-flash）

## 输入
- 待审截图：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/motion/`（MOTION 任务产出：act1..act6 桌面+手机定格，文件名含 act 与 desktop/mobile）
- 认可基准：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio/docs/design/character-homepage/home-completion-v1/README.md` 与
  `home-fluidity-v1/README.md` 及其引用的设计资产（用读图能力逐一打开对照）

## 审计项（逐幕，桌面与手机分开给结论）
1. 人物：中间脸部无变形、不混两张脸/两套手；Q 版姿势合理；关节/衣摆无破面
2. 图层一致性：文字/角色/物件遮挡关系与进度一致，无错序悬浮
3. 素材齐全：各幕原画/轻量素材已加载（无破图占位/空白区域/alt 文本裸露）
4. 排版：中文换行、字号层级、幕间过渡定格构图与认可稿一致；无 CSS 顺序退化（错位/叠压/掉样式）
5. 手机截图：轻量布局正确（未强上桌面 WebGL 大图），可读性达标

## 产出
- P0（不可上线级）/P1（应修）/P2（可延后）/P3（提示）分级清单，每条附：截图路径 + 问题描述 + 建议修法
- 结论：六幕美术整体是否与认可版本一致（可直接上线 / 需修复后上线）

## 红线
- 只审图不改码；不臆测截图外的行为；每条结论必须指向具体截图证据

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AUDITL-report.md`。
