# 微压缩流程说明

本文说明 `packages/codeagent/src/services/compact/microCompact.ts` 中的微压缩逻辑：它什么时候开始、会走哪条路径，以及每条路径具体如何压缩。

## 微压缩要解决什么问题

Claude Code 的对话历史里，工具调用结果通常占用大量 token，例如文件读取、grep、glob、shell 输出、文件编辑和写入结果。微压缩不会像完整 `/compact` 那样生成摘要，而是优先处理旧的 `tool_result` 内容，降低后续请求的输入 token 或缓存重写成本。

当前文件里有两条微压缩路径：

1. **时间微压缩**：服务端缓存已经变冷时，直接把本地历史里的旧工具结果内容替换成占位文本。
2. **缓存微压缩**：服务端缓存仍然可用时，通过 API 的 `cache_edits` 删除缓存前缀中的旧工具结果，本地消息不改。

两条路径都只处理可压缩工具：Read、Shell、Grep、Glob、Edit、Write。

## 微压缩什么时候开始

入口函数是 `microcompactMessages(messages, toolUseContext, querySource)`。每次主循环准备发送消息前，会先调用它尝试微压缩。

执行顺序固定为：

1. 清除上一轮的 compact warning suppression 状态。
2. 优先检查时间微压缩。
3. 如果时间微压缩没有触发，再检查缓存微压缩。
4. 如果两者都没有触发，直接返回原始 `messages`。

## 路径一：时间微压缩

时间微压缩由 `evaluateTimeBasedTrigger` 判断是否触发。

触发条件如下：

1. `getTimeBasedMCConfig()` 返回的配置必须启用。
2. `querySource` 必须显式存在，并且属于主线程来源，例如 `repl_main_thread` 或 `repl_main_thread:outputStyle:<style>`。
3. 历史消息中必须存在上一条 assistant 消息。
4. 当前时间距离上一条 assistant 消息的时间差必须大于等于 `config.gapThresholdMinutes`。

这些条件成立时，代码认为服务端 prompt cache 大概率已经过期。既然下一次请求无论如何都要重写缓存前缀，就不再使用 `cache_edits`，而是在请求前直接缩小本地消息体积。

### 时间微压缩过程

触发后，`maybeTimeBasedMicrocompact` 会执行以下步骤：

1. 收集所有可压缩工具的 `tool_use.id`。
2. 根据配置 `keepRecent` 保留最近 N 个可压缩工具结果；代码会把 N 下限设为 1，避免把全部工具结果都清空。
3. 其余旧工具结果进入 `clearSet`。
4. 遍历所有 user 消息，只处理其中的 `tool_result` block。
5. 如果 `tool_result.tool_use_id` 在 `clearSet` 中，就把它的 `content` 替换为固定占位文本：`[Old tool result content cleared]`。
6. 同时用 `calculateToolResultTokens` 估算节省 token 数。
7. 如果没有实际节省 token，就不返回压缩结果。
8. 记录 analytics、中文 token 调试日志和 debug 日志。
9. 抑制本轮 compact warning。
10. 调用 `resetMicrocompactState()` 清理缓存微压缩状态。
11. 如果开启 prompt cache break detection，则调用 `notifyCacheDeletion(querySource)`，说明接下来的 cache read 下降是预期行为。
12. 返回改写后的 `messages`。

时间微压缩会改变本地历史消息内容，但保持消息结构合法：assistant 里的 `tool_use` 还在，user 里的 `tool_result` 也还在，只是旧结果正文变成占位文本。

## 路径二：缓存微压缩

如果时间微压缩未触发，入口函数会尝试缓存微压缩。

缓存微压缩的前置条件如下：

1. `feature('CACHED_MICROCOMPACT')` 为真。
2. `cachedMicrocompact` 模块的配置启用。
3. 当前主循环模型支持 cache editing。
4. 请求来源必须是主线程；这样可以避免子代理、session memory、prompt suggestion 等分支把自己的工具结果注册到全局缓存微压缩状态中。

### 缓存微压缩过程

`cachedMicrocompactPath` 的核心过程如下：

