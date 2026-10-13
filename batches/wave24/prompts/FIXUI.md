# FIXUI · 修复 act3 标签叠压 + WebGL 边界泄漏 + 补拍验证帧

## 前置：PERF 已完成（3108 重建不再影响采样）

## 缺陷 1（AUDITL P1-1）：act3 桌面标签与引言叠压
- 证据：`portfolio-release-2026-10-10/motion/matrix/act3-desktop.png` 底部中央
- 元素：`ArtDirectedPreview.tsx` ~548-580 `motion-chapters` nav（动态模式显示的**已认可 UI，不要删**）
  与第 3 幕引言第二行垂直碰撞
- 修法（择一/组合）：错开垂直位置（标签下移/引言上移）；或引言淡入期间标签降透明度/收起，结束恢复

## 缺陷 2（PERF §A4，真实泄漏）：899↔900 模式边界往返 WebGL 资源线性累积
- 证据：`portfolio-release-2026-10-10/perf/leak/leak-check.json`——每往返 **+8 纹理 / +4 WebGL 上下文**
  （5 轮 10→50 / 2→22）；Chrome ~16 上下文上限后靠 webglcontextlost 兜底静默降级未崩
- PERF 已给修复方向：`src/lib/character-motion/art-renderer.ts` 的 `cleanup()` 在
  `renderer.dispose()` 后补 **`renderer.forceContextLoss()`** 促使上下文立即归还；
  并核查未释放的 three.js 内部纹理（+4/往返疑为纹理对象未随 dispose 释放，逐个 `texture.dispose()`
  或 `renderer.dispose()` 后确认 three 版本语义）；（可选）跨模式切换复用同一 canvas/上下文——若复杂不做
- **验收判据（复测 PERF 的 leak-check.mjs）**：899↔1440 往返 **20 轮**，存活纹理与上下文数趋于平台值
  （允许首轮增长后稳定，不允许线性增长）；章节正反跳转与可见性场景维持零增长

## 验证与产出（存 `portfolio-release-2026-10-10/fixui/`）
1. `pnpm run typecheck` + `pnpm run lint` 过
2. 备份 prisma/data → 重建 standalone → 重启 3108（当前 PID 18588，先查端口归属；流程同 FIXANCHOR 先例）
3. 重拍帧：`act3-desktop-after.png`（标签与引言无叠压）、`act2-mobile-after.png`（第 2 幕**落定态**，
   进度点 02 实心——补 AUDITL P2-1）；其余五幕桌面抽查无新叠压
4. leak-check 复测：借用 `perf/leak/leak-check.mjs`（只改输出路径的复制变体，不动原脚本）20 轮判定
5. 不 commit（主控审查后统一提交）；不部署

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FIXUI-report.md`：
两缺陷根因/改动 diff 摘要/修复前后对照（叠压截图 + 泄漏曲线前后数据）。
