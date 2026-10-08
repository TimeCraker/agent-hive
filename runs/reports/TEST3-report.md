# TEST3 结果报告

## 结论一句话

快照按减法后 UI 全量重生成（3 张全新基线、无孤儿）、verify 全链 12 步中 11 绿，唯 check:clean 结构性红（主控提交前预期态）；过程中发现并修复 1 处真实 a11y 回归（墨底珊瑚短码对比度 3.2:1 → 5.6:1，3 行豁免内）。

## verify 全量结果表

| 步骤 | 结果 | 证据（2026-10-07 实测输出） |
|---|---|---|
| typecheck | ✅ | `tsc --noEmit` 无输出 |
| lint | ✅ | `eslint .` 无告警 |
| test:unit | ✅ | Test Files 16 passed (16) · Tests 173 passed (173) |
| test:integration | ✅ | Test Files 4 passed (4) · Tests 59 passed (59) |
| test:security | ✅ | Test Files 1 passed (1) · Tests 31 passed (31) |
| test:e2e | ✅ | 30 passed (38.3s) |
| test:a11y | ✅ | 6 passed (9.5s) |
| test:responsive | ✅ | 7 passed (9.5s) |
| test:visual | ✅ | 3 passed (9.1s) |
| build | ✅ | `✓ built in 771ms` |
| check:bundle | ✅ | `[check-bundle] PASS`（gzip 83.31 KB / 100 KB 上限） |
| check:clean | ❌ 预期内 | 关键行：`[check-clean] FAIL：验证产生了未声明的 tracked/untracked 改动`（18 项 = 主控 wave15-17 未提交改动 15 项 + 本次 3 项，属主控提交前结构性红，非缺陷） |

快照目录终态（先删后生成、两轮确认稳定，无孤儿）：

```
tests/e2e/visual.spec.ts-snapshots/
  workbench-1440-light.png   (78,885 B, 20:41)
  workbench-1440-reduce.png  (81,730 B, 20:41)
  workbench-375-light.png    (43,944 B, 20:41)
```

## 修改清单

本次新增改动共 3 行代码 + 快照产物（≤5 行小样式豁免内，未触碰 package.json / copy.ts）：

1. `site/src/styles/globals.css:28` — 新增 token `--color-accent-lift: #cc7d66`（墨底亮珊瑚，ink 上 5.6:1；同色相提亮版，沿用本仓 ink-3 注释所载「色值不达标直接换值」既定修复模式）
2. `site/src/components/GlobalLeaderboard.tsx:313` — 榜切换 tab 选中态短码 `text-accent` → `text-accent-lift`（axe 报的唯一违规文本：10px bold 珊瑚 #a8513c 在墨底 #1a1a18 上 3.2:1 < 4.5:1）
3. `site/src/components/Leaderboard.tsx:176` — 指标 tab 选中态 ↑/↓ 箭头 `text-accent` → `text-accent-lift`（同源缺陷一并修：该箭头因 `aria-hidden` 未被 axe 报，但同属墨底珊瑚文本，不修会造成同格两色珊瑚的肉眼色差）
4. `tests/e2e/visual.spec.ts-snapshots/*.png` — 3 张基线全量重生成 ×2 轮（20:37 首版因上述样式修复作废删除，20:41 终版复跑 3/3 稳定通过）

排查确认无需改动的同类项：`Sidebar.tsx:77` 珊瑚圆点为非文本色块（3:1 要求，3.2:1 达标）；`BenchForm.tsx:94` 协议选中格内无 accent 文本；其余 `text-accent` 均在纸/panel 底（4.79:1 达标）；多处 `hover:bg-ink` 反白无 accent 子文本且 axe 不查 hover 态。

## 未修问题分级

- **P0-P3：无**。未发现需交主控的结构性或组件问题。
- 备忘（非缺陷）：`check:clean` 红为任务书预告的主控提交前结构性红，18 项改动待主控统一提交后自愈；`Leaderboard.tsx:176` 箭头的 aria-hidden 装饰语义保留未动。

## 自评

- 流程合规：按「tsc/lint 先行 → 删快照 → 生成 → verify 全量」顺序执行；失败处理遵循分级规则——a11y 失败先定位（区分了「axe 因 aria-hidden 跳过」与「真违规」），确认真回归后以 3 行豁免内修复，改后 a11y 6/6、快照重生成复跑稳定。
- 判定依据可溯：对比度手算复核（#a8513c 与 #cc7d66 在 #1a1a18 上分别为 3.2:1 / 5.6:1）；verify 链为 `&&` 串联，check:clean 能执行即证明前 11 步全绿，并另留存全量日志逐项取证后清理。
- 红线自查：未做 git 操作、未碰 copy.ts/package.json、测试无真实网络、临时文件（verify 日志、test-results）已收尾清除。
- 不足：视觉快照基线含本次样式修复后的新色值，若主控后续再动墨底珊瑚相关样式需再次重生成（属正常流程）。
