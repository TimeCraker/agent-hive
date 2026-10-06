# AUDGM 结果报告

- **审计对象**：`games` monorepo（AsterNova 矩阵，分支 `main`，HEAD `f5be446` 2026-10-05）
- **审计时间**：2026-10-06 · 只读审计（除本报告外零写入、零 git 写操作）
- **方法**：文档比对 + `git log`/`git status`/`git ls-files` 取证 + 代码扫描 + `go vet`/`go build` 实测

## 结论一句话

存量纪律良好（封存/冻结声明全部兑现、backend vet+build 全绿、三端 TODO/FIXME 均为 0），真正的债集中在两处：**git 被当资产库用**（87 个 >5MB 文件共 1,385MB 被追踪、pack 已 2.73GiB、美术返工每轮再入库 30~50MB 二进制），以及**「一套协议多端共享」名不副实**（两份 game.proto 已内容分叉，主力端 client-godot-v2 协议代码为零）。

## 子项目一致性

| 子项目 | 声明 | 实际时间线（git log） | 判定 |
|---|---|---|---|
| backend | ❄️ 一期封存（README 封存声明 2026-09-30） | 最后实质 commit `285c466`/`c5667ae`/`b53cf55` 均 2026-09-30（封存声明+CI 清理+gofmt），此后零 commit | ✅ 一致 |
| client-godot | ❄️ 冻结（FROZEN.md） | 冻结后仅两笔 README 文档级改动：`8456bf3`（2 行状态标注）、`b616172`（113/113 行 CRLF 重写），无功能改动 | ✅ 一致 |
| client-godot-v2 | 🚀 M2 主力开发中 | 2026-10-01~03 持续 commit；近 8 条全为 `fix(art)` 美术返工，但 M2 玩法代码存量实在（`scripts/combat/player_combat_fsm.gd` 473 行、`scripts/entities/player/player_controller.gd` 550 行、tests/ 10+ 门禁脚本） | ✅ 一致（与 CLAUDE.md「美术返工为主线」吻合） |
| web-client | 现役 | 2026-10-03~05 密集 perf/fix commit（`34e4d02`→`f84da63` 共 7 笔） | ✅ 一致 |
| render-lab | M1 沙盒 | 最后实质 commit `5fd6dd7` 2026-09-28；但 `asternova/AGENTS.md:33` 仍称其为「**当前阶段核心工作区**」，与实况（主战场已移至 art/ 角色返工）漂移 | ⚠️ 见 P3-1 |
| art | 返工工程进行中 | 2026-10-03 单日 8 笔密集 commit | ✅ 一致 |
| scratch | 实验场 | 最后活动 `00cf8d7` 2026-09-30 清理 | ✅ 一致 |

**工作树状态**（44 条：12 修改 + 32 未跟踪）：全部归属于三角色美术返工 WIP（紫色 rework 未跟踪 36MB review + 白色 face_repair 9MB + v2 侧 purple glb/审阅场景）与并行文档保鲜波次的 .md 改动（按任务要求原样保留、未深究）。`docs/stage-specs/character-art-rework.md` 明确「白色静态样板等待用户确认后再扩展」——WIP 滞留工作树符合流程约定，非违规。

**文档口径小偏差**：仓库 CLAUDE.md 称 backend「9 包单测」，实测 `find -name "*_test.go"` 为 **12 个文件 / 8 个包**（auth 四子包 + battle + gateway/handlers + match + proto）。

## 代码质量

**client-godot-v2（重点）**
- 182 个 `.gd`、共 11,813 行，最大单文件 550 行（`scripts/entities/player/player_controller.gd`）——无巨石文件。
- 分层清晰：`scripts/{combat,entities,animation,camera,vfx,ui,environment}` + `scenes/{character_lab,entities,levels,lighting,ui}` + `tests/`。
- TODO/FIXME = **0**。
- 瑕疵：项目根散落 6 个一次性调试脚本且已被 git 追踪（`diagnose_anim.gd`、`inspect_glb.gd`、`inspect_meleelib_legs.gd`、`list_idle_clips.gd`、`print_aster_rest.gd`、`print_meleelib_tpose.gd`）→ P2-2。

