# CPYC · 简历副本操作加确认弹层

## 背景
`apps/web/src/components/dashboard/resume-list.tsx` 的「创建副本」按钮（Copy 图标，handleCopy 函数）
目前点击立即执行。删除按钮已有确认弹层模式（deleteTargetId + dialogRef，含焦点管理：打开焦点入层、
Esc/关闭后焦点归还触发按钮）。副本应与删除交互对齐，防误触。

## 要求
1. 点击副本按钮 → 打开确认弹层（复用现有弹层的样式与焦点管理模式，文案区分于删除：
   标题「创建副本」，正文「将以「(副本)」后缀克隆此简历与其设计稿，确认创建？」，
   确认按钮铜色，取消按钮 outline）
2. 确认后才调用现有 handleCopy(r)；copyingId loading 态保持在确认按钮上
3. Esc / 点击遮罩 / 取消按钮 → 关闭并焦点归还副本触发按钮
4. 不改变 handleCopy 内部逻辑、不碰删除逻辑、不碰封面渲染

## 禁止
- 不碰 upload/page.tsx（另一并行任务在改）
- 不 git commit、不跑 install/build

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\CPYC-report.md`。
