# PERFCAL · 性能测试口径修正 + 线上真节流复测

## 问题（复核 §2）
`portfolio-release-followup-2026-10-11/regress2/raf-health.mjs:82` 只在元数据写 `cpuRate: 4`，
**从未调用 `Emulation.setCPUThrottlingRate`**——"CPU4x P95 4.6ms/零停顿"是未节流样本被误标。
旧原始数据保留不删，但要更正标签。

## 任务
1. **修正脚本**：新脚本（存 closeout 目录，不动旧文件）真正
   `client.send('Emulation.setCPUThottlingRate', { rate: 4 })`（注意拼对 API 名）后采样；
   记录浏览器/GPU/视口/构建版本（线上 BUILD_ID）/节流参数/缓存状态
2. **桌面压力线上三轮**（https://asterforge.top，1440×900 慢滚同剧本）：绘制帧数、主线程提交开销、
   布局重算耗时、长任务；**rAF 回调速度≠显示帧率**的口径写进输出
   - 参考Codex 专项的 audit.mjs 方法与已存基线：`my-portfolio/portfolio-svg-performance-2026-10-11/`（如存在）
   - 注意：线上当前是 7bee441（无 ce0fc0c）——本轮测的是**线上现状**，部署后由 VERIFY3 复测终版；
     报告里写明本次构建版本
3. **手机冷加载线上三轮**（同复核口径：390×844 DPR3 触摸+CPU4x+1.6Mbps+150ms+禁缓存，首屏观察期不滚动）：
   LCP/FCP/CLS 中位数与范围；**与复核的 4756/1924/1916ms 分开呈现**，不混算
4. **更正说明文件**：在 closeout 目录写 CORRECTION.md——旧 4.6ms 数据标注为"未节流 headless 样本"，
   不再作为 CPU4x 压力验收结论引用；Lighthouse 模拟节流数据单列（复核口径：不能互相覆盖）
5. 真实 Android/iOS/物理高刷：无设备就写"未测"，不冒充

## 红线
只读线上；不部署；不改产品代码；证据不覆盖旧目录

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\PERFCAL-report.md`。
证据：`C:/Users/TimeCraker/Desktop/my_workspace/portfolio-release-closeout-2026-10-12/perfcal/`