1. 加载缓存微压缩模块并取得模块级 `cachedMCState`。
2. 读取配置，例如触发阈值 `triggerThreshold` 和保留数量 `keepRecent`。
3. 收集当前消息中所有可压缩工具的 `tool_use.id`。
4. 再遍历 user 消息里的 `tool_result`，只登记匹配这些 id、且之前没登记过的工具结果。
5. 按 user message 分组登记工具结果，供后续生成精确的 `cache_edits`。
6. 调用 `getToolResultsToDelete(state)`，根据计数策略判断是否超过阈值、哪些旧工具结果应删除。
7. 如果有可删除工具结果，调用 `createCacheEditsBlock(state, toolsToDelete)` 生成 `cache_edits` block。
8. 把生成的 `cache_edits` 放入 `pendingCacheEdits`，等待 API 层在下一次请求中插入。
9. 记录 analytics 和中文 token 调试日志。
10. 调用 `suppressCompactWarning()`。
11. 如果开启 prompt cache break detection，则调用 `notifyCacheDeletion(querySource)`。
12. 找到上一条 assistant 消息里的累计 `cache_deleted_input_tokens`，作为 baseline。
13. 返回原始 `messages`，并在 `compactionInfo.pendingCacheEdits` 中附带本次删除的工具 id 和 baseline。

缓存微压缩不改本地消息内容。真正的压缩动作发生在 API 请求层：它会把 `pendingCacheEdits` 插入消息流，告诉服务端删除缓存前缀中的旧工具结果。API 返回后，外层会根据 usage 中新的累计 `cache_deleted_input_tokens` 与 baseline 的差值，计算本次真实删除 token 数。

## pending 与 pinned cache edits

文件里有三类与缓存编辑相关的状态函数：

- `consumePendingCacheEdits()`：取出本轮新生成的 `cache_edits`，并清空 pending 状态。
- `pinCacheEdits(userMessageIndex, block)`：API 层插入新 `cache_edits` 后，把它固定到对应 user message 位置。
- `getPinnedCacheEdits()`：后续请求需要继续把已经固定的 `cache_edits` 放回原位置，保证服务端缓存前缀结构稳定。

这样做的原因是：缓存命中依赖消息前缀完全一致。如果某次请求生成了 `cache_edits`，后续请求也必须在相同位置重发它，否则缓存结构会变化，命中率会下降。

## 两条路径的差异

| 对比项 | 时间微压缩 | 缓存微压缩 |
| --- | --- | --- |
| 触发依据 | 距离上一条 assistant 消息超过时间阈值 | 可压缩工具结果数量超过计数阈值 |
| 适用场景 | 服务端缓存大概率已冷却 | 服务端缓存仍可复用 |
| 是否修改本地 messages | 是 | 否 |
| 压缩方式 | 把旧 `tool_result.content` 替换成占位文本 | 生成 `cache_edits`，由 API 层编辑服务端缓存 |
| 是否重置缓存微压缩状态 | 是 | 否 |
| token 节省统计 | 本地粗略估算 | API usage 返回后计算真实删除量 |

## 为什么时间微压缩优先

时间微压缩优先于缓存微压缩，是因为它们假设的缓存状态不同：

- 时间微压缩认为缓存已经过期，下一次请求必须重写前缀，所以直接缩小本地消息更划算。
- 缓存微压缩依赖已有缓存仍然有效，通过 `cache_edits` 在不破坏缓存前缀的情况下删除旧结果。

如果时间条件已经说明缓存是冷的，再尝试 cache editing 就没有意义，甚至可能用旧状态编辑不存在的服务端缓存项。因此时间微压缩触发后会短路返回，并重置缓存微压缩状态。

## 总结

微压缩的主目标是减少工具结果带来的上下文膨胀。它不会主动总结对话，也不会替代完整 autocompact；它只针对可压缩工具结果做轻量清理。

- 长时间空闲后再次请求：走时间微压缩，清空旧工具结果正文。
- 连续对话且缓存仍热：走缓存微压缩，用 `cache_edits` 删除服务端缓存里的旧工具结果。
- 条件不满足：不压缩，原样返回消息。
