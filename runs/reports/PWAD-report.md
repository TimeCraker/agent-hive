# PWAD 结果报告

## 结果摘要

pw 填表脚本九件套已从 git 历史 `7277880`（pelican-ride 清场前快照）捞回，适配后收录为 `skills/publish/templates/pw/`，模板三层齐备：launch 基础层（bili/douyin/xhs.mjs）/ CDP 探针层（基础层自带）/ Playwright 填表层（pw/）。SKILL.md 快速上手补 pw/ 用法入口，「坑」节 2026-10-03 条同步收录状态。1 个 commit（`97e1fe2`），工作树干净。

## 适配点清单

| # | 适配点 | 改动 |
|---|---|---|
| 1 | `loadPlaywright` 硬路径（工单点名①） | `require(../../hsr-currency-war/pw/node_modules/playwright)` → `require('playwright')`，从 `pw/` 子目录向上命中 `templates/node_modules`（PUBD 托管）；报错提示改为指向 `npm install` |
| 2 | qa/ 截图输出项目化（工单点名②） | `util.js` 新增 `qaPath(name)`：落 `<项目>/qa/` 且自动建目录；9 个文件里全部 `qa/xxx.png` 相对路径与 `__dirname/../qa` 绝对路径统一改走 `qaPath` |
| 3 | spec 读取项目化 | `ROOT` 由 `path.join(__dirname, '..')`（原 pelican-ride 工程目录）→ `path.resolve(arg('project', process.cwd()))`，与 bili.mjs/xhs.mjs 的 `--project` 同构；`bili-replace.js` 的裸 `readFileSync(__dirname/../form.json)` 与 `process.argv[2]` 一并改为 `loadSpec` + `arg('video')` |
| 4 | hsr 字样清零（验收硬指标） | `util.js` 头注释与报错文案重写；`bili-fill.js`/`douyin-fill.js`/`bili-discard.js` 注释里的 hsr 出处改为「2026-10-03 三端 live 实测版」 |
| 5 | 模板语境泛化 | `bili-replace.js` 头注释「换成 pelican-ride」→「换成本次内容」；`douyin-fill.js`/`xhs-fill.js` 报错提示里的 `../../` 相对路径改为仓库根视角（与 SKILL.md 文档一致） |
| 6 | SKILL.md | 快速上手新增「Playwright 填表层（pw/）」段（用法命令 + 九件角色 + `--dry` 探针纪律）；「坑」节 2026-10-03 条由「本体现存 git 历史」更新为「已收录进 templates/pw/」 |

未动的部分（有意保留）：`bili-fill.js` 删误猜标签列表（欧美MV 等）、`bili-replace.js` 旧标签列表、`bili-fix3.js` 分区当前值「绘画」等定点逻辑，均为实测版脚本的历史现场，运行时找不到即跳过/人工兜底，泛化它们超出本次收录边界。

## 验证证据（命令+输出）

**1. 语法检查 9/9：**

```
$ for f in *.js; do node --check "$f" && echo "OK $f"; done
OK bili-discard.js / OK bili-fill.js / OK bili-fix3.js / OK bili-replace.js
OK bili-restore.js / OK douyin-declare-fix.js / OK douyin-fill.js / OK util.js / OK xhs-fill.js
```

**2. hsr 引用扫描（0 命中）：**

```
$ grep -rn "hsr" skills/publish/templates/
（无输出，exit=1）
```

**3. 临时目录依赖验证（复制 templates → npm install）：**

```
$ npm install --no-audit --no-fund
added 2 packages in 4s          # 仅 playwright + playwright-core，秒装，零浏览器下载
```

**4. 零副作用加载验证（不开浏览器、不连 CDP）——`--dry` 的替代验证：**

```
$ node -e "const u = require('./pw/util'); const pw = u.loadPlaywright(); ..."
exports: loadPlaywright,arg,hasFlag,ROOT,loadSpec,qaPath,setFiles,dumpForm,typeParagraphs,selfCheck,race,evalSafe
chromium: true | connectOverCDP: function
ROOT(cwd default): <临时目录>        # --project 缺省回退 cwd，正确
qaPath: <临时目录>/qa/t.png          # 目录自动创建，正确
```

**5. `--project` 全链路（Windows 真实路径）：**

```
$ node -e "…push('--project', <项目绝对路径>); const u = require('./pw/util'); u.loadSpec('form.json'); u.qaPath('x.png')"
ROOT: C:\Users\...\pwad-proj
spec: {"title":"t","tags":["a"],"description":["d"]}
qaPath: C:\Users\...\pwad-proj\qa\x.png
```

不走 `--dry` 实跑的原因：所有 `*-fill.js` 第一步即 `connectOverCDP` 附着 9222/9223/9224 已开窗口，不起浏览器必然 exit 1，`--dry` 同样要先附着（它只跳过「写」不跳过「连」）。故采用零副作用的 util 加载 + playwright 解析链验证替代，等价证明依赖与参数链路通。

**6. 文档漂移检查：**

```
$ python scripts/check-docs.py
--- check-docs: 0 fail, 0 warn, 3 archived skipped
```

验证后临时目录（pwad-test / pwad-proj）已全部删除。

## 提交

```
97e1fe2 feat(skills): 收录 pw 填表脚本进 publish 模板 / vendor pw fill-layer scripts into publish template
 10 files changed, 677 insertions(+), 2 deletions(-)
```

仅 add 本工单清单文件（pw/ 九件 + SKILL.md），`git status` 干净。

## 遗留问题

1. **选择器时效性**：pw 脚本选择器是 2026-10-03 实测版，平台改版即失效；SKILL.md 已写明纪律（先 `--dry` dumpForm 看真实 DOM 再改，不凭记忆改）。
2. **pelican-ride 定点参数残留**：`bili-fill.js` 误猜标签黑名单、`douyin-fill.js` 默认 `--names`（AI,GPT,Codex…）、`xhs-fill.js` 默认 `--topics`（鹈鹕,AI绘画…）等实测现场参数保留为示例，新项目需用命令行参数覆盖；后续若高频使用可考虑参数化进 publish-plan.json。
3. **基础层与 pw 层未打通**：`run.mjs` 仍只调度基础层 `setup`，pw 填表层需手动单跑；是否把 pw 挂进 run.mjs 调度留给后续工单拍板。
4. live 环境回归未做（红线禁真发布），下次真实投稿时顺带验证 `--project`/qaPath 改造在真窗口下的表现。

## 自评

**达标**。验收标准逐条对上：pw/ 9 文件收录、`node --check` 9/9 过、hsr 引用 0 处、SKILL.md pw 用法入口就位、1 个 commit、`git status` 干净；两个点名适配点（loadPlaywright 硬路径、qa/ 项目化）均完成且经零副作用加载验证。红线全程未破（未起浏览器、未登录、未发布、未动其他 skill 与 docs/）。
