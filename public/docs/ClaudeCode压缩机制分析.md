# ClaudeCode 压缩机制分析

本文分析 ClaudeCode 当前会话上下文压缩机制，覆盖压缩类型、触发时机、触发阈值、关键代码行为、压缩后的消息形态，以及本次新增的 `appendChineseTokenLog` 中文日志断点。

## 1. 总体链路

压缩不是单一路径，而是一组分层上下文治理机制：

1. **Token 展示与告警**：footer 读取最近一次 API usage，计算 compact boundary 后的 token 使用量，用于 verbose token 显示与 `TokenWarning`。
2. **Snip / Microcompact**：在请求前优先尝试清理旧工具结果或通过 cache edit 删除工具结果，减少上下文压力。
3. **API 原生 context management**：构造 Anthropic API 的 `context_management` 策略，让服务端清理 thinking 或 tool use/tool result 内容。
4. **自动压缩 Auto Compact**：当估算 token 达到自动阈值时，先尝试 session memory compact，再 fallback 到完整摘要压缩。
5. **手动压缩 Manual Compact**：用户执行 `/compact` 时触发，走完整摘要压缩；在 reactive-only 模式下可走 reactive compact wrapper。
6. **响应式压缩 Reactive Compact**：当 API 返回 withheld prompt-too-long 或 media-size 错误后，单次触发 compact 并重试。
7. **部分压缩 Partial Compact**：围绕用户选定 pivot，只摘要 pivot 前或 pivot 后的消息。

典型请求路径可以概括为：

```text
messages
  -> snip compact / force snip
  -> microcompactMessages
      -> time-based microcompact
      -> cached microcompact
  -> API context_management 参数生成
  -> shouldAutoCompact / autoCompactIfNeeded
      -> trySessionMemoryCompaction
      -> compactConversation
  -> Claude API 请求
  -> 如果 withheld PTL/media error，则 tryReactiveCompact
```

## 2. Token 读取与 compact boundary

### 2.1 Footer token 显示

相关代码：

- `src/components/PromptInput/Notifications.tsx`
- `src/utils/messages.ts`
- `src/utils/tokens.ts`

`Notifications` 中的 token usage 计算逻辑：

```ts
const messagesForTokenCount = getMessagesAfterCompactBoundary(messages)
const tokens = tokenCountFromLastAPIResponse(messagesForTokenCount)
```

含义：

- `getMessagesAfterCompactBoundary(messages)` 会从最近一次 compact boundary 之后截取消息。
- `tokenCountFromLastAPIResponse(...)` 使用最后一次 assistant API response 的 `usage` 字段计算 token。
- footer 的 `verbose` 模式显示的是 compact boundary 后最近 API 响应里的 token 数，而不是整份 transcript 的精确总 token。

已存在日志：

```text
断点：footer verbose模式读取最近API响应token
```

记录字段包括：

- `original_message_count`
- `messages_after_compact_boundary`
- `token_usage`

### 2.2 compact boundary 的结果形态

完整压缩或 session memory 压缩后，会构造类似下面的消息结构：

```text
[SystemCompactBoundaryMessage]
[UserMessage: isCompactSummary=true, isVisibleInTranscriptOnly=true]
[post-compact attachments]
[SessionStart hook messages]
[后续新对话消息]
```

其中 compact boundary 会记录：

- compact 类型：`auto` 或 `manual`
- compact 前 token 数
- anchor message uuid
- preserved segment metadata
- pre-compact discovered tools

后续 token 统计和消息截取会以最近 compact boundary 为分界。

## 3. 自动压缩 Auto Compact

相关代码：

- `src/services/compact/autoCompact.ts`
- 关键函数：`shouldAutoCompact`、`autoCompactIfNeeded`

### 3.1 是否启用

`isAutoCompactEnabled()` 会检查：

1. `DISABLE_COMPACT`：整体禁用 compact。
2. `DISABLE_AUTO_COMPACT`：只禁用自动压缩，保留手动 `/compact`。
3. 用户配置 `getGlobalConfig().autoCompactEnabled`。

此外 `shouldAutoCompact` 会跳过特殊 query source：

- `session_memory`
- `compact`
- context-collapse 下的 `marble_origami`

当开启 reactive-only 或 context-collapse 时，也会压制 proactive autocompact，让其他机制接管上下文治理。

