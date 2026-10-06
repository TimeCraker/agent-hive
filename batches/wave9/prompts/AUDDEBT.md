# 任务 AUDDEBT:5 仓 TODO/FIXME 技术债盘点(只读)

一句话任务:对 xiaofanzhuo / my-portfolio / agent-hive / coding-plan-bench / pwa-hw-voice 五个仓做**只读**技术债盘点——全量 TODO/FIXME/HACK/XXX 注释 + 未提交改动——产出分级技术债台账。**不改任何文件(报告除外)。**

## 背景(已核实事实,勿重新考古)

- 你的 cwd 是工作区根 `C:/Users/TimeCraker/Desktop/my_workspace`(它**不是** git 仓,只是容器目录)。
- 目标五仓(相对 cwd):`xiaofanzhuo/`(社区小饭桌点餐,已上线)、`my-portfolio/`(个人主站,已上线)、`agent-hive/`(你正在其中工作的派发控制台)、`coding-plan-bench/`(模型测速台,已上线)、`pwa-hw-voice/`(未启动定制项目,仅归档协议)。
- **排除**:ResumeAIX(所有者冻结)、games/vibe-studio/video-script-workflow/config/lekao/asterforge-deploy(另有专项审计任务覆盖)、sex-workspace(纯创作)、archive/、一切 node_modules/.git/build 产物。
- 同工作区另有并行波次在做各仓**文档保鲜审计**(只改 .md);`git status` 里的 .md 未提交改动是他们的,报告中**单独标注为"并行波次文档改动,非技术债"**,不混入台账。
- 同波另有 FIXPSF 任务会修 my-portfolio 的部署脚本并提交,忽略该增量。

## 步骤

1. **逐仓 TODO 全量扫描**:对每个仓 `git grep -nE "TODO|FIXME|HACK|XXX\b"`(git grep 只搜追踪文件,天然排除产物;注意 XXX 需词边界防误报)。记录:路径:行号 + 注释内容摘录。
2. **逐仓未提交改动盘点**:`git status --porcelain` + `git stash list`,区分:所有者 WIP / 并行波次文档改动 / 疑似遗留垃圾(如意外入库的产物)。
3. **逐仓近态**:`git log -5 --oneline`(台账里给每个仓一个"最近活动"锚点,判断 TODO 是活跃债还是死债)。
4. **分级汇总**:每条债 P0(安全/线上正确性)→ P1(功能正确性/部署链路)→ P2(质量/卫生)→ P3(锦上添花);同一模式多处出现合并为一条(如"5 处 TODO(api) 合并 1 条")。
5. 写台账报告。

## 红线

- **只读**:除报告外零写入;无 git 写操作(不 commit/stash/discard)。
- 只碰五仓与报告文件;不进入排除清单的目录(读取 CLAUDE.md 等公共文件除外)。
- Windows 11 + PowerShell;China 网络重试 ≤2。

## 验收标准

台账覆盖五仓:每仓 TODO 计数 + 未提交改动计数留证(命令输出);分级合并后总条目数与原始计数可对账;P0/P1 每条附路径:行号。

## 报告要求

完成后**整文件覆盖写入**:
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AUDDEBT-report.md`

模板:`# AUDDEBT 结果报告` / `## 结论一句话` / `## 各仓盘点(5 小节:TODO 明细/未提交改动/最近活动)` / `## 分级技术债台账(P0-P3)` / `## 自评`
