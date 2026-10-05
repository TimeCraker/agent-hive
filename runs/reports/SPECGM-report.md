# SPECGM 结果报告

## 结论一句话

web-client 下一阶段 Stage Spec 草案(性能二期 Perf 55+→70+ + 官网内容化)已落盘 `asternova/docs/stage-specs/web-client-perf2-content.md`,头部标注 `status: DRAFT(待所有者评审,非实施指令)`,以 commit `f5be446` 入库(仅含该新文件,153 行);40 条用户未提交现场零接触,未 push。

## Spec 要点摘要

**落位与纪律**:落盘仓内惯例位置 `asternova/docs/stage-specs/`(与 m1/m2/character-art-rework 同列,kebab-case 命名),非 `web-client/docs/`(那里只有生成快照 all_code_merged.txt / project_tree.txt,惯例不放手写文档)。头部 DRAFT 标注 + 非实施授权声明 + 批准记录空表。

**背景核实(全部来自仓内证据)**:wave1 六个 commit(02e66d0→f84da63)的实测数据——TBT 11047→1329ms(-88%)、加载期 JS 763KB→325KB、LCP 1239→1022ms;f84da63 记录移动模拟 TBT 余量 ~1040ms(three.js chunk 484KB + WebGL init ~0.8s);`public/godot/` 旧版 WASM 实测 51.5MB(wasm 35.7 + pck 15.5 + js 0.28),next.config.ts 仅 `.gz` 变体有一年 immutable 缓存、裸文件无 Cache-Control;arena 经 iframe 挂载、守卫态不渲染;ui-polish R 序列现行、剩余队列含黑洞 slow3G 占位待办(并入 CLS 专项)。

**A 线性能二期(FR)**:①WASM 按需加载与缓存——守卫态/首页零 `/godot/` 请求固化为 AC、裸文件补缓存头、预取只许作用于小引导文件、产出加载时序记录(为 v2 Web demo 攒策略输入);②LCP 专项(LCP 元素认定/字体策略审计/next/image priority);③CLS 专项(此前从未专项测,黑洞揭示与字体交换为主候选源);④TBT 余量(长任务源定位 + lobby framer-motion 瘦身评估)。

**B 线内容化(FR)**:四板块 `/devlog` `/roadmap` `/gallery` `/changelog`,内容即数据(git 提交即发布、零后端)、内容与组件解耦以呼应「web-client 退化为托管壳」的演化定位;入口整合不挤占现有登录→大厅 CTA 动线;SEO 基础(OG/sitemap,深度待决策)。

**NFR 全量化**:Perf ≥70(口径 T0 固化)、LCP ≤2.5s、CLS ≤0.05(内容页 ≤0.02)、内容页单页 JS 增量 ≤30KB gz、WASM 请求数=0(实测口径)、ui-polish 既有全绿不回退、动效零删减(wave1 同等纪律)。AC 五条:性能 before/after 报告、WASM 网络面板+curl -I 实证、内容页真实样例+移动适配、无回退复跑、线上真实页面抽查。

**任务分解**:`T0 度量口径固化+before 基线`(阻塞全部)→ T1 LCP/CLS/TBT ∥ T2 WASM 策略(可并行)→ T3 内容框架 → T4 四板块 → T5 入口+SEO → T6 终验全量回归。风险 6 条(移动慢网下 70+ 可达性、内容化与演化方向张力、画廊素材依赖 M1 返工节奏、Next.js 16 训练差异、本地分≠线上、拆包/升级回归风险)各配缓解。

**非目标红线**:backend(封存)与 client-godot(冻结)/client-godot-v2 零派活;无后端动态能力;不做 v2 Web demo;three.js 升级默认不做;不动 Arcade 本体与 arena 守卫逻辑。

## 留给所有者的决策点

Spec §8 共 9 条开放问题,批准前需逐条拍板:

1. **Q1 目标口径**:Perf ≥70 按移动档单档,还是移动 70/桌面 90+ 双档?(草案倾向移动档为准)
2. **Q2 验收工具**:本地 Lighthouse 唯一门槛,还是 PSI/WPT 线上复测纳入门槛?
3. **Q3 内容形态**:MDX / JSON / 混合?(草案倾向混合:devlog/changelog 用 MDX,roadmap/gallery 用 JSON)
4. **Q4 路线图数据源**:与 BLUEPRINT 手工转译 vs 构建时直接引用(防内部决策曝光)?(草案倾向手工转译+发布检查清单)
5. **Q5 开发日志语言**:中/英/双语?(关联 Steam 首发的受众定位)
6. **Q6 旧版 WASM demo 去留**:51.5MB 旧试玩是否保留引流位?若退役,A1 范围可裁剪
7. **Q7 画廊首版素材边界**:仅 asternova/assets 既有图先行,还是等 M1 角色定稿?
8. **Q8 three.js 0.161 升级**:是否纳入本期?(草案倾向不纳入)
9. **Q9 线上复测强度**:AC-5 是关键路由人工走查还是全路由线上跑分?

## 提交

- `f5be446 docs(spec): web-client 性能二期与内容化草案 / draft web-client perf2 & content spec`
- `git show --stat HEAD`:仅 `asternova/docs/stage-specs/web-client-perf2-content.md`(1 file, +153)
- `git status` 对比初始快照:8 修改 + 32 未跟踪 = 40 条用户现场原样,无其他新增;spec 已入库不在未跟踪列表
- 未 push(遵守红线)

## 自评

- 验收标准 1 ✓:spec 落盘、结构完整(背景/目标/非目标/FR/NFR/AC/任务分解/风险/开放问题/批准记录),提交仅含新文件。
- 验收标准 2 ✓:40 条用户现场逐条核对原样,零接触、零回退、零混入。
- 验收标准 3 ✓:本报告含要点摘要 + 决策点清单。
- 红线遵守:只新增文档未动代码;未给封存/冻结线派活(非目标 §2 明确排除);所有现状引用来自仓内 commit 记录、next.config.ts、public/godot 实测体积、ui-polish 台账与页面源码,无臆造;未 push。
- 局限:Perf「39→55+」沿用所有者给定口径,仓内 commit 只记录了 TBT/LCP/JS 传输明细,Lighthouse 分数本身无留档——已在 spec 中 T0(度量口径固化)设为第一任务,正是为补这个洞。
