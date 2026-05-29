# ClaudeCode 压缩机制用户小册

本文说明 ClaudeCode 的“压缩”机制：什么时候开始压缩、压缩分哪些情况，以及压缩相关的关键指标参数。这里的压缩指的是对会话上下文进行整理、摘要或清理，以降低输入 token 占用，避免上下文窗口耗尽；它不是对项目文件做压缩。

## 1. 压缩解决什么问题

在长会话中，模型需要携带历史消息、工具调用结果、文件读取内容、图片/文档等上下文。随着会话增长，输入 token 会接近模型上下文窗口上限。压缩机制会在合适时机把旧上下文转换为摘要，或清理旧工具结果，从而给后续对话留出空间。

压缩后的目标是：

- 保留任务目标、重要结论、关键文件和必要的最近上下文。
- 删除或摘要旧的、低价值的大段工具输出。
- 尽量不破坏工具调用配对关系，例如 `tool_use` 与 `tool_result`。
- 避免 `prompt_too_long`、媒体体积过大等上下文错误。

## 2. 压缩什么时候开始

### 2.1 手动压缩：用户主动执行 `/compact`

用户执行 `/compact` 时会立即尝试压缩，不需要等到 token 接近阈值。

手动压缩的处理顺序：

1. 如果没有自定义压缩指令，优先尝试 Session Memory 压缩。
2. 如果处于 reactive-only 模式，则走 Reactive 压缩路径。
3. 否则先执行 microcompact，再执行传统摘要压缩。

手动压缩适合以下场景：

- 会话已经很长，但还没触发自动压缩。
- 即将切换任务，希望先整理上下文。
- 用户希望通过 `/compact <自定义指令>` 指定摘要重点。

注意：Session Memory 压缩不支持自定义压缩指令；带自定义指令时会走传统摘要压缩。

### 2.2 自动压缩：token 达到自动压缩阈值

自动压缩由系统在会话过程中判断。当估算的当前上下文 token 数达到自动压缩阈值时触发。

核心判断公式：

```text
effectiveContextWindow = modelContextWindow - reservedTokensForSummary

autoCompactThreshold =
  如果配置了 AUTOCOMPACT_PCT：floor(effectiveContextWindow × AUTOCOMPACT_PCT / 100)
  否则：effectiveContextWindow - 13,000
```

其中：

- `modelContextWindow`：当前模型的上下文窗口大小。
- `reservedTokensForSummary`：为压缩摘要输出预留的 token，默认最多 `20,000`。
- `13,000`：默认自动压缩缓冲区，避免压缩请求本身超限。

自动压缩触发时，系统会先尝试 Session Memory 压缩；如果不满足条件或压缩后仍超过阈值，再回退到传统摘要压缩。

自动压缩不会在以下情况下触发：

- 全局禁用了压缩。
- 单独禁用了自动压缩。
- 用户配置关闭了 `autoCompactEnabled`。
- 当前请求来源是 `session_memory` 或 `compact`，避免递归压缩。
- reactive-only 模式开启时，主动自动压缩被抑制。
- Context Collapse 模式开启时，主动自动压缩被抑制，由 Context Collapse 负责上下文管理。

### 2.3 被动压缩：发生上下文错误后恢复

当 API 返回 `prompt_too_long` 或媒体体积错误时，系统会尝试 Reactive 压缩来恢复本轮请求。

Reactive 压缩特点：

- 每一轮最多尝试一次，避免无限重试。
- `prompt_too_long` 场景通过摘要降低 token 数。
- 媒体错误场景会通过压缩路径剥离可清理的图片内容。
- 如果压缩仍无法恢复，会把原始错误返回给用户。

### 2.4 微压缩：请求前清理旧工具结果

Microcompact 是轻量级压缩，不一定生成摘要，主要清理旧工具结果或通过缓存编辑减少上下文压力。

它通常发生在正式请求或传统压缩之前，用于先降低上下文负担。

## 3. 压缩分哪些情况

