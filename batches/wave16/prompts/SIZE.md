# SIZE · Vibe 侧栏可拖拽调宽

## 问题
`apps/web/src/components/editor/editor-sheet.tsx`：`const PANEL_W = 'w-[640px]'`（约 66 行），
面板容器约 596-598 行 `<div className={...w-[640px]...}>` 写死宽度，用户无法调整。

## 改造要求（全部在此文件内完成）
1. **宽度 state 化**：`const [panelW, setPanelW] = useState(640)`；
   挂载时从 `localStorage.getItem('vibe-panel-w')` 读取（非法值回退 640）；
   clamp **380–760px**
2. **拖拽手柄**：面板容器左缘加 6px 竖条（absolute left-0 top-0 h-full w-1.5，
   `cursor-col-resize`，透明底，hover/拖拽中显示 `bg-[var(--primary)]/60` 细线，z-index 合理）；
   onmousedown 记录起点 → document mousemove 按 `(容器右缘 x - e.clientX)` 计算新宽度
   （clamp 内）→ document mouseup 结束并 `localStorage.setItem('vibe-panel-w', String(w))`
3. **拖拽中**：`document.body.style.userSelect = 'none'`（结束恢复）；手柄自身 `select-none`
4. **双击手柄**：宽度重置 640 并落 localStorage
5. `w-[640px]` 的两处（596/598 行附近）改为内联 `style={{ width: panelW }}`（含 transition 的
   那层保持既有收起/展开 transition 兼容：展开态宽度用 state，收起逻辑不动）
6. reduce-motion 用户无动画增强（现有 transition 保留即可）

## 禁止
- 不碰 vibe-chat-panel.tsx（另一并行任务在改消息排版）
- 不改面板收起/展开的既有业务逻辑
- 不 git commit、不跑 install/build

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\SIZE-report.md`。
