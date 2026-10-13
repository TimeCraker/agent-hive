# RB2 · 回滚 runbook Abort 修复 + 离线三中止点演练

日期：2026-10-12。对象：`my-portfolio/docs/runbooks/rollback.md`。依据：`portfolio-review-followup-2026-10-11/REVIEW.md` §1 + `rollback-mv-proof.txt`（POSIX mv 最小实验：`new_build_at_service_root=false, saved_build_nested=true`）。

## 结论

REVIEW §1 的三项建议全部落实，runbook Abort 嵌套缺陷已修复并以离线假目录演练验证（三中止点 4 场景 PASS + 修复前缺陷复现对照）；**线上零触碰**——未执行任何回滚 / 恢复 / 重启，未 SSH 写操作。commit：**`5cf5a9b`**（分支 `codex/character-motion-m1`，1 file changed, +52/−23）。

## 1. runbook diff 摘要（对照 REVIEW §1 建议）

| REVIEW §1 建议 | 落实位置（`docs/runbooks/rollback.md`） | 改法 |
| --- | --- | --- |
| Abort 直接 mv 会嵌套；先移开候选目录再还原 | §3.1 Abort 路径（原 :92-99 整段重写） | 新增三中止点对照表 + 统一流程：**A)** `[ -d .next/$d ]` 时先 `mv .next/$d .next/$d.aborted-$TS2` 移开解压产生的候选（不存在则跳过）→ **B)** 还原 `*.broken-$TS`（此刻目标必不存在，mv 是改名不嵌套）→ **C)** 根 BUILD_ID 从步骤 2 存档恢复。三中止点同一段代码覆盖；另补「步骤 2 之前中止只需 restart」与「新会话先 `ls .next/` 找回时间戳」两条边界 |
| Abort 从保存值恢复 BUILD_ID，不硬编码 | §3.1 步骤 2 + Abort C | 步骤 2 新增 `cp .next/BUILD_ID .next/BUILD_ID.pre-rollback-$TS`；Abort 用 `cp` 恢复存档值；原 `echo 'pzMAgpozcTii4Ryej1ld2' > .next/BUILD_ID` 硬编码删除 |
| 备份统一引用同一目录；135231/174846 标注不混用 | §1.1 / §1.2 / §3 身份段 / §3.1 步骤 0 / §3.2 / §3.3 / §3.4 / §4.2 | 步骤 0 改为 `BK=$(cat …predeploy-LATEST.txt)` + 读出 `OLD_SHA`/`OLD_BUILD_ID`，后续代码包（tar）、根 BUILD_ID（cp）、源码回退（`git reset --hard "$OLD_SHA"`）、条件 DB 恢复（`cp "$BK/dev.db"`）全部引用同一 `$BK`；新会话尾注「勿重读 LATEST（可能已被新部署改写），重设为同一目录」。历史波次标注：`…-135231` = 2026-10-11 六幕发布波次（实证样本，§1.2 表保留其直读证据），`…-174846` = 同日晚间性能发布波次（LATEST 现指向）。§1.1 线上事实同步更新为生产 `7bee441` / 两处 BUILD_ID `nwHF9XWOcBX14YFXX9fCN`（2026-10-11 复核实证） |

保持不动（REVIEW 确认已正确的部分）：默认路径零 DB 触碰原则、§4 DB 恢复独立门槛 + 恢复前强制 preflight 备份、上传目录（仓库外）不涉及。§7 清理清单补入 `.aborted-<TS2>` 与 `BUILD_ID.pre-rollback-<TS>`。

## 2. 离线演练（核心证据）

