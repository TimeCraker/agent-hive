# BTN · 上传页「从零开始构建」入口按钮可点性美术

## 问题
`apps/web/src/app/(dashboard)/upload/page.tsx` 约 246-268 行：peach 侧栏（`.folio-intake-note`）里的
`Button variant="outline"`（内容：MessageCircle 图标 chip + 「没有简历？从零开始构建」+ 说明文字 + 右侧 Sparkles）。
用户实测反馈：**完全看不出可以点**——outline 变体的灰边框在 peach 底上隐形，无 hover 反馈，无箭头指示。

## 美术方向（editorial/folio 语言：铜色 primary-deep + 米色 + mono 图注，无渐变无大圆角）
把这张卡做成有明确按钮特征的可点入口，静态时就能看出可点：

1. **卡面**：`bg-card`（白/米白）与 peach 底形成明度对比；边框 `border-[var(--primary-deep)]/25`
2. **hover**：`-translate-y-0.5` 浮起 + `var(--folio-shadow)` 阴影 + 边框加深到 `/50`；`active` 回落
3. **箭头指示**：右侧 `Sparkles` 换成 `ArrowRight`（lucide），铜色 `text-primary-text`，
   `group-hover:translate-x-1` 滑动（Button 加 `group` 类）
4. **左图标 chip**：`bg-primary-deep/10` 加深为 hover 时 `/15`，圆环 `ring-1 ring-[var(--primary-deep)]/20`
5. **cursor-pointer** 显式声明；`focus-visible:ring-2 focus-visible:ring-[var(--primary-deep)]/40` 可达性
6. **加载态保留**：vibeLoading 时 Loader2 旋转 + disabled 样式
7. （可选加分）卡底部加一行 mono 小字 CTA：`START FROM SCRATCH →` 风格 eyebrow，铜色

## 禁止
- 不改 handleVibeStart 逻辑、不碰 FileUpload 组件
- 不碰 resume-list.tsx（另一并行任务在改）
- 不 git commit、不跑 install/build

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\BTN-report.md`。
