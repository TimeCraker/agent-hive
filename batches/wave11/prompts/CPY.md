# CPY · 简历网格加「创建副本」按钮

## 背景
ResumeAIX 的 `POST /api/resumes/[id]/version` 接口已存在（克隆简历+活跃设计稿，标题自动加"(副本)"），
但前端没有任何按钮调用它。需要在简历列表的每张卡片操作区加上这个入口。

## 要求
1. 文件：`apps/web/src/components/dashboard/resume-list.tsx`
2. 在每张简历卡的删除按钮旁边（或卡片底部）加一个「创建副本」按钮
3. 点击后 `fetch(\`/api/resumes/${r.id}/version\`, { method: 'POST' })`
4. 成功后刷新简历列表（可调 router.refresh() 或回调）
5. 样式与删除按钮协调（同样的 icon-button 或小型文字按钮），用 Copy 或 Files 图标
6. 不碰删除逻辑、不碰卡片链接、不碰无关 dirty 文件（apps/interview-helper/next-env.d.ts、scripts/eval-*）

## 禁止
- 不修改 API 路由
- 不修改 schema
- 不运行 pnpm install/build
- 不 git commit

## 报告
写 `runs/reports/CPY-report.md`：改动文件、按钮位置、交互逻辑、验证方式。