### 3.2 阈值

核心常量：

```ts
AUTOCOMPACT_BUFFER_TOKENS = 13_000
WARNING_THRESHOLD_BUFFER_TOKENS = 20_000
ERROR_THRESHOLD_BUFFER_TOKENS = 20_000
MANUAL_COMPACT_BUFFER_TOKENS = 3_000
MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3
```

`getEffectiveContextWindowSize(model)`：

```text
effectiveWindow = modelContextWindow - reservedSummaryOutputTokens
```

其中 `reservedSummaryOutputTokens` 是：

```text
min(getMaxOutputTokensForModel(model), MAX_OUTPUT_TOKENS_FOR_SUMMARY)
```

`MAX_OUTPUT_TOKENS_FOR_SUMMARY` 默认是 `20_000`，可由 `ARGS_MAX_OUTPUT_TOKENS_FOR_SUMMARY` 覆盖。

`getAutoCompactThreshold(model)`：

- 如果存在 `ARGS_AUTOCOMPACT_PCT`：
  ```text
  threshold = floor(effectiveWindow * pct / 100)
  ```
- 否则：
  ```text
  threshold = effectiveWindow - 13_000
  ```
- 如果存在测试覆盖 `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`，取更小阈值。

`shouldAutoCompact` 实际判定：

```text
tokenCount = tokenCountWithEstimation(messages) - snipTokensFreed
shouldCompact = tokenCount >= getAutoCompactThreshold(model)
```

### 3.3 行为

`autoCompactIfNeeded(...)` 的行为：

1. 如果 `DISABLE_COMPACT`，直接不压缩。
2. 如果连续失败次数达到 `3`，触发 circuit breaker，本 session 后续跳过自动压缩。
3. 调用 `shouldAutoCompact(...)` 判定是否达到阈值。
4. 达到阈值后构造 `RecompactionInfo`，记录：
   - 是否链式重复压缩
   - 上次 compact 后经过多少 turn
   - 上次 compact turn id
   - 当前自动压缩阈值
   - query source
5. 优先调用 `trySessionMemoryCompaction(...)`。
6. 如果 session memory compact 不可用或结果仍超过阈值，fallback 到 `compactConversation(...)`。
7. 成功后会：
   - 清空 `lastSummarizedMessageId`
   - 执行 `runPostCompactCleanup(querySource)`
   - 重置 prompt cache break detection baseline
   - 标记 post compaction
8. 失败后记录错误并累加 consecutive failures。

### 3.4 新增日志

本次新增日志：

- `断点：自动压缩阈值判定`
  - 记录 `message_count`、`model`、`query_source`、`token_count`、`snip_tokens_freed`、`threshold`、`effective_window`、`is_above_auto_compact_threshold`。
- `断点：自动压缩未触发`
  - 记录未达到阈值时的消息数量、模型、query source、连续失败次数。
- `断点：自动压缩采用会话记忆压缩`
  - 记录 session memory compact 被采用后的 pre/post token。
- `断点：自动压缩采用完整摘要压缩`
  - 记录 fallback 到完整摘要压缩后的 token 结果。
- `断点：自动压缩失败`
  - 记录失败原因、连续失败次数和 circuit breaker 是否触发。

## 4. 完整摘要压缩 Compact Conversation

相关代码：

- `src/services/compact/compact.ts`
- 关键函数：`compactConversation`

### 4.1 触发来源

`compactConversation(...)` 可由多处触发：

- 手动 `/compact`
- 自动压缩 fallback
- reactive compact
- in-process teammate / forked agent 场景

GitNexus 影响分析显示该函数风险为 **HIGH**：直接调用方包括手动 compact、自动 compact、响应式 compact 和 teammate runner。因此本次只加 fire-and-forget 日志，不改控制流。

### 4.2 行为步骤

完整摘要压缩主要流程：

1. 校验消息非空。
2. 计算 `preCompactTokenCount = tokenCountWithEstimation(messages)`。
3. 执行 PreCompact hooks。
4. 生成 compact prompt。
5. 通过 forked agent / streaming 请求模型生成 summary。
6. 如果 compact 请求自身遇到 prompt-too-long：
   - 最多重试 `MAX_PTL_RETRIES = 3` 次。
   - 每次调用 `truncateHeadForPTLRetry(...)` 丢弃最老的 API round group。
   - 如果仍失败，抛出 `ERROR_MESSAGE_PROMPT_TOO_LONG`。