| 类型 | 触发方式 | 主要作用 | 是否生成摘要 | 适用场景 |
| --- | --- | --- | --- | --- |
| 手动压缩 | 用户执行 `/compact` | 用户主动整理会话 | 通常会 | 长会话整理、切换任务前 |
| 自动压缩 | token 达到阈值 | 防止上下文窗口耗尽 | 通常会 | 会话持续增长时 |
| Reactive 压缩 | `prompt_too_long` 或媒体错误后 | 错误恢复 | 通常会 | 请求已经超限时 |
| Session Memory 压缩 | 自动/手动压缩优先尝试 | 用已提取的会话记忆替代旧上下文 | 使用 session memory 作为摘要 | 已启用 Session Memory 且内容可用时 |
| 传统摘要压缩 | 自动/手动/Reactive 回退路径 | 用模型生成压缩摘要 | 会 | 通用兜底路径 |
| Time-based Microcompact | 长时间空闲后 | 清理旧工具结果，减少冷缓存重写成本 | 不生成摘要 | 距离上次主线程 assistant 消息超过阈值时 |
| Cached Microcompact | 工具结果数量达到阈值 | 通过缓存编辑删除旧工具结果 | 不生成摘要 | 主线程、支持模型、缓存编辑可用时 |
| API Context Management | API 原生上下文管理配置 | 清理 tool use / thinking | 不生成摘要 | 特定 API 管理策略开启时 |

## 4. 关键指标参数

### 4.1 上下文窗口与摘要预留

| 指标 | 默认值/计算方式 | 说明 |
| --- | --- | --- |
| `modelContextWindow` | 由当前模型决定 | 模型可接受的上下文窗口大小。 |
| `MAX_OUTPUT_TOKENS_FOR_SUMMARY` | `20,000` | 压缩摘要输出的最大预留 token。 |
| `reservedTokensForSummary` | `min(modelMaxOutputTokens, 20,000)` | 实际预留给摘要输出的 token。 |
| `effectiveContextWindow` | `modelContextWindow - reservedTokensForSummary` | 自动压缩判断使用的有效上下文窗口。 |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | 可选环境变量 | 设置后会限制自动压缩使用的上下文窗口上限。 |

### 4.2 自动压缩阈值

| 指标 | 默认值/计算方式 | 说明 |
| --- | --- | --- |
| `AUTOCOMPACT_BUFFER_TOKENS` | `13,000` | 未配置百分比时，自动压缩阈值距离有效窗口尾部的缓冲量。 |
| `ARGS_AUTOCOMPACT_PCT` | 可选，`0 < pct <= 100` | 编译期百分比阈值，例如 `65` 表示在有效窗口 65% 处触发。 |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 可选，`0 < pct <= 100` | 测试用覆盖值，只能让压缩更早触发，取更小阈值。 |
| `autoCompactThreshold` | 见下方公式 | 自动压缩真正使用的 token 阈值。 |

自动压缩阈值公式：

```text
如果 ARGS_AUTOCOMPACT_PCT 有效：
  autoCompactThreshold = floor(effectiveContextWindow × ARGS_AUTOCOMPACT_PCT / 100)
否则：
  autoCompactThreshold = effectiveContextWindow - 13,000

如果 CLAUDE_AUTOCOMPACT_PCT_OVERRIDE 有效：
  autoCompactThreshold = min(autoCompactThreshold, floor(effectiveContextWindow × override / 100))
```

示例：假设某模型上下文窗口为 `200,000`，摘要预留为 `20,000`，则：

```text
effectiveContextWindow = 180,000
默认自动压缩阈值 = 180,000 - 13,000 = 167,000
如果 AUTOCOMPACT_PCT = 65，则阈值 = floor(180,000 × 65%) = 117,000
```

### 4.3 告警、错误与阻塞阈值

| 指标 | 默认值/计算方式 | 说明 |
| --- | --- | --- |
| `percentLeft` | `round((threshold - tokenUsage) / threshold × 100)`，最低为 `0` | 展示距离压缩阈值还剩多少百分比。 |
| `WARNING_THRESHOLD_BUFFER_TOKENS` | `20,000` | 距离阈值 20k token 时进入 warning 状态。 |
| `ERROR_THRESHOLD_BUFFER_TOKENS` | `20,000` | 距离阈值 20k token 时进入 error 状态。当前实现与 warning 使用同一缓冲值。 |
| `MANUAL_COMPACT_BUFFER_TOKENS` | `3,000` | 距离有效上下文窗口 3k token 时达到阻塞限制。 |
| `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE` | 可选环境变量 | 测试用阻塞阈值覆盖。 |

阻塞限制默认计算：

```text
blockingLimit = effectiveContextWindow - 3,000
isAtBlockingLimit = tokenUsage >= blockingLimit
```

### 4.4 自动压缩失败熔断

