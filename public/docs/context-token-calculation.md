# CodeAgent 上下文 Token 计算机制说明

本文用于解释 CodeAgent 中“上下文 token”是怎么来的、怎么计算、用在哪里、什么时候变化，以及哪些代码路径对 token 特别敏感。

> 适用范围：当前项目 `packages/codeagent` 的 CLI/Agent 查询链路、上下文窗口、自动压缩、微压缩、状态栏与成本统计相关逻辑。

---

## 1. 一句话理解

CodeAgent 里同时存在几类 token 概念：

| 概念 | 含义 | 典型用途 |
| --- | --- | --- |
| 当前上下文 token | 下一次请求大概会占用多少上下文窗口 | 判断是否要 compact、是否快超限 |
| API usage token | 模型 API 返回的真实 usage | 成本统计、状态栏、作为上下文估算锚点 |
| 累计会话 token | 整个会话所有 API 调用的输入/输出/缓存 token 累加 | 展示总成本、telemetry |
| output token | 当前模型本轮生成了多少 token | 判断输出截断、token budget、成本 |
| context window size | 当前模型最大上下文窗口 | 计算百分比、阈值、阻断限制 |
| estimated token | 本地粗略估算值 | API usage 不可用或有新增未发送消息时兜底 |

最核心的原则是：

> **判断上下文是否快满，不能用累计 token，也不能只看 output token；应该用“最近一次真实 API usage + 之后新增消息的本地估算”。**

对应的核心函数是：

```ts
// src/utils/tokens.ts
tokenCountWithEstimation(messages)
```

---

## 2. Token 从哪里来

CodeAgent 的 token 数据主要有三个来源。

### 2.1 API 返回的 usage

模型调用完成后，API 会在 assistant message 上返回 usage：

```ts
usage.input_tokens
usage.output_tokens
usage.cache_creation_input_tokens
usage.cache_read_input_tokens
```

读取入口：

```ts
// src/utils/tokens.ts
getTokenUsage(message)
```

它只接受真实 assistant message 的 usage，会排除 synthetic message：

- synthetic assistant message 不代表真实 API 调用；
- synthetic model 不应该参与真实 token 统计。

完整的单次 API 总 token 计算：

```ts
// src/utils/tokens.ts
getTokenCountFromUsage(usage)
```

公式：

```text
total = input_tokens
      + cache_creation_input_tokens
      + cache_read_input_tokens
      + output_tokens
```

这个值常用于“这一轮 API 调用真实用了多少上下文相关 token”。

### 2.2 本地粗略估算

当没有 API usage，或者最近一次 API response 之后又新增了消息，CodeAgent 会用字符长度估算 token。

核心函数：

```ts
// src/services/tokenEstimation.ts
roughTokenCountEstimation(content, bytesPerToken = 4)
roughTokenCountEstimationForMessages(messages)
```

默认估算公式：

```text
tokens ≈ Math.round(content.length / 4)
```

特殊处理：

| 内容类型 | 估算方式 |
| --- | --- |
| 普通文本 | 字符数 / 4 |
| JSON / JSONL / JSONC | 字符数 / 2 |
| image / document | 固定约 2000 token |
| tool_use | tool 名称 + JSON.stringify(input) 后估算 |
| tool_result | 递归估算其 content |
| thinking / redacted_thinking | 估算 thinking/data 文本 |
| 其它未知 block | JSON.stringify(block) 后估算 |

图片和 PDF 不按 base64 长度估算，因为 base64 体积可能极大，但 API 实际计费/计 token 不是简单按 base64 字符算。这里统一用约 2000 token 的保守值。

### 2.3 API countTokens / fallback token counting

项目里也有显式 token counting 能力：

```ts
// src/services/tokenEstimation.ts
countTokensWithAPI(content)
countMessagesTokensWithAPI(messages, tools)
countTokensViaHaikuFallback(messages, tools)
```

用途是更精确地计算消息和工具 schema 的 input tokens。

注意点：