7. 清空 read file state、loaded nested memory paths。
8. 生成 post-compact attachments：
   - 最近读取文件附件
   - async agent 附件
   - plan 附件
   - plan mode 附件
   - invoked skill 附件
   - deferred tools delta
   - agent listing delta
   - MCP instructions delta
9. 执行 SessionStart hooks。
10. 构造 compact boundary 和 summary message。
11. 计算两个 token 指标：
    - `compactionCallTotalTokens`：压缩 API 调用本身的 usage 总 token。
    - `truePostCompactTokenCount`：压缩后真正会进入下一轮上下文的消息 payload 粗估 token。
12. 写入 `tengu_compact` analytics。
13. 重置 prompt cache break detection baseline。
14. 标记 post compaction。
15. 重新 append session metadata。
16. 执行 PostCompact hooks。
17. 返回 `CompactionResult`。

### 4.3 结果形态

返回的 `CompactionResult` 包括：

```ts
{
  boundaryMarker,
  summaryMessages,
  attachments,
  hookResults,
  userDisplayMessage,
  preCompactTokenCount,
  postCompactTokenCount,      // compact API call total usage
  truePostCompactTokenCount,  // resulting context estimate
  compactionUsage,
}
```

注意：

- `postCompactTokenCount` 兼容旧字段名，但语义已经变成“压缩 API 调用总 usage”。
- 真正压缩后上下文大小应看 `truePostCompactTokenCount`。
- 下一轮 `shouldAutoCompact` 看到的 token 还会叠加 system prompt、tools、user context 等，因此 `willRetriggerNextTurn=false` 不代表绝对不会再次触发。

### 4.4 新增日志

本次新增日志：

- `断点：完整摘要压缩遇到PTL并截断重试`
  - 记录 PTL retry 次数、丢弃消息数、剩余消息数、compact 前 token、是否自动压缩。
- `断点：完整摘要压缩完成`
  - 记录 compact 前消息数、实际摘要消息数、compact API 总 token、压缩后真实上下文估算、是否会下轮重触发、query source、PTL 次数、附件数、hook 消息数、summary 消息数等。

## 5. Session Memory Compact

相关代码：

- `src/services/compact/sessionMemoryCompact.ts`
- 关键函数：`trySessionMemoryCompaction`

### 5.1 是否启用

`shouldUseSessionMemoryCompaction()` 依赖：

- 环境变量 override
- GrowthBook flags：`tengu_session_memory`、`tengu_sm_compact`

如果未启用，直接返回 `null`，由调用方 fallback 到 legacy compact。

### 5.2 阈值与保留窗口

默认配置：

```ts
DEFAULT_SM_COMPACT_CONFIG = {
  minTokens: 10_000,
  minTextBlockMessages: 5,
  maxTokens: 40_000,
}
```

`calculateMessagesToKeepIndex(...)` 从 `lastSummarizedMessageId` 之后开始向后保留尾部消息，并满足：

- 至少保留 `minTokens`
- 至少保留 `minTextBlockMessages`
- 最多不超过 `maxTokens`
- 不跨过最近 compact boundary
- 不切断 tool_use/tool_result pair
- 不切断共享 assistant `message.id` 的 thinking fragments

### 5.3 行为

`trySessionMemoryCompaction(...)`：

1. 检查是否启用 session memory compaction。
2. 初始化远程配置。
3. 等待 session memory extraction 完成。
4. 读取 `lastSummarizedMessageId` 和 session memory 内容。
5. 如果没有 session memory 文件，返回 `null`。
6. 如果 session memory 仍是空模板，返回 `null`。
7. 如果有 `lastSummarizedMessageId`，找到其 index；找不到则返回 `null`。
8. 如果是恢复 session 且没有 summarized id，则把 last index 设为最后一条消息。
9. 计算 `startIndex`，生成 `messagesToKeep`。
10. 执行 SessionStart hooks。
11. 用 session memory 内容构造 compact summary。
12. 构建 post-compact messages 并估算 token。
13. 如果传入 `autoCompactThreshold` 且 post compact token 仍大于等于阈值，返回 `null`，交给 legacy compact。
14. 成功则返回 `CompactionResult`。

