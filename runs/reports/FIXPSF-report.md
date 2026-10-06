# FIXPSF 结果报告

## 结论一句话

**修复正确,验收通过**:b6101c1 对 `scripts/deploy-portfolio-safe.sh` L175 的单字符补转义(`require(` → `require\(`)经独立提取与等价复现证实,远端实际收到语法正确的版本断言,比较逻辑在真实 node_modules + lockfile 上走通;零代码改动、零 commit。

## 透传机制说明

远端段**不是 heredoc**,而是 `$SSH "双引号多行字符串"` 直接作为 ssh 的命令参数,转义共三层:

1. **本地 bash 解析双引号字符串**(任务背景里担心的「heredoc 定界符加引号」情形不存在):双引号内 `\$` → 字面 `$`、`\"` → 字面 `"`、`\\` → 字面 `\`,未转义的 `$VAR` 在本地展开。修复的原理正是:`\"` 在本地双引号上下文被转成真双引号后再透传。
2. **ssh 传输**:注释行(L133/134/168/192)里的裸 `"` 会翻转本地引号奇偶,导致该参数词分裂成多段(提取实证 block#1 为 3 个参数);真实 ssh 把多个命令参数用**单空格 join** 后交给远端 shell,分裂只发生在注释文本里,功能无损。
3. **远端 shell 解析**:收到的文本作为 bash 执行,`$(node -p 'require("next/package.json").version')` 中单引号保护双引号字面量,node 拿到合法 JS。

修复前 L175 的裸 `"` 在本地解析时提前闭合字符串再重开,双引号被「吞掉」,远端收到 `require(next/package.json).version`——JS 解析为除法链,运行时 `ReferenceError: next is not defined`。

## L175 远端形态提取验证

方法:提取 harness(`/tmp/fixpsf/harness.sh`,用后已删)以与脚本完全相同的方式展开——原样 source L129-230/L234-251 的 `$SSH "..."` 语句,`$SSH` 替换为按单空格 join 参数的 dump 函数(复刻 ssh 行为),本地变量(REMOTE_TARBALL/LOCAL_TARBALL/LOCAL_SHA)按脚本 L29-33 同形态注入。

```
$ bash harness.sh scripts/deploy-portfolio-safe.sh /tmp/fixpsf/post
[harness] block#1: ssh 将收到 3 个参数(词分裂后), 按单空格 join
[harness] block#2: ssh 将收到 1 个参数(词分裂后), 按单空格 join

$ grep -n 'INSTALLED_NEXT=' /tmp/fixpsf/post/received-1.sh
47:INSTALLED_NEXT=$(node -p 'require("next/package.json").version')
```

字节级确认(od -c,修复后):`r e q u i r e ( " n e x t / p a c k a g e . j s o n " ) . v e r s i o n` —— 真双引号字节存在;修复前同行为 `r e q u i r e ( n e x t / p a c k a g e . j s o n )`,双引号缺失。

pre/post 提取文本 diff **恰好 1 行**,与 b6101c1 的 1 行 diff 一一对应,证明「远端收到的差异 = 提交声称修复的差异」:

```diff
47c47
< INSTALLED_NEXT=$(node -p 'require(next/package.json).version')
---
> INSTALLED_NEXT=$(node -p 'require("next/package.json").version')
```

完整性扫描(修复是否遗漏其他行):剥离所有 `\"` 后,远端段内剩余裸 `"` 仅存在于 4 条注释行(L133/134/168/192)与 4 个字符串定界符,全部功能行均正确使用 `\"`/`\$` 转义——无其他待修点。

## 三项验证留证

**① 主脚本语法**:

```
$ bash -n scripts/deploy-portfolio-safe.sh && echo PASS
BASH-N-PASS exit=0
```

**② 提取文本语法**(远端实际收到的两块,含修复前对照):

```
$ bash -n /tmp/fixpsf/post/received-1.sh  → received-1.sh: BASH-N-PASS
$ bash -n /tmp/fixpsf/post/received-2.sh  → received-2.sh: BASH-N-PASS
$ bash -n /tmp/fixpsf/pre/received-1.sh   → pre/received-1.sh: BASH-N-PASS
```

(修复前语法也过 → 证实原始故障是**运行时**挂,与「每次部署必挂在断言步」实录吻合。)

**③ 最小等价复现**(从提取出的远端文本原样切 `LOCKED_NEXT=` 到 `fi` 断言段,cd 本仓真实 node_modules + pnpm-lock.yaml 执行):

```
===== sim-post(修复后透传文本)=====
📦 next: installed=16.3.7 locked=16.3.7
SIM-RESULT installed=16.3.7 locked=16.3.7 -> match, assertion passed
sim-post-exit=0

===== sim-pre(修复前透传文本,预期必挂)=====
[eval]:1
require(next/package.json).version
        ^
ReferenceError: next is not defined
    at [eval]:1:9 ...
Node.js v24.16.0
sim-pre-exit=1
```

正例:lockfile grep 链(`grep -A2 '^      next:' | … | cut -d'(' -f1`)提取 16.3.7,node 取 16.3.7,`if` 比较通过不触发 FATAL;负例:node ReferenceError + exit 1,`set -e` 下远端中止——完整复现 2026-09-30 起的部署必挂路径,并证明 b6101c1 恰好切断该路径。

## 结论(验收通过 / 补修记录)

**验收通过,无需补修**:

- 修复方向正确:本脚本的透传机制下(双引号参数,非带引号 heredoc),`\"` 正是让远端收到真双引号的正确写法;
- 修复最小且完整:1 行 diff,全脚本无其他遗漏的功能行裸引号;
- 等价复现双向验证:修复后走通(16.3.7 == 16.3.7),修复前复现必挂(ReferenceError → exit 1);
- 零代码改动、零 commit、未触碰服务器;`git status` 全程 clean,临时文件(/tmp/fixpsf)已删除。

## 自评

- 任务背景给出的「heredoc 定界符是否加引号」疑点是合理的排查方向,但实证发现该脚本根本不用 heredoc——独立验收的价值正在于不沿用深夜会话的未验证假设,连透传形态本身也重新核实。
- 提取 harness 没有人工改写一个字符,复刻了 `$SSH` 词分裂 + ssh 单空格 join 的真实行为(词分裂由 `set -u` 误触注释行变量展开而意外获得实证),提取文本与 git diff 逐行对得上,证据链闭合。
- 负例复现超出任务最低要求,但把「为什么 09-30 起必挂」从推断变成实录,成本低、说服力高。
- 局限:等价复现在 Windows Git Bash 的 node v24 上执行,服务器是 node20,但 `node -p 'require("…")'` 语义与版本无关,不影响结论。