- Bedrock 没有完全一致的 Anthropic SDK countTokens 能力，因此有 Bedrock 专用路径；
- Vertex 某些 beta header 不能用于 countTokens，会被过滤；
- 包含 thinking blocks 时，需要带最小 thinking 配置，否则 API 可能拒绝；
- fallback counting 通常使用小模型/Haiku，特殊环境可能改用 Sonnet。

---

## 3. 当前上下文 token 怎么计算

最关键函数：

```ts
// src/utils/tokens.ts
tokenCountWithEstimation(messages)
```

它的逻辑是：

```text
从 messages 尾部向前找最近一个带真实 API usage 的 assistant message

如果找到：
  1. 使用该 usage 计算 apiTokenCount
  2. 对这个 assistant 之后新增的消息做 rough estimate
  3. 返回 apiTokenCount + estimatedNewTokens

如果找不到：
  对整个 messages 做 rough estimate
```

伪代码：

```ts
const apiTokenCount = getTokenCountFromUsage(lastUsage)
const estimatedNewTokens = roughTokenCountEstimationForMessages(messagesAfterLastUsage)
return apiTokenCount + estimatedNewTokens
```

### 3.1 为什么不能只用最后一次 usage

因为最后一次 API 调用结束后，可能已经追加了新消息，例如：

- 工具执行结果；
- hook 输出；
- 用户新输入；
- attachment；
- compact boundary；
- microcompact/snippet boundary。

这些消息还没有被下一次 API 真实统计过，但下一次请求会带上它们，所以必须本地估算并加上。

### 3.2 并行工具调用的特殊处理

并行 tool use 会让一个 API response 被拆成多个 assistant message，它们共享同一个 `message.id`，中间可能穿插 tool_result：

```text
assistant(id=A, tool_use_1)
user(tool_result_1)
assistant(id=A, tool_use_2)
user(tool_result_2)
```

如果只从最后一个 assistant(id=A) 往后估算，就会漏掉 `tool_result_1`。

因此 `tokenCountWithEstimation()` 会在找到 usage-bearing assistant 后，继续向前回溯到同一个 response id 的第一个 sibling，再估算它后面的所有消息。

这避免了并行工具结果被低估。

---

## 4. Context window size 怎么确定

上下文窗口大小由模型决定，核心函数：

```ts
// src/utils/context.ts
getContextWindowForModel(model, betas)
```

优先级大致如下：

```text
1. ant 用户的 CLAUDE_CODE_MAX_CONTEXT_TOKENS 运行时覆盖
2. 模型名带 [1m] 后缀
3. model capability 中的 max_input_tokens
4. enterprise provider 特殊规则
5. 1M beta header + 支持 1M 的模型
6. GrowthBook/实验开启 1M
7. ant 内部模型配置
8. 默认 MODEL_CONTEXT_WINDOW_DEFAULT，默认 200_000
```

默认值：

```ts
MODEL_CONTEXT_WINDOW_DEFAULT = 200_000
```

1M context 可能被禁用：

```ts
CODEAGENT3_DISABLE_1M_CONTEXT
```

部分 enterprise provider 有特殊窗口：

| Provider / Model | Context window |
| --- | --- |
| minimax | 200k |
| gpt-5.5 | 250k |
| gpt-4.1 / gpt-5 / codex | 约 1,047,576，除非禁用 1M |
| deepseek-chat / reasoner / v3 / r1 | 128k |

---

## 5. 状态栏里的上下文百分比怎么算

状态栏使用的是最近一次 API usage，而不是 `tokenCountWithEstimation()`。

入口：

```ts
// src/components/StatusLine.tsx
getCurrentUsage(messages)
calculateContextPercentages(currentUsage, contextWindowSize)
```

`getCurrentUsage()` 从 messages 尾部找最近一次真实 usage，返回：

```ts
{
  input_tokens,
  output_tokens,
  cache_creation_input_tokens,
  cache_read_input_tokens,
}
```

但百分比计算只使用 input 相关 token：

```ts
// src/utils/context.ts
totalInputTokens = input_tokens
                 + cache_creation_input_tokens
                 + cache_read_input_tokens

usedPercentage = round(totalInputTokens / contextWindowSize * 100)
```

