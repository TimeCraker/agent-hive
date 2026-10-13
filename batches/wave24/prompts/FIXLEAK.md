# FIXLEAK · 调试并修复 899↔900 边界 WebGL 泄漏（首修无效，带数据接力）

## 背景（接力，前会话 FIXUI 夜间僵死，主控已接管验证）
- 工作目录 `C:/Users/TimeCraker/Desktop/my_workspace/my-portfolio`（分支 codex/character-motion-m1）
- **工作区已有两处未提交修复**（勿重做，先理解）：
  1. `src/lib/character-motion/art-renderer.ts` cleanup 内 `if (!canvas.isConnected) renderer.forceContextLoss();`
  2. `src/app/lab/character-motion/motion.css` act3 引言抬升（叠压修复，与本任务无关但同批验证）
- 本地预览 3108 已在跑修复版构建（BUILD_ID f6B_yWwdobbAZAY0fc0AJ，主控刚重启，PID 以端口为准）

## 问题：首修无效（主控 20 轮复测数据）
用 `C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/fixui/leak-check-20.mjs`
（= PERF 的 leak-check.mjs 复制变体，ROUNDS=20；env：PLAYWRIGHT_MODULE=C:/Users/TimeCraker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright、CHROME_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe、PREVIEW_URL=http://localhost:3108/）

主控实测（round20）：texturesLive 10→**173**（+8/轮）、webglContexts **82**（+4/轮）——
与修复前 PERF 数据同速率，`forceContextLoss` 修复**对该路径零效果**（修复代码确认已在构建 chunk 内）。

## 调试假设（逐个用插桩证实/证伪，别猜）
1. **isConnected 恒 true**：cleanup 执行时 React 尚未把旧 canvas 移出 DOM（被动 effect 清理与
   DOM 移除的时序），条件永不触发——插桩验证：cleanup 里 console.log canvas.isConnected
2. **泄漏不经过 mountArtMotion cleanup**：899↔900 切换走 matchMedia → 组件树分支更换，
   旧分支的清理路径缺失/不执行；查 `ArtDirectedPreview.tsx` 的 desktopMotion matchMedia effect
   与 canvas 挂载结构（每轮 +4 上下文 = 每次切换挂 2 个新上下文 × 双向？）
3. **上下文来源不止 renderer**：three 初始化 probe、OffscreenCanvas、或 lab 工具残留
   （textureCount report=6 但 texturesLive 170——查 three 内部纹理与 atlas/姿态纹理的 dispose 链）

## 修复要求
- 最小改动定位真实累积路径后修（可以是：cleanup 无条件 forceContextLoss 若时序证明安全、
  延迟到下一帧再判 isConnected、模式切换时显式销毁旧 canvas、或复用同一 renderer）
- **不改演出语义/美术**；修后 20 轮 leak-check 复测判据：texturesLive 与 webglContexts 趋平台值
  （允许首轮爬升后平稳；不得线性增长）；章节跳转/可见性/滚动停启维持零增长
- `pnpm run typecheck` + `pnpm run lint` 过；备份 prisma/data 后重建 standalone 重启 3108 验证
- **同批补拍**（FIXUI 遗留）：`portfolio-release-2026-10-10/fixui/` 下
  `act3-desktop-after.png`（动态模式第 3 幕定格，标签与引言无叠压）、
  `act2-mobile-after.png`（第 2 幕落定态：进度点 02 实心、标签 02/06），
  其余五幕桌面抽查无新叠压
- 回归：verify-home-completion 20 项（PREVIEW_URL=http://localhost:3108，VALIDATION_OUTPUT 指向 fixui 目录）
- 不 commit（主控审查后统一提交）；不部署

## 红线
- 机器勿休眠期间跑长测（如遇预览进程消失先查端口再重启，流程同上）
- 不动 PERF 既有证据目录；测试脚本只用复制变体

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FIXLEAK-report.md`：
插桩结论（哪个假设成立+证据）、修复 diff、20 轮前后对照曲线、补拍帧、回归结果。
