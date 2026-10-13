# AUDITP · 线上六幕多模态审计

## 你是多模态审图任务（glm-5.3-flash）

## 前置：PRODUI 已产出线上截图

## 输入
- 线上截图：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/produi/`（act1..act6 desktop/mobile）
- 本地基准：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/motion/`（同幕定格）
- 认可基准：`.../my-portfolio/docs/design/character-homepage/home-completion-v1/README.md` 等设计资产

## 审计项（逐幕三对照：线上 vs 本地 vs 认可稿）
1. 素材一致：线上原画/轻量素材与本地一致，无缺图/破图/错误版本素材（部署遗漏信号）
2. 构图一致：布局/字号/间距无 CSS 顺序退化；人物姿势定格合理
3. 人物完好：脸部/手部无变形混合；图层遮挡一致
4. 手机轻量布局在线上同样生效
5. 明显性能视觉病：明显白块/未优化巨图直出/布局跳动痕迹

## 产出
- P0-P3 分级清单（每条：线上截图路径 + 与基准差异描述 + 建议）
- 结论：线上美术与认可版本一致性判定

## 红线
- 只审图；不臆测截图外行为；结论必须指向具体截图

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AUDITP-report.md`。
