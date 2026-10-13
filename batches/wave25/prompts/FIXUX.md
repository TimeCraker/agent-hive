# FIXUX · 模式切换保留章节（R1）+ 旧锚点 hashchange（R2）

## 独立复核证据（必读）
`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-review-2026-10-11/REVIEW.md` R1/R2 节（含行号与复现）。
两处都在 `src/components/character-motion/ArtDirectedPreview.tsx`：
- R1：toggle()（约 :394）无条件 scrollTo(0)+重写 hash+同步第零章
- R2：legacy 集合只在挂载 effect（约 :111-131）判断；hashchange 处理（约 :314、:366）只管 chapter-*

## 修复 1：切换保留当前章节（R1）
- 动态→静态、静态→动态**保留当前章节**（保存当前章节/目标进度，切换并等新模式挂载/布局就绪后落位）
- prefers-reduced-motion 变化时同样尽量保留当前章节
- **等待就绪再定位**：避免先跳首幕再跳回的闪动（等 ReadingStory 布局或演出 mount 完成）
- **异步竞态防护**：加载期间用户主动滚动或再次切换时，旧异步定位不得覆盖新操作（代数/序号守卫）
- 切换后 hash、页面内容、章节指示（rail aria-current / 底部标签）三者一致
- 不引入重复 ScrollTrigger / pin spacer

## 修复 2：旧锚点 hashchange 补齐（R2）
- 抽出共用的 legacy 解析函数：挂载 effect 与 hashchange 处理器**共用**
- hashchange 时命中 legacy 集合（intro/stats/footer/about/projects/services/custom-dev/hardware/
  rag-demo/tech/vote/contact——**全集**，不只补三个示例）→ 跳 `/explore#<原hash>`
- chapter-* 新章节导航保持正常（与 FIXANCHOR 已修的动态 hashchange 共存不冲突）
- 保留目标 hash，避免跳转循环与浏览器历史混乱（用 replace 语义时想清楚历史栈）
- 保留 AnchorSettle 落点修复不动

## 验收（全部实测，记 预期/实际/截图）
R1：第 2/3/4/6 幕双向切换各一次（落同章、无跳屏/空白/重复 pin）；快速连续切换 ×3；
reduce-motion 开→关、关→开；直接深链接到第 4 幕后切换。
R2：新标签首次 `/#projects /#services /#vote`（回归）；**已打开首页内** location.hash 切换三锚点
（此前漏测路径）；前进/后退；其他 legacy 锚点抽查 ≥2（如 #custom-dev、#tech）；
chapter-* 深链接与动态 hashchange 回归。

## 工程要求
- `pnpm run typecheck` + `pnpm run lint` 过；动作单测 21 个跑一遍
- 需要浏览器验证时：备份 prisma/data → 重建 standalone → 重启 3108（先查端口归属；
  两件套拷贝顺序：先拷 .next/static 再启服务——服务先启会 404 chunk）
- **不 commit**（主控审查后统一提交）；不部署；不改美术/动效语义

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\FIXUX-report.md`：
两修复 diff 摘要 + 验收矩阵（截图存 `C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-followup-2026-10-11/fixux/`）。
