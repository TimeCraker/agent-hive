# ANCHOR · 旧业务页锚点稳定性修复

## 两个真实现象（先复现定位，再局部修）
1. **#tech 前进后退偶发改写**：恢复 `/explore#tech` 时偶发变 `#rag-demo`（REGRESS2 19/20 原证；
   复核明确"一次重放成功不能标记消失"）
2. **#vote 落点偏 81px**：首页设 `#vote` → 正确入 `/explore#vote`，但最终 top=173.109px 而
   scroll-margin=92px（偏 81px）；距文档底还有 1876px，**排除底部钳制**。
   证据：`portfolio-review-followup-2026-10-11/vote-clamp.json` + `verify-tail.mjs`

## 主要入口（不碰 Codex SVG 性能代码与动画曲线）
`src/components/ui/AnchorSettle.tsx`、`src/hooks/useActiveChapter.ts`、必要时 `src/data/home-chapters.ts`

## 方法要求
- **先复现**：记录加载期间目标位置与 hash 的变化序列（何时被谁改写/落点何时漂移），
  确认实际触发源（怀疑方向：AnchorSettle 延迟布局稳定判定与 useActiveChapter 历史写入的竞态；
  慢加载下字体/图片再推布局的时点）——用证据说话，不猜
- 局部修复：落定过程**有界**（超时上限）；用户 wheel/touch 主动滚动即取消（已有机制保持）；
  前进后退保留正确历史条目；兼容 alias（#vote 是 contact 的 alias 等）
- 禁止：无限定时器、永久锁地址、屏蔽正常章节导航来"掩盖"

## 最少验收（全部实测记录；测试站=本地 3108 重建含 ce0fc0c+本修复）
1. 新标签直接访问 `/explore#projects /#services /#vote /#tech` ×4；首页已打开后设同组旧 hash ×4
2. **#tech 前进后退重复 ≥5 次**，每次记录中间与最终地址（禁止只读首次送达）
3. 冷缓存 / 暖缓存 / CPU4x+1.6Mbps+150ms 慢加载三条件；字体图片动效稳定后核对落点，
   目标与 scroll-margin 偏差 ≤10px；若真到文档边界记录钳制依据
4. 用户主动滚动取消自动落定；页内其他章节跳转正常无循环
5. 首页第 2/3/4/6 幕动态⇄静态双向 + 减少动态设置，章节保留回归（R1 不回退）

## 工程与红线
- typecheck/lint/动作单测 23/生产构建过；不投票/上传/发消息/登录/写业务数据
- 构建预览流程：备份 prisma/data → 停服 → build → 先拷 static 再起服
- **不 commit**（主控审查后统一提交）

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\ANCHOR-report.md`：
复现数据（触发源结论）→ 修复 diff → 验收矩阵。证据：
`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-closeout-2026-10-12/anchor/`