**web-client（重点）**
- src+app 共 111 个 ts/tsx；`lint`/`build`/`typecheck` 脚本齐备，根级 CI（`.github/workflows/ci.yml`，push 触及 web-client 时跑 lint+build）已生效。
- TODO/FIXME = **0**。
- 瑕疵：**双组件树**。`tsconfig.json` 的 `@/* → ./*` 指向项目根，使根级 `components/`（shadcn 原件 8 个文件：theme-provider + ui/{button,card,input,label,sonner,tabs}）与 `lib/utils.ts` 同 `src/components/` 并存且都被引用（`app/layout.tsx:4-5`、`app/login/page.tsx:10-13` 用根组件；业务组件在 src 下）→ P2-3。
- 排除一个假死代码：`src/api/auth.ts`+`jwt.ts` 疑似无人引用，复检发现 `app/login/page.tsx:15-16` 在用（首轮 grep 的排除条件误杀），**不是死代码**。

**backend（封存验证）**
- `go vet ./...` exit 0、`go build ./...` exit 0（Go 1.26.4 windows/amd64）——封存仓可编译性良好。
- TODO/FIXME = 0。

## 协议漂移

房主权威架构下的实况：**「一套协议多端共享」（README.md:45 铁律 3）当前没有活的消费者，且仅存的两份副本已分叉。**

1. **两份 game.proto 内容分叉**（非仅行尾差异，忽略 CR 后 diff 仍存两段实质差异；md5 `f6b8b58…` vs `9caa304…`）：
   - `asternova/backend/services/proto/game.proto`（权威源）多出：GameMessage 的 `input_x/input_y=11-12`、`is_charging/is_attacking=13-14`、`mouse_x/mouse_y=15-16`（:29-38），PlayerPos 的 `current_state=6`、`hp=7`、`energy=8`（:48-54）。
   - `asternova/client-godot/proto/game.proto`（冻结副本）止步于 `rot_y=10`，缺上述 9 个字段——照此副本开发会丢失输入上行与状态快照能力。

2. **线上实况是 JSON/protobuf 混合序列化**（封存 backend 内）：入站先试 JSON 再回落 protobuf（`services/gateway/handlers/websocket.go:180-184`）；chat/move 出站走 `proto.Marshal`（:254/:265/:278）；`match_success` 出站却是 `json.Marshal`（`hub.go:194-197`）；`cast_ultimate` 特判 JSON（websocket.go:162）；player_positions 持久化 JSON（:270）。proto 文件注释宣称「替代之前的 GameMessage JSON」，实际两轨并行。

3. **web-client 只说 JSON 子集**：大厅匹配流 `app/lobby/page.tsx:410`（`new WebSocket(...?token=...&scope=lobby)`）、:408 发 `{type:"match_req"}`、:423 收 `match_success + room_id`——恰好只依赖 backend 的 JSON 路径，与 backend 兼容；arena 页无自有 WS 逻辑（WASM 自包含）。

4. **client-godot-v2 协议代码为零**：全仓 .gd 中 websocket/packet_peer/multiplayer/enet 零真实命中（唯一"命中"是 `extends SceneTree` 撞了 `enet` 子串的误报）；`scripts/transport/` 目录不存在。CLAUDE.md 如实标注「Transport 与联机未启动」，但 `docs/stage-specs/m2-transport-and-v2-skeleton.md` 状态行（2026-09-10 更新）仍称「Transport 抽象……推进中」且范围内列有 `scripts/transport/` 目录——spec 口径滞后于实况 → P3-2。

**净结论**：单机优先阶段此漂移无运行时风险；风险在二期重启与 M2 Transport 落地时，若无唯一权威副本约束，极易照抄分叉的旧 proto 或复刻 JSON/proto 双轨。

## 仓库卫生

1. **大文件入库（最大项）**：git 追踪的 >5MB 文件 **87 个、合计 1,385MB**；`.git` size-pack **2.73 GiB**。突出者：
   - 同一资产多副本：`modern_japan_neighborhood.glb` 三份共 ≈224MB（`art/models/nextgen_pbr/` 64MB、`client-godot-v2/models/environment/` 80MB、`render-lab/models/environment/` 80MB）；`aster_assembled.glb` 三份（art/v2/render-lab）；convenience_store、asphalt/tile 系贴图 3~8 份散布。
   - 测试/探针产物入库：`art/models/work/test_baked*.glb` 4×8MB、`test_check.glb`、`client-godot-v2/models/aster/test_spine.glb` 6MB、`aster_source_probe.glb` 6MB。
   - 返工制作源二进制每轮全量入库：`white_rework_working.blend` 47MB（当前工作树 Modified，提交将再 +47MB blob）、`purple_rework_working.blend` 43MB、各 master blend 29~91MB。
