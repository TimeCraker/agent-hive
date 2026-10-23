# VISION · 视觉渠道恢复 + 真实扫描解析全链路（S32-VISION）

## 权威 Spec
`docs/stages/stage-32-remediation.md` §32-1（先读）。

## 关键事实（主会话已实证，不得再以「环境限制」为结论）
用户现有智谱密钥真实可用：endpoint `https://open.bigmodel.cn/api/coding/paas/v4`、
model `glm-5.3-flash`、合成图片经 `image_url` 发送 → **HTTP 200 且正确识别图中五位数字**。
因此 ai-service 视觉通道 401 的根因是**配置问题**（旧 SiliconFlow 配置仍生效），不是密钥/模型不可用。

## 任务
### 1. 诊断（先做，证据说话）
- 追配置来源链：DB `ai_config`（`apps/ai-service/src/lib/ai-client.ts` 的 getConfig 及优先级）→
  进程环境变量兜底 → 缓存（TTL/失效时机）→ 本地启动配置注入（stage31-runtime 启停脚本可能注入旧值）
- 查后台默认配置（admin 界面的默认值种子/迁移）与服务端代码默认值是否一致
- 结论写清：旧配置为何生效（哪一层压住了）、证据（查询输出脱敏后摘录——**密钥只显示尾 4 位**）

### 2. 配置修正（仅本地视觉渠道）
- 视觉通道指向智谱：provider 形态/baseURL/model 载荷（`image_url` 数组）按 ai-client 的
  视觉调用约定调整——**只动视觉，保留现有文本渠道配置不动**
- 密钥：引用既有配置位置（DB/env），**不在报告/代码/提交中出现明文**；
  修正动作为数据/本地配置层面；若需代码层兼容（如 payload 形态），最小改动

### 3. 全链路真实验收（正式前端，Playwright 驱动 + 截图）
两条输入各走一遍完整链路：
- **合成图片简历**（程序生成含姓名/日期/经历的图片）
- **无文字层扫描 PDF**（程序合成：渲染文字为图像的 PDF）
链路：上传 → BullMQ 队列 → 视觉识别 → 结构化 → 核对修改页 → 保存 → 编辑器打开 → PDF 导出

核验点：
1. **姓名完整性**（原始姓名问题文件若无法获取，明确保留该文件复验项并如实写）
2. 日期字段正确
3. 左右栏顺序（多栏模板）
4. 章节内容完整（教育/工作/项目/技能等）
5. 失败提示、重试、退币回归（构造一次失败如损坏图片：提示正确、重试可用、计费对齐）

### 4. 边界
- 直接 curl 模型 200 **不能替代**全链路（可作辅助诊断证据记录）
- 环境：五服务本地栈（status-all 检查；不足按 browser-audit runbook 拉起）
- E2E 账号：`e2e-stage31@resumeaix.test / E2eStage31!2026` 或 misc2 小号（见 stage31 台账）

## 工程要求
type-check + lint；涉及代码则相关测试；不 commit（主控审查后统一提交）；
**不 push 不部署**；不输出密钥。

## 报告
绝对路径 `C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\VISION-report.md`：
诊断结论（配置生效链）、修正动作、全链路验收矩阵（每步截图路径）、失败/退币回归、未验项如实。
证据：`C:/Users/TimeCraker/Desktop/my_workspace/ResumeAIX-stage32/VISION/`
