# History Snip 机制说明

## 1. 概念

History Snip 是 `HISTORY_SNIP` feature gate 下的一套对话历史瘦身机制，用于在上下文窗口逐渐变满时，移除旧 turn 中体积较大的只读工具输出，从而减少后续 API 请求携带的 token。

它和 compact 的区别是：compact 通常把一段历史压缩成摘要；History Snip 不改写结论，也不总结整段历史，而是保留用户问题和 assistant 的最终文本结论，只删除旧 turn 里的 `Read` / `Grep` / `Glob` 工具调用与结果。

## 2. 设计目标

- 降低模型上下文中的大块文件读取和搜索结果占用。
- 保留对话可读性：用户原始 query 和最终 answer 仍在。
- 避免破坏状态语义：不裁剪 `Edit`、`Write`、`Bash`、`Agent` 等可能有副作用或承载状态变化的工具。
- 兼容 resume：通过 `snip_boundary` 记录被删除的 message UUID，恢复会话时可重放裁剪。

## 3. 可裁剪对象

当前只裁剪无副作用的只读/搜索工具：

- `Read`
- `Grep`
- `Glob`

裁剪时会删除：

- assistant message 中对应的 `tool_use` block。
- user/tool-result message 中对应的 `tool_result` block。
- 如果某条 assistant 或 user message 在删除 block 后没有剩余有效内容，则整条 message 会从模型上下文中移除。

保留内容包括：

- 用户原始 query。
- assistant 最终文本结论。
- 非 snippable 工具调用及其结果。
- 最近受保护的用户 turn。

## 4. 触发方式

### 4.1 模型主动调用 Snip 工具

`src/tools/SnipTool/prompt.ts` 定义 `Snip` 工具提示。模型看到上下文压力提醒后，可以根据用户消息末尾的 `[id:XXXXXX]` 选择要清理的旧 turn。

处理入口在 `src/services/compact/snipCompact.ts` 的 `snipCompactIfNeeded()`：

1. 扫描 assistant messages 中的 `Snip` tool_use。
2. 读取输入里的 short IDs。
3. 把 short ID 映射回用户 query message 的 UUID。
4. 跳过最近受保护的 turn。
5. 对选中的 turn 调用核心裁剪引擎。
6. 生成 `snip_boundary`，记录 `removedUuids`、`tokensFreed`、`snippedCount`。

### 4.2 `/snip` 本地命令

`src/commands/force-snip.ts` 实现 `/snip` 命令。它优先走自动模式：从最旧且符合条件的 turn 开始清理，不需要模型先调用 Snip 工具。

自动选择逻辑在 `autoSnipOldestEligibleTurns()`：

1. 收集所有用户 query message UUID。
2. 保护最近 `TAIL_PROTECT_COUNT` 个用户 turn。
3. 从旧到新扫描包含 `Read` / `Grep` / `Glob` 的 turn。
4. 选择 eligible turns 后应用裁剪。
5. 把 boundary message 写回当前会话。

### 4.3 上下文压力提醒

`shouldNudgeForSnips()` 会从最新消息往前累计估算 token 数。超过 `NUDGE_INTERVAL_TOKENS` 后，会触发 context efficiency 类提醒，引导模型使用 Snip。

默认阈值：

- `CODEAGENT_SNIP_TAIL_PROTECT`：默认 `15`，保护最近 15 个用户 turn。
- `CODEAGENT_SNIP_NUDGE_TOKENS`：默认 `10000`，控制提醒间隔。

## 5. 请求链路中的执行顺序

在 `src/query.ts` 中，每轮 API 请求前会先执行 History Snip：

1. 应用 pending SnipTool 调用。
2. 如果产生 `snip_boundary`，yield 给会话历史。
3. 把 `tokensFreed` 传给 autocompact 的阈值判断。
4. 再继续执行 microcompact / context collapse / autocompact。

这样做的原因是：Snip 释放的 token 不一定能被后续 token 估算直接看见，尤其是被保护尾部仍保留时，所以需要显式把 `snipTokensFreed` 传下去。

## 6. 投影视图与 UI 历史

History Snip 区分两种视角：

- REPL/UI scrollback：可以保留完整历史，方便用户回看。
- API-bound messages：默认过滤掉已 snip 的 messages，减少发送给模型的上下文。

`src/services/compact/snipProjection.ts` 的 `projectSnippedView()` 会读取所有 `snip_boundary.snipMetadata.removedUuids`，并过滤 UUID 命中的 messages。

`src/utils/messages.ts` 的 `getMessagesAfterCompactBoundary()` 在构造模型请求消息时默认调用该投影；只有传入 `includeSnipped: true` 时才保留被裁剪消息。

## 7. Resume 恢复

由于 transcript JSONL 是 append-only，History Snip 不能简单依赖“内存里已经删了”这个事实。恢复会话时，如果不重放裁剪，历史链可能重新包含被 snip 的大块消息。

`src/utils/sessionStorage.ts` 的 `applySnipRemovals()` 负责：

1. 扫描 transcript 中所有带 `snipMetadata.removedUuids` 的 boundary。
2. 删除这些 UUID 对应的 messages。
3. 修复删除后断开的 `parentUuid` 链。

这保证 resume 后模型看到的仍是 snipped view，而不是完整未裁剪历史。

## 8. 关键文件

- `src/services/compact/snipCompact.ts`：核心裁剪规则、自动选择、SnipTool 调用处理、boundary 生成。
- `src/services/compact/snipProjection.ts`：根据 boundary 生成 API-facing snipped view。
- `src/tools/SnipTool/prompt.ts`：暴露给模型的 Snip 工具说明。
- `src/commands/force-snip.ts`：`/snip` 本地命令。
- `src/query.ts`：每轮请求前应用 Snip，并与 microcompact/autocompact 串联。
- `src/utils/messages.ts`：构造模型消息时默认过滤 snipped messages。
- `src/utils/sessionStorage.ts`：resume 时重放裁剪并修复 parent chain。
- `src/utils/attachments.ts`：只在主线程注入 history snip 相关提醒。

## 9. 注意事项

- Snip 只适合清理已完成、结论已沉淀、后续不再直接依赖原始工具输出的旧 turn。
- 最近 turn 默认受保护，避免模型刚读到的信息被过早移除。
- 不能把有副作用的工具加入 snippable 列表，否则可能破坏模型对状态变化的理解。
- 新增裁剪类型时，需要同时考虑 API 投影、resume 重放和 parentUuid 修复。
- `snip_boundary` 是恢复和投影的关键元数据，缺少 `removedUuids` 的旧 boundary 无法可靠重放。
