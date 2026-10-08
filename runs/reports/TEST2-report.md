# TEST2 结果报告

## 结论一句话

快照按打磨后 UI 全量重生成（3 张、稳定复现），verify **12/13 绿**——唯 `check:clean` 因工作树含 wave14 未提交改动结构性红（预期，待主控提交）；过程中修掉 2 个真实回归：SecHead 375px 横向溢出（组件 1 行）与 copy-provenance 大小写断言（测试侧）。

## verify 全量结果表

| 阶段 | 结果 | 关键数字 |
|---|---|---|
| typecheck | ✅ | tsc --noEmit 零输出 |
| lint | ✅ | eslint . 零告警 |
| test:unit | ✅ | 16 files / 173 passed |
| test:integration | ✅ | 4 files / 59 passed |
| test:security | ✅ | 1 file / 31 passed |
| test:e2e | ✅ | 30 passed (54.1s) |
| test:a11y | ✅ | 6 passed |
| test:responsive | ✅ | 7 passed |
| test:visual | ✅ | 3 passed（新基线稳定复现两次） |
| build | ✅ | 66 modules / built in 1.33s |
| check:bundle | ✅ | [check-bundle] PASS |
| check:clean | ⛔ 结构性红 | 见下方关键行（预期） |

check:clean 关键行（留证）：

```
[check-clean] FAIL：验证产生了未声明的 tracked/untracked 改动：
   M site/src/App.tsx
   M site/src/components/BenchForm.tsx
   ...（wave14 POL1-POL5 打磨改动 13 文件）
   M tests/e2e/copy-provenance.spec.ts
   M tests/e2e/visual.spec.ts-snapshots/workbench-1440-light.png
   M tests/e2e/visual.spec.ts-snapshots/workbench-1440-reduce.png
   M tests/e2e/visual.spec.ts-snapshots/workbench-375-light.png
```

红因：工作树含 wave14 打磨改动 + 本任务快照/测试产物，均属主控统一验收提交范围，非验证流程污染。

## 修改清单

1. **`site/src/components/BenchForm.tsx:251`**（组件级小样式修复，1 行，豁免范围内）：`SecHead` 容器 `flex` → `flex flex-wrap`。诊断：编号 + 大写 tag + 长 sub（"快选 · 点击预填 URL 与模型，Key 不预填"）三段均 `whitespace-nowrap`，375px 视口下 `scrollWidth 379 > clientWidth 375`（探针实测：sub 起点 x=186、宽 193px、右缘 379）。加 `flex-wrap` 后桌面（≥768px）不触发换行、渲染不变，375px 下 sub 折至次行、发丝线填充余宽。**修复导致 375 快照变化，基线在组件修复后二次重生成**，3 张均为最终态。
2. **`tests/e2e/copy-provenance.spec.ts:93`**（测试文件修复）：`expect(text).toContain("Total")` → `expect(text.toLowerCase()).toContain("total")`。原因：wave14 词汇表制式将左列术语码大写渲染（`TERMS = [..., "TOTAL", ...]`，Methodology.tsx:9，注释明言"展示层映射，不改文案源"），`innerText` 取到的是渲染态 `TOTAL`，区分大小写断言必然失败。改为大小写不敏感——锚"指标口径存在"的语义，不锚字形制式。
3. **`tests/e2e/visual.spec.ts-snapshots/`（3 张基线全量重生成）**：先删后生成两次（首次生成后发现组件溢出，修复后二次重生成保证基线=最终组件态）；生成后不带 `--update-snapshots` 复跑一次验证非 flaky（两次全过）。

临时探针 spec（`tests/e2e/probe-tmp.spec.ts`）用完已删，无残留、无孤儿。

## 未修问题分级（P0-P3）

无。全部失败项已归因并修复（见修改清单 1、2），无组件结构性问题、无遗留 blocker。

## 自评

- 验收标准 1（快照仅 3 张全新基线、无孤儿）：✅ `ls` 实证 3 文件，且为组件修复后的最终态，非中间态。
- 验收标准 2（verify 12/13 绿，唯 check:clean 结构性红）：✅ 关键行已粘贴。
- 验收标准 3（e2e/a11y/responsive 全过）：✅ 30 + 6 + 7 passed——锚点未破的实证；唯一"锚点破"假象（Total 大小写）实为制式渲染所致，已在测试侧以语义锚方式修复。
- 红线遵守：未碰 package.json；零 git 操作（无 add/commit/restore）；探针为本地 mock 流量，无真实网络；无密钥读取。
- 风险提示：SecHead 修复采用 `flex-wrap` 是通用防溢出（不依赖当前文案长度），若后续 POL 再增长 sub 文案也不会回退溢出；但若主控对 375px 折行视觉有异议，可改为收窄 sub 或隐藏 hairline 的替代方案（≤5 行内可换）。
