# TEST4 结果报告

## 结论一句话

功能波终检通过：视觉快照按 wave22 功能后 UI 全量重生成（恰 3 张全新基线、无孤儿），`npm run verify` 12 步中 11 步全绿，唯 check:clean 为主控提交前结构性红（预期内，提交后自愈）；期间修 1 处测试断言使其适配 RunProgress 新计数制式。

## verify 全量结果表

实际串联 12 步（package.json `verify` 脚本原样执行，第二轮完整跑）：

| # | 步骤 | 结果 | 关键数据 |
|---|------|------|----------|
| 1 | typecheck (`tsc --noEmit`) | ✅ 绿 | 无错误输出 |
| 2 | lint (`eslint .`) | ✅ 绿 | 无告警 |
| 3 | test:unit | ✅ 绿 | 17 files / 182 tests（含 boardShare 新单测 9 个） |
| 4 | test:integration | ✅ 绿 | 4 files / 59 tests |
| 5 | test:security | ✅ 绿 | 1 file / 31 tests |
| 6 | test:e2e（全量） | ✅ 绿 | 30 passed (37.8s)，含 leaderboard FEAT 红线 |
| 7 | test:a11y | ✅ 绿 | 6 passed (9.5s) |
| 8 | test:responsive | ✅ 绿 | 7 passed (9.8s) |
| 9 | test:visual | ✅ 绿 | 3 passed (9.0s)，新基线确定性复验通过 |
| 10 | build | ✅ 绿 | `✓ built in 853ms` |
| 11 | check:bundle | ✅ 绿 | `[check-bundle] PASS` |
| 12 | check:clean | 🔴 结构性红（预期） | 见下方关键行 |

check:clean 关键行留证（主控提交前结构性红，工作区含 wave22 全部未提交改动）：

```
[check-clean] FAIL：验证产生了未声明的 tracked/untracked 改动：
   M site/src/components/Leaderboard.tsx
   M site/src/components/ResultCard.tsx
   M site/src/components/RunProgress.tsx
   M site/src/content/copy.ts
   M site/src/styles/globals.css
   M tests/e2e/benchmark-flow.spec.ts
   M tests/e2e/visual.spec.ts-snapshots/workbench-1440-light.png
   M tests/e2e/visual.spec.ts-snapshots/workbench-1440-reduce.png
   M tests/e2e/visual.spec.ts-snapshots/workbench-375-light.png
  ?? site/src/components/TrendSpark.tsx
  ?? site/src/lib/boardShare.ts
  ?? tests/unit/boardShare.test.ts
```

> 口径说明：任务验收写「12/13」，实测 verify 链为 12 步（11 绿 + 1 预期红），语义与任务意图一致（除 check:clean 外全绿）。

## 修改清单

仅 2 处，均在红线豁免范围（测试文件 + 快照产物）：

1. **快照基线全量重生成**（`tests/e2e/visual.spec.ts-snapshots/`，先删后生成）：
   - 删除 3 张旧基线 → `npx playwright test tests/e2e/visual.spec.ts --update-snapshots` 生成 3 张全新基线（workbench-1440-light / workbench-375-light / workbench-1440-reduce）。
   - 新基线默认视图 = 榜单，已包含 wave22 的「复制榜单」按钮与「榜单/趋势」切换控件；verify 第 9 步以对比模式复跑通过，证明基线确定性。

2. **`tests/e2e/benchmark-flow.spec.ts:140-142` 断言精确化**（1 行替换 + 1 行注释）：
   - 旧：`await expect(progress).toContainText("1/3");`
   - 新：`await expect(progress).toContainText(/SAMPLE 1\/\?|SAMPLE 2\/3/);`
   - 根因：wave22 后 RunProgress 计数制式变化——引擎首次 onProgress 回调前（首样本在测中）总数未知，显示 `SAMPLE 1/?`；回调后显示 `SAMPLE 2/3` 串行推进。旧断言 `1/3` 锚定旧格式，首轮 verify 即红。
   - 语义不变：仍验证「多样本运行时样本进度计数可见 + 可取消」，正则兼容两种时序态，零 flaky。首轮 verify 该测试 5s 超时失败，修正后单跑 1.6s 通过、全量 e2e 30/30 通过。

## 未修问题分级

- **P0 / P1 / P2：无。**
- **P3（预期内，不修）**：check:clean 红——系工作区含 wave22 功能改动（5 M + 3 ??）+ 本任务快照重生成（3 M）+ 测试修正（1 M）均未提交所致，属主控提交前结构性红，主控完成提交后自愈。
- 备注：leaderboard.spec 预警的选择器歧义未发生——该文件无裸 `getByRole('button')`，「开始测速」为精确名匹配，其余走 testid，30/30 一次通过，零修改。

## 自评

- 快照验收：目录恰 3 张全新基线（2026-10-08 10:39 生成），无孤儿文件 ✅
- e2e / a11y / responsive 全过（30 / 6 / 7）✅
- boardShare 新单测计入 test:unit（17 files / 182 tests，单跑 9/9）✅
- 红线遵守：只改测试文件与快照产物，未碰 package.json / copy.ts / 组件结构；无 git 提交操作；e2e 全程 mock route 无真实网络；未读取任何密钥 ✅
- 唯一超预期事项：benchmark-flow 断言修正（任务已授权「测试侧直接修」路径，已如实报告）
