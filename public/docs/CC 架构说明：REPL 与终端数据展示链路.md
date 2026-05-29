# ClaudeCode 架构说明：REPL 与终端数据展示链路

## 结论

这个项目**不是传统意义上的前后端分离项目**。

它更像是一个基于 **Bun + TypeScript + React + Ink** 的终端 CLI 应用：

- “前端”是终端里的 React/Ink UI。
- “后端”不是项目内独立启动的 HTTP 服务，而是同一个 CLI 进程里的请求处理、上下文处理、工具调用和 API 适配逻辑。
- 真正的数据来源通常是外部模型接口，例如 Anthropic API 或企业模式下的 OpenAI 兼容接口。

可以把 `REPL` 理解为：

> 终端 UI 与核心请求处理逻辑之间的桥梁 / 调度层。

更准确地说，`REPL` 负责接收用户终端输入，组织上下文和工具环境，调用核心 `query()` 对话循环，然后把模型/API 返回的流式事件转换成 UI 状态，最终交给 Ink/React 组件渲染到终端。

---

## 不是传统前后端分离

传统前后端分离通常是：

```text
Browser Frontend
  ↓ HTTP
Backend Server
  ↓
Database / External API
```

本项目更接近：

```text
Terminal UI / Ink React
  ↓
REPL
  ↓
query() 对话内核
  ↓
services/api/*
  ↓
Anthropic API / OpenAI-compatible API
```

也就是说，本项目没有一个单独的 Web 前端，也没有一个单独启动的后端服务。终端 UI、REPL、请求内核、API 适配都运行在同一个 CLI 进程里。

---

## REPL 在架构中的位置

`REPL` 位于终端 UI 和核心请求内核之间：

```text
用户终端输入
  ↓
REPL
  ↓
query()
  ↓
模型 API / 工具调用 / 上下文处理
  ↓
query() 返回流式事件
  ↓
REPL 更新 messages / streamingText / tool 状态
  ↓
Messages / Message 组件
  ↓
Ink 渲染到终端
```

因此，可以说：

```text
REPL = 终端 UI 和 query 内核之间的桥梁
```

但不建议把它理解成传统意义上的“后端接口”，因为它不是 HTTP server，也不是单独的后端服务。

---

## 终端数据展示链路

后台接口返回的数据展示到终端，大致链路如下：

```text
1. 用户在终端输入 prompt / 命令
   ↓
2. REPL 接收输入，生成 user message
   ↓
3. REPL 调用 query()
   ↓
4. query() 调用 services/api/*
   ↓
5. API 层请求 Anthropic / OpenAI-compatible 接口
   ↓
6. API 返回流式响应
   ↓
7. query() 把流式响应转成内部 Message / Event
   ↓
8. REPL 消费 event，更新 messages / streamingText 状态
   ↓
9. <Messages /> 和 <Message /> 渲染消息
   ↓
10. Ink 把 React 组件绘制到终端
```

---

## 关键模块职责

| 模块 | 职责 |
|---|---|
| `src/entrypoints/cli.tsx` | CLI 启动入口 |
| `src/main.tsx` | 初始化 CLI、配置、权限、REPL 等 |
| `src/replLauncher.tsx` | 启动 `<App><REPL /></App>` |
| `src/interactiveHelpers.tsx` | 通过 `root.render(element)` 把 Ink/React UI 渲染到终端 |
| `src/screens/REPL.tsx` | 终端交互主控制层，管理输入、状态、消息和请求调度 |
| `src/query.ts` | 对话请求核心循环，负责上下文、模型调用、工具调用和流式事件处理 |
| `src/services/api/claude.ts` | Anthropic API 请求和流式响应处理 |
| `src/services/api/openai-fetch-adapter.ts` | 企业 OpenAI 兼容接口适配，把 OpenAI 响应转换为 Anthropic 风格事件 |
| `src/components/Messages.tsx` | 消息列表渲染、过滤、分组、截断、滚动等 |
| `src/components/Message.tsx` | 根据消息类型渲染单条消息 |

---

## 入口与终端渲染

CLI 启动后会进入主流程，最终启动 REPL 界面。

关键链路：

```text
src/entrypoints/cli.tsx
  ↓
src/main.tsx
  ↓
src/replLauncher.tsx
  ↓
<App>
  <REPL />
</App>
  ↓
src/interactiveHelpers.tsx
  ↓
root.render(element)
```

`src/replLauncher.tsx` 负责把 `REPL` 包进 `App`：

```tsx
<App {...appProps}>
  <REPL {...replProps} />
</App>
```

`src/interactiveHelpers.tsx` 中的 `renderAndRun()` 负责真正渲染：

```ts
root.render(element)
```

这里的 `root` 是 Ink 的渲染根节点，最终会把 React 组件树绘制成终端 UI。

---

## REPL 如何管理消息

`REPL` 维护终端会话中的核心消息状态：

```ts
const [messages, rawSetMessages] = useState<MessageType[]>(...)
```