也就是说状态栏展示的是：

> 当前模型上下文窗口里，输入侧上下文大概占了多少。

它不把 output_tokens 计入百分比，因为状态栏更关心“下一次可用输入上下文还剩多少”。

---

## 6. 成本统计里的 token 怎么算

成本统计是累计维度，不是当前上下文维度。

入口：

```ts
// src/cost-tracker.ts
addToTotalSessionCost(cost, usage, model)
```

每次 API 调用后，会累计：

```ts
modelUsage.inputTokens += usage.input_tokens
modelUsage.outputTokens += usage.output_tokens
modelUsage.cacheReadInputTokens += usage.cache_read_input_tokens ?? 0
modelUsage.cacheCreationInputTokens += usage.cache_creation_input_tokens ?? 0
modelUsage.costUSD += cost
```

同时写入 metrics counter：

```ts
getTokenCounter()?.add(usage.input_tokens, { type: 'input' })
getTokenCounter()?.add(usage.output_tokens, { type: 'output' })
getTokenCounter()?.add(cache_read, { type: 'cacheRead' })
getTokenCounter()?.add(cache_creation, { type: 'cacheCreation' })
```

注意：

> 成本统计是“历史累计消耗”，不能用来判断当前上下文是否快满。

例如一个长会话可能累计消耗 100 万 token，但当前上下文因为 compact 后只有 40k token。

---

## 7. 自动压缩阈值怎么算

自动压缩入口：

```ts
// src/services/compact/autoCompact.ts
shouldAutoCompact(messages, model, querySource, snipTokensFreed)
```

核心判断：

```text
tokenCount = tokenCountWithEstimation(messages) - snipTokensFreed
threshold = getAutoCompactThreshold(model)
return tokenCount >= threshold
```

### 7.1 effective context window

自动压缩不会等上下文窗口完全满才触发，而是先计算“有效上下文窗口”：

```ts
// src/services/compact/autoCompact.ts
getEffectiveContextWindowSize(model)
```

公式：

```text
effectiveContextWindow = contextWindowSize - reservedTokensForSummary
reservedTokensForSummary = min(modelMaxOutputTokens, 20_000)
```

为什么要预留？

因为 compact 本身要让模型生成摘要，摘要生成也需要 output token 空间。如果上下文已经顶满才 compact，可能连摘要都生成不出来。

### 7.2 auto compact threshold

默认公式：

```text
autoCompactThreshold = effectiveContextWindow - 13_000
```

也就是：

```text
contextWindowSize
- min(modelMaxOutputTokens, 20_000)
- 13_000 safety buffer
```

也支持编译期百分比：

```text
ARGS_AUTOCOMPACT_PCT
```

以及测试/调试 override：

```text
CODEAGENT3_AUTO_COMPACT_WINDOW
CODEAGENT3_AUTOCOMPACT_PCT_OVERRIDE
```

### 7.3 warning / error / blocking limit

同一个函数也会计算几类状态：

```ts
// src/services/compact/autoCompact.ts
calculateTokenWarningState(tokenUsage, model)
```

包含：

| 字段 | 含义 |
| --- | --- |
| percentLeft | 距离当前阈值还剩百分比 |
| isAboveWarningThreshold | 是否进入 warning 区间 |
| isAboveErrorThreshold | 是否进入 error 区间 |
| isAboveAutoCompactThreshold | 是否应该自动 compact |
| isAtBlockingLimit | 是否到达阻断限制 |

阻断限制默认：

```text
blockingLimit = effectiveContextWindow - 3_000
```

如果 auto compact 关闭，并且达到 blocking limit，会返回 prompt too long 类型的错误，让用户手动 `/compact`。

---

## 8. Compact 后 token 怎么变化

完整 compact 入口：

```ts
// src/services/compact/compact.ts
compactConversation(...)
```

compact 前记录：

```ts
preCompactTokenCount = tokenCountWithEstimation(messages)
```

compact 做的事情：

