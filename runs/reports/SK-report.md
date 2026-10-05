# SK 结果报告

任务：把 `frontend-test` / `perf-audit` 两个 Claude Code skill 导入 DSH 可用范围
执行日期：2026-10-05

## 落点机制调查结论

读本仓 `README.md` + `lib/import-logic.js`（纯函数核心，无 DSH 运行时依赖）得出：

1. **用户级 skill 落点**：`~/.claude/skills/<name>` → `~/.agents/skills/<name>`
   （绝对路径：`C:\Users\TimeCraker\.agents\skills\<name>`；README「落点映射」标注为 DSH 官方扫描根，rank 500）
2. **识别条件**：目标 skill 目录内必须存在 `SKILL.md`（`listClaudeAssets` 以此过滤）
3. **幂等机制**：`compareSkillDirs` 按「相对路径 → sha256(内容)」整树指纹比对；一致 → identical 跳过，不同 → conflict 走三策略（覆盖/合并/跳过）
4. **复制方式**：`replaceDir` = 复制到 `<target>.dsh-import-tmp-*` 临时名后原子改名；目标为 junction 时先摘链接绝不写穿
5. **DSH skill 清单机制**：`~/.dsh` 目录树（cache / storages / dsh-runtimes / profiles）中**无 skill 持久清单或缓存文件**，skill 由新会话启动时从扫描根动态发现 → 本环境无法模拟 DSH 会话识别，需用户侧开新会话验证
6. **佐证**：`~/.agents/skills/` 已有 6 个 skill（design-skill、gsap、issue-summary、lottie、skill-creator、ui-ux-pro-max，目录时间戳 2026-08-14 与本仓同期），正是此前插件实际导入的落点；`~/.claude/skills` 8 个 skill 的差集恰好 = 本次任务的两个

## 实际操作（复制/修改清单）

**采用优先方案**：未手工 `cp`，而是写临时 Node 脚本（位于系统临时目录，已清理）直接调用插件自身的 `planImport` / `executeImport`，`strategies` 中除两个目标 key 外全部显式 `skip` —— 与 GUI 里只勾选这两项完全等价，落点规则、指纹比对、原子替换全部复用插件代码。

| 项 | 源（只读） | 目标（新增） | 结果 |
|---|---|---|---|
| frontend-test | `~\.claude\skills\frontend-test\`（1 文件，10.6 KB） | `~\.agents\skills\frontend-test\` | imported（new → overwrite） |
| perf-audit | `~\.claude\skills\perf-audit\`（10 文件，44.3 KB） | `~\.agents\skills\perf-audit\` | imported（new → overwrite） |

无同名冲突（导入前目标目录不存在两者）。副作用控制：其余 6 个用户级 skill 中 4 个 identical（无写入）、2 个 conflict（design-skill、ui-ux-pro-max，源比目标新）按策略 skip，**未动**。未触碰 rules / CLAUDE.md / AGENTS.md / commands。未修改 DSH 安装目录与 `~/.claude` 源。

目标文件树（导入后实际存在）：

```
C:\Users\TimeCraker\.agents\skills\
├── frontend-test\
│   └── SKILL.md                      (10,895 B)
└── perf-audit\
    ├── SKILL.md                      (6,443 B)
    ├── references\
    │   ├── output-schema.md          (3,698 B)
    │   ├── thresholds.md             (3,212 B)
    │   └── troubleshooting.md        (6,200 B)
    └── scripts\
        ├── common.sh                 (4,224 B)
        ├── lighthouse.sh             (4,747 B)
        ├── merge-report.sh           (7,455 B)
        ├── pa-jq.js                  (1,789 B)
        ├── psi.sh                    (3,614 B)
        └── wpt.sh                    (4,020 B)
```

## 验证证据

1. **插件复验 identical**：导入后重跑 `planImport`，两项均为 `[identical] 已导入且内容一致，无需改动` —— 即整树 sha256 指纹（相对路径 + 内容）与源完全一致（连 scripts 的可执行位文件也逐一落位）。
2. **文件完整**：文件树见上；frontend-test 1 文件、perf-audit 10 文件，与源 `ls -laR` 逐项对应。
3. **frontmatter 完好**：两个 `SKILL.md` 首行 `---`、`name:`、`description:` 均在（frontend-test 另有 `user-invocable: true`；perf-audit 另有 `license` / `metadata`）。
4. **无 junction**：目标目录导入前经 `dir /a` 确认无联接，均为真实目录，不存在写穿风险。

### 用户侧验证步骤（本环境无法启动 DSH 会话，DSH 无 skill 缓存可查）

1. 打开 DSH，新建会话；
2. 查看可用 skill 列表，应出现 `frontend-test` 与 `perf-audit`；
3. （可选）在 DSH 会话里说「跑一次页面性能跑分」验证 perf-audit 可被触发加载。

## 遗留问题

- **design-skill / ui-ux-pro-max 源已更新**：`~/.claude/skills` 中这两个 skill 比 `~/.agents/skills` 目标新（conflict），本次按任务范围未动；后续可在 DSH 设置 → 插件配置 →「导入 Claude 配置」里对这两项选「覆盖」更新。
- DSH 识别验证只能由用户开新会话完成（DSH 无 skill 清单缓存、本环境无 DSH 运行实例）。

## 自评

**达标**。两个 skill 已按插件自身的落点规则与幂等机制完整落位（复验 identical），目标路径清单与文件树齐全，验证方法明确且已尽本环境所能完成文件级验证；红线全部遵守（未改 DSH 程序、未动 `~/.claude` 源、无冲突蛮干）。
