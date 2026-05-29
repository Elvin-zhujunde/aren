
## 总览

CodeAgent 采用 `while(true)` 驱动的 Agent 循环架构。每次迭代（turn）的流程为：

```
上下文准备 → 调用模型(流式) → 处理响应 → 执行工具(如有) → 收集结果 → 继续循环
```

核心文件：
- `src/query.ts` — 主循环与消息调度
- `src/services/api/agent.ts` — 流式 API 事件处理
- `src/services/tools/toolOrchestration.ts` — 工具编排（并发/串行）
- `src/services/tools/toolExecution.ts` — 单个工具的完整执行流水线

---

## 一、模型返回的消息类型

### 流式事件类型（agent.ts:2092-2409）

| 流式事件 | 内容块类型 | 含义 | 处理方式 |
|---|---|---|---|
| `message_start` | — | 消息开始 | 初始化 `partialMessage`，记录 TTFB 和 token 用量 |
| `content_block_start` | `tool_use` | 工具调用块开始 | 初始化 `input: ''`，后续通过 delta 追加 JSON |
| `content_block_start` | `server_tool_use` | 服务端工具调用 | 服务端直接调用的工具（如 advisor） |
| `content_block_start` | `text` | 文本块开始 | 初始化空文本，后续通过 delta 追加 |
| `content_block_start` | `thinking` | 思考块开始 | 初始化推理过程文本和签名字段 |
| `content_block_delta` | `input_json_delta` | 工具输入增量 | 逐步追加 JSON 参数片段到 `tool_use.input` |
| `content_block_delta` | `text_delta` | 文本增量 | 追加模型的文本输出 |
| `content_block_delta` | `thinking_delta` | 思考增量 | 追加模型的推理过程文本 |
| `content_block_delta` | `signature_delta` | 签名增量 | 追加思考块的验证签名 |
| `content_block_stop` | — | 内容块结束 | 组装为 `AssistantMessage` 并 yield |
| `message_delta` | — | 消息增量 | 设置最终 `stop_reason` 和 `usage` |
| `message_stop` | — | 消息结束 | 流式传输完成 |

### 停止原因（stop_reason）及对应处理

| stop_reason | 含义 | 后续路径 |
|---|---|---|
| `end_turn` | 正常完成，无工具调用 | → 完成路径（stop hooks → token budget → 返回） |
| `tool_use` | 模型请求工具执行 | → 工具执行路径 |
| `max_tokens` | 输出 token 超限 | → 恢复路径（升级到 64k 或注入续接消息） |
| `model_context_window_exceeded` | 上下文窗口溢出 | → 复用 max_output_tokens 恢复路径 |
| `refusal` | 内容策略拒答 | → yield 拒答消息 |

---

## 二、完整链路图