2. **编译产物被追踪**：`asternova/backend/asternova-server` 37MB ELF 二进制，自 `6ac8e18`（2026-08-08 subtree 并入）起躺在库里至今。
3. **.git 垃圾**：`.git/objects` 内 25 个 `tmp_pack_*`/`tmp_obj_*` 残留（`git count-objects -vH` 报 garbage found×25）——中断的 git 操作遗留。
4. **.gitignore 覆盖良好**：根（OS 垃圾/`*.blend1`/调试截图）+ client-godot-v2（`.godot/`、Tripo 中间纹理）+ web-client（node_modules、pnpm-lock 单源说明）均到位；`tsconfig.tsbuildinfo` 等构建产物未泄漏入库。
5. 未跟踪 WIP 体量：紫色 review 36MB + 白色 face_repair 9MB + v2 `models/characters/rework/` 目录 163MB（含已跟踪 white_static.glb 29MB 与未跟踪 purple glb）——属返工交付物，按管线应随后提交，非卫生违规。

## 分级问题清单(P0-P3)

**P0：无。**（无生产事故风险、无声明严重失实、封存/冻结纪律全部兑现）

**P1（建议尽快处理，本次未执行）**
1. **git 二进制膨胀无治理**：87 文件 1,385MB 追踪中、pack 2.73GiB、三副本资产、test_* 产物入库、返工 blend 每轮 +30~50MB。建议：大资产迁 Git LFS 或外置资产库 + art/models/work/test_* 与 probe 产物清除 + 跨目录共享资产去重定源（P1 动作涉及历史改写，须用户拍板）。
2. **编译产物 `backend/asternova-server`（37MB）入库**：建议 `git rm --cached` + backend/.gitignore 补 `asternova-server`。
3. **game.proto 双副本分叉且无唯一源约束**：建议宣布 `backend/services/proto/game.proto` 为唯一权威（README 铁律 3 落到文件），冻结副本加「已过期」头注，M2 Transport spec 显式引用权威源。

**P2**
4. `.git/objects` 25 个 tmp_pack/tmp_obj 垃圾：择机 `git gc`（无破坏性，但属 git 写操作，留用户执行）。
5. client-godot-v2 根目录 6 个散落调试 .gd（已追踪）：归入 `scripts/tools/` 或删除。
6. web-client 双组件树（根 components/lib 与 src/components 并存、两套 import 风格）：渐进归一至 src 下，顺带统一 `@/*` 别名语义。

**P3**
7. `AGENTS.md:33` render-lab「当前阶段核心工作区」表述过时（顶部 2026-10-01 校正已覆盖，正文未同步）。
8. `m2-transport-and-v2-skeleton.md` 状态行（2026-09-10）「Transport 推进中」与实况（零 transport 代码）滞后，建议改为「未启动」。
9. README「在线试玩（旧版）」指向的 WASM 产物自 2026-08-08（`d70b25f`）后未再导出——已如实标「旧版」，仅提示长期挂一代构建。
10. 仓库 CLAUDE.md「9 包单测」与实测 8 包 12 文件的口径偏差，顺手校正。
11. web-client 登录/匹配仍依赖封存 backend 的线上旧实例（api.asterforge.top）：属已知过渡态，建议在 web-client README 标注该依赖边界。

## 自评

- **覆盖度**：任务五步全部完成——一致性（7 子项目声明 vs 时间线）、代码质量（v2/web-client 结构+行数+TODO 密度、backend vet/build 实测）、协议漂移（双 proto diff + gateway 序列化路径 + 两端消费者核验）、卫生（>5MB 全量扫描 + gitignore + 工作树）、分级清单。
- **两次纠错**：① `SceneTree` 撞 `enet` 子串的 grep 误报——排除后确认 v2 网络代码为零；② `src/api` 疑似死代码——复检为 grep 排除条件误杀，实际在用。均为二次取证后翻转结论，未带入报告。
- **未做与原因**：`go test` 未跑（红线仅允许 vet/build）；Godot 69 项无头门禁与前端 build 未跑（只读红线禁依赖安装、且会写 .godot/.next 缓存）；未跟踪 .md 改动属并行波次，按任务要求未深究。
- **置信度**：P1 各条均有命令输出/文件行号/commit 哈希直接支撑；一致性判定基于 `git log` 路径过滤，docs 型 commit 已逐一 `git show --stat` 区分，未把文档改动误判为功能漂移。