| 指标 | 默认值 | 说明 |
| --- | --- | --- |
| `MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES` | `3` | 自动压缩连续失败 3 次后，本会话后续会跳过自动压缩尝试。 |
| `consecutiveFailures` | 成功后重置为 `0` | 用于记录连续失败次数，避免反复请求必然失败的压缩。 |

## 5. Session Memory 压缩指标

Session Memory 压缩是一种优先路径：当它可用时，系统会用已提取的会话记忆作为摘要，并保留一段最近消息。

启用条件：

- `ENABLE_CLAUDE_CODE_SM_COMPACT` 为真时强制启用。
- `DISABLE_CLAUDE_CODE_SM_COMPACT` 为真时强制禁用。
- 否则依赖远程开关：`tengu_session_memory` 与 `tengu_sm_compact` 都开启。
- 必须存在非空 Session Memory 内容。

保留最近上下文的默认指标：

| 指标 | 默认值 | 说明 |
| --- | --- | --- |
| `minTokens` | `10,000` | 压缩后至少保留的最近上下文 token。 |
| `minTextBlockMessages` | `5` | 压缩后至少保留含文本块的消息数量。 |
| `maxTokens` | `40,000` | 压缩后保留最近上下文的硬上限。 |

保留规则：

1. 从已总结消息之后开始保留。
2. 向前扩展，直到满足 `minTokens` 与 `minTextBlockMessages`。
3. 达到 `maxTokens` 后停止扩展。
4. 自动调整边界，避免拆开 `tool_use` / `tool_result` 配对。
5. 自动保留同一 assistant message id 下的 thinking 片段，避免归一化后丢失。
6. 如果用于自动压缩时，压缩后 token 仍大于等于 `autoCompactThreshold`，则放弃 Session Memory 压缩并回退。

## 6. Microcompact 指标

Microcompact 是轻量级上下文清理，重点处理工具结果，而不是生成自然语言摘要。

### 6.1 可清理的工具结果

默认可参与 microcompact 的工具包括：

- 文件读取工具。
- Shell/Bash 类工具。
- Grep 搜索工具。
- Glob 文件匹配工具。
- 文件编辑工具。
- 文件写入工具。

图片或文档块在 token 估算中按约 `2,000` token 计入；粗略消息 token 估算会乘以 `4/3` 作为保守 padding。

### 6.2 Time-based Microcompact

| 指标 | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `false` | 默认关闭，依赖远程配置开启。 |
| `gapThresholdMinutes` | `60` | 距离上次主线程 assistant 消息超过 60 分钟时触发。 |
| `keepRecent` | `5` | 保留最近 5 个可压缩工具结果。 |

触发逻辑：

- 只作用于主线程。
- 在 API 请求前运行。
- 当间隔超过阈值时，认为服务端 prompt cache 大概率已经过期，因此先清理旧工具结果，减少冷缓存重写成本。
- 一旦 time-based microcompact 触发，本轮会跳过 cached microcompact。

### 6.3 Cached Microcompact

| 指标 | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `false` | 默认关闭。 |
| `triggerThreshold` | `12` | 可压缩工具结果达到 12 个后触发。 |
| `keepRecent` | `3` | 保留最近 3 个工具结果。 |
| `supportedModels` | `claude-opus-4-6`, `claude-sonnet-4-6` | 默认支持模型列表。 |
| `systemPromptSuggestSummaries` | `false` | 是否通过系统提示建议摘要。 |

Cached Microcompact 的特点：

- 只在主线程运行，避免子 agent 的工具结果污染主线程状态。
- 不直接修改本地消息内容。
- 通过 cache edits 在 API 层删除旧工具结果，以尽量保持缓存命中。
- 触发后会记录删除工具数量、当前活跃工具数量、阈值与保留数量等事件指标。

## 7. API Context Management 指标

部分场景会使用 API 原生上下文管理策略。

| 指标 | 默认值/配置 | 说明 |
| --- | --- | --- |
| `DEFAULT_MAX_INPUT_TOKENS` | `180,000` | API 原生清理触发 token 阈值。 |
| `DEFAULT_TARGET_INPUT_TOKENS` | `40,000` | 清理后希望保留的目标输入 token。 |
| `API_MAX_INPUT_TOKENS` | 可选环境变量 | 覆盖触发阈值。 |
| `API_TARGET_INPUT_TOKENS` | 可选环境变量 | 覆盖保留目标。 |
| `USE_API_CLEAR_TOOL_RESULTS` | 可选环境变量 | 启用 API 清理工具结果策略。 |
| `USE_API_CLEAR_TOOL_USES` | 可选环境变量 | 启用 API 清理工具调用策略。 |
| `clear_at_least` | `triggerThreshold - keepTarget` | 默认等于 `180,000 - 40,000 = 140,000` token。 |