```text
旧 conversation messages
        │
        ▼
compact summary request
        │
        ▼
生成 summary
        │
        ▼
替换为：
  compact boundary
  + summary message
  + preserved tail messages
  + post-compact attachments
  + hook messages
```

最终 post compact messages 由：

```ts
// src/services/compact/compact.ts
buildPostCompactMessages(result)
```

组装：

```ts
[
  boundaryMarker,
  ...summaryMessages,
  ...messagesToKeep,
  ...attachments,
  ...hookResults,
]
```

### 8.1 postCompactTokenCount 容易误解

在 `compactConversation()` 中有两个概念：

```ts
compactionCallTotalTokens = tokenCountFromLastAPIResponse([summaryResponse])
truePostCompactTokenCount = roughTokenCountEstimationForMessages([...newMessages])
```

区别：

| 字段 | 含义 |
| --- | --- |
| compactionCallTotalTokens / postCompactTokenCount | compact 这次 API 调用消耗了多少 token |
| truePostCompactTokenCount | compact 后新上下文消息本身大概有多少 token |

`postCompactTokenCount` 名字历史上容易误导，它不是“压缩后上下文大小”，而是“压缩 API 调用总 token”。代码里已经用注释说明这一点。

### 8.2 compact 后为什么可能很快再次触发 compact

`truePostCompactTokenCount` 只估算 compact 后 messages 的 payload，不包含下一次请求中系统提示、工具 schema、userContext 等额外输入。

下一轮真实 API usage 可能比它多 20k 到 40k。

所以代码会记录：

```ts
willRetriggerNextTurn = truePostCompactTokenCount >= autoCompactThreshold
```

即使这里是 false，如果它很接近阈值，下一轮也可能因为系统提示和工具 schema 重新超过阈值。

---

## 9. Reactive compact 和 prompt-too-long 恢复

除了 proactive auto compact，还有 reactive compact。

触发方式：

```text
请求真的打到 API 后，API 返回 prompt-too-long / 413
```

query loop 会先暂存这个错误，不马上展示给用户，然后尝试恢复：

1. 如果 context-collapse 开启，先尝试 drain staged collapses；
2. 再尝试 reactive compact；
3. compact 成功后用新 messages 重试；
4. 如果失败，再把错误展示给用户。

相关路径：

```ts
// src/query.ts
isWithheld413
reactiveCompact.tryReactiveCompact(...)
finalizeReactiveCompactRetry(...)
```

为什么需要 reactive compact？

因为本地估算可能不准确，或者系统提示、工具 schema、缓存行为导致真实 API token 超过本地判断。reactive compact 是最后兜底。

---

## 10. Microcompact：不总结，只清理旧工具结果

微压缩入口：

```ts
// src/services/compact/microCompact.ts
microcompactMessages(messages, toolUseContext, querySource)
```

它和完整 compact 不同：

| 类型 | 行为 | 是否调用模型总结 |
| --- | --- | --- |
| full compact | 把旧历史总结成 summary | 是 |
| microcompact | 清理旧工具结果或缓存中的工具结果 | 否 |

### 10.1 可微压缩工具

只处理结果大、且可安全清理的工具：

```ts
FileRead
Bash/Shell
Grep
Glob
FileEdit
FileWrite
```

Read/Search/Edit/Write/Shell 的结果可能很大，清理它们能显著减少上下文。

### 10.2 time-based microcompact

如果距离上一条主线程 assistant 消息太久，服务端 prompt cache 大概率过期，继续维护 cache edit 没意义。

此时会直接把旧工具结果内容替换为：

```text
[Old tool result content cleared]
```

并保留最近 N 个工具结果。

估算节省 token：

```ts
calculateToolResultTokens(block)
```

文本按粗略 token 算，图片/文档按 2000 token 算。

### 10.3 cached microcompact

cached microcompact 不直接改本地 messages。

它会通过 API 的 `cache_edits` 能力，让服务端从缓存前缀中删除旧 tool_result，同时本地历史仍保留原内容。

流程：