- 脚本：`portfolio-release-closeout-2026-10-12/rb2/rb2-drill.sh`（Git Bash，`mktemp -d` 实验目录；`rollback_to`/`abort_fixed` 与修复后 runbook 逐行对应，仅省略 ssh/sudo/systemctl）
- 复现入口：`bash rb2-drill.sh`（本次输出存 `rb2-drill-transcript.txt`，GNU tar 1.35 / MINGW64_NT-10.0-26200）
- 安全约束：所有递归 mv/rm 前 `guard()` printf 目标绝对路径并断言在实验目录内（transcript 中逐条 `GUARD OK`），越界即 exit 42；结束时实验目录已删除
- 夹具：假服务根 `svc/.next/{standalone,static}`（新构建标记 `NEWID-7bee441-FAKE`，两处 BUILD_ID 一致）+ 假 predeploy 备份（tar 前缀 `standalone/`、`static/`，`BUILD_ID.old`=`OLDID-b2d2eac-FAKE`，旧库快照）+ 假生产库 `PROD-DATA-CURRENT-WAVE` + 仓库外上传标记 `UPLOAD-MARKER-20261012`

### 结果（transcript 原文摘录）

| 场景 | 中止点构造 | 结果行 |
| --- | --- | --- |
| s0 缺陷对照 | 完全解压后执行**修复前** Abort（直接 mv） | `new_build_at_service_root=false saved_build_nested=true` → 与 `rollback-mv-proof.txt` 一致，目录树可见 `standalone/standalone.broken-*` 嵌套；证明夹具对缺陷敏感 |
| s1 | 步骤 2 后、解压前 | `new_build_at_service_root=true build_ids_consistent=true nesting_absent=true db_zero_loss=true uploads_zero_loss=true aborted_candidates=''` → **PASS** |
| s2 | standalone 包已解、static 包未解（两包之间） | 同上全 true，`aborted_candidates='standalone'`（候选移开未删，内容为旧构建）→ **PASS** |
| s3 | standalone 包只解出 1 个成员（目录不完整） | 同上全 true，`aborted_candidates='standalone'`；还原后内嵌 BUILD_ID 复现（完整性恢复）→ **PASS** |
| s4 | 两包全解 + 步骤 4 已覆盖根 BUILD_ID（前置断言确认根值已是旧值） | 同上全 true，`aborted_candidates='standalone,static'` → **PASS** |

`DRILL RESULT: ALL PASS（三中止点 4 场景全过 + 修复前缺陷复现）`，退出码 0。三项证明要求对应：**构建回服务根** = `new_build_at_service_root + build_ids_consistent`（两处 BUILD_ID 均为回滚前新值）；**无嵌套** = `nesting_absent`（还原目录内递归 find 无 `*broken-*`/`*aborted-*`）+ 各场景目录树；**DB/上传零丢失** = `db_zero_loss + uploads_zero_loss`（内容仍为回滚前生产值，未被快照覆盖）。

## 3. 其他核对

- 历史发布报告指向：`agent-hive/runs/reports/DEPLOY-report.md:80` 已有指向 `my-portfolio/docs/runbooks/rollback.md`（commit `d6e9f32`）的警示说明——**已存在且有效**（文件与 commit 均在，本次未改动该报告）。
- 线上状态未变：生产仍为 `7bee441` / BUILD_ID `nwHF9XWOcBX14YFXX9fCN`；本次全程未对服务器做写操作。
- 本修复与后续回滚对的关系：runbook 已参数化，未来波次（含 174846）按步骤 0 动态取值即可，无需再改文档身份常量。

## 4. 证据清单

- `portfolio-release-closeout-2026-10-12/rb2/rb2-drill.sh` — 演练脚本（可复现）
- `portfolio-release-closeout-2026-10-12/rb2/rb2-drill-transcript.txt` — 全程输出（含 GUARD 行、各场景目录树、SUMMARY）
- `portfolio-release-closeout-2026-10-12/rb2/rollback.md.diff` — `git show 5cf5a9b` 全量 diff（177 行）
- 输入依据：`portfolio-review-followup-2026-10-11/REVIEW.md` §1、`rollback-mv-proof.txt`