### 5.4 结果形态

Session memory compact 的结果和 legacy compact 同样是 `CompactionResult`，但差异是：

- 不发起 compact API summary call。
- summary 来自 session memory 文件。
- `postCompactTokenCount` 和 `truePostCompactTokenCount` 收敛到同一个 post compact message estimate。
- 会保留满足 min/max 规则的尾部消息。

### 5.5 新增日志

本次新增日志：

- `断点：会话记忆压缩跳过-无会话记忆`
- `断点：会话记忆压缩跳过-模板为空`
- `断点：会话记忆压缩结果超过自动压缩阈值`
- `断点：会话记忆压缩完成`

这些日志用于区分 session memory compact 未被采用的原因，以及被采用后保留了多少消息、post compact token 数是否低于自动压缩阈值。

## 6. Microcompact

相关代码：

- `src/services/compact/microCompact.ts`
- 关键函数：`microcompactMessages`、`cachedMicrocompactPath`、`maybeTimeBasedMicrocompact`

### 6.1 总体入口

`microcompactMessages(...)` 的执行顺序：

1. 清理 compact warning suppression。
2. 先尝试 time-based microcompact。
3. 如果 time-based 未触发，再尝试 cached microcompact。
4. 如果都不可用，返回原 messages。

### 6.2 Time-based microcompact

触发函数：`evaluateTimeBasedTrigger(...)`

触发条件：

- `getTimeBasedMCConfig().enabled === true`
- query source 必须是主线程，例如 `repl_main_thread` 或 `repl_main_thread:outputStyle:*`
- 存在上一条 assistant 消息
- 当前时间距离上一条 assistant 消息超过 `config.gapThresholdMinutes`

行为：

- 收集 compactable tools 的 tool_use id。
- 保留最近 `keepRecent` 个 tool result，且至少保留 1 个。
- 将更老的 tool_result content 替换为：

```text
[Old tool result content cleared]
```

- 估算 `tokensSaved`。
- suppress compact warning。
- reset cached microcompact state。
- 通知 prompt cache break detection 这是预期 cache deletion。

结果形态：

```ts
{ messages: result }
```

这里的 `messages` 会被实际改写，旧工具结果内容变成占位文本。

新增日志：

- `断点：时间微压缩清理旧工具结果`
  - 记录 idle gap、阈值、清理工具数、保留工具数、估算节省 token。

### 6.3 Cached microcompact

触发条件：

- 编译特性 `CACHED_MICROCOMPACT`
- `isCachedMicrocompactEnabled()`
- 模型支持 cache editing
- query source 是主线程

行为：

- 注册 compactable tool results。
- 根据 cached MC 配置判断哪些 tool results 应删除。
- 构造 `cache_edits` block，并暂存在 `pendingCacheEdits`。
- 不改写本地 messages。
- 后续 API 层插入 cache edit/reference，让服务端 cache prefix 删除旧工具结果。
- API 响应后使用 `cache_deleted_input_tokens` 计算实际删除 token。

结果形态：

```ts
{
  messages, // unchanged
  compactionInfo: {
    pendingCacheEdits: {
      trigger: 'auto',
      deletedToolIds,
      baselineCacheDeletedTokens,
    }
  }
}
```

新增日志：

- `断点：缓存微压缩删除工具结果`
  - 记录删除工具数量、工具 id、active tool count、阈值、keep recent、baseline cache_deleted_input_tokens。

## 7. API 原生 context management

相关代码：

- `src/services/compact/apiMicrocompact.ts`
- 关键函数：`getAPIContextManagement`

### 7.1 Thinking 清理

当：

```text
hasThinking=true && isRedactThinkingActive=false
```

会加入策略：

```ts
{
  type: 'clear_thinking_20251015',
  keep: clearAllThinking ? { type: 'thinking_turns', value: 1 } : 'all'
}
```

含义：

- 默认保留 thinking。
- 如果 `clearAllThinking` 为 true，则只保留最后 1 个 thinking turn。

### 7.2 Tool 清理

Tool clearing 是 ant-only：

```text
process.env.USER_TYPE === 'ant'
```

环境变量：