```
用户输入
    │
    ▼
query() → queryLoop()                    [src/query.ts:513-535]
    │
    │  ┌── while(true) 循环每轮迭代 ──────────────────────────┐
    │  │                                                       │
    ▼  ▼                                                       │
上下文准备                                                      │
  ├─ snip（裁剪旧内容）                                         │
  ├─ microcompact（微压缩）                                     │
  └─ autocompact（自动压缩）                                    │
    │                                                       │
    ▼                                                       │
deps.callModel() ──流式API调用──→                           │
    │                                                       │
    ▼                                                       │
流式事件循环                              [agent.ts:2092]    │
    ├─ message_start → 初始化消息                              │
    ├─ content_block_start → 初始化各类内容块                   │
    │   ├─ text（文本）                                        │
    │   ├─ tool_use（工具调用）                                 │
    │   ├─ thinking（推理思考）                                 │
    │   └─ server_tool_use（服务端工具）                        │
    ├─ content_block_delta → 追加增量内容                       │
    │   ├─ text_delta → 文本追加                               │
    │   ├─ input_json_delta → 工具参数JSON追加                  │
    │   ├─ thinking_delta → 思考追加                            │
    │   └─ signature_delta → 签名追加                           │
    ├─ content_block_stop → yield AssistantMessage             │
    ├─ message_delta → 设置 stop_reason + usage                │
    └─ message_stop → 完成                                     │
    │                                                       │
    ▼                                                       │
流式消费者                              [query.ts:1022-1241]  │
    ├─ 收集 assistantMessages[]                                │
    ├─ 提取 toolUseBlocks[] → 设置 needsFollowUp               │
    ├─ 流式工具执行器: addTool() + getCompletedResults()       │
    └─ 暂留可恢复错误 (prompt-too-long, max-output-tokens)     │
    │                                                       │
    ▼                                                       │
后采样钩子                              [query.ts:1580-1589]  │
    └─ executePostSamplingHooks()                             │
    │                                                       │
    ▼                                                       │
┌─── 分支判断: needsFollowUp ? ───┐                          │
│                                │                          │
│ false (无工具调用)              │ true (有工具调用)         │
▼                                ▼                          │
完成/错误恢复路径              工具执行路径                    │
│                              │                            │
├─ 上下文溢出恢复              ├─ 工具编排                    │
│  ├─ 折叠排空                 │  [toolOrchestration.ts]     │
│  │  (collapse drain)         │  ├─ 分区:                   │
│  └─ 响应式压缩               │  │  ├─ 并发安全批 → 并行执行│
│     (reactive compact)       │  │  └─ 串行批 → 顺序执行   │
│                              │  └─ 每个工具:               │
├─ 输出token超限恢复            │     [toolExecution.ts]     │
│  ├─ 升级到64k重试             │     ├─ Zod输入验证          │
│  └─ 注入续接消息              │     ├─ 自定义输入验证       │
│                              │     ├─ PreToolUse钩子       │
├─ API错误 → 返回               │     ├─ 权限检查            │
│                              │     │  ├─ allow → 执行     │
├─ Stop Hooks                  │     │  ├─ deny → 返回错误  │
│  ├─ 阻止性错误 → continue     │     │  └─ ask → 用户交互  │
│  └─ 阻止继续 → 返回           │     ├─ tool.call() 执行    │
│                              │     ├─ 结果映射             │
├─ Token Budget检查             │     ├─ PostToolUse钩子      │
│  ├─ 继续 → 注入nudge          │     └─ 返回tool_result     │
│  └─ 通过 → 返回completed      │                            │
│                              ▼                            │
│                         工具结果后处理                       │
│                         [query.ts:2030-2441]               │
│                         ├─ 目标(Goal)追踪                   │
│                         ├─ 工具摘要生成（异步）              │
│                         ├─ 中止/延迟/钩子停止检查            │
│                         ├─ 附件收集                         │
│                         │  ├─ 排队命令                      │
│                         │  ├─ 内存预取                      │
│                         │  └─ 技能发现预取                   │
│                         ├─ 工具刷新(MCP)                    │
│                         ├─ 最大轮次检查                      │
│                         └─ 构建下一轮state → continue ─────┘
│
▼
返回 { reason: 'completed' }
```

---

## 三、关键路径详解

### 3.1 流式响应处理（agent.ts）

模型调用通过 Anthropic SDK 的流式 API 返回事件流。核心处理逻辑在 `queryModel()` 内的流式循环中：

1. **`message_start`**：记录首字节时间（TTFB），初始化消息对象和用量统计
2. **`content_block_start`**：根据内容块类型初始化数据结构
   - `tool_use`：`input` 初始化为空字符串，后续通过 `input_json_delta` 逐步追加
   - `text`：`text` 初始化为空字符串
   - `thinking`：`thinking` + `signature` 初始化为空
3. **`content_block_delta`**：逐步追加内容到对应的内容块
4. **`content_block_stop`**：一个完整内容块接收完毕，组装为 `AssistantMessage` 并 yield
5. **`message_delta`**：设置最终的 `stop_reason` 和 `usage`，通过直接属性修改回写到已 yield 的消息对象上（保持引用一致性，确保转录写队列能捕获最终值）

### 3.2 主循环消息调度（query.ts）

`queryLoop()` 是一个 `while(true)` 循环，每轮迭代：

**阶段A - 流式消费**（L1022-1241）：
- 逐个接收 `AssistantMessage`
- 收集到 `assistantMessages[]` 和 `toolUseBlocks[]`
- 如果启用了流式工具执行器，在流式传输期间就开始执行工具（`addTool()` + `getCompletedResults()`）
- 暂留可恢复错误（prompt-too-long、max-output-tokens、媒体大小错误）

**阶段B - 后采样钩子**（L1580-1589）：
- `executePostSamplingHooks()` 每轮触发一次

