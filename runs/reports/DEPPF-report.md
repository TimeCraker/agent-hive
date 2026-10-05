# DEPPF 结果报告

## 结论一句话

**部署成功**：10-05 性能优化轮随 `b2d2eac` 上线 https://asterforge.top（服务停机窗口 ≈26s），验收 3 项全过——线上字体 preload 已全部改为相对路径（18 条 ≥9）、Inter latin（48,432B）与 JBMono latin（31,340B）preload 归零、首页 HTTP 200；过程中发现 `deploy-portfolio-safe.sh` 服务器端版本断言存在引号转义 bug 导致脚本中止（线上零影响），按 SKILL「手动完成 deploy」权威兜底路径补完剩余步骤，全程未改任何业务代码 / 配置 / nginx。

## 部署过程

**时间线（2026-10-05 23:30–23:50）**

| # | 步骤 | 结果 |
|---|------|------|
| 1 | 读 SKILL.md 部署节 + asterforge-deploy README/COLD-START | ✅ 确认唯一入口 `deploy-portfolio-safe.sh`、7 项原子验证、Next 16 standalone SOP 适用性存疑（后证伪） |
| 2 | SSH 预检 `ssh ... 'echo ok'` | ✅ SSH_OK（代理 TUN 未抖） |
| 3 | 三端一致性检查 | 服务器 `437349a`（perf 轮**前**部署点，印证线上未部署 perf 轮）；本地 `b2d2eac` 领先 origin 3 条 docs 提交 |
| 4 | `git push origin master`（`995831a..b2d2eac`） | ✅ 脚本用法第 1 步「先 git commit + push origin」的流程内动作（3 条均为纯 docs 提交），非额外 push；push 后本地 = origin `0 0` |
| 5 | `bash scripts/deploy-portfolio-safe.sh` | 本地侧 4 项检查全过（prisma/data 排除 / .env 排除 / package.json 在 / sha256 f9fed73e…）；服务器侧 sha256 校验过 → tar 提取 → `git reset --hard b2d2eac` → 未纳管构建输入检查过 → `pnpm install` 完成（3.8s）→ **中止于 next 版本断言**（详见下）；此时尚未 stop 服务，**线上全程无感** |
| 6 | 手动复核断言真实状态 | `installed_next=16.3.7` = `locked_next=16.3.7`——断言想验证的事实**实际通过**，纯粹是脚本引号 bug 误杀 |
| 7 | 侦察 standalone 补件需求 | 在跑的 standalone 本就无 `@swc/helpers`/`@next/env` 且 16.3.7 运行正常 → README「Next 16 SOP 补 4 项」不适用本路径（那是 `deploy-portfolio-only.ps1` 特定场景），无需补件 |
| 8 | 按 SKILL「手动完成 deploy」配方补完（scp 脚本 + `nohup … < /dev/null` + status 标志位） | db push（无 schema 变化）→ seed（Seed completed）→ dev.db 2,207,744B → stop → 清 `.next/cache/fetch-cache` → `next build`（23:42:59–23:43:22，**BUILD_ID=`pRkaxPhaiEd-PPKQxusZ3`**）→ cp static+public 进 standalone → restart → **service active，新进程 PID 3601660 etime=3s** |
| 9 | 双侧清理 | 服务器 /tmp：本次 deppf-* + 本次 tarball + **10-03 遗留的 68MB 旧 tarball**（佐证该 bug 当天已中止过一次部署、未走到清理步）全清，零残留；本地 /tmp 清毕；服务器 repo 无 untracked 源码 |

**safe.sh 中止根因**（供后续修复任务，本任务未越界改脚本）：脚本 175 行

```
INSTALLED_NEXT=\$(node -p 'require(\"next/package.json").version')
```

开头双引号被转义、结尾裸双引号未转义，经「本地 bash 双引号 → SSH → 远程 bash」双层解析后双引号被剥离，node 实际收到 `require(next/package.json).version` → `ReferenceError: next is not defined` → `set -e` 中止。该断言自 09-30（commit 0a897d8）加入起在此环境必挂。

## 原子 7 项验证

