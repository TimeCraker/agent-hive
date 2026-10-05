# 任务 PUBD：vibe-studio skills/publish Playwright 依赖正经化（自足化）

## 背景（已核实事实，勿重新考古）
- 仓库：`C:\Users\TimeCraker\Desktop\my_workspace\vibe-studio`（Git 仓，master，工作树应干净；若有别人未提交改动，一律保留不碰）
- `skills/publish` 是三端投稿填表 skill（B 站/抖音/小红书，独立 Chrome profile + 调试端口 9222/9223/9224，契约：脚本只填表、人点发布）
- 填表层已从 CDP 手写迁移到 Playwright `connectOverCDP`（pw/ 脚本族），但 **Playwright 的 node_modules 挂在 `products/hsr-currency-war/pw/` 下**（历史项目的施工残留），skill 模板不自足——换机器/删旧项目即断
- 工单台账原话（docs/workorder-log.md 2026-10-03 遗留）：「Playwright 依赖还挂在 hsr 项目下，收录进 skills/publish 时要正经化（装包或 vendoring 决策）」

## 步骤
1. 读 `skills/publish/SKILL.md` 与 `templates/` 全部脚本，弄清哪些脚本 import playwright、入口与参数形态（run.mjs / bili / douyin / xhs）；再看 `products/hsr-currency-war/pw/` 的 package.json 与用法
2. 做依赖决策并实施**最小方案**（预期方向：`skills/publish/templates/` 补一份 package.json，声明 playwright 依赖与 scripts；不建新抽象、不复制 node_modules；若调研后发现更简方案——例如脚本可声明式声明所需版本即可——如实论证后实施）
3. `skills/publish/SKILL.md` 使用节补安装步骤（一两行，说清「复制模板后先装依赖」）；只动这一个 SKILL.md
4. 验证自足性：把 `products/hsr-currency-war` 临时改名（如 `hsr-currency-war__hold`），在临时目录复制 publish 模板 → `npm install --no-audit --no-fund` → 跑 dry 模式（`--dry` 或等效不登录不开真实投稿的路径）确认零报错零依赖 hsr；验证后**立刻把目录名改回**
5. 提交：只 `git add skills/publish/**`，Conventional Commits 中英对照，如 `fix(skills): publish 依赖自足化 / make publish skill self-contained`

## 红线
- 不真发布、不扫码登录任何平台；key/账号信息零接触零入库
- 不动 `products/`（临时改名验证除外，验完立即恢复并 `git status` 确认无痕）
- 不改其他 skill、不改 `docs/**`（workorder-log 由主控统一补记）
- 并行施工提示：同仓可能有其他会话在改别的目录，提交只 add 上面列的文件；遇 `index.lock` 等 10 秒重试（≤3 次）
- npm 安装如遇网络问题，重试 ≤1 次，失败如实报告

## 验收标准
- publish 模板脱离 hsr 项目可独立 dry-run（报告中给出完整命令与输出摘要）
- SKILL.md 安装步骤就位
- 1 个 commit，`git status` 干净（含 hsr 目录名已恢复的证据）

## 报告要求
完成后把结果**整文件覆盖写入**：
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PUBD-report.md`
结构：# PUBD 结果报告 / ## 结果摘要 / ## 依赖决策与理由 / ## 改动清单 / ## 验证证据（命令+输出摘要）/ ## 提交 / ## 遗留问题 / ## 自评（达标|部分达标|未达标 + 原因）
