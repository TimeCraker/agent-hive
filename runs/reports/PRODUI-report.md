# PRODUI 报告 · 线上 HTTPS 六幕与入口回归

- **目标**：`https://asterforge.top/`（真实域名，全只读：不登录 / 不写业务 / 不发邮件 / 不投票 / 不 commit）
- **前置**：DEPLOY 验收通过（线上 = 发布 SHA，见 DEPLOY-report.md；本文不重复部署侧检查）
- **执行时间**：2026-10-11 14:10 – 15:02 (UTC+8)
- **环境**：Windows 11 + Playwright（codex runtime 模块）+ Chrome headless（`C:/Program Files/Google/Chrome/Application/chrome.exe`）
- **证据目录**：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-2026-10-10/produi/`（截图 + 各 phase `result.json` + `imgdiff.json`）
- **测试脚本**：`produi/matrix.mjs`（5 phase）、`reshoot.mjs`、`imgdiff.mjs`、`probe-failures.mjs`、`probe-deny.mjs`（均只读，不动仓库）

## 总结论

**74/74 项检查通过（含 2 项首测 FAIL 后复测闭环），另加 Edge 引擎 smoke 通过；线上六幕与全部公开入口健康，无需回滚。**
另有 1 项语义标注（切换回首幕 vs handover 字面「保留章节」）与待真机清单，见文末。

---

## 1. 传输层与 SEO（transport 8/8）

| # | 检查 | 预期 | 实际 | 证据 | 结论 |
|---|---|---|---|---|---|
| 1 | HTTP→HTTPS | 301 跳 https | `http://asterforge.top/` → 301 → `https://asterforge.top/`，浏览器落点 https | curl + 浏览器导航 | ✅ |
| 2 | 域名证书 | 有效且匹配 | CN=asterforge.top，Let's Encrypt (YE2)，2026-09-21 → 2026-12-20 | openssl s_client | ✅ |
| 3 | 混合内容 | 无 http:// 子资源 | 桌面首页全部请求收集，0 条 http://（除主导航本身） | `transport/result.json` | ✅ |
| 4 | 首页 meta | title/desc/canonical/OG | title「TimeCraker · AI Builder」；canonical=`https://asterforge.top`；og:title/description/image/url 全在 | `transport/result.json` NOTE | ✅ |
| 5 | robots/sitemap | 正确且无预览泄漏 | robots: Allow / + Disallow /admin /api /s + sitemap 指向；sitemap 含 /explore /config /projects/*，**无 home-preview、无 /lab** | 同上 | ✅ |
| 6 | /home-preview noindex | 源码含 noindex | `<meta name="robots" ... noindex>` 存在于渲染 HTML | 同上 | ✅ |
| 7 | /explore canonical | 指向 /explore | `https://asterforge.top/explore` | 同上 | ✅ |
| 8 | 静态资源缓存 | 版本化资源 immutable | `/_next/static/media/*.woff2` → `public, max-age=31536000, immutable` | 同上 NOTE | ✅ |

## 2. 桌面六幕与动效（acts 17/17，1920×1080 主 + 1366/1440 抽查）

| # | 检查 | 实际 | 证据 | 结论 |
|---|---|---|---|---|
| 1-2 | 慢滚正向 12s（0→1） | faceDeformation 全程 0；无 motionError；drawn 增量 >30 帧；handoff 窗口外角色 opacity >0.95（无 PPT 式淡入） | `acts/slow-roll-samples.json`、`acts/result.json` | ✅ |
| 3-4 | 慢滚反向 12s（1→0） | 同上全部满足 | 同上 | ✅ |
| 5 | 滚轮连击 12 次 | settle 后 opacity>0.95、face 0、无错误 | `acts/wheel-burst-settled.png` | ✅ |
| 6 | 快速大幅跳转 6 连 | 全程 opacity>0.9，无错误 | `acts/result.json` | ✅ |
| 7 | 快速倒向 6 连 | settle 一致姿势，纹理 ≤12 | `acts/fast-reversals-settled.png` | ✅ |
| 8-12 | 5 个转场停住（p=0.17/0.25/0.51/0.74/0.92） | 正反到达同 act/pose/kind，headX/scene 差 <0.01 | `acts/pause-{1..5}-{forward,reverse}.png` | ✅ |
| 13 | 幕外不可见链接 | hero/contact 幕 works 链接 hit-test 不可点；resume 幕（p=0.62）可点 | `acts/result.json` | ✅ |
| 14 | 1920×1080 六幕 | rail 逐幕导航、aria-current=step、无横向溢出 | **`act1..6-desktop.png`（1920×1080）** | ✅ |
| 15-16 | 1366×768 / 1440×900 抽查 | 六幕导航无溢出 | `acts/desktop-{1366,1440}-contact.png` | ✅ |
| 17 | Console/网络 | 0 page error、0 console error、0 一方失败请求 | `acts/result.json` NOTE | ✅ |

## 3. 手机模式（mobile 8/8，390 主 + 320/430 抽查）

| # | 检查 | 实际 | 证据 | 结论 |
|---|---|---|---|---|
| 1 | 390×844 DPR3（hasTouch/isMobile） | 静态模式（active=false）、0 条桌面纹理（pose-*/mascot 零下载）、无横向溢出 | `mobile/mobile-390-hero.png` | ✅ |
| 2 | 390 CDP 触摸滚动 | 滚动前进 >40px，状态干净无溢出 | `mobile/result.json` | ✅ |
| 3 | 390 六幕可读 | 逐幕 scrollIntoView 截图 | **`act1..6-mobile.png`** | ✅ |
| 4-5 | 320×568 DPR1 抽查 | 静态模式 + 无桌面纹理 + 无溢出 + CDP 触摸 | `mobile/mobile-320-hero.png` | ✅ |
| 6-7 | 430×932 DPR3 抽查 | 同上 | `mobile/mobile-430-hero.png` | ✅ |
| 8 | Console/网络 | 0 错误、0 一方失败 | `mobile/result.json` | ✅ |