- `USE_API_CLEAR_TOOL_RESULTS`
- `USE_API_CLEAR_TOOL_USES`
- `API_MAX_INPUT_TOKENS`
- `API_TARGET_INPUT_TOKENS`

默认值：

```ts
DEFAULT_MAX_INPUT_TOKENS = 180_000
DEFAULT_TARGET_INPUT_TOKENS = 40_000
```

如果启用 clear tool results，策略为：

```ts
{
  type: 'clear_tool_uses_20250919',
  trigger: { type: 'input_tokens', value: triggerThreshold },
  clear_at_least: { type: 'input_tokens', value: triggerThreshold - keepTarget },
  clear_tool_inputs: TOOLS_CLEARABLE_RESULTS,
}
```

如果启用 clear tool uses，策略为：

```ts
{
  type: 'clear_tool_uses_20250919',
  trigger: { type: 'input_tokens', value: triggerThreshold },
  clear_at_least: { type: 'input_tokens', value: triggerThreshold - keepTarget },
  exclude_tools: TOOLS_CLEARABLE_USES,
}
```

### 7.3 结果形态

如果有策略：

```ts
{ edits: strategies }
```

如果没有策略：

```ts
undefined
```

该结果最终进入 API 请求参数的 `context_management`。

新增日志：

- `断点：API原生上下文管理配置完成`
  - 记录 thinking/tool clearing 输入条件、环境状态和最终策略数量。

## 8. Reactive Compact

相关代码：

- `src/services/compact/reactiveCompact.ts`
- 关键函数：`tryReactiveCompact`、`reactiveCompactOnPromptTooLong`

### 8.1 Reactive-only mode

`isReactiveOnlyMode()`：

- 如果 `INNERCC_FORCE_REACTIVE_ONLY` 为 truthy，启用。
- 否则读取 GrowthBook flag `tengu_cobalt_raccoon`。

Reactive-only 模式下 proactive autocompact 会被压制，转而依赖 API 413 / withheld error 后的 reactive recovery。

### 8.2 tryReactiveCompact

触发时机：

- API 返回 withheld prompt-too-long。
- 或 media-size withheld error。

行为：

- 如果本轮已经尝试过，返回 `null`，避免无限循环。
- 如果请求已 abort，返回 `null`。
- 否则调用 `compactConversation(..., isAutoCompact=true)`。
- 成功返回 `CompactionResult`，失败返回 `null`。

新增日志：

- `断点：响应式压缩跳过-本轮已尝试`
- `断点：响应式压缩跳过-请求已中止`
- `断点：响应式压缩完成`
- `断点：响应式压缩失败`

### 8.3 reactiveCompactOnPromptTooLong

这是 reactive-only 模式下手动 `/compact` 入口。

行为：

- abort 时返回 `{ ok: false, reason: 'aborted' }`
- 成功时返回 `{ ok: true, result }`
- 异常会映射为结构化 reason：
  - `too_few_groups`
  - `aborted`
  - `exhausted`
  - `media_unstrippable`
  - `error`

新增日志：

- `断点：响应式手动压缩完成`

## 9. Partial Compact

相关代码：

- `src/services/compact/compact.ts`
- 关键函数：`partialCompactConversation`

触发方式：用户指定 pivot message，并选择方向：

- `direction='from'`：摘要 pivot 之后的消息，保留 pivot 之前的消息。
- `direction='up_to'`：摘要 pivot 之前的消息，保留 pivot 之后的消息。

行为差异：

- `up_to` 会移除保留段中的旧 compact boundary / summary，避免旧 boundary 截断新 summary。
- `from` 保留旧 compact boundary，因为新 summary 位于保留段之后，反向扫描仍能工作。
- `up_to` prefix 能命中 prompt cache；`from` 更容易破坏 cache prefix。
- 同样有 PTL retry 机制。

结果仍为 `CompactionResult`。

本次未对 partial compact 单独插日志，因为用户重点要求结合 `appendChineseTokenLog` 标注压缩主链路，而 partial compact 复用 compact summary 行为，后续如需可按 `compactConversation` 同样方式补充。

## 10. 压缩类型对照表

