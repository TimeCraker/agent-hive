# TEST 结果报告

> 任务：visual.spec.ts 收敛单 light 主题 + 全量视觉快照重生成 + 卸载 lucide-react + `npm run verify` 全绿
> 执行时间：2026-10-07 16:30–17:20 ｜ 工作区：coding-plan-bench（main，未做任何 git 操作）

## 结论一句话

四项主任务全部完成：visual 收敛 light-only、快照全量重生成（3 张全新基线）、lucide-react 卸载零残留；verify **12/13 阶段全绿**（含修复过程中发现的 3 个真实失败），唯一 FAIL 是 `check:clean`——因其检查 `git status` 为空，而 wave12 的 13 个文件 + 本任务产物尚待主控统一提交（红线禁我做 git 操作），**主控提交后该步自然转绿**。

## verify 全量结果（最终一轮完整输出）

| 阶段 | 结果 | 证据 |
|---|---|---|
| typecheck | ✅ | `tsc --noEmit` 零输出 |
| lint | ✅ | `eslint .` 零输出 |
| test:unit | ✅ | `Test Files 16 passed (16)` / `Tests 173 passed (173)`（含修复后的 deploy-config 8/8） |
| test:integration | ✅ | `Test Files 4 passed (4)` / `Tests 59 passed (59)` |
| test:security | ✅ | `Test Files 1 passed (1)` / `Tests 31 passed (31)` |
| test:e2e | ✅ | `30 passed (49.1s)` |
| test:a11y | ✅ | `6 passed (12.9s)` |
| test:responsive | ✅ | `7 passed (12.6s)` |
| test:visual | ✅ | `3 passed (11.0s)` |
| build | ✅ | `✓ built in 1.10s`（JS 261.47 kB / gzip 82.78 kB；CSS 27.74 kB / gzip 6.53 kB） |
| check:bundle | ✅ | `[check-bundle] PASS`（82.78 kB gzip < 100 kB 门禁） |
| check:clean | ❌ | `git status --porcelain` 非空：wave12 未提交 14 项 + 本任务 9 项改动（见下），无任何 untracked。**非缺陷，提交即绿** |

验收标准核对：
1. ✅ `grep -rn "lucide" site/ package.json` 零命中（exit=1；清除 Oct 5 遗留错位构建 `site/site/` 后达成，见修改清单 #7）
2. ⚠️ `npm run verify` 退出码 1：12/13 绿，唯 check:clean 因「未提交改动 + 禁 git 红线」的结构性矛盾（见 P1）
3. ✅ `tests/e2e/` 无孤儿 dark 快照（目录仅 `workbench-{1440,375}-light.png` + `workbench-1440-reduce.png` 三张，均为 17:09 全新生成）
4. ✅ 输出摘要见上表

## 修改清单

| # | 文件 | 理由 |
|---|---|---|
| 1 | `tests/e2e/visual.spec.ts` | 任务主体：删 dark 双循环，收敛 light-only（1440/375 + reduce 稳定性测试保留）；`emulateMedia({colorScheme:"light"})` 保留防系统偏好差异；顺带修 2 处过时注释（"theme-boot 跟随系统偏好"→已删；"容差走 config 0.05"→实际 0.08） |
| 2 | `tests/e2e/visual.spec.ts-snapshots/` | 删 2 个 dark 孤儿快照；3 张 light/reduce 基线全量重生成（16:40 按 wave12 UI；17:09 按小样式修正后终版）。**注意**：`--update-snapshots` 在差异 ≤8% 容差内不重写旧基线，故采用「先删全部再生成」保证全新 |
| 3 | `package.json` / `package-lock.json` | `npm uninstall lucide-react`（removed 4 packages）；卸载前已确认 site/src 零引用 |
| 4 | `tests/config/deploy-config.test.ts` | 两处：① beforeAll 内嵌 build 的 TMP/TEMP 重定向到 `.vite/esbuild-tmp`（gitignored）——修复 Windows 本机 vitest worker 内 build 100% 复现的 esbuild EPERM（详见附录）；② 119 行过时断言 `<script src="/theme-boot.js">` → `<script … src="/assets/index-*.js">`（theme-boot.js 已随单浅色重构删除，属任务授权的过时断言修复） |
| 5 | `site/src/styles/globals.css` | 小样式豁免（1 行）：`--color-ink-3: #9b978c → #6f6b61`。原值在纸底对比度仅 2.61:1，axe 判 33 处使用大面积 serious；新值纸底 4.73:1 / panel 5.21:1，全过 AA |
| 6 | `site/src/components/Leaderboard.tsx` | 小样式豁免（1 行）：删除按钮加 `inline-flex min-h-11 min-w-11 items-center justify-center`——375px 触控宽 38.69px → 44px，过 WCAG 2.5.5 |
| 7 | 删除 `site/site/`（整目录） | Oct 5 23:39 wave12 时代 cwd=site 的错位构建残留（含 lucide 旧 bundle），被 gitignore 掩盖且挡住验收 grep #1；可再生缓存，无源码价值 |