**阶段C - 分支判断**：
- `needsFollowUp = false` → 完成/错误恢复路径
- `needsFollowUp = true` → 工具执行路径

**阶段D - 错误恢复**（无工具调用时）：
1. **上下文溢出**：先尝试折叠排空（collapse drain），再尝试响应式压缩（reactive compact）
2. **输出 token 超限**：先从默认上限升级到 64k 重试，再注入续接消息让模型从中断处继续
3. **API 错误**：执行 stop-failure hooks 后返回
4. **Stop hooks**：可产生阻止性错误导致循环继续
5. **Token budget**：检查是否超出 token 预算

**阶段E - 工具执行**（有工具调用时）：
1. 通过 `runTools()` 或 `streamingToolExecutor.getRemainingResults()` 获取工具结果
2. 逐个 yield 工具结果消息，检测 hook 停止/延迟信号
3. 目标追踪（update_goal 完成回调）
4. 异步生成工具摘要
5. 收集附件（排队命令、内存预取、技能发现）
6. 构建下一轮 state → `continue` 回到循环顶部

### 3.3 工具编排（toolOrchestration.ts）

`runTools()` 将工具调用分为两类批次：

1. **并发安全批**（`isConcurrencySafe = true`）：只读工具，可并行执行
   - 使用 `all()` 控制并发度（最大 `MAX_TOOL_USE_CONCURRENCY`，默认10）
   - 上下文修改器在批次完成后统一应用

2. **串行批**（`isConcurrencySafe = false`）：可能修改共享状态的工具，顺序执行
   - 每个工具执行后立即应用上下文修改

分区算法（`partitionToolCalls`）：连续的并发安全工具合并为一个批次，非并发安全工具各自成批。

### 3.4 单工具执行流水线（toolExecution.ts）

`checkPermissionsAndCallTool()` 是单个工具的完整执行流水线：

```
Zod输入验证 → 自定义验证 → PreToolUse钩子 → 权限检查 → tool.call() → 结果映射 → PostToolUse钩子
```

1. **Zod 输入验证**（L680-745）：模型生成的输入不一定符合 schema，验证失败返回 `InputValidationError`
2. **自定义验证**（L748-798）：工具可定义 `validateInput()` 进行业务逻辑验证
3. **PreToolUse 钩子**（L865-976）：
   - `message`：yield 附件消息
   - `hookPermissionResult`：钩子提供权限决策
   - `hookUpdatedInput`：钩子修改工具输入
   - `preventContinuation`：阻止循环继续
   - `defer`：延迟工具执行（仅非交互模式）
   - `stop`：停止工具执行
4. **权限检查**（L1057-1268）：
   - `allow`：继续执行
   - `deny`：返回错误 `tool_result`
   - `ask`：弹出用户交互对话框
5. **工具执行**（L1380-1396）：`tool.call(input, context, ...)`
6. **结果映射**（L1480-1483）：`tool.mapToolResultToToolResultBlockParam()` 将结果转为 API 格式
7. **PostToolUse 钩子**（L1688-1736）：可修改 MCP 输出、yield 附件消息

---

## 四、错误处理链路

### 重试层（withRetry.ts）

| 错误类型 | 处理方式 |
|---|---|
| 429 限速 | 快速模式冷却或标准重试 |
| 529 过载 | 重试最多3次，然后降级 |
| 401 认证失败 | 刷新 OAuth token 后重试 |
| 400 上下文溢出 | 调整 max_tokens 后重试 |
| 模型切换 | 抛出 `ModelSwitchRequestedError`，由 query.ts 捕获处理 |

### 错误转助手消息（errors.ts）

`getAssistantMessageFromError()` 将 API 错误转换为合成的 `AssistantMessage`，使错误能像正常响应一样进入处理流水线。

---

## 五、注释位置索引

