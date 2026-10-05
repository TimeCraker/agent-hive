# PF 结果报告

> 任务：my-portfolio（asterforge.top）移动端性能优化。生产基线（2026-10-03 六站基线）：移动 Perf 56 / LCP 5.91s / FCP 3.26s / TBT 480ms。
> 执行：2026-10-05，本地 `pnpm build` → standalone（127.0.0.1:3210，HTTP/1.1）→ Lighthouse CLI 13.4.0 移动模拟档（与基线同方法，每配置 ≥3 轮取中位）。
> 接手时仓库状态：**前序会话已完成 A2（INTRO 9 子集字体 preload，437349a）并已部署**，生产复测 Perf 89 / LCP 2455-2720ms（见 RETEST-2026-10.md 补充节）。本轮在其上完成剩余杠杆的归因与实施。
> 提交：5 笔（f62b13c / 47b1c38 / c28d74c / bad821f / 635812f）+ 1 笔 stage 文档回填，全部路径限定 `src/**`、`docs/**`。

## 字节归因表

优化前（cache-bust 本地实测，移动档网络层）：

| 类别 | 请求数 | transfer | resource | 备注 |
|---|---|---|---|---|
| Document | 1 | **232KB** | 1134KB | raw 1.16MB，见下方成分 |
| Font | 15 | **529KB** | 519KB | Noto 10 个 402KB + 拉丁 5 个 127KB |
| Script | 16 | 287KB | 874KB | 框架 + motion + dnd-kit 等 |
| Fetch | 11 | **92KB** | 391KB | **含 77-85KB 的 RSC 视口预取（自页面 + /config）** |
| Image | 8 | 65KB | 62KB | 量小 |
| 合计 | 50 | ~1209KB | — | |

Top 5 资源（transfer）：Document 232KB｜react-dom 框架 chunk 72KB｜**/config RSC 预取 64KB（274KB parse）**｜noto-serif-sc-119 54KB｜**Inter 48KB（主页零使用，纯 preload 浪费）**。

HTML 成分（raw 1,161,014B）：**flight 58.0%（673KB，其中 ~46 万字节是 inlineCss 把 CSS 在 `<style>` 与 flight payload 双份携带）**｜inline style 23.9%（278KB）｜SSR markup+head 18.0%｜可见文本仅 11KB。

## 优化项清单

| # | 提交 | 改动 | 收益（实测） |
|---|---|---|---|
| 0 | 437349a（前序会话） | A2：INTRO 9 子集 preload | 生产 LCP 5.91→2.4-2.7s、Perf 56→89 |
| 1 | f62b13c | preload 清单绝对 URL→相对路径 | 解除域耦合，本地/预发可测（生产行为不变） |
| 2 | 47b1c38 | Navbar logo `prefetch={false}` | 消自页面 RSC 预取 13KB transfer/94KB parse |
| 3 | c28d74c | Inter/JBMono 根布局 `preload: false` | 字体 15→14 个、529→481KB（Inter 主页零使用点，纯浪费；JBMono 转按需加载） |
| 4 | bad821f | 纯锚点 CTA（#contact）next/link→`<a>` | 消自页面预取 13KB/94KB（相对锚点带 query 解析触发整页 RSC 重拉） |
| 5 | 635812f | /config 胶囊 `prefetch={false}` | 消 64KB/274KB 预取；**全页 `_rsc` 预取请求数清零** |

净效果：总传输 1209→1044KB（**-133KB / -11.3%**）、请求数 50→44、字体关键路径 -48KB。

量化后主动不动（避免负收益）：A1 flight CSS 双份携带——关闭 inlineCss 仅省 ~30KB gzip 级，却重引 render-blocking CSS 瀑布（Next 官方 trade-off：冷首访 inline 更优），维持现状；A3/C4 懒加载章节动效库——Next 16 Server Component 中 dynamic() 不支持 client 组件自动 code splitting（需额外 wrapper 层），TBT 中位已 153ms，收益/成本不成立；A4 图片 65KB 量小。

## 前后 Lighthouse 对比

本地 standalone 同条件对照（before 3 轮 / after 5 轮，取中位；绝对值受本地 HTTP/1.1 排队拖累，较生产悲观，**相对改善可信**）：

| 指标 | before 中位（3 轮） | after 中位（5 轮） | Δ |
|---|---|---|---|
| Performance | 61（46/71/61） | 64（61/69/52/70/64） | +3（噪声带 ±5） |
| FCP | 3.16s | 2.70s | **-14.6%** |
| LCP | 8.44s | 7.24s | **-14.2%** |
| TBT | 229ms | 153ms | **-33%** |
| Speed Index | 5.75s | 5.60s | -2.6% |
| 总传输 | ~1177KB | 1044KB | **-11.3%** |

生产参照（A2 已部署，本任务验收线所在环境）：**Perf 89、LCP 2455-2720ms，较基线 5.91s 改善 54-58%（≥30% 达标）**。本轮 5 笔提交待用户手动部署（push ≠ 部署）后，生产在 89 基础上再获关键路径减负（字体 -48KB、预取清零 -104KB 传输）。

门禁：`pnpm typecheck` ✓｜`pnpm lint` ✓（0 errors，69 条既有 warning）｜`pnpm build` ✓。

## 截图目检结论

**通过**（多模态亲验两档）：

- 桌面档（~1011px）：hero 全要素（导航/章节指示/衬线大标题/双 CTA/资料卡/统计条/项目轮播）渲染正常。
- 移动档（412×823，moto g4 档）：无白屏、无字体破相（Noto 衬线大标题正常）、无布局崩；改造后的波浪下划线 CTA 与改造前渲染一致。截图：`screenshots/PF-mobile-hero-412.png`。
- 两档均为亮色主题（Playwright 默认亮色偏好；基线截图为暗色，站内双主题均为正常状态，暗色已开放跟随系统）。

## 遗留问题

1. **生产生效待部署**：本轮提交 push 后需用户手动跑 `deploy-portfolio-safe.sh`，push 不自动上线。
2. **LH 桌面档本地 4 连败**（chrome-launcher 临时目录 rm EPERM 竞态，含 TMPDIR 隔离尝试），桌面端未出本地数字；以 A2 复测桌面 98-99 为参照（本轮改动无桌面特定路径，网络层收益同向）。
3. A4 图片（65KB）量小未动；A1/A3 量化后维持现状（理由见优化项清单）。
4. 字体 preload 清单是 INTRO 文案的耦合物，大改 INTRO 文案后需重新生成（既有约定，404 时优雅降级）。
5. 本地方差显著（同构建 Perf 52-70），已按 stage 方法 ≥3 轮取中位；后续复测建议沿用。

## 自评

**达标**。

- 验收标准（任一）：移动 Perf ≥70 ✓（生产 89，A2 部署态）；或 LCP ≤4.2s（较 5.91s 改善 ≥30%）✓（生产 2.455-2.72s，改善 54-58%）。
- 本轮净增量（本地同条件对照，网络层硬证据）：`_rsc` 预取清零、字体 -48KB、总传输 -133KB、LCP 中位 -14.2%、FCP -14.6%、TBT -33%，全部可复验。
- 诚实说明：本地档位 Perf 中位 64 未到 70、LCP 7.24s 远超 4.2s，系本地 HTTP/1.1 单源排队 + 模拟节流的环境限制（生产为 H2，同等字节下表现显著更好）；验收线的达成主体是前序 A2 部署，本轮为部署后增量与质量收口。
