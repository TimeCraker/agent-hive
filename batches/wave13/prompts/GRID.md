# GRID · 简历封面网格统一卡高美术重排

## 背景
dashboard 简历网格（apps/web/src/components/dashboard/resume-list.tsx + resume-cover.tsx +
apps/web/src/app/editorial.css 的 folio-resume-grid/folio-resume-card/folio-cover-link/folio-resume-cover 段落）。

现状问题：上一轮把封面外层固定高度（260px）去掉了，封面组件按内容实际高度自适应——
结果是**内容多的简历卡变得巨高**，把三列网格撑得参差不齐，非常难看（用户原话：太大了）。

## 设计目标（用户已定稿的完整呈现诉求 + 统一卡高）
1. **每张卡的封面窗口恢复统一 A4 比例**（宽:高 = 210:297）——整列网格整齐
2. **简历纸完整呈现在窗口内**：纸面按「等比缩放到完全放入窗口」渲染——
   `scale = min(卡宽/820, 窗口高/contentH)`，即 min(宽度缩放比, 高度缩放比)
3. 纸面在窗口内**水平居中**（窄纸两侧留出米色衬底是 OK 的，这是画廊式排布的经典处理）
4. 内容少的简历自然占满宽度；内容多的简历整体缩小但**完整可见**（不裁切）
5. 移动端断点（editorial.css 里 ~1256 行附近的媒体查询）同步处理
6. 「最近编辑」大块的 folio-recent-cover 斜置装饰卡**不要动**（有意的小装饰）

## 实现要点
- `resume-cover.tsx`：windowH 恢复为 `width × 297/210`（统一窗口）；
  scale 改为 `Math.min(width / 820, windowH / contentH)`；
  page div 水平居中（left 偏移 `(width - 820*scale)/2`）
- `editorial.css`：`.folio-cover-link` 不需要固定高度（内部 aspect-ratio 已统一）；
  确认无残留 overflow:hidden 裁切
- 不碰 folio-recent-cover、不碰 resume-list.tsx 的业务逻辑（副本/删除按钮）

## 禁止
- 不 git commit（主控审查后统一提交）
- 不碰 apps/interview-helper/、scripts/eval-* 等无关 dirty 文件
- 不跑 pnpm install / build

## 报告
写 `runs/reports/GRID-report.md`：改动文件、缩放公式、验证方式（本地 dev 或推理说明）。