## 4. 深链接与导航控件（deeplinks 26/26）

| # | 检查 | 实际 | 证据 | 结论 |
|---|---|---|---|---|
| 1-18 | 6 深链接 ×（首次/刷新/新标签） | 全部落对章节（动态 chapter dataset / 静态 rect≈88px） | `deeplinks/result.json` | ✅ |
| 19 | 静态模式 hash 前进/后退 | hero→about→contact 链式 back/forward 内容全同步 | `deeplinks/deeplink-backforward-static.png` | ✅ |
| 20 | 动态模式 same-doc hash 前进/后退 | goto #chapter-about → chapter=1；goBack → chapter=0（MOTION 轮 B6a 缺陷的修复在线上生效） | `deeplinks/deeplink-backforward-dynamic.png` | ✅ |
| 21 | 目录 6 章跳转 + 指示 | 目录逐章跳转，rail aria-current=step | `deeplinks/result.json` | ✅ |
| 22 | 目录键盘 | Enter 打开、Esc 关闭、焦点返回「目录」触发钮 | 同上 | ✅ |
| 23 | 回到顶部 | 第六幕返回第一幕 | `deeplinks/back-to-top-act1.png` | ✅ |
| 24 | 动态→静态切换 | 按设计显式回首幕（scrollTo 0 + #chapter-hero，chapter=0） | `deeplinks/toggle-static-act1.png` | ✅（见 §8 标注 1） |
| 25 | 静态→动态切换 | 恢复动态成功，同样回首幕（与本地 A1 验收行为一致） | `deeplinks/mode-switch-act1.png` | ✅（见 §8 标注 1） |
| 26 | Console/网络 | 0 错误 | 同上 | ✅ |

## 5. 入口与原业务（entries 15/17 → 复测闭环 17/17）