| 类型 | 触发时机 | 触发阈值/条件 | 是否改写本地 messages | 结果形态 |
| --- | --- | --- | --- | --- |
| Footer token 统计 | UI render / messages 变化 | 最近 API response usage | 否 | token 数字和 warning 状态 |
| Auto Compact | 请求前 proactive check | `tokenCountWithEstimation(messages)-snipFreed >= autoThreshold` | 是，成功后替换为 compact result | compact boundary + summary + attachments + hooks |
| Manual Compact | 用户执行 `/compact` | 用户主动触发；blocking limit 附近常提示用户执行 | 是 | compact boundary + summary + attachments + hooks |
| Session Memory Compact | auto/manual compact 优先尝试 | session memory 启用且存在有效内容，post token 低于 auto threshold | 是 | session memory summary + preserved tail |
| Full Summary Compact | auto fallback / manual / reactive | compact 入口被调用 | 是 | LLM summary + boundary + restored context |
| PTL retry compact | compact API 自身 PTL | 最多 `MAX_PTL_RETRIES=3` | 是，摘要输入逐步截头 | 成功则 normal compact，失败抛 PTL |
| Time-based Microcompact | 请求前 idle gap 超阈值 | main thread + gap >= config threshold | 是，旧 tool_result content 替换占位符 | messages 变短，保留最近 N 个工具结果 |
| Cached Microcompact | 请求前 cached MC 判定 | feature + enabled + model supported + main thread | 否 | pending cache edits，由 API 层删除 cache 内工具结果 |
| API context management | API 参数构造 | thinking/tool clearing 条件和 env | 否，本地不变 | `{ edits: [...] }` 交给 API |
| Reactive Compact | API withheld PTL/media error 后 | 单轮最多一次，未 abort | 是 | compact result 后重试请求 |
| Partial Compact | 用户按 pivot 局部压缩 | 用户主动指定 pivot/direction | 是 | pivot 一侧 summary + 另一侧 preserved messages |

## 11. 关键阈值汇总

| 阈值 | 默认值 | 所在位置 | 作用 |
| --- | ---: | --- | --- |
| `MAX_OUTPUT_TOKENS_FOR_SUMMARY` | `20_000` | `autoCompact.ts` | 从模型 context window 中预留 summary output 空间 |
| `AUTOCOMPACT_BUFFER_TOKENS` | `13_000` | `autoCompact.ts` | 无 pct 配置时，自动压缩阈值 = effective window - buffer |
| `WARNING_THRESHOLD_BUFFER_TOKENS` | `20_000` | `autoCompact.ts` | UI warning 阈值 buffer |
| `ERROR_THRESHOLD_BUFFER_TOKENS` | `20_000` | `autoCompact.ts` | UI error 阈值 buffer |
| `MANUAL_COMPACT_BUFFER_TOKENS` | `3_000` | `autoCompact.ts` | blocking limit buffer |
| `MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES` | `3` | `autoCompact.ts` | 自动压缩失败 circuit breaker |
| `MAX_PTL_RETRIES` | `3` | `compact.ts` | compact 请求自身 prompt-too-long 截头重试次数 |
| `POST_COMPACT_TOKEN_BUDGET` | `50_000` | `compact.ts` | post compact 文件/上下文恢复预算 |
| `POST_COMPACT_MAX_FILES_TO_RESTORE` | `5` | `compact.ts` | compact 后恢复最近文件数量 |
| `POST_COMPACT_MAX_TOKENS_PER_FILE` | `5_000` | `compact.ts` | 单文件恢复 token 上限 |
| `POST_COMPACT_SKILLS_TOKEN_BUDGET` | `25_000` | `compact.ts` | invoked skill 恢复总预算 |
| `POST_COMPACT_MAX_TOKENS_PER_SKILL` | `5_000` | `compact.ts` | 单 skill 恢复 token 上限 |
| `DEFAULT_SM_COMPACT_CONFIG.minTokens` | `10_000` | `sessionMemoryCompact.ts` | session memory compact 保留尾部最少 token |
| `DEFAULT_SM_COMPACT_CONFIG.minTextBlockMessages` | `5` | `sessionMemoryCompact.ts` | session memory compact 保留最少文本消息数 |
| `DEFAULT_SM_COMPACT_CONFIG.maxTokens` | `40_000` | `sessionMemoryCompact.ts` | session memory compact 保留尾部最多 token |
| `DEFAULT_MAX_INPUT_TOKENS` | `180_000` | `apiMicrocompact.ts` | API context management 默认触发 input token |
| `DEFAULT_TARGET_INPUT_TOKENS` | `40_000` | `apiMicrocompact.ts` | API context management 默认目标 input token |