```text
扫描可压缩 tool_result
注册到 cachedMCState
达到阈值后选出旧 tool_result
生成 pendingCacheEdits
下一次 API 请求插入 cache_edits
API 返回后根据 cache_deleted_input_tokens 计算真实删除量
```

这类逻辑对 prompt cache 非常敏感，因为 cache_edits 必须在后续请求中稳定重放，否则缓存前缀会失配。

---

## 11. Snip：按 turn 删除旧 Read/Grep/Glob 结果

Snip 是另一类上下文清理机制，主要面向“已完成探索、不再需要旧读文件/搜索结果”的 turn。

入口：

```ts
// src/services/compact/snipCompact.ts
snipCompactIfNeeded(messages)
autoSnipOldestEligibleTurns(messages)
```

可 snip 工具：

```ts
Read
Grep
Glob
```

不会 snip：

- Bash；
- Edit；
- Write；
- Agent；
- 其它可能有副作用或承载状态变化的工具。

Snip 的保护策略：

```text
最近 15 个 user turns 默认不允许 snip
```

可通过：

```text
CODEAGENT3_SNIP_TAIL_PROTECT
```

调整。

Snip 删除后会生成 boundary message，记录：

```ts
removedUuids
tokensFreed
snippedCount
```

query loop 里有一个重要修正：

```ts
// src/query.ts
snipTokensFreed
```

因为 snip 后，最近一个 surviving assistant 的 usage 仍然是 snip 前 API 返回的 usage，`tokenCountWithEstimation()` 看不到这部分释放量，所以 auto compact 判断时要额外减掉：

```text
tokenCountWithEstimation(messagesForQuery) - snipTokensFreed
```

---

## 12. 工具结果为什么特别敏感

工具结果是上下文 token 增长最快的来源之一。

例如：

- `Read` 大文件；
- `Grep` 返回大量匹配；
- `Glob` 返回大量路径；
- `Bash` 输出长日志；
- 并行工具调用一次返回多个大结果；
- 子代理结果回传给主线程。

相关保护机制：

### 12.1 单工具结果持久化到磁盘

入口：

```ts
// src/utils/toolResultStorage.ts
processToolResultBlock(...)
maybePersistLargeToolResult(...)
```

当单个 tool_result 超过阈值，会写入磁盘，只把 preview 和路径放进上下文：

```text
<persisted-output>
Output too large (...). Full output saved to: ...
Preview (...):
...
</persisted-output>
```

这样模型仍知道结果在哪里，但上下文里不塞完整大输出。

### 12.2 单条 user message 的聚合工具结果预算

并行工具调用可能产生多个 tool_result，它们在 API wire format 中会被合并成一个 user message。

如果每个结果单看都不超限，但合并后很大，也会撑爆上下文。

因此有 message-level budget：

```ts
// src/utils/toolResultStorage.ts
enforceToolResultBudget(...)
applyToolResultBudget(...)
```

它会：

1. 按 API 实际合并规则把 tool_result 分组；
2. 如果某组总大小超过预算，选择最大的 fresh results 持久化；
3. 已经做过的选择会 frozen，避免后续请求改变历史 prefix 破坏 prompt cache。

这是非常 token/cache 敏感的一段逻辑。

---

## 13. 输出 token 和 max output token

上下文窗口不只受输入影响，也要给输出预留空间。

模型输出上限来自：

```ts
// src/utils/context.ts
getModelMaxOutputTokens(model)
```

默认值和上限根据模型不同而不同，例如：

| 模型类型 | 默认 max output | upper limit |
| --- | --- | --- |
| opus-4-6 | 64k | 128k |
| sonnet-4-6 | 32k | 128k |
| sonnet-4 / haiku-4 | 32k | 64k |
| claude-3-opus | 4096 | 4096 |
| claude-3-sonnet | 8192 | 8192 |
| 其它默认 | 32k | 64k |

自动压缩会预留：

```text
min(modelMaxOutputTokens, 20_000)
```

输出截断恢复：

```ts
// src/query.ts
isWithheldMaxOutputTokens
```