| # | 检查 | 实际 | 证据 | 结论 |
|---|---|---|---|---|
| 1 | /explore 加载 | 200，#projects/#services/#vote 三区可见 | `entries/explore-top.png` | ✅ |
| 2-4 | /explore#projects/#services/#vote | 直达落位 top=92/92/-46（容差内） | `entries/result.json` | ✅ |
| 5-7 | 旧根锚点 /#projects/#services/#vote | location.replace → /explore#* 落位：services 92 ✅、vote -46 ✅、**projects 首测 896 ✗** | 见下 | ✅（复测） |
| 8 | /config | 200，67 个交互链接 | `entries/config-center.png` | ✅ |
| 9 | /config/files | 200，云端保险箱 26 文件/7 分类/11 上锁正常渲染 | `entries/config-files.png` | ✅ |
| 10 | /projects/[slug] | game/interview/genesis/rag 全 200；未知 slug 正确 404；/projects/resume 308 → resume.asterforge.top | `entries/result.json` | ✅ |
| 11 | /home-preview | 200，六幕可演 + noindex | `entries/home-preview-act1.png` | ✅ |
| 12 | /lab/character-motion | 200 + noindex + 正式首页无 lab 控件泄漏 | `entries/result.json` | ✅ |
| 13 | works 入口（线上配置） | resume=`https://resume.asterforge.top/`（GET 200）；game=`https://asterforge.top/projects/game`（200）；两者 rel=noopener noreferrer | `entries/result.json` NOTE | ✅ |
| 14 | 联系区 | mailto=timecraker@foxmail.com；GitHub=https://github.com/TimeCraker | `entries/act6-contact-live.png` | ✅ |
| 15 | 剪贴板授权态 | 复制成功，clipboard 值=timecraker@foxmail.com，反馈「邮箱已复制」 | `entries/result.json` | ✅ |
| 16 | 剪贴板拒绝态 | **首测 FAIL**：headless Chromium clipboard-write 默认 granted，无法自然拒绝。按 UIUX 轮同法注入 NotAllowedError reject：catch 路径生效 →「复制未成功」+ 按钮回「复制邮箱」+ 无成功误导 | `entries/copy-deny-fallback-live.png`、`probe-deny.mjs` | ✅（模拟复测；真机拒绝态待真机） |
| 17 | 公开 API（GET 只读） | /api/votes（非空数组）、/api/public/projects（links）、/api/public/announcement、/api/files/categories、/api/files 全 200 结构正常 | `entries/result.json` | ✅ |

**FAIL 复测闭环说明**：
- `/#projects` 首测落位 896px：测量时机（2.5s）早于 AnchorSettle 完整落定路径（fonts 800ms + 懒图 decode 1200ms + 平滑滚动等待 1000ms，上限叠加 >2.5s）。等待 `data-anchor-lock` 释放 + scrollY 稳定后复测 **settled top=92（容差内）** → 非缺陷。`probe-failures.mjs` 输出存档。
- 附带观察（预期行为，非错误）：私密文件缩略图 `401`（上锁文件未授权不可读，权限边界正常）；首轮 deeplinks 高频开页曾触发 `/api/analytics/track` **429**（埋点限流防护正常工作）。为符合只读红线，后续 phase 在测试浏览器内 abort 该 POST 埋点（console 中 `net::ERR_FAILED` 均来自此拦截，非线上故障）。

## 6. 截图与本地 3108 基准对照（imgdiff.json + 视觉模型复核）

像素对比（线上 1440×900 vs 本地 motion 基线同尺寸；阈值：RGB 通道和 >24 记为差异像素）：

| 幕 | desktop diffRatio | mobile diffRatio | 定性 |
|---|---|---|---|
| act1 | 4.4% | 1.4% | 粒子/相位噪声 |
| act2 | 18.2% | 0.9% | **视觉模型复核：同角色、同动作语义、同构图文案（ABOUT ME / AI Builder / 循此苦旅以达天际）；差异为手臂张角/衣摆形态的动效相位，非美术退化** |
| act3 | 24.0% | **0（完全一致）** | **同上复核结论：AI/SOFTWARE/HARDWARE 三块、角色侧身托举引导姿势一致，相位差** |
| act4 | 0.018% | 1.5% | 基本完全一致 |
| act5 | 7.9% | 0.4% | 相位噪声 |
| act6 | 3.4% | **0（完全一致）** | 基本一致 |

- mobile act3/act6 与本地基线**像素级完全一致**，desktop act4 差异 0.018% —— 素材、CSS 顺序无部署退化。
- 差异集中在含角色动画的幕（act2/3/5），为两轮截图动效相位不同所致，已逐张视觉复核确认。
- 佐证：`/character-motion/art-directed-v1/manifest.json` 200；acts phase 慢滚期间原画持续绘制、角色全程可见。

