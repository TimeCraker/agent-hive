# 任务 AUDVBS:vibe-studio 7 技能质量审计(只读)

一句话任务:对 vibe-studio 的 7 个 skill(ppt / humanizer / video-motion / narration / auto-subtitle / publish / web-capture)逐个做**只读**质量审计——完整性、可执行性、依赖真实性——产出分级清单与改进 backlog。**不改任何文件(报告除外)。**

## 背景(已核实事实,勿重新考古)

- 本仓是自媒体内容工厂(skills 集合),定位:代码画 PPT、科技解说成片、网页代码动画逐帧录制、三平台自动投稿。指引:`vibe-studio/README.md`(先读)。
- 7 个 skill 的具体文件结构以仓内实况为准(先 glob/列目录再下结论,勿凭名字臆断)。
- 同工作区另有并行波次在做各仓**文档保鲜审计**(只改 .md);`git status` 里的 .md 未提交改动是他们的,原样保留。

## 步骤

1. **逐 skill 盘点**:每个 skill 读其 SKILL.md(或同名主文件),核对:声明的工作流步骤是否完整(有无断头步骤)、声明的外部依赖(工具/命令/API)是否在文档中写明获取方式、参数/路径引用是否自洽。
2. **可执行性抽查**:对每个 skill 挑 1-2 个关键脚本/命令做**语法级**检查(node --check / python -m py_compile / ts 解析,视语言而定);不实际执行重型渲染/投稿。
3. **依赖真实性**:文档声明的依赖工具,检查仓内是否有版本/安装说明;发现"文档说有但仓内没有"或"脚本引用了不存在的路径"逐条记录。
4. **skill 间衔接**:上游产物(如 video-motion 的帧输出)与下游消费(narration / auto-subtitle / publish)的路径约定是否一致。
5. 汇总写报告。

## 红线

- **只读**:除报告外零写入;无 git 写操作;不 install 依赖;不执行任何实际渲染/上传/投稿类命令(语法检查除外);不碰生产。
- 不碰兄弟仓;China 网络重试 ≤2。
- Windows 11 + PowerShell。

## 验收标准

报告含:7 个 skill 逐一的小节(每个含 完整性/可执行性/依赖真实性 三项结论)+ 总分级清单 P0-P3(每条附文件路径证据)+ 改进 backlog(按优先级排序的可执行建议)。

## 报告要求

完成后**整文件覆盖写入**:
`C:\Users\TimeCraker\Desktop\my_workspace\agent-hive\runs\reports\AUDVBS-report.md`

模板:`# AUDVBS 结果报告` / `## 结论一句话` / `## Skill 逐项审计(7 小节)` / `## 衔接一致性` / `## 分级问题清单(P0-P3)` / `## 改进 backlog` / `## 自评`