如果命中 `max_output_tokens`：

1. 可能先从 capped 8k 升级到 64k 重试；
2. 如果仍然截断，会追加 meta message 让模型继续；
3. 最多恢复 3 次。

这里的 token 和上下文 token 相关但不是同一个概念：

- output token 是模型本轮生成长度；
- context token 是请求输入 + 缓存 + 输出在窗口里的占用。

---

## 14. Task budget / Goal budget 的 token

项目里还有任务预算相关 token。

API task_budget：

```ts
// src/services/api/agent.ts
configureTaskBudgetParams(taskBudget, outputConfig, betas)
```

发送给 API：

```ts
output_config.task_budget = {
  type: 'tokens',
  total,
  remaining,
}
```

query loop 中，跨 compact 时会更新 remaining：

```ts
// src/query.ts
finalContextTokensFromLastResponse(messagesForQuery)
taskBudgetRemaining = taskBudgetRemaining - preCompactContext
```

`finalContextTokensFromLastResponse()` 有一个特殊点：

```ts
// src/utils/tokens.ts
finalContextTokensFromLastResponse(messages)
```

它优先使用 usage.iterations 的最后一轮：

```text
lastIteration.input_tokens + lastIteration.output_tokens
```

如果没有 iterations，则用：

```text
usage.input_tokens + usage.output_tokens
```

这里**故意不包括 cache tokens**，因为它要匹配服务端 task budget 对“最终上下文窗口”的计算口径，而不是成本口径。

---

## 15. 一次 query 中 token 相关流程图

```text
用户输入 / 工具结果 / 历史 messages
        │
        ▼
getMessagesAfterCompactBoundary
        │
        ▼
applyToolResultBudget
  └─ 大 tool_result 可能落盘，只保留 preview
        │
        ▼
HISTORY_SNIP
  └─ 删除旧 Read/Grep/Glob 结果，得到 snipTokensFreed
        │
        ▼
microcompact
  ├─ time-based：本地清空旧工具结果
  └─ cached：生成 cache_edits，服务端缓存删除
        │
        ▼
context-collapse（如果开启）
        │
        ▼
autocompact 判断
  └─ tokenCountWithEstimation(messages) - snipTokensFreed >= threshold ?
        │
        ├─ 是：compactConversation → summary + boundary + attachments
        │
        └─ 否：继续
        │
        ▼
blocking limit 判断
        │
        ▼
构造 API 请求
  ├─ system prompt
  ├─ userContext/systemContext
  ├─ tools schema
  ├─ messagesForAPI
  ├─ max_tokens
  ├─ thinking
  ├─ betas
  └─ cache_control/cache_edits
        │
        ▼
模型 API 返回 assistant + usage
        │
        ▼
usage 用于：
  ├─ 成本累计
  ├─ 状态栏百分比
  ├─ 下一轮 tokenCountWithEstimation 的锚点
  ├─ compact telemetry
  └─ task budget / goal runtime
```

---

## 16. 哪些地方对 token 特别敏感

### 16.1 system prompt 和工具 schema

每次 API 请求都会包含：

- system prompt；
- attribution header；
- CLI sysprompt prefix；
- append system context；
- tool schemas；
- MCP tools；
- agent definitions；
- advisor instructions；
- skill/tool search 相关说明。

这些不一定存在于 `messages` 里，但会进入 API input_tokens。

因此：

> `roughTokenCountEstimationForMessages()` 只看 messages payload，可能低估下一次真实 input_tokens。

这也是为什么自动压缩阈值需要 buffer。

### 16.2 prompt cache

cache tokens 不代表“免费上下文”。

API usage 中有：

- `cache_read_input_tokens`；
- `cache_creation_input_tokens`。

在成本和上下文估算中通常要计入，因为它们仍对应输入上下文内容。

但某些 task budget final context 口径会故意排除 cache tokens。

容易混淆：