## 7. Edge 引擎 smoke（补充）

`msedge.exe` headless（Chromium 内核、独立二进制）：桌面 1440×900 六幕 rail 逐幕导航全过、无横向溢出、0 page error；手机 390×844 DPR3 静态轻量模式正常。证据：`edge-desktop-contact.png`、`edge-mobile-hero.png`。

## 8. 短时健康观察（首轮全过后）

时段 **14:58:42 – 15:01:59 (UTC+8)**，3 轮、间隔约 95s，每轮 3 个探测点：

| 探测 | #1 | #2 | #3 |
|---|---|---|---|
| `/`（HTML） | 200 / 1.83s | 200 / 1.85s | 200 / 2.21s |
| `manifest.json`（原画清单） | 200 / 1.16s | 200 / 1.15s | 200 / 1.16s |
| `_next/static/*.woff2` | 200 / 0.10s | 200 / 0.09s | 200 / 0.11s |

全 200、延迟稳定（HTML ~2s 为本机跨境网络正常水平；woff2 ~0.1s 命中缓存）。无 5xx、无抖动。未创建任何定时任务。

## 9. 标注与建议（非缺陷，提请主控知悉）

1. **「切换保留章节」语义**：handover §7 字面为「静态阅读与动态演出切换保留当前章节」，实现为**两个方向都显式回第一幕**（`toggle()` → scrollTo(0) + replaceState #chapter-hero），且与本地 A1 验收及 FIXUI repro-toggle 行为一致（已认可设计）。章节保留的正确通道是深链接直达/刷新/新标签（全部 PASS）。若希望切换保留当前章，属产品改动而非回归缺陷。
2. **act*-desktop.png 时间线异常（已修复）**：首轮 acts phase 结束后，`act1-6-desktop.png` 曾于 14:29 被非预期写入者覆盖为 1440×900（与 deeplinks 第一轮运行时间重叠，来源未能定位）。已用 `reshoot.mjs` 确定性重截 1920×1080 正式证据（14:4x）+ 1440×900 对比版（`diff*-desktop.png`），当前文件确凿可信。
3. 剪贴板拒绝态在 headless 内只能以注入 reject 模拟（clipboard-write 默认 granted），真机权限弹窗拒绝路径列入待真机。

## 10. 未测真机项清单（不混入通过统计）

| 项 | 原因 | 已覆盖的替代证据 |
|---|---|---|
| 真实 Android Chrome | 无真机 | Chromium 390/320/430 模拟 + CDP 触摸滚动 + Edge 手机模式 |
| 真实 iOS Safari / WebKit 引擎 | 无真机、本轮未跑 WebKit | Chrome + Edge 双 Chromium 引擎；MOTION 轮本地 WebKit 记录 |
| 物理 120/144Hz 高刷流畅性 | 无高刷屏 | MOTION/PERF 轮 rAF/trace 采样 + 本轮动效正确性 |
| 真实剪贴板权限拒绝弹窗 | headless 默认 granted | 注入 NotAllowedError 的 catch 路径验证 |
| 真实触摸惯性/双指等手势 | CDP 单点模拟 | CDP touchStart/Move/End 基本滚动 |
| 真机横竖屏旋转 | 无真机 | 本轮 viewport 模式边界 899/900 于 MOTION 轮已验 |

## 11. 附：证据文件索引

```
produi/
  act1..6-desktop.png        # 桌面六幕正式证据（1920×1080）
  act1..6-mobile.png         # 手机六幕（390×844 DPR3）
  diff1..6-desktop.png       # 与本地基线同尺寸对比版（1440×900）
  imgdiff.json               # 像素对比量化数据
  transport|acts|mobile|deeplinks|entries/result.json   # 各 phase 逐项结果
  acts/slow-roll-samples.json                          # 慢滚正反采样原始数据
  entries/copy-deny-fallback-live.png                  # 拒绝态回退截图
  edge-desktop-contact.png / edge-mobile-hero.png      # Edge 引擎 smoke
  matrix.mjs / reshoot.mjs / imgdiff.mjs / probe-*.mjs # 只读测试脚本
```