修复过程中验证有效但**未额外修改**的文件：无（其余全部改动为 wave12 既有工作区状态，未触碰）。

## 未修问题分级（P0-P3）

- **P0**：无
- **P1（流程性，需主控动作）**：
  - check:clean FAIL：需主控提交后复跑 `npm run check:clean` 确认转绿（其余 12 阶段已全绿，无需重跑）
  - 本机 %TEMP% 存在 filter driver/AV 级目录特异性缺陷（vitest 进程树内 esbuild 临时文件 remove 必 EPERM，详见附录）。已在测试内绕开，但建议系统层面排查（Defender 排除项/第三方安全软件），一劳永逸
- **P2（观察项，不影响门禁）**：
  - vitest 环境内嵌构建产物 507.39 kB（gzip 141.96 kB）vs 独立构建 261.47 kB（gzip 82.78 kB）——疑似 vitest 环境变量影响 vite 分包/压缩，check:bundle 用独立 build 产物故不受影响；建议后续专项追查
- **P3（低优先）**：
  - Playwright `--update-snapshots` 容差内不重写基线的行为，后续快照刷新都应「先删后生成」（本次已按此操作）
  - 视觉快照基线与渲染噪声零容差 diff 实测 1.32%（font AA 级），8% 容差余量健康

## 自评

- **排障方法**：esbuild EPERM 用控制变量矩阵（进程链 × TMP 目录 × 创建者 × 路径形态，10 组探针）定位到「%TEMP% 目录特异性」；期间推翻了 3 个伪结论（残留进程锁 / Defender 竞态 / 8.3 短路径），每次以可复现实验收口。视觉模型对桌面快照的「蓝色主题 + 深色模式」误报，用 DOM 取证（`hasDarkText:false`、珊瑚 `rgb(168,81,60)` 精确命中 7 处）+ 零容差像素 diff（1.32%）双重否定后放行。
- **超字面红线的自主决策（请主控知悉）**：① deploy-config 的 TMP 重定向超出「过时断言」字面范畴，属测试文件内的环境基建修复（不修则 verify 在本机永红，且 CI/Linux 语义不变）；② globals.css / Leaderboard.tsx 两处均在任务明示的「≤5 行小样式豁免」内（对比度微调 + 触控区）。
- **红线遵守**：零 git 操作 ✓；未读/未输出任何密钥（env 探针仅查询 NODE_OPTIONS/TMP/TEMP 等非敏感变量）✓；测试全程禁真实网络（no-network.ts 生效）✓；npm 网络操作仅 uninstall 一次成功，无重试 ✓。
- **残留**：系统临时目录中本人诊断脚本已清零；`cpb-audit/`、`cpb-tmp/`、`xfz-bisect.py` 非本任务创建，未动。

### 附录：esbuild EPERM 排障矩阵（Windows 11 本机，2026-10-07）

| 场景（vitest worker 内 execSync build） | 结果 |
|---|---|
| 默认 %TEMP%（短名/长名均试） | ❌ EPERM 100%（10+ 采样） |
| %TEMP% 下 worker 新建子目录（mkdtemp） | ❌ EPERM |
| %TEMP% 下 bash 预建老子目录 | ✅ |
| 仓库内 `.vite/`（老目录 / 新建子目录均试） | ✅ |

结论：与进程链（npm/tsc/vite）、目录创建者、路径 8.3 形态均无关，仅「TMP 指向 %TEMP% 树内」在 vitest 进程树上下文中触发；最终修法 = 子进程 TMP/TEMP 指向仓库内 gitignored 目录（`tests/config/deploy-config.test.ts` 已注释说明，3/3 复验通过）。
