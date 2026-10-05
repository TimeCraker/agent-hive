# XFZCLEAN 结果报告

**任务**：清空小饭桌生产库 Agent D 测试走查残留（7 道测试菜 + 8 张测试单），备份留档后执行，验证线上回干净空态。
**执行时间**：2026-10-05 23:41–23:45（UTC+8）· 操作员 Claude（Agent XFZCLEAN）· 服务器 VM-0-2-ubuntu（腾讯云 111.229.200.178）

## 结论一句话

**PASS** —— 安全闸门比对通过后，单事务删除 8 张测试订单 + 7 道测试菜品（菜品 7→0、订单 8→0），先有 VACUUM INTO 一致性备份（114,688 字节、内容核验一致），其他表（Store/Customer/DeviceToken/Address/Blocklist）零接触，线上四页全 200、首页空态「暂无菜品」、7 道测试菜名零残留、小饭桌 vhost 零 5xx。

## 清理前盘点（只读 SELECT，2026-10-05 23:42）

盘点方式：服务器无 sqlite3 CLI，按仓内 DEPLOY.md 惯例以打包内置 Prisma（`require('.../src/generated/prisma')` + 显式 `DATABASE_URL` 前缀）跑只读 findMany/count。

**菜品 Dish_COUNT=7**（与任务口径 7/7 逐一吻合：名称+价格+餐段全对）：

| id | 名称 | 价格 | 分类 | 餐段 | 库存 | 创建时间 (UTC) |
|---|---|---|---|---|---|---|
| cmus5g10d0000v41qhpj8jv0x | 红烧肉 | 28 | 热菜 | lunch | 20 | 2026-10-03T08:47:59Z |
| cmus5g1xc0001v41q4zdhwh5f | 番茄炒蛋 | 15 | 热菜 | lunch | 20 | 2026-10-03T08:48:00Z |
| cmus5g2tx0002v41qn2nktiy7 | 紫菜蛋花汤 | 8 | 汤品 | lunch | 30 | 2026-10-03T08:48:01Z |
| cmus5g3sc0003v41qvn3r06ju | 白米饭 | 2 | 主食 | lunch | 99 | 2026-10-03T08:48:02Z |
| cmus5g4pv0004v41qz861bc8y | 可乐鸡翅 | 26 | 热菜 | dinner | 15 | 2026-10-03T08:48:03Z |
| cmus5g5o90005v41qp4nizo58 | 清炒时蔬 | 12 | 素菜 | dinner | 20 | 2026-10-03T08:48:05Z |
| cmus5g6mg0006v41qjl1vdiap | 小米粥 | 5 | 主食 | dinner | 40 | 2026-10-03T08:48:06Z |

**订单 ORDER_COUNT=8**（全部带测试指纹，与 E2E 台账 2026-10-03 对账口径逐条吻合）：

| id | 下单时间 (UTC) | 总额 | 状态 | 收货人 | 手机号 | 内容 |
|---|---|---|---|---|---|---|
| ORD-1003-23VQ | 10-03 08:51:46 | 56 | cancelled（顾客侧已删） | E2E走查 | 13800000000 | 红烧肉×2 |
| ORD-1003-WCFM | 10-03 08:52:51 | 56 | cancelled（顾客侧已删） | E2E走查 | 13800000000 | 红烧肉×2 |
| ORD-1003-F5MN | 10-03 08:55:44 | 56 | cancelled（顾客侧已删） | E2E走查 | 13800000000 | 红烧肉×2 |
| ORD-1003-D8CC | 10-03 08:56:53 | 56 | cancelled（顾客侧已删） | E2E走查 | 13800000000 | 红烧肉×2 |
| ORD-1003-WFJ2 | 10-03 08:59:03 | 56 | cancelled（顾客侧已删） | E2E走查 | 13800000000 | 红烧肉×2 |
| ORD-1003-D9RY | 10-03 09:00:38 | 56 | cancelled（顾客侧已删） | E2E走查 | 13800000000 | 红烧肉×2 |
| ORD-1003-3AJM | 10-03 09:45:44 | 30 | finished（顾客侧已删） | 【E2E】测试顾客 | 13900000000 | 【E2E】测试菜A改×2 |
| ORD-1003-5GNY | 10-03 09:48:39 | 56 | cancelled（顾客侧已删） | E2E走查 | 13800000000 | 红烧肉×2 |

7 张「E2E走查」单地址快照明写「E2E测试地址，请勿配送（回归后商家取消）」；8 单全部创建于 2026-10-03，**10-03 之后零新订单**——无任何疑似真实订单，闸门通过。

**其他表（按红线不动）**：Store=1 · Customer=1 · DeviceToken=12 · Address=4 · Blocklist=0 —— 与 E2E 台账「Agent D 残留（7 菜/8 单/1 档/12 令牌/4 址）」完全一致。

## 备份

- **方式**：`VACUUM INTO`（WAL 库禁止直接 cp —— DEPLOY.md NFR-06；服务器无 sqlite3 CLI）
- **路径**：`/home/ubuntu/backups/xiaofanzhuo/db-preclean-xfzclean-20261005-234317.sqlite`
- **大小**：114,688 字节（非零 ✓）· 权限已按仓内 PII 规约收紧 `-rw-------`（600）
- **内容核验**：以独立连接打开备份计数 = Dish 7 / Order 8 / Store 1 / Customer 1，与清理前实况逐表一致 ✓

