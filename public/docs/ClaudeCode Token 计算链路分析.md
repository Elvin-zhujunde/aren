# ClaudeCode Token 计算链路分析

## 1. 结论摘要

ClaudeCode 的主要 token 数据来自模型接口返回的 `usage` 字段，而不是完全依赖本地计算。本地 token 估算主要用于两个场景：接口 usage 不存在时的兜底估算，以及最后一次 API 响应之后又追加了 tool_result、attachment 等消息时，对新增消息进行粗略估算。

`/status` 命令本身不展示 token 用量。它打开 Settings 的 Status 标签页，展示版本、账号、模型、API provider、IDE、MCP、Sandbox 和系统诊断。与 token 相关的界面主要在 footer verbose 文本、statusline hook 输入、spinner token budget 文本、TokenWarning 上下文告警和成本统计中。

## 2. `/status`、`/usage`、footer 和 statusline 的区别

`src/commands/status/status.tsx` 中的 `/status` 只渲染 `<Settings defaultTab="Status" />`。Status 页实现位于 `src/components/Settings/Status.tsx`，它调用 `buildPrimarySection()` 和 `buildSecondarySection()` 生成状态属性，不读取 token usage。

Settings 中的 Usage 页位于 `src/components/Settings/Usage.tsx`，它通过 `fetchUtilization()` 获取账号或订阅周期额度，例如当前 5 小时窗口、当前周用量。这是服务端账号额度利用率，不等同于本轮对话的 prompt/output token。

footer verbose 模式位于 `src/components/PromptInput/Notifications.tsx`。它对 compact boundary 之后的 messages 调用 `tokenCountFromLastAPIResponse()`，显示最近一次 API 响应对应的 token 总量。

statusline 位于 `src/components/StatusLine.tsx`。它调用 `getCurrentUsage(messages)` 取最近一次 API usage，再通过 `calculateContextPercentages()` 计算当前上下文窗口 used/remaining 百分比，并把这些数据写入 `context_window` hook payload。

## 3. API usage 如何进入消息

流式 API 响应处理位于 `src/services/api/claude.ts`。当收到 `message_delta` 事件时，代码调用 `updateUsage(usage, part.usage)` 合并 usage。Anthropic streaming API 的 usage 是累计值，不是增量值，所以 `updateUsage()` 会保留 input/cache 字段中已经出现过的非零值，并更新 output_tokens。

随后代码会找到最后一个已经 yield 的 assistant message，并直接修改 `lastMsg.message.usage = usage`。这里使用直接属性修改是为了让 transcript 写入队列持有的对象引用能拿到最终 usage。

## 4. token 工具函数

`src/utils/tokens.ts` 是 token 统计核心工具文件。

- `getTokenUsage(message)`：从真实 assistant message 中读取 API 返回的 usage，并过滤 synthetic message 和 synthetic model。
- `getTokenCountFromUsage(usage)`：计算 `input_tokens + cache_creation_input_tokens + cache_read_input_tokens + output_tokens`。
- `tokenCountFromLastAPIResponse(messages)`：从后往前找到最近一次带 usage 的 assistant message，返回总 token。
- `getCurrentUsage(messages)`：返回最近一次 usage 的 input/output/cache 拆分，供 statusline 使用。
- `finalContextTokensFromLastResponse(messages)`：用于 task_budget 剩余额度计算，优先读取 `usage.iterations[-1]` 的最终上下文窗口，并按设计排除 cache token。
- `tokenCountWithEstimation(messages)`：当前上下文大小的 canonical 估算函数。它用最近一次 API usage 作为锚点，再把锚点之后的新消息通过本地粗估补上。

## 5. 本地估算边界

本地估算位于 `src/services/tokenEstimation.ts`。

`roughTokenCountEstimation(content)` 使用 `content.length / 4` 的近似规则。JSON/JSONL/JSONC 文件会用更激进的 bytes-per-token 比例。图片和 document block 会按固定 2000 token 保守估算，避免 base64 内容导致严重高估或低估。

`countMessagesTokensWithAPI()` 是另一条接口计数路径，它调用 Anthropic `messages.countTokens` 或 Bedrock CountTokens。它用于需要精确计算 messages/tools 输入 token 的场景，但普通对话 UI 展示主要依赖真实 API 响应上的 `usage`。

## 6. 每轮上传/下载 token 是否实时显示

当前代码没有完整实时显示每轮上传 token 和下载 token 的分项表。

下载/output token 有两个近实时来源：spinner token budget 使用 `getTurnOutputTokens()`，它等于当前累计 output token 减去本轮开始时的 output token 快照；另一个 spinner tree leader token 使用 `responseLength / 4` 粗估流式输出长度。

上传/input/cache token 通常需要等接口返回 usage 后才能准确知道。statusline 和 footer 都是读取已经写回 assistant message 的 usage，因此更接近“响应完成后更新”，不是每个流式 chunk 都实时显示 input/cache 分项。

## 7. 累计成本和累计 token

`src/cost-tracker.ts` 中的 `addToTotalSessionCost()` 会把每次 API usage 写入全局模型用量。`addToTotalModelUsage()` 累加 inputTokens、outputTokens、cacheReadInputTokens、cacheCreationInputTokens、webSearchRequests 和 costUSD。

这些累计值存储在 bootstrap state 中。`getTotalInputTokens()`、`getTotalOutputTokens()`、`getTotalCacheReadInputTokens()`、`getTotalCacheCreationInputTokens()` 会从所有模型用量中汇总。statusline 的 `context_window.total_input_tokens` 和 `total_output_tokens` 使用这些累计值。

## 8. 中文日志断点

本次插桩会写入项目根目录的 `openai_requests.log`。日志格式为：ISO 时间 + 中文描述 + pretty JSON 数据。

日志断点包括：

1. `updateUsage()`：记录流式 API usage 合并前、delta、合并后的摘要。
2. `getTokenUsage()`：记录从 assistant message 中读到的 API usage。
3. `getTokenCountFromUsage()`：记录 API usage 到 total token 的计算。
4. `tokenCountWithEstimation()`：记录 API usage 加本地估算的上下文 token 计算。
5. `buildStatusLineCommandInput()`：记录 statusline 输出的 context window token payload。
6. `Notifications` footer：记录 verbose footer 显示 token 的来源。
7. `addToTotalSessionCost()`：记录每次 API usage 如何进入累计成本和累计 token。

日志不会写入完整 messages、用户 prompt、工具结果正文或附件内容，只写 token 数值、模型名、message 数量和百分比等调试信息。

## 9. 验证方式

运行：

```bash
bun test tests/unit/utils/tokenDebugLogger.test.ts
```

然后启动一次开发 CLI，发送一轮请求后检查项目根目录：

```bash
ls -l openai_requests.log
```

查看日志中是否出现中文断点，例如：

- `断点：流式API message_delta合并usage`
- `断点：从assistant消息中读取API返回的usage`
- `断点：footer verbose模式读取最近API响应token`
- `断点：statusline构建context_window token数据`
- `断点：累计会话成本和模型token用量`
