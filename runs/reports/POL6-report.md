# POL6 结果报告

## 结论一句话

三文件改造全部完成：nav 底线式 tabs 改为墨线外框方格 segmented（选中格墨底纸字 + 珊瑚方点，nav 2px 底线移除走「更简」分支）、global hero 白话化、SecurityBanner 收敛单行制；tsc 全项目零错误、eslint 三文件零 error、四项禁词全零、e2e 锚点四项齐全。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `site/src/components/Sidebar.tsx` | nav 从「2px 墨底线 + 珊瑚选中底线 tabs」改为方框 segmented；外层 2px 墨底线移除；masthead 块零改动 |
| `site/src/App.tsx` | 仅 `heroConfig.global` 的 title/desc 两行白话化；hero 结构（h1 消费 `APP_TITLE`、desc `max-w-[60ch]`、hairline + 视图记号行）与 footer（`FOOTER_BENCH`）零改动 |
| `site/src/components/SecurityBanner.tsx` | 整体重写为一行制：去掉 lbl-mono eyebrow 行，左轨 4px→3px，「下载本地版」改用 `LOCAL_APP_DOWNLOAD` 常量并取消移动端隐藏 |

## 结构说明

**segmented 最终结构**（Sidebar.tsx nav）：

- **外框**：`border-[1.5px] border-ink` 墨线外框包裹整组，自带结构线——据此选了「去掉 nav 2px 底线」分支（页面更简优先）；sticky 背景仍 `bg-paper` 全不透明
- **分格**：两格之间 `border-l border-line-2`（1px 发丝分隔，仅第 2 格起加）；移动端容器 `inline-flex w-full` + 格 `flex-1 justify-center` 两格等宽撑满，桌面 `md:w-auto` + `md:flex-none` 内容自适应收缩
- **选中态**：`bg-ink text-paper`（墨底纸字）；格内几何方点保留，选中格方点统一转 `bg-accent` 珊瑚（墨底上原 run 蓝对比度仅 ~2.4:1 不可辨；珊瑚在墨底 ~3.3:1，且延续「选中=珊瑚全局语义」的 EYE P0 决策）——未选格方点保留 per-tab 语义色（run 蓝 / 珊瑚）
- **未选态**：`text-ink-2 hover:text-ink hover:bg-panel-2`；动效仅 `transition-colors`
- **触达**：桌面 py-2.5 紧凑；移动端由 globals.css 全局 `min-height: 44px` 兜底
- **a11y**：按钮保持原生 `<button type="button">`，未加 `role="tab"`——e2e 用 `getByRole("button", { name: /能力榜/ })` 定位，加 role 会破坏锚点

**SecurityBanner 一行制**：`border-l-[3px] border-l-accent` 珊瑚轨 + 单句 `text-[13px] text-ink-2`（`min-w-[16ch] flex-1` 保证折行成块）+ 右侧动作簇（下载本地版 link + 关闭钮，mono 小方钮 hover 墨反白）；移动端最多折「句子行 + 动作行」两行，不再三行堆叠；下载链接取消原 `hidden sm:inline-flex`，移动端常显（本地版是移动端 Key 安全出口）。

## 自检结果

| 项 | 结果 |
|---|---|
| `npx tsc --noEmit`（site/） | exit 0，全项目零输出（无并行波次报错） |
| `npx eslint` 三文件 | exit 0，零 error 零 warning |
| `rounded-` / `gradient` / `backdrop-blur` / `lucide`（三文件，大小写不敏感） | 全部 0 次 |
| e2e 锚点①button「测速台」「能力榜」 | ✓ 保留（文本与原生 button role 未变） |
| e2e 锚点②link 含「GitHub」 | ✓ masthead 未动 |
| e2e 锚点③button「关闭安全说明」 | ✓ aria-label + 文本保留 |
| e2e 锚点④FOOTER_BENCH 原文渲染 | ✓ footer 块未动 |

## 遗留与建议

- nav 2px 墨底线移除后，sticky 区下缘无线条提示遮挡边界（纯纸底）——符合「segmented 自带框、页面更简」的取舍；若实机滚动观感不适，恢复只需在 nav 元素加回 `border-b-2 border-ink` 一处
- 未做浏览器实机截图验证（红线禁起 dev server）；结构正确性由 tsc/eslint/锚点核对覆盖，视觉终验留给主控 EYE 波次
- copy.ts、globals.css、其他组件零触碰；未做 git 操作
