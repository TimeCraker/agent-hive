# SHELL 结果报告

## 结论一句话

应用壳已从「玻璃侧边栏 SPA」重构为 agent-hive 同款 Swiss Industrial Print 壳层（masthead + sticky 导航 + 1240px 单列 wrap），主题切换与 theme-boot 引导全部清退，e2e 语义锚点一字未动，tsc / eslint / 自检 grep 全绿。

## 改动文件清单

| 文件 | 改动 |
|---|---|
| `site/src/App.tsx` | 删除三块 fixed 背景装饰（grid-bg 网格层 + 两颗 drift 径向光斑）与全部内联 style 色值；侧边栏 flex 布局改为单列 wrap（`max-w-[1240px] px-4 md:px-9`）；主题 state / `handleTheme` / `toggleTheme` import 全部移除（`initTheme` 移至 main.tsx）；hero 排版改 Swiss（h1 `font-disp` 收紧 + 描述 `text-ink-2` 14px/1.6）；错误框改 panel 底 + 发丝线 + 3px bad 红左轨（`role="alert"` 保留）；footer 改左对齐发丝线顶边。view 切换与全部 hooks/props 逻辑零改动 |
| `site/src/components/Sidebar.tsx` | 整文件重写：删除桌面侧边栏 + 移动端双导航 + 主题切换按钮，导出 `Masthead`（`View` 类型继续从这里导出，App.tsx 消费不变）。新结构 = masthead（16px 珊瑚 mark 内嵌 3px 纸色 inset + 「Coding Plan Bench」font-disp 22px/700/-0.03em 字标 + mono 副行「CPB · 可信测速台」+ 右侧描边 mono 徽章列 `profile · cpb-standard@1` 与 GitHub 链接）+ sticky 导航（`top-0` 纸底不透明 + 2px 墨底线 + 测速台/能力榜 tabs，`.st-dot` 方点 run 蓝/accent 珊瑚，选中 2px 同色底线压墨线）。lucide-react import 清零 |
| `site/src/components/SecurityBanner.tsx` | 玻璃横幅改 Swiss 信息横幅：panel 底 + `border-line-2` 发丝线 + 左 3px 珊瑚色轨；正文 `text-ink-2`；关闭按钮从 X 图标改 mono 描边小方钮（可见文本 + aria-label 均为「关闭安全说明」，一字不改）；「下载本地版」链接保留 href/rel，视觉改 `text-accent` |
| `site/src/main.tsx` | 渲染前调用一次 `initTheme()`（挂 data-theme，单浅色主题无闪烁需求） |
| `site/index.html` | 删除 `<script src="/theme-boot.js"></script>` |
| `site/public/theme-boot.js` | 删除文件（单主题无需防闪烁引导） |

## 布局结构说明

```
<div min-h-screen bg-paper>                    ← 纸感底（点阵纹理在 body 上，无装饰层）
  <header masthead>                            ← max-w-1240 wrap，pt-6/32
    mark(16px 珊瑚方块 + 3px 纸色 inset) + 字标堆叠(22px disp / mono 副行)
    + ml-auto 徽章列[profile·cpb-standard@1 | GitHub 链接（描边 mono 小徽章）]
  <nav sticky top-0 z-100 bg-paper border-b-2 border-ink>
    tabs（overflow-x-auto 横向可滚动）：
      测速台 = st-dot bg-run + 选中底线 bg-run
      能力榜 = st-dot bg-accent + 选中底线 bg-accent
      选中底线用 absolute inset 定位（不用负 margin，overflow 滚动容器内不裁切）
  <div wrap max-w-1240 px-4/36 pb-14>
    <SecurityBanner>                           ← panel + 发丝线 + 3px 珊瑚左轨，可关闭
    <section hero>                             ← h1 font-disp + text-ink-2 14px/1.6 max-w-2xl
    <main>                                     ← view === bench / global 原样切换
    <footer>                                   ← 发丝线顶边 + text-ink-3 11.5px
```

- 桌面/移动同一顶部结构（无媒体断点分叉，仅 masthead 字标 18→22px、wrap 留白 16→36px、徽章换行）
- 导航背景 `bg-paper` 不透明，滚动内容被完全遮住；tab 选中底线与墨线重叠处形成「色条压墨线」的 agent-hive 同款语言

## 自检结果

1. **tsc**：`npx tsc --noEmit` → exit 0，全仓零类型错误（含并行任务当时已落盘的 BenchForm/Leaderboard 等改动）
2. **eslint**：`npx eslint site/src/App.tsx site/src/components/Sidebar.tsx site/src/components/SecurityBanner.tsx site/src/main.tsx` → exit 0，零 error 零 warning
3. **自检 grep（五文件逐一计数，全部 = 0）**：`rounded-` 0 · `gradient` 0 · `backdrop-blur` 0 · `lucide-react` 0 · `style={{` 0
4. **e2e 锚点三项齐全**（grep 实证）：
   - `button` 可见名「测速台」「能力榜」→ Sidebar.tsx tabs label 原文
   - `link` 可见名含「GitHub」→ masthead 徽章列 `<a>` 文本 GitHub（href/target/rel 保留）
   - `button`「关闭安全说明」→ SecurityBanner 关闭钮（可见文本 + aria-label 同串）
5. **role/testid 结构不减少**：App `role="alert"` 保留；tab 按钮 `data-active` 保留；无新增义务

## 遗留与建议

1. **`tests/config/deploy-config.test.ts:119` 将红**：该测试断言 index.html 含 `<script src="/theme-boot.js">`，本任务按契约删除了该引用——需 TEST 后置任务同步删/改此断言（`site/public/_headers` 注释里也有一处 theme-boot 表述可顺手清理）。
2. **视觉快照必更新**：`tests/e2e/visual.spec.ts` 的 workbench 截图（1440/375 × light/dark）必然全量变化，且 dark emulation 在单浅色主题下与 light 同貌——建议 TEST 任务把 dark 分支并入 light 或直接裁剪。
3. **一处文案微调需主控知情**：global 视图 hero 描述原文「测速请切回左侧『测速台』」中「左侧」指向已删除的侧边栏，已改为「测速请切回『测速台』」（App.tsx 内硬编码串，非 copy.ts 常量；APP_TITLE/APP_SUBTITLE/SECURITY_BANNER/FOOTER_BENCH 未动）。
4. **`site/design-system/MASTER.md` 仍描述旧侧边栏结构**（Sidebar 组件表、theme-boot 表述），非本任务红线内文件，建议文档任务统一刷新。
5. `Sidebar.tsx` 文件名保留（红线限定只能动这 5 个文件），但导出已更名 `Masthead`；全仓仅 App.tsx 引用，已同步。后续若有整理窗口可把文件更名为 `Masthead.tsx`。
