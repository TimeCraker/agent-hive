# MOTION · 六幕动作与交互验收矩阵（本地 3108，含截图产出）

## 总上下文
- 总任务书必读：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio/docs/handovers/homepage-release-and-acceptance-agent-prompt.md`（本任务覆盖 §6 脚本部分 + §7 矩阵 + §9 可自动化项）
- 工作目录：`C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`
- 预览：`http://localhost:3108/`（已运行，PID 26776；若挂了按 BASE 报告 §4 重启：`cd .next/standalone` 后 `PORT=3108 node server.js` 隐藏窗口后台）
- 证据目录（新建，所有截图/trace 存这）：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/motion/`
- 环境变量（先验证路径存在再用）：`PLAYWRIGHT_MODULE=C:/Users/TimeCraker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`、`CHROME_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe`；不存在就自行在本机定位可用 playwright/chrome 并记录实际路径

## A. 既有脚本跑通（先读脚本源码确认参数）
1. `scripts/character-motion/verify-home-completion.mjs`：`PREVIEW_URL=http://localhost:3108`，
   `VALIDATION_OUTPUT` 指到证据目录（该脚本 PREVIEW_URL 是站点基址）
2. `scripts/character-motion/verify-fluidity.mjs`：`PREVIEW_URL=http://localhost:3108/`（完整页面 URL）。
   该脚本输出路径固定——**先读源码找到固定输出位置，把脚本复制为证据目录内的发布专用变体**（改输出路径）再跑，不得覆盖既有交付证据
3. 两脚本已知上轮通过项数（20 / 11）作对照，逐项记录本轮结果

## B. 交互矩阵（每项记 预期/实际/设备/截图或 trace/结论；正反两向都测）
- 一→六幕慢滚完整走一遍，再六→一幕倒滚
- 快速大幅滚动、滚轮连击、拖滚动条、快速倒向：无黑帧/闪陌物件/角色消失/错误姿势定格
- 每个转场中间停住再继续/倒滚：图层共用进度，文字/角色/物件遮挡一致
- 人物中间脸部不变形、不混两张脸/两套手；Q 版关节动作合理，不 PPT 式淡入重现
- 章节导航与目录入口跳转正确、当前章节指示准确
- 六个深链接 `#chapter-hero/about/capabilities/resume/game/contact` 逐一：首次打开/刷新/复制新标签/前进后退
- 静态阅读⇄动态演出切换保留章节；reduce motion 开关也保留位置
- 动作收尾后停止无意义绘制；标签页隐藏→恢复无速度异常/突跳/重复 ticker（确定性模拟即可，真后台另注待真机）
- 窗口 899→900、900→899 模式边界：无重复 canvas/孤立 pin spacer/滚动高度错乱
- 失败注入（仅本测试浏览器拦截）：WebGL 上下文丢失/初始化失败/动作图失败 → 应回到完整可读六幕，不卡加载

## C. 设备矩阵（可自动化部分）
- 桌面 1366×768 / 1440×900 / 1920×1080；手机 320/360/390/430（hasTouch+isMobile+真实 CDP 触摸事件，DPR 1/2/3 抽查）；平板 768/850；横向纵向
- 手机不下载桌面六姿态/大纹理（网络请求断言）；无横向溢出/布局跳动
- Chromium 与 Edge 双引擎；真实手机/Safari/物理高刷 → 列「待真机确认」，不得冒充已测

## 产出
- 每幕至少 1 张桌面 + 1 张手机定格截图（命名 `act1-desktop.png` … `act6-mobile.png`），供 AUDITL 审计
- 逐项矩阵表写入报告；失败项如实标 FAIL 并给出现象与复现步骤

## 红线
- 不 commit、不部署、不改线上；测试仅限本测试浏览器实例；不改原交付脚本（复制变体）

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\MOTION-report.md`。