## 12. 新增日志断点清单

本次新增的 `appendChineseTokenLog` 覆盖以下关键路径：

| 日志描述 | 文件 | 目的 |
| --- | --- | --- |
| `断点：自动压缩阈值判定` | `autoCompact.ts` | 看 token 是否达到 auto compact threshold |
| `断点：自动压缩未触发` | `autoCompact.ts` | 区分 proactive check 未触发 |
| `断点：自动压缩采用会话记忆压缩` | `autoCompact.ts` | 确认 auto compact 使用 SM compact |
| `断点：自动压缩采用完整摘要压缩` | `autoCompact.ts` | 确认 auto compact fallback 到 legacy summary compact |
| `断点：自动压缩失败` | `autoCompact.ts` | 记录失败与 circuit breaker 状态 |
| `断点：完整摘要压缩遇到PTL并截断重试` | `compact.ts` | 观察 compact API 自身 PTL retry |
| `断点：完整摘要压缩完成` | `compact.ts` | 记录完整摘要压缩最终结果 |
| `断点：会话记忆压缩跳过-无会话记忆` | `sessionMemoryCompact.ts` | 解释 SM compact fallback 原因 |
| `断点：会话记忆压缩跳过-模板为空` | `sessionMemoryCompact.ts` | 解释 SM compact fallback 原因 |
| `断点：会话记忆压缩结果超过自动压缩阈值` | `sessionMemoryCompact.ts` | 解释 SM compact 被拒绝原因 |
| `断点：会话记忆压缩完成` | `sessionMemoryCompact.ts` | 记录 SM compact 成功结果 |
| `断点：缓存微压缩删除工具结果` | `microCompact.ts` | 记录 cached microcompact cache edit 计划 |
| `断点：时间微压缩清理旧工具结果` | `microCompact.ts` | 记录 time-based microcompact 实际清理 |
| `断点：响应式压缩跳过-本轮已尝试` | `reactiveCompact.ts` | 避免重复 reactive retry 的观测点 |
| `断点：响应式压缩跳过-请求已中止` | `reactiveCompact.ts` | abort 场景观测点 |
| `断点：响应式压缩完成` | `reactiveCompact.ts` | reactive compact 成功结果 |
| `断点：响应式压缩失败` | `reactiveCompact.ts` | reactive compact 失败原因 |
| `断点：响应式手动压缩完成` | `reactiveCompact.ts` | reactive-only 手动 compact 成功结果 |
| `断点：API原生上下文管理配置完成` | `apiMicrocompact.ts` | 记录 API context_management 策略构造结果 |

所有新增日志均使用：

```ts
void appendChineseTokenLog(...)
```

因此日志写入失败会被 `appendChineseTokenLog` 内部吞掉，不影响压缩主流程。

## 13. 风险与验证

### 13.1 GitNexus 影响分析结果

已按项目要求在编辑前执行 GitNexus impact：

- `shouldAutoCompact`：LOW，直接影响 `autoCompactIfNeeded`。
- `autoCompactIfNeeded`：LOW。
- `compactConversation`：HIGH，直接调用方包括手动 compact、自动 compact、reactive compact、in-process teammate。
- `trySessionMemoryCompaction`：LOW。
- `microcompactMessages`：LOW。
- `cachedMicrocompactPath`：LOW。
- `maybeTimeBasedMicrocompact`：LOW。
- `tryReactiveCompact`：LOW。
- `reactiveCompactOnPromptTooLong`：LOW。
- `getAPIContextManagement`：LOW。

由于 `compactConversation` 是 HIGH，本次在该函数中只加入无控制流影响的中文日志，不改变压缩算法、阈值、消息构造或返回结构。

### 13.2 已检查项

- 新增日志相关文件的 VS Code diagnostics 已检查：
  - `autoCompact.ts`
  - `compact.ts`
  - `sessionMemoryCompact.ts`
  - `microCompact.ts`
  - `reactiveCompact.ts`
  - `apiMicrocompact.ts`
- 日志调用均为 fire-and-forget。
- 未改变压缩触发条件、阈值公式、返回类型语义。