这些消息包括：

- 用户输入消息
- Assistant 回复消息
- 工具调用消息
- 工具结果消息
- 系统提示消息
- 进度消息
- compact / snip 边界消息

当有新事件返回时，`REPL` 会通过 `setMessages()` 更新消息数组。

最终这些消息会传给 `Messages` 组件：

```tsx
<Messages messages={displayedMessages} ... />
```

因此，终端里看到的内容，本质上是 `messages` 状态被 Ink/React 渲染出来的结果。

---

## REPL 如何调用请求内核

`REPL` 不直接处理底层 API 请求，而是调用 `query()`：

```ts
for await (const event of query({
  messages: messagesIncludingNewMessages,
  systemPrompt,
  userContext,
  systemContext,
  canUseTool,
  toolUseContext,
  querySource: getQuerySourceForREPL(),
})) {
  onQueryEvent(event)
}
```

这里的 `query()` 可以理解为对话内核。

它负责：

- 构造模型请求
- 整理系统提示词和用户上下文
- 处理上下文压缩
- 调用模型 API
- 处理流式响应
- 处理工具调用
- 处理工具结果
- 处理重试、fallback、错误等流程

---

## 流式响应如何进入终端 UI

模型 API 通常返回流式事件，例如：

```text
message_start
content_block_start
content_block_delta
message_delta
message_stop
```

API 层和 `query()` 会把这些事件转换成项目内部使用的 message/event。

然后 `REPL` 通过 `onQueryEvent()` 消费这些事件：

```text
query() yield event
  ↓
REPL onQueryEvent(event)
  ↓
handleMessageFromStream(...)
  ↓
setMessages(...)
  ↓
Messages 组件重新渲染
```

如果是完整消息，会追加到 `messages`。

如果是流式文本，会更新当前 streaming 状态，让终端看起来像是在实时输出。

---

## Anthropic API 路径

Anthropic 原生接口大致路径：

```text
REPL
  ↓
query()
  ↓
src/services/api/claude.ts
  ↓
anthropic.beta.messages.create({ stream: true })
  ↓
for await (const part of stream)
  ↓
累积 text / thinking / tool_use 等 content block
  ↓
yield 内部事件
  ↓
REPL 更新 UI
```

在流式过程中，文本 delta 会不断追加到当前内容块中，然后由上层转成可展示的消息状态。

---

## OpenAI 兼容接口路径

企业 OpenAI 兼容模式下，项目不是直接把 OpenAI 响应交给 UI，而是做了一层适配。

大致路径：

```text
Anthropic-style request
  ↓
openai-fetch-adapter
  ↓
转换为 OpenAI chat.completions 请求
  ↓
OpenAI-compatible API stream
  ↓
包装成 SSE Response
  ↓
转换回 Anthropic-style response/event
  ↓
query() 统一处理
  ↓
REPL 更新 UI
```

这样上层的 `query()` 和 `REPL` 不需要关心底层是 Anthropic 还是 OpenAI 兼容接口，可以统一按 Anthropic 风格的事件处理。

---

## 消息组件如何渲染

消息最终由组件树渲染：

```text
REPL
  ↓
<Messages />
  ↓
<Message />
  ↓
AssistantTextMessage / UserTextMessage / SystemTextMessage / ToolUseMessage 等
  ↓
Ink 终端输出
```

`Message` 会根据消息类型分发到不同组件：

- `assistant` → Assistant 相关组件
- `user` → User 相关组件
- `system` → SystemTextMessage
- `tool_use` / grouped tool → Tool 相关组件
- attachment / compact / progress → 对应特殊展示组件

---

## 总体架构图

```text
┌─────────────────────────────────────┐
│ Terminal                            │
│ 用户输入 / 终端输出                  │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ Ink / React UI                      │
│ App / REPL / Messages / Message     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ REPL                                │
│ - 管理 messages 状态                 │
│ - 处理用户输入                       │
│ - 调用 query()                       │
│ - 消费流式事件                       │
│ - 触发 UI 更新                       │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ query() 对话内核                    │
│ - 构造请求                           │
│ - 处理上下文                         │
│ - 处理工具调用                       │
│ - 处理模型流式返回                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ services/api/*                      │
│ - Anthropic SDK                      │
│ - OpenAI-compatible adapter          │
│ - stream 转换                        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│ External Model API                  │
│ Anthropic / OpenAI-compatible        │
└─────────────────────────────────────┘
```

---

## 一句话总结

`REPL` 是这个 CLI 应用里的核心交互调度层。

它连接：

```text
终端输入输出
  ↕
React/Ink 终端界面
  ↕
query() 请求内核
  ↕
外部模型 API
```

所以，如果用“前端 / 内核 / 接口”的方式理解：

```text
终端 UI = 展示层
REPL = 桥梁和调度层
query() = 请求和对话内核
services/api/* = 外部接口适配层
外部模型 API = 实际远程数据来源
```