| 文件 | 行号范围 | 注释内容 |
|---|---|---|
| `src/services/api/agent.ts` | ~2092 | 流式响应事件分发 |
| `src/services/api/agent.ts` | ~2094 | 消息开始事件 |
| `src/services/api/agent.ts` | ~2108 | 内容块开始事件 |
| `src/services/api/agent.ts` | ~2110 | 工具调用块 |
| `src/services/api/agent.ts` | ~2116 | 服务端工具调用块 |
| `src/services/api/agent.ts` | ~2132 | 文本块 |
| `src/services/api/agent.ts` | ~2143 | 思考块 |
| `src/services/api/agent.ts` | ~2166 | 内容块增量事件 |
| `src/services/api/agent.ts` | ~2200 | 工具输入JSON增量 |
| `src/services/api/agent.ts` | ~2226 | 文本增量 |
| `src/services/api/agent.ts` | ~2261 | 思考增量 |
| `src/services/api/agent.ts` | ~2284 | 内容块结束事件 |
| `src/services/api/agent.ts` | ~2326 | 消息增量事件 + stop_reason |
| `src/services/api/agent.ts` | ~2371 | 内容拒答 |
| `src/services/api/agent.ts` | ~2379 | 输出token超限 |
| `src/services/api/agent.ts` | ~2392 | 上下文窗口超限 |
| `src/services/api/agent.ts` | ~2408 | 消息结束事件 |
| `src/query.ts` | ~513 | 查询入口 |
| `src/query.ts` | ~535 | 核心查询循环 |
| `src/query.ts` | ~1022 | 流式调用模型 |
| `src/query.ts` | ~1089 | 流式降级处理 |
| `src/query.ts` | ~1176 | 可恢复错误暂留 |
| `src/query.ts` | ~1203 | 收集助手消息和工具调用块 |
| `src/query.ts` | ~1214 | 流式工具执行器 |
| `src/query.ts` | ~1228 | 收集流式工具结果 |
| `src/query.ts` | ~1580 | 后采样钩子 |
| `src/query.ts` | ~1595 | 流式中止处理 |
| `src/query.ts` | ~1648 | 无工具调用路径 |
| `src/query.ts` | ~1671 | 上下文溢出恢复 - 折叠排空 |
| `src/query.ts` | ~1705 | 上下文溢出恢复 - 响应式压缩 |
| `src/query.ts` | ~1779 | 输出token超限恢复 |
| `src/query.ts` | ~1859 | 停止钩子 |
| `src/query.ts` | ~1954 | 工具执行路径 |
| `src/query.ts` | ~1992 | 工具编排入口 |
| `src/query.ts` | ~1997 | 逐个处理工具执行结果 |
| `src/query.ts` | ~2076 | 工具使用摘要生成 |
| `src/query.ts` | ~2285 | 附件收集 |
| `src/query.ts` | ~2417 | 最大轮次检查 |
| `src/query.ts` | ~2429 | 下一轮状态构建 |
| `src/services/tools/toolOrchestration.ts` | ~8 | 工具并发配置 |
| `src/services/tools/toolOrchestration.ts` | ~26 | 工具编排主函数 |
| `src/services/tools/toolOrchestration.ts` | ~37 | 并发安全批 |
| `src/services/tools/toolOrchestration.ts` | ~71 | 串行批 |
| `src/services/tools/toolOrchestration.ts` | ~93 | 工具调用分区 |
| `src/services/tools/toolExecution.ts` | ~381 | 单个工具执行入口 |
| `src/services/tools/toolExecution.ts` | ~425 | 工具未找到 |
| `src/services/tools/toolExecution.ts` | ~480 | 工具执行被中止 |
| `src/services/tools/toolExecution.ts` | ~520 | 权限检查与工具调用 |
| `src/services/tools/toolExecution.ts` | ~534 | 工具执行异常 |
| `src/services/tools/toolExecution.ts` | ~664 | 权限检查与工具调用核心函数 |
| `src/services/tools/toolExecution.ts` | ~680 | Zod输入验证 |
| `src/services/tools/toolExecution.ts` | ~748 | 自定义输入验证 |
| `src/services/tools/toolExecution.ts` | ~865 | 前置工具钩子 |
| `src/services/tools/toolExecution.ts` | ~1057 | 权限检查 |
| `src/services/tools/toolExecution.ts` | ~1146 | 权限拒绝路径 |
| `src/services/tools/toolExecution.ts` | ~1380 | 工具执行 |
| `src/services/tools/toolExecution.ts` | ~1608 | 添加工具结果 |
| `src/services/tools/toolExecution.ts` | ~1688 | 后置工具钩子 |
| `src/services/tools/toolExecution.ts` | ~1777 | 钩子阻止继续 |
