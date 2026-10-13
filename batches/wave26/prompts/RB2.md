# RB2 · 回滚 runbook Abort 修复 + 离线三中止点演练

## 依据（必读）
- 复核证据：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-review-followup-2026-10-11/REVIEW.md` §1 +
  `rollback-mv-proof.txt`（POSIX mv 最小实验：`new_build_at_service_root=false, saved_build_nested=true`）
- 现行 runbook：`docs/runbooks/rollback.md`（问题点约 :95 Abort 段）
- 线上事实：生产 = `7bee441` / BUILD_ID `nwHF9XWOcBX14YFXX9fCN`；最新备份 `portfolio-predeploy-20261011-174846`（runbook 内另引用过 `135231` 旧例）

## 修复要求
1. **mv 嵌套缺陷**：Abort 路径在解压已重建 `.next/standalone`/`.next/static` 时，不得把
   `standalone.broken-$TS` 直接 mv 进已存在目标（POSIX mv 会嵌套）。改为：先把解压产生的候选目录
   移到独立路径，再还原保存的新目录；**三种中止点分别处理**：尚未解压 / 部分解压 / 完全解压。
2. **BUILD_ID 保存/恢复**：流程开始时保存当前 BUILD_ID 到变量/文件，Abort 恢复保存值，不硬编码。
3. **备份引用统一**：选定备份目录后，代码包、SHA、BUILD_ID、条件 DB 恢复统一引用同一备份；
   历史例子（135231/174846）明确标注日期与版本，不混用。
4. 默认回滚仅代码+构建、保留当前 DB 与运行时上传；DB 恢复独立条件化（恢复前保存当前库）——
   这些已正确，**保持不动**。
5. **离线演练（核心）**：Git Bash 临时目录（mktemp -d）用带不同标记的假构建文件模拟三中止点：
   - 证明当前构建回到"服务根目录"（假服务根结构 `.next/{standalone,static}` + 两处 BUILD_ID 一致）
   - 证明无目录嵌套（saved 不进 new 内部）
   - 证明假数据库与上传标记零丢失
   - **递归移动/删除前先 printf 确认目标绝对路径在实验目录内**；全程命令可复现，输出存证
6. 不在线上执行任何回滚/恢复；原历史发布报告只加指向现行 runbook 的说明（已加过则核对指向有效）
7. 修改以独立 commit 提交（Conventional Commets 中英文，文档类）

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\RB2-report.md`：
diff 摘要、三中止点演练的命令与结果输出、commit SHA。
证据：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-closeout-2026-10-12/rb2/`
