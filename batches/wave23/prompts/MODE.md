# MODE · 自由编辑默认化 + 首次引导 + 进入按钮化

## 问题（用户定稿）
1. `apps/web/src/app/(editor)/resume/[id]/page.tsx` 约 114 行：`useState(!vibeRequested)` ——
   所有用户默认进引导制作；用户定稿：**自由编辑应为默认，引导制作只有第一次使用才引导**
2. `apps/web/src/components/editor/guided-resume-desk.tsx` 约 229 行「进入自由编辑 →」是文字链接，
   看不出是按钮

## 改造要求
1. **首次标记**：localStorage key `resumeaix-guided-seen`。
   page.tsx 的 guided 初始值改为：
   - `vibeRequested`（?vibe=1）→ false（保持现状）
   - 否则惰性读取 localStorage：无标记 → true（首次用户走引导）；有标记 → false（回访走自由编辑）
   - 注意 typeof window 守卫（客户端组件 SSR 壳）
2. **写标记时机**（三处，进入自由编辑即写 `resumeaix-guided-seen = '1'`，try/catch 包裹）：
   - 顶栏「自由编辑」tab 的 onClick（page.tsx 约 455 行）
   - 引导侧栏「进入自由编辑」按钮 onClick（guided-resume-desk.tsx）
   - 若还有其他 setGuided(false) 调用点一并补上
3. **「进入自由编辑 →」按钮化**（guided-resume-desk.tsx）：
   - 从文字链接升级为块级 CTA 按钮：`bg-[var(--primary-deep)] text-white rounded-lg px-4 py-2.5
     text-sm font-medium flex items-center justify-between gap-2 btn-press
     hover:bg-[var(--primary-deep-hover)] transition-colors w-full`
   - 文案保留「进入自由编辑」，右侧 `ArrowRight`（lucide）`group-hover:translate-x-0.5`（父级加 group）
   - 深墨侧栏上铜底白字对比最强；宽度撑满侧栏内边距
4. 顶栏两个 tab（引导制作/自由编辑）样式不动

## 禁止
- 不碰 zoom-preview.tsx（另一并行任务在改）
- 不改引导流程内部逻辑（只改默认模式与入口按钮）
- 不 git commit、不跑 install/build

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\MODE-report.md`。