| # | 验证项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | tar exclude 裸名 | ✅ | 打包成功，tarball 65MB（src-tauri 131 + fonts 108 + components 163 条目，正常内容非 node_modules） |
| 2 | 打包后 grep（prisma/data 不在 + .env 不在） | ✅ | `✅ prisma/data 已排除` / `✅ .env* secrets 已排除` |
| 3 | sha256 本地生成 + scp 单传 + 服务器 `-c` 校验 | ✅ | sha256 `f9fed73ea74c…`，服务器 `✅ sha256 校验通过` |
| 4 | SSH host key 严格（accept-new + BatchMode） | ✅ | 脚本与全部手动 SSH 命令均带 `-o StrictHostKeyChecking=accept-new -o BatchMode=yes -F /dev/null` |
| 5 | 精确 tarball 路径（无 glob，防 TOCTOU） | ✅ | 固定时间戳文件名 `portfolio-deploy-20261005-233953.tar.gz` 显式传参 |
| 6 | 服务器 build 后 db size > 0 | ✅ | `dev.db 2,211,840 bytes`（build 后复测） |
| 7 | 5 项最终验证 | ✅ | ① 三端 commit：本地 = origin = 服务器 = `b2d2eacbfbaf2a3a446a11e88150b426186acb50` ② `/admin` HTTP/2 200 ③ `/api/admin/login` POST 空体 → HTTP 401（路由活、鉴权正常拒绝，非 404/500）④ dev.db 2,211,840B ⑤ 最近 1 分钟 P2021/500 错误数 = 0 |

补做：第 7 项配套的 tarball 清理因脚本中止未执行，已手动补做并顺带清掉 10-03 遗留 tarball。

## 线上复测

`curl -s --compressed https://asterforge.top/`（2026-10-05 23:47）：

```
HTTP 200 | TTFB 0.216967s | size 236877B
```

| 验收项 | 部署前（wave6 基线） | 部署后 | 判定 |
|--------|---------------------|--------|------|
| 相对路径 `/fonts/noto-serif-sc/…` preload | 0 | **18 条**（9 子集 ×2：105/112–119） | ✅ ≥9 |
| 绝对路径 `https://asterforge.top/fonts/…` preload | 16 条 | **0** | ✅ |
| Inter latin（`83afe278`，48,432B ≈48.4KB）preload | 1 | **0**（woff2 文件保留供按需加载 = c28d74c 设计行为） | ✅ |
| JBMono latin（`05174236`，31,340B ≈31.3KB）preload | 1 | **0**（同上） | ✅ |
| 首页状态 | 200 | **200**，TTFB 0.217s | ✅ |

Inter/JBMono 的身份用**服务器构建产物字节数硬证据**锁定：`.next/static/media/83afe278…woff2` = 48,432B、`05174236…woff2` = 31,340B，与 wave6 实测 48.4/31.3KB 完全吻合。

部署后剩余 font preload 全集（curl 原始输出片段）：

```
1  href="/_next/static/media/9e9f04e3c37952ab-s.p.0pan85mumqyf3.woff2"   ← Anton latin 400（12,004B）
1  href="/_next/static/media/fraunces_latin_500_normal-s.p.….woff2"     ← Fraunces（local 显式 preload）
1  href="/_next/static/media/fraunces_latin_600_normal-s.p.….woff2"
2 ×9 href="/fonts/noto-serif-sc/5.3.0/noto-serif-sc-{105,112..119}-600-normal.woff2"
```

Anton（`--font-display`）未在本轮 `f62b13c`/`c28d74c` 改动范围内（layout.tsx 中无 `preload:false`），保留为符合提交内容的预期行为，非回归；Fraunces 为 437349a 轮引入的显式 preload，预期保留。

## 自评

- **验收 3 项全过**：7 项验证全绿（1 项由手动兜底补完）、preload 相对 18≥9 / Inter+JBMono=0 / 首页 200、报告含日志摘要与原始 curl 证据。
- **零越界**：未改任何业务代码 / 配置 / nginx；push 仅限流程内必需的 3 条已有 docs 提交；部署中断后未盲目重跑脚本（bug 非网络瞬断，重试无意义，符合红线）。
- **服务影响**：停机窗口 = stop（23:42:59）→ active（23:43:25）≈ **26 秒**（build 仅 23s，增量缓存复用，BUILD_ID 已变更证实新构建；fetch-cache 已按 SOP 清除）。
- **遗留发现（不属本任务范围，建议立项修复）**：`deploy-portfolio-safe.sh` 175 行断言的引号转义 bug 自 09-30 起使脚本在此环境必挂于该步（10-03 遗留 68MB tarball 佐证当天同样中止）；修法为将内层引号改为不依赖双层转义的写法（如 `node -p "require('next/package.json').version"` 内外引号对调，或断言移至独立远程脚本文件）。
- **线上验证口径说明**：`/api/admin/login` 的 401 为「路由活」的正确判据（空凭证 POST 被鉴权拒绝），与 404/500 区分。