| 场景 | 是否计 cache tokens |
| --- | --- |
| `getTokenCountFromUsage()` | 计入 |
| `tokenCountWithEstimation()` | 计入最近 usage 的 cache tokens |
| 状态栏 used percentage | 计入 input + cache read + cache creation |
| `finalContextTokensFromLastResponse()` | 不计 cache tokens |
| 成本累计 | 分类型累计 input/output/cache read/cache creation |

### 16.3 compact 相关附件

compact 后不只是 summary，还会重新注入一些上下文：

- 最近读过的文件；
- async agent 状态；
- plan 文件；
- plan mode 信息；
- invoked skills；
- deferred tools delta；
- MCP instructions delta；
- session start hook messages。

这些都会增加 post-compact token。

相关预算：

```ts
POST_COMPACT_MAX_FILES_TO_RESTORE = 5
POST_COMPACT_TOKEN_BUDGET = 50_000
POST_COMPACT_MAX_TOKENS_PER_FILE = 5_000
POST_COMPACT_MAX_TOKENS_PER_SKILL = 5_000
POST_COMPACT_SKILLS_TOKEN_BUDGET = 25_000
```

### 16.4 thinking blocks

thinking / redacted_thinking 会进入 token 估算。

同时，thinking 配置会影响 API 参数和 cache key：

- adaptive thinking；
- budget thinking；
- disabled thinking；
- redacted thinking；
- context management clear thinking。

改这些参数可能影响：

- 输出质量；
- max token 分配；
- prompt cache 命中；
- token counting API 是否成功。

### 16.5 图片和文档

图片/文档 token 估算不能简单按 base64 字符长度算。

项目里多个地方使用约 2000 token 常量，避免大 PDF base64 被估成几十万 token。

相关路径：

- `roughTokenCountEstimationForBlock()`；
- `microCompact.calculateToolResultTokens()`；
- compact 前会 strip images/documents，替换成 `[image]` / `[document]`。

### 16.6 并行工具调用

并行工具调用有两个敏感点：

1. 多个 assistant fragment 共享同一个 API response id；
2. 多个 tool_result 在 API wire format 中可能合并成一个 user message。

因此：

- `tokenCountWithEstimation()` 要回溯同 response id 的第一个 fragment；
- `enforceToolResultBudget()` 要按 API 合并规则分组。

否则会低估 token 或漏掉超大聚合工具结果。

### 16.7 model switching / 1M context

模型切换会改变：

- context window size；
- max output tokens；
- thinking 支持；
- tool search 支持；
- cache key；
- 是否支持 1M context。

因此状态栏、auto compact threshold、blocking limit 都依赖当前 runtime model，而不是静态配置。

---

## 17. 常见误区

### 误区 1：累计 token 越大，当前上下文越满

不一定。

累计 token 是历史所有 API 调用消耗；当前上下文只看下一次请求会带上的内容。compact 后累计 token 不会下降，但当前上下文会下降。

### 误区 2：output_tokens 可以代表上下文大小

不能。

`output_tokens` 只代表模型本轮生成了多少，不包含系统提示、工具 schema、历史消息、工具结果等输入上下文。

代码里明确警告：

```ts
messageTokenCountFromLastAPIResponse()
```

不要用于 autocompact/session memory 这类阈值判断。

### 误区 3：compact 后的 postCompactTokenCount 是压缩后上下文大小

不是。

它实际是 compact summary 这次 API 调用的总 token。真正压缩后上下文估算是 `truePostCompactTokenCount`。

### 误区 4：cache read token 不占上下文

仍然要按上下文内容处理。

cache read 只是服务端复用了缓存前缀，减少延迟/成本或改变计费方式；它对应的内容仍然在模型输入上下文里。

### 误区 5：本地估算精确等于 API tokenizer

不是。

本地估算是启发式，主要用于提前判断和兜底。真实口径以 API usage 为准。

---

## 18. 排查 token 问题时看哪里

### 当前上下文为什么触发 compact？

看：

```ts
src/services/compact/autoCompact.ts
shouldAutoCompact()
calculateTokenWarningState()
getAutoCompactThreshold()
```

关键变量：

```text
tokenCount
snipTokensFreed
threshold
effectiveWindow
model
querySource
```