Thinking 清理策略：

- 如果存在 thinking 且未启用 redacted thinking，会加入 `clear_thinking_20251015` 策略。
- 默认保留全部 thinking。
- 当 `clearAllThinking` 开启时，只保留最近 1 个 thinking turn。

## 8. 用户能感知到什么

用户通常会看到以下现象：

- 上下文接近阈值时，界面可能显示剩余上下文百分比或压缩提示。
- 自动压缩触发时，系统会短暂进入 compacting 状态。
- 手动 `/compact` 成功后，会返回压缩后的会话状态和摘要显示。
- Reactive 压缩成功时，本轮请求会自动重试；失败时会显示 `prompt_too_long` 或媒体错误。
- 压缩成功后，后续对话会基于摘要与保留的最近上下文继续。

## 9. 常见问题

### Q1：压缩会丢失所有历史吗？

不会。压缩会尽量保留重要摘要、最近上下文、任务状态与必要工具关系。但非常旧的大段工具输出、重复内容或图片内容可能被摘要或清理。

### Q2：什么时候应该手动 `/compact`？

建议在以下时机手动压缩：

- 一个阶段性任务完成后。
- 准备切换到另一个大任务前。
- 会话包含大量文件读取或命令输出后。
- 用户希望指定摘要重点时，例如 `/compact 保留数据库迁移相关决策`。

### Q3：为什么有时候自动压缩没有发生？

可能原因包括：

- 自动压缩被配置关闭。
- 当前 token 还没达到阈值。
- reactive-only 或 Context Collapse 模式接管了上下文管理。
- 当前请求来源是压缩或 session memory，为避免递归而跳过。
- 自动压缩已连续失败 3 次并触发熔断。

### Q4：为什么 Session Memory 压缩没有被使用？

可能原因包括：

- Session Memory 压缩开关未启用。
- Session Memory 文件不存在或内容为空模板。
- 找不到已总结消息边界。
- 压缩后 token 仍超过自动压缩阈值。
- 用户传入了自定义 `/compact` 指令。

## 10. 快速参考

| 场景 | 开始条件 | 关键参数 |
| --- | --- | --- |
| 自动压缩 | `tokenUsage >= autoCompactThreshold` | `20,000` 摘要预留、`13,000` 自动缓冲、可选百分比阈值 |
| 手动压缩 | 用户执行 `/compact` | 无需达到阈值，可带自定义指令 |
| 阻塞限制 | `tokenUsage >= effectiveContextWindow - 3,000` | `MANUAL_COMPACT_BUFFER_TOKENS = 3,000` |
| Warning/Error | `tokenUsage >= threshold - 20,000` | warning 与 error 当前同为 `20,000` buffer |
| 自动压缩熔断 | 连续失败 3 次 | `MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3` |
| Session Memory 保留 | 压缩后保留最近上下文 | `minTokens=10,000`、`minTextBlockMessages=5`、`maxTokens=40,000` |
| Time-based Microcompact | 主线程空闲超过 60 分钟 | `gapThresholdMinutes=60`、`keepRecent=5` |
| Cached Microcompact | 工具结果数量达到 12 | `triggerThreshold=12`、`keepRecent=3` |
| API Context Management | 输入达到 API 阈值 | `180,000` 触发、目标保留 `40,000` |

## 11. 实现位置

主要实现文件：

- `packages/codeagent/src/services/compact/autoCompact.ts`：自动压缩阈值、告警状态、熔断逻辑。
- `packages/codeagent/src/commands/compact/compact.ts`：`/compact` 手动压缩入口。
- `packages/codeagent/src/services/compact/reactiveCompact.ts`：Reactive 压缩与错误恢复。
- `packages/codeagent/src/services/compact/sessionMemoryCompact.ts`：Session Memory 压缩与保留策略。
- `packages/codeagent/src/services/compact/microCompact.ts`：Microcompact 主逻辑。
- `packages/codeagent/src/services/compact/timeBasedMCConfig.ts`：Time-based Microcompact 配置。
- `packages/codeagent/src/services/compact/cachedMCConfig.ts`：Cached Microcompact 配置。
- `packages/codeagent/src/services/compact/apiMicrocompact.ts`：API 原生上下文管理策略。
