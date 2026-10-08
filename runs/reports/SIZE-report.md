# SIZE · Vibe 侧栏可拖拽调宽 — 完成报告

**状态**：✅ 完成 · type-check 通过 · 未 commit（按任务要求）

**改动文件**：仅 `apps/web/src/components/editor/editor-sheet.tsx`（`vibe-chat-panel.tsx` 未触碰）

## 改动明细

### 1. 宽度 state 化 + 持久化
- 新增模块级常量：`PANEL_W_STORAGE_KEY = 'vibe-panel-w'`、`PANEL_W_DEFAULT = 640`、`PANEL_W_MIN = 380`、`PANEL_W_MAX = 760`，及 `clampPanelWidth()`（含取整）、`persistPanelWidth()`（try/catch 静默降级）。
- `PushPanel` 内 `const [panelW, setPanelW] = useState(PANEL_W_DEFAULT)`；挂载 `useEffect` 读 localStorage——缺失 / 非数值回退 640，数值超界 clamp 进 380–760。
- `panelWRef` 镜像最新宽度，供 mouseup 落盘，避开闭包陈旧值。

### 2. 拖拽手柄（面板左缘）
- `<aside>` 加 `relative`；左缘插入手柄 div：`absolute left-0 top-0 z-20 h-full w-1.5 cursor-col-resize select-none`（6px 命中区，透明底）。
- 内部 1px 细线（span 居中）：`bg-[var(--primary)]/60`，hover（`group-hover:`）与拖拽中显示；z-20 压过面板内 sticky z-10 tab 条，全高可抓。
- `onMouseDown`（仅左键、仅展开态）：记录容器右缘 x（`getBoundingClientRect().right`，面板右缘锚定不动）→ `document mousemove` 按 `右缘 x - e.clientX` 算新宽并 clamp → `document mouseup` 结束。
- 结束/卸载时 `localStorage.setItem('vibe-panel-w', String(w))`。

### 3. 拖拽中反馈
- `document.body.style.userSelect = 'none'`（结束恢复 `''`）；额外加了 `body.cursor = 'col-resize'`（同样恢复），避免拖拽时鼠标滑出 6px 手柄后光标闪变。
- 手柄自身 `select-none`；mousedown `e.preventDefault()` 阻止原生选字。
- 拖拽期间外层 `transition-none`（宽度 1:1 跟手），松手后恢复既有 `transition-[width] duration-300 ease-in-out`——收起/展开动画不受影响。

### 4. 双击手柄
- 重置 640 并立即落 localStorage。

### 5. 宽度应用（两处 `w-[640px]` 全部替换，常量 `PANEL_W` 已删）
- 外层 `<aside>`：`style={open ? { width: panelW } : undefined}` + `open ? '' : 'w-0'`——展开态宽度走 state，收起逻辑 `w-0` 原样保留，transition 层兼容既有收起/展开。
- 内层内容 div：`style={{ width: panelW }}`（保持"展开/收起动画期间内容不回流"的既有设计）。

### 6. reduce-motion
- 细线的 150ms 颜色过渡加了 `motion-reduce:transition-none`；既有 width transition 按要求原样保留，无新增动画增强。

## 实现要点（为何这样做）
- **拖拽生命周期挂 effect（`[dragging]`）而非全在 mousedown 里**：正常 mouseup 与组件中途卸载都会走 cleanup——解绑 document 监听、恢复 body 样式、落盘，无监听器/样式泄漏；落盘只写一处。
- **hydration 安全**：SSR 与客户端首帧都渲染 640，localStorage 只在挂载 effect 里读取，不产生 `style` 水合不匹配。
- **性能**：mousemove 只重渲染 PushPanel 自身 DOM（aside/手柄/内层 div），`children`（EditorContent 整树）因元素引用不变被 React 跳过，不会逐帧重渲编辑器。

## 验证
- `pnpm --filter @resumeaix/web type-check` → `tsc --noEmit` **零报错**（含并行任务中的 vibe-chat-panel.tsx 也编译通过）。
- 未跑 build / install / commit（按任务禁止项）。
- 浏览器实拖验证未做（本地 dev 不可用，见记忆 `web-dev-tooling-issues`）；建议验收清单：拖拽跟手、clamp 两端、双击重置、刷新后宽度保持、收起/展开动画正常、拖拽中不会选中文字。

## 剩余风险
1. **鼠标移出浏览器窗口松手**：`mouseup` 不触发，拖拽会延续到下次点击——原生 mouse 事件的已知边界，回到窗口内点一下即自愈（任务指明用 mouse 事件，未引入 pointer capture）。
2. **面板展开态下组件重挂载**（如跨页导航返回且 editorOpen 已是真）：首帧 640 → effect 应用持久化宽度，有一次 300ms 宽度过渡；常规路径（挂载时面板收起）无此现象。
3. `appearance-drawer.tsx` 另有一个同名 `PANEL_W`（500px 面板），未动；如后续想给外观抽屉做同款可拖，可复制同一模式。