## 执行与复核

清理脚本带**删除前闸门重验**（库内现存行 ID 与盘点清单完全一致才执行，防盘点后有新写入），按显式 ID 在**单事务**（Prisma `$transaction` 数组形式）内删除。等价 SQL：

```sql
BEGIN;
DELETE FROM "Order" WHERE id IN ('ORD-1003-23VQ','ORD-1003-WCFM','ORD-1003-F5MN','ORD-1003-D8CC','ORD-1003-WFJ2','ORD-1003-D9RY','ORD-1003-3AJM','ORD-1003-5GNY');
DELETE FROM "Dish"  WHERE id IN ('cmus5g10d0000v41qhpj8jv0x','cmus5g1xc0001v41q4zdhwh5f','cmus5g2tx0002v41qn2nktiy7','cmus5g3sc0003v41qvn3r06ju','cmus5g4pv0004v41qz861bc8y','cmus5g5o90005v41qp4nizo58','cmus5g6mg0006v41qjl1vdiap');
COMMIT;
```

> 注：任务书「先删订单-菜品关联行」不适用——schema 无关联表，`Order.items` 为内联 JSON 快照列（PRD 快照原则），删 Order 行即连带清除菜品关联数据。

**执行输出**：

```
DELETED orders=8 dishes=7
POST_COUNT Order=0 Dish=0
CLEAN_OK
EXIT=0
```

**删后立即复核**（同一只读盘点脚本）：`DISH_COUNT=0` · `ORDER_COUNT=0` · `OTHER_COUNTS Store=1 Customer=1 DeviceToken=12 Address=4 Blocklist=0`（其他表原样）。

未重启服务：代码无 ISR/缓存配置（首页动态渲染），删库后即时生效，实测印证；也无需与服务器上其他维护任务错峰。未改 schema、未跑 migration、未触碰小饭桌之外的任何服务。收尾已删除服务器与本地两侧临时脚本。

## 线上验证（2026-10-05 23:44，三通道留证）

**API**：`/api/health` → `{"ok":true}`；`/api/menu` → `{"openLunch":true,"openDinner":true,"deliveryFee":0,"payQrCode":null,"dishes":[]}`（空盘 ✓）

**四页状态码**（服务器本机 :3010 / 服务器→公网 HTTPS / 本机（China 出口）→公网 HTTPS，三通道一致）：

| 页面 | 本机:3010 | 公网(服务器侧) | 公网(本机侧) |
|---|---|---|---|
| `/` | 200 | 200 | 200 |
| `/checkout` | 200 | 200 | 200 |
| `/orders` | 200 | 200 | 200 |
| `/me` | 200 | 200 | 200 |

**首页空态**：HTML 含「暂无菜品」✓；7 道测试菜名（红烧肉/番茄炒蛋/紫菜蛋花汤/白米饭/可乐鸡翅/清炒时蔬/小米粥）grep 命中 **0** ✓。

**5xx**：nginx 近 200 行访问日志中小饭桌 vhost 5xx = **0**；仅有的 1 条 5xx 为 `rag.asterforge.top` vhost 于 23:28:08（本次操作窗口前）被外部扫描器（CMS-Checker）触发的 502，与小饭桌无关、未处置（范围外）。

## 自评

**验收标准逐条对账**：

1. ✅ 清理前后计数留档：菜品 7→0、订单 8→0（无关联表，items 随订单行内联清除）
2. ✅ 服务器带时间戳 DB 备份：路径 + 大小 + 内容核验见上
3. ✅ 线上四页全 200 且首页空态（三通道 + 5xx 零）
4. ✅ 报告含盘点明细、备份信息、删除 SQL（等价）、前后计数、线上验证输出

**与任务书的偏差（均有仓内依据）**：① 任务书设想 sqlite3 CLI + cp 备份——服务器实际无 sqlite3 且 WAL 库禁直接 cp（DEPLOY.md NFR-06），改用内置 Prisma 单事务删除 + `VACUUM INTO` 一致性快照，事务性等价；② 「订单-菜品关联表」在 schema 中不存在（快照原则内联 JSON），该子步骤天然不适用。

**遗留与提示**：Agent D 残留的 1 条顾客档 / 12 条设备令牌 / 4 条地址按任务红线**保留未动**（任务明确只清 7 菜 + 8 单）；商家后续在 `/admin` 重新上架真实菜单即可，Store 行未动（deliveryFee=0、payQrCode=null 为现状，收款码上传仍待商家处理——与 2026-10-05 XFZ2 报告结论一致）。备份文件随 `/home/ubuntu/backups/xiaofanzhuo/` 既有轮转策略管理。

**红线自查**：删前有备份且核验 ✓ · 只删盘点逐条确认过的显式 ID 行（含删除前二次闸门）✓ · 不改 schema / 不跑 migration / 不动其他服务 ✓ · 密钥零入报告零落盘 ✓ · 临时文件双侧清零 ✓