### 为什么状态栏显示使用率很高？

看：

```ts
src/components/StatusLine.tsx
buildStatusLineCommandInput()

src/utils/context.ts
calculateContextPercentages()
```

重点确认：

```text
currentUsage.input_tokens
cache_creation_input_tokens
cache_read_input_tokens
contextWindowSize
runtimeModel
```

### 为什么 compact 后马上又 compact？

看：

```ts
src/services/compact/compact.ts
truePostCompactTokenCount
willRetriggerNextTurn
postCompactFileAttachments
hookMessages
skillAttachment
planAttachment
```

重点检查 compact 后重新注入了多少附件、skills、文件内容、hook 输出。

### 为什么工具结果撑爆上下文？

看：

```ts
src/utils/toolResultStorage.ts
maybePersistLargeToolResult()
enforceToolResultBudget()
applyToolResultBudget()

src/services/compact/microCompact.ts
microcompactMessages()
```

重点确认：

```text
工具 maxResultSizeChars
单结果是否落盘
并行工具结果是否被聚合预算处理
Read 工具是否因 Infinity 跳过落盘
microcompact 是否触发
```

### 为什么 prompt-too-long 没提前挡住？

可能原因：

- 本地 rough estimate 低估；
- system prompt / tools schema 比 messages 估算多很多；
- cache / beta / thinking 参数改变了真实 API token；
- 图片/文档或特殊 block 估算偏差；
- snip 后 usage 锚点仍是旧值但 snipTokensFreed 未正确抵扣；
- context-collapse / reactive compact 接管了恢复路径。

看：

```ts
src/query.ts
blocking limit 判断
reactive compact 恢复路径
context collapse 恢复路径
```

---

## 19. 关键文件速查

| 文件 | 作用 |
| --- | --- |
| `src/utils/tokens.ts` | 当前上下文 token 计算、usage 读取、最后 API response token |
| `src/services/tokenEstimation.ts` | 本地粗略估算、API countTokens、fallback count |
| `src/utils/context.ts` | context window、max output token、状态栏百分比 |
| `src/services/compact/autoCompact.ts` | 自动压缩阈值、warning/error/blocking 状态 |
| `src/services/compact/compact.ts` | 完整 compact、post-compact token、附件恢复 |
| `src/services/compact/microCompact.ts` | 时间微压缩、缓存微压缩、旧工具结果清理 |
| `src/services/compact/snipCompact.ts` | Read/Grep/Glob turn snip |
| `src/utils/toolResultStorage.ts` | 大工具结果落盘、聚合工具结果预算 |
| `src/query.ts` | 主查询循环，串起 snip/microcompact/autocompact/API/recovery |
| `src/services/api/agent.ts` | API 请求构造、max_tokens、thinking、betas、cache、usage 产生 |
| `src/cost-tracker.ts` | 成本和累计 token 统计 |
| `src/components/StatusLine.tsx` | 状态栏 context_window 展示 |

---

## 20. 总结

CodeAgent 的 token 体系可以分成三层：

```text
真实层：API usage
  input/output/cache read/cache creation

估算层：rough estimation
  字符数 / block 类型 / 图片文档常量 / 新增消息估算

决策层：context window policy
  auto compact threshold / blocking limit / microcompact / snip / reactive compact
```

实际运行时的核心闭环是：

```text
API usage 成为下一轮 token 计算锚点
新增消息用本地估算补齐
达到阈值则 compact/microcompact/snip
请求失败则 reactive compact 兜底
成本和状态栏分别用 usage 做累计和展示
```

最需要谨慎的地方是：

1. 不要混用累计 token、当前上下文 token、output token；
2. cache token 在大多数上下文判断里仍要计入；
3. compact 后的 `postCompactTokenCount` 不是压缩后上下文大小；
4. 工具结果、附件、skills、hook 输出是上下文膨胀高风险来源；
5. 并行工具调用和 prompt cache 稳定性会影响 token 判断准确性；
6. 本地估算只是提前预警，真实 token 仍以 API usage 为准。
