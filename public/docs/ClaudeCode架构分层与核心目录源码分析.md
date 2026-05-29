# ClaudeCode CLI 架构分层与核心目录源码分析

> 分析对象：`packages/codeagent`  
> 分析日期：2026-05-27  
> 重点：项目架构分层、核心目录职责、主调用链、上下文压缩与 `appendChineseTokenLog` 调试打印链路。

## 1. 项目总体定位

`packages/codeagent` 是一个基于 **Bun + TypeScript + React/Ink** 的终端 Agent 应用。它既支持交互式 TUI，也支持 `-p/--print` 无头/SDK 模式，并通过模型 API、工具系统、MCP、插件、技能、上下文压缩、远程桥接等能力完成完整的 agentic loop。

从 `package.json` 可以看出：

- 包类型是 ESM：`"type": "module"`，见 `packages/codeagent/package.json:5`。
- 运行时和包管理器以 Bun 为中心：`"packageManager": "bun@1.3.11"`、`"engines": { "bun": ">=1.3.11" }`，见 `packages/codeagent/package.json:6-13`。
- CLI 开发入口是 `bun run ./src/entrypoints/cli.tsx`，见 `packages/codeagent/package.json:21`。
- 构建入口是 `scripts/build.ts`，同时通过 feature flags 控制能力裁剪，例如 `HISTORY_SNIP`、`REACTIVE_COMPACT`、`ENHANCED_TELEMETRY_BETA`，见 `packages/codeagent/package.json:15-18`。
- 依赖层面同时包含：
  - React/Ink 终端 UI：`react`、`ink`，见 `packages/codeagent/package.json:86-98`。
  - Anthropic SDK、MCP SDK：`@anthropic-ai/sdk`、`@modelcontextprotocol/sdk`，见 `packages/codeagent/package.json:28-39`。
  - OpenTelemetry、Langfuse、AWS/Azure provider、tiktoken、ws 等服务端/观测/模型生态依赖，见 `packages/codeagent/package.json:30-120`。

因此它不是传统 Web MVC 架构，而是一个 **CLI/TUI 驱动的分层 Agent Runtime 架构**。

## 2. 推荐的架构分层理解

源码更适合按“执行链路 + 横切能力”理解，可分为以下层次：

```text
┌────────────────────────────────────────────┐
│ 入口层 Entry / CLI Bootstrap                │
│ src/entrypoints, src/main.tsx               │
├────────────────────────────────────────────┤
│ 交互层 UI / Commands / Screens              │
│ src/screens, src/components, src/commands   │
├────────────────────────────────────────────┤
│ 会话编排层 Session / Query Engine           │
│ src/QueryEngine.ts, src/query.ts, src/query │
├────────────────────────────────────────────┤
│ Agent 能力层 Tools / Skills / MCP / Goals   │
│ src/tools, src/tools.ts, src/skills, goals  │
├────────────────────────────────────────────┤
│ 领域服务层 Services                         │
│ api, compact, analytics, mcp, enterprise    │
├────────────────────────────────────────────┤
│ 状态与上下文层 State / Context / Bootstrap  │
│ state, bootstrap, context, history, memdir   │
├────────────────────────────────────────────┤
│ 基础设施层 Utils / Types / Constants        │
│ utils, types, constants, schemas, vendor     │
└────────────────────────────────────────────┘
```

### 2.1 入口层：CLI Bootstrap 与启动路由

核心文件：

- `src/entrypoints/cli.tsx`
- `src/main.tsx`
- `src/replLauncher.tsx`

`src/entrypoints/cli.tsx` 是最前置的轻量启动入口。它的设计目标是 **尽量延迟加载重模块**，先处理快速路径和特殊模式：

- `main()` 从 `process.argv.slice(2)` 取参数，见 `packages/codeagent/src/entrypoints/cli.tsx:174-176`。
- `--version` 直接输出版本，不加载完整 CLI，见 `packages/codeagent/src/entrypoints/cli.tsx:195-200`。
- enterprise pure mode 下先安装网络守卫并拦截被禁用参数，见 `packages/codeagent/src/entrypoints/cli.tsx:203-218`。
- ACP、computer-use MCP、daemon worker、bridge、server 等特殊路径都通过动态 `import()` 分流，见 `packages/codeagent/src/entrypoints/cli.tsx:220-424`。

`src/main.tsx` 是完整 CLI 的主控制器：

- 顶层启动后调用 `run()`，见 `packages/codeagent/src/main.tsx:867-868`。
- `run()` 创建 Commander 程序对象并注册全局选项、子命令和默认 action，见 `packages/codeagent/src/main.tsx:898-984`。
- `preAction` hook 负责在真正执行命令前完成初始化：MDM/keychain 预取、`init()`、日志 sink、插件目录、迁移、远程 settings 等，见 `packages/codeagent/src/main.tsx:919-983`。
- 默认 action 中解析大量运行参数，例如 `--print`、`--tools`、`--allowed-tools`、`--mcp-config`、`--model`、`--plugin-dir` 等，见 `packages/codeagent/src/main.tsx:984-1025`。

`src/replLauncher.tsx` 是 UI 挂载的薄封装：

- `launchRepl()` 动态导入 `App` 和 `REPL`，然后渲染 `<App><REPL /></App>`，见 `packages/codeagent/src/replLauncher.tsx:13-26`。

这一层的职责不是业务处理，而是：

1. 快速路径短路；
2. 环境、feature gate、enterprise policy 初始化；
3. Commander 参数解析；
4. 分流到交互式 REPL、无头 `runHeadless`、bridge/server/daemon 等模式。

### 2.2 交互层：React/Ink TUI、Slash Commands 与 Screens

核心目录：

- `src/screens`
- `src/components`
- `src/commands`
- `src/commands.ts`
- `src/replLauncher.tsx`

`src/screens/REPL.tsx` 是交互式终端界面的主屏幕：

- `REPL` 组件的 props 覆盖命令、工具、初始消息、MCP、系统 prompt、远程会话、SSH 会话、goal context、thinking config 等，见 `packages/codeagent/src/screens/REPL.tsx:560-585`。
- `REPL()` 组件入口在 `packages/codeagent/src/screens/REPL.tsx:597-624`。
- 内部通过 `useAppState` 读取权限、verbose、MCP、plugins、agentDefinitions、fileHistory、队列命令、任务等状态，见 `packages/codeagent/src/screens/REPL.tsx:642-666`。
- 它负责交互生命周期、输入框、消息列表、权限弹窗、工具进度、远程会话、任务视图等 UI 编排。

`src/components` 是终端 UI 组件库，典型职责包括：

- `App.tsx`：应用壳层。
- `Messages.tsx`、`Message.tsx`、`MessageRow.tsx`：消息展示。
- `PromptInput/`：输入框、footer、通知区域。
- `StatusLine.tsx`：状态栏及 context window 信息输出。
- `ModelPicker.tsx`、`ThemePicker.tsx`、`Permission` 相关组件：本地交互弹窗。
- `FileEditToolDiff.tsx`、`StructuredDiff.tsx`：工具结果的可视化展示。

`src/commands.ts` 是 slash command 注册聚合层：

- 文件顶部集中 import 各个 `src/commands/<name>/index.ts`，见 `packages/codeagent/src/commands.ts:1-49`。
- 使用 feature flag 条件加载部分命令，例如 `assistant`、`bridge`、`voice`、`force-snip`、workflow 等，见 `packages/codeagent/src/commands.ts:62-126`。
- `getCommands(cwd)` 加载所有命令、技能、插件命令、workflow 命令，并按可用性和 enabled 状态过滤，见 `packages/codeagent/src/commands.ts:497-543`。
- `getSkillToolCommands` 从 commands 中筛选模型可调用的 prompt 类命令，见 `packages/codeagent/src/commands.ts:587-607`。
- `getSlashCommandToolSkills` 筛选技能类命令，供 SkillTool 或技能索引使用，见 `packages/codeagent/src/commands.ts:609-634`。
- `REMOTE_SAFE_COMMANDS` 和 `BRIDGE_SAFE_COMMANDS` 定义远程/桥接模式下可用的命令白名单，见 `packages/codeagent/src/commands.ts:636-702`。

这一层的职责是：

1. 把用户输入转换为命令、消息或工具调用；
2. 管理终端 UI 状态；
3. 提供 slash command、local command、prompt command、技能命令等交互入口；
4. 将交互结果交给会话编排层继续处理。

### 2.3 会话编排层：QueryEngine 与 query loop

核心文件：

- `src/QueryEngine.ts`
- `src/query.ts`
- `src/query/config.ts`
- `src/query/deps.ts`
- `src/query/stopHooks.ts`
- `src/query/tokenBudget.ts`

`QueryEngine.ts` 更偏 **无头/SDK 模式的会话引擎封装**：

- `QueryEngine` 类定义在 `packages/codeagent/src/QueryEngine.ts:588`。
- 构造函数接收 `QueryEngineConfig`，保存 mutable messages、abort controller、transcript recorder、permissionDenials、usage 等状态，见 `packages/codeagent/src/QueryEngine.ts:607-616`。
- `submitMessage()` 是核心异步生成器，接收 prompt 并持续 yield SDK 消息，见 `packages/codeagent/src/QueryEngine.ts:618-646`。
- 它会包装 `canUseTool` 来记录权限拒绝，见 `packages/codeagent/src/QueryEngine.ts:653-681`。
- 它构造 `ProcessUserInputContext`，把 commands、tools、MCP、model、thinking、agentDefinitions、app state 等组织成一次 query 所需上下文，见 `packages/codeagent/src/QueryEngine.ts:731-793`。

`query.ts` 是真正的 agentic loop 核心：

- `query()` 是导出的异步生成器，负责调用内部 `queryLoop()` 并在正常结束后通知命令生命周期完成，见 `packages/codeagent/src/query.ts:490-510`。
- `queryLoop()` 从 `QueryParams` 中拆出 systemPrompt、userContext、toolUseContext、querySource、maxTurns 等不可变参数，并创建 loop state，见 `packages/codeagent/src/query.ts:512-550`。
- 每轮循环会 yield `stream_request_start`，建立 query tracking、处理消息窗口、工具结果预算、snip、microcompact、autocompact、API 请求、流式响应、工具执行、stop hooks、reactive compact、token budget 等，见 `packages/codeagent/src/query.ts:613-736`。
- 在发 API 前，先应用工具结果预算和历史压缩：`applyToolResultBudget()` 在 `packages/codeagent/src/query.ts:681-706`，`snipCompactIfNeeded()` 在 `packages/codeagent/src/query.ts:708-727`，`deps.microcompact()` 在 `packages/codeagent/src/query.ts:729-736`。

这一层是项目最核心的“会话状态机”，职责包括：

1. 把消息历史转换为下一次模型请求；
2. 决定是否需要上下文裁剪/压缩；
3. 调用模型 API 并消费流式事件；
4. 识别 tool_use 并调用工具编排服务；
5. 处理权限、预算、stop hook、goal runtime、重试和错误恢复；
6. 输出 UI/SDK 可消费的消息事件。

### 2.4 Agent 能力层：Tools、Skills、MCP 与 Goals

核心目录/文件：

- `src/tools`
- `src/tools.ts`
- `src/Tool.ts`
- `src/skills`
- `src/services/mcp`
- `src/goals`

`src/Tool.ts` 定义工具系统的核心类型，尤其是 `ToolUseContext`：

- `ToolUseContext` 包含 goal context、runtime、commands、debug、mainLoopModel、tools、verbose、thinkingConfig、MCP clients/resources、是否无头会话等，见 `packages/codeagent/src/Tool.ts:202-219`。
- 这说明工具不是孤立函数，而是运行在带有权限、模型、MCP、会话、状态、abort controller 的上下文中。

`src/tools.ts` 是工具池组装层：

- 文件顶部 import 各类工具：`AgentTool`、`SkillTool`、`BashTool`、`FileEditTool`、`FileReadTool`、`GlobTool`、`GrepTool` 等，见 `packages/codeagent/src/tools.ts:1-12`。
- 大量工具受 feature flag 或环境变量控制，例如 `SleepTool`、cron tools、workflow、web browser、PowerShell 等，见 `packages/codeagent/src/tools.ts:13-155`。
- `getAllBaseTools()` 返回当前环境下可能启用的基础工具集合，是工具清单的 source of truth，见 `packages/codeagent/src/tools.ts:184-219`。

`src/tools/<ToolName>` 目录承担具体工具实现，例如：

- `BashTool`：shell 命令执行。
- `FileReadTool/FileEditTool/FileWriteTool`：文件读写编辑。
- `GlobTool/GrepTool`：代码检索。
- `AgentTool`：子 Agent 调度。
- `SkillTool`：模型调用技能/命令。
- `AskUserQuestionTool`、`EnterPlanModeTool`、`ExitPlanModeTool`：交互决策和计划模式。
- `Task*Tool`：任务列表管理。
- `MCPTool`、`ReadMcpResourceTool`、`ListMcpResourcesTool`：MCP 资源和工具接入。

`src/skills` 和 `src/commands.ts` 共同构成“模型可调用能力”的动态扩展：技能既可以作为 slash command 被用户调用，也可以经 `SkillTool` 暴露给模型。

`src/goals` 则提供目标模式相关上下文、预算、证据和控制器。`QueryEngine` 会在无头 goal 模式下构造 goal tool/runtime context，见 `packages/codeagent/src/QueryEngine.ts:683-717`。

### 2.5 领域服务层：API、压缩、MCP、企业策略、观测

核心目录：

- `src/services/api`
- `src/services/compact`
- `src/services/tools`
- `src/services/mcp`
- `src/services/analytics`
- `src/services/enterprise`
- `src/services/http`
- `src/services/contextCollapse`
- `src/services/tokenEstimation.ts`

#### API 服务

`src/services/api/agent.ts` 负责模型 API 请求、流式响应、usage 合并、缓存断点等底层 API 行为。当前与 token 相关的关键函数：

- `updateUsage()` 合并流式 `message_delta` 中的 usage，见 `packages/codeagent/src/services/api/agent.ts:3020-3093`。
- 函数注释明确 Anthropic streaming API 的 usage 是累计值而非增量值，见 `packages/codeagent/src/services/api/agent.ts:3011-3018`。
- 它对 `input_tokens`、`cache_creation_input_tokens`、`cache_read_input_tokens` 使用非零值保护，避免 message_delta 的 0 覆盖 message_start 的真实值，见 `packages/codeagent/src/services/api/agent.ts:3027-3042`。
- 在 `CACHED_MICROCOMPACT` feature 下还处理 `cache_deleted_input_tokens`，见 `packages/codeagent/src/services/api/agent.ts:3061-3078`。

#### 压缩服务

`src/services/compact` 是上下文管理核心，包含多种压缩策略：

- `autoCompact.ts`：自动压缩阈值判断与策略选择。
- `compact.ts`：完整摘要压缩。
- `microCompact.ts`：缓存微压缩、时间微压缩。
- `reactiveCompact.ts`：遇到 prompt too long 等错误后的响应式压缩。
- `sessionMemoryCompact.ts`：会话记忆压缩。
- `apiMicrocompact.ts`：API 原生上下文管理配置。
- `snipCompact.ts` / `snipProjection.ts`：历史 snip 裁剪。

`autoCompact.ts` 的关键逻辑：

- `shouldAutoCompact()` 计算当前 token count、阈值和 effective window，见 `packages/codeagent/src/services/compact/autoCompact.ts:243-267`。
- `autoCompactIfNeeded()` 在需要时优先尝试 session memory compaction，再 fallback 到完整摘要压缩，见 `packages/codeagent/src/services/compact/autoCompact.ts:270-415`。
- 自动压缩触发后会清理压缩状态、重置缓存检测基线、记录 post-compaction，见 `packages/codeagent/src/services/compact/autoCompact.ts:329-382`。

`microCompact.ts` 的关键逻辑：

- 缓存微压缩删除旧工具结果并返回 pending cache edits，日志断点在 `packages/codeagent/src/services/compact/microCompact.ts:382-390`。
- 时间微压缩基于“距离上一条 main-loop assistant 消息的时间间隔”触发，`evaluateTimeBasedTrigger()` 在 `packages/codeagent/src/services/compact/microCompact.ts:429-451`。
- `maybeTimeBasedMicrocompact()` 会清理旧 tool_result 内容，仅保留最近 N 个，见 `packages/codeagent/src/services/compact/microCompact.ts:453-545`。

#### 工具编排服务

`src/services/tools` 提供工具执行编排，`query.ts` 通过 `runTools` 和 `StreamingToolExecutor` 连接模型 tool_use 与具体工具实现，见 `packages/codeagent/src/query.ts:107-110`。

#### 企业与网络策略

`src/services/enterprise/config.ts`、`src/services/http/networkGuard.ts` 等用于 enterprise pure mode 的配置、禁用参数、网络守卫。入口层在 enterprise mode 下会安装 network guards，见 `packages/codeagent/src/entrypoints/cli.tsx:203-218`。

#### 观测与成本

`src/services/analytics`、`src/cost-tracker.ts`、OpenTelemetry 相关依赖共同承担事件、成本、token、耗时统计。`addToTotalSessionCost()` 会累计模型用量和成本，见 `packages/codeagent/src/cost-tracker.ts:319-382`。

### 2.6 状态与上下文层

核心目录/文件：

- `src/bootstrap/state.ts`
- `src/state`
- `src/context`
- `src/history.ts`
- `src/memdir`
- `src/utils/sessionStorage.ts`

`bootstrap/state.ts` 是大量进程级状态的注册和访问中心，例如 session id、hooks、permission mode、main loop model、token budget 等。可以看到它也负责 hook callback 注册：`registerHookCallbacks()` 在 `packages/codeagent/src/bootstrap/state.ts:1423-1436`。

`src/state` 是 React AppState 层，给 REPL 和组件提供可订阅状态。`REPL.tsx` 中大量 `useAppState` 说明 UI 层主要通过这个状态容器读取 runtime 状态，见 `packages/codeagent/src/screens/REPL.tsx:642-666`。

`src/context` 是 React context 和运行时上下文，例如 notifications、stats、voice 等。`Notifications.tsx` 通过 `useNotifications()` 处理通知，见 `packages/codeagent/src/components/PromptInput/Notifications.tsx:3-16`。

`src/memdir`、`history.ts`、`sessionStorage.ts` 则承担会话持久化、记忆加载、 transcript 记录等职责。

### 2.7 基础设施层：utils、types、constants、schemas、vendor

核心目录：

- `src/utils`
- `src/types`
- `src/constants`
- `src/schemas`
- `src/vendor`

这一层提供通用能力：

- `utils/messages.ts`：消息构造、转换、compact boundary 处理。
- `utils/tokens.ts`：token 统计与 context window 估算。
- `utils/model`：模型选择、运行时模型解析。
- `utils/settings`：settings 加载与缓存。
- `utils/permissions`：权限规则和 filesystem sandbox。
- `utils/hooks`：hook 执行。
- `types/message.ts`、`types/command.ts`、`types/permissions.ts`：跨层类型契约。
- `constants/prompts.ts`、`constants/tools.ts`、`constants/querySource.ts`：提示词、工具、query source 等常量。

## 3. 主调用链分析

### 3.1 交互式 REPL 启动链

典型链路：

```text
package.json scripts.dev
  -> src/entrypoints/cli.tsx main()
  -> dynamic import src/main.tsx
  -> run() 创建 Commander
  -> default action 解析 options / 初始化 setup
  -> launchRepl(root, appProps, replProps)
  -> <App><REPL /></App>
  -> REPL 处理输入、命令、状态和消息
  -> query() agentic loop
  -> services/api + tools + compact
  -> messages 回流 UI
```

源码锚点：

- dev 脚本入口：`packages/codeagent/package.json:21`。
- CLI bootstrap main：`packages/codeagent/src/entrypoints/cli.tsx:174-232`。
- 主 Commander 初始化：`packages/codeagent/src/main.tsx:898-984`。
- REPL 挂载：`packages/codeagent/src/replLauncher.tsx:13-26`。
- REPL 组件入口：`packages/codeagent/src/screens/REPL.tsx:597-624`。
- query 生成器入口：`packages/codeagent/src/query.ts:490-510`。

### 3.2 无头 / SDK 查询链

典型链路：

```text
CLI -p / SDK query()
  -> QueryEngine.submitMessage()
  -> processUserInput / slash command expansion
  -> query(params)
  -> queryLoop()
  -> API streaming / tool execution
  -> SDKMessage async generator 输出
```

源码锚点：

- `QueryEngine` 类：`packages/codeagent/src/QueryEngine.ts:588-616`。
- `submitMessage()`：`packages/codeagent/src/QueryEngine.ts:618-646`。
- `ProcessUserInputContext` 构造：`packages/codeagent/src/QueryEngine.ts:731-793`。
- `query()` / `queryLoop()`：`packages/codeagent/src/query.ts:490-534`。

### 3.3 模型请求前的上下文处理链

`queryLoop()` 中一次模型请求前会按顺序处理：

```text
messages
  -> getMessagesAfterCompactBoundary()
  -> applyToolResultBudget()
  -> snipCompactIfNeeded()
  -> microcompact()
  -> autoCompactIfNeeded()
  -> normalizeMessagesForAPI / addCacheBreakpoints
  -> services/api/agent.ts streaming request
```

可见源码：

- 消息窗口从 compact boundary 后开始：`packages/codeagent/src/query.ts:677`。
- 工具结果预算：`packages/codeagent/src/query.ts:681-706`。
- snip compact：`packages/codeagent/src/query.ts:708-727`。
- microcompact：`packages/codeagent/src/query.ts:729-736`。
- 自动压缩逻辑位于 `packages/codeagent/src/services/compact/autoCompact.ts:270-415`。

这说明项目采用了多级上下文控制：

1. **工具结果预算**：先限制单条/聚合 tool result 尺寸；
2. **Snip**：基于历史裁剪；
3. **Microcompact**：清理旧工具结果或生成 cache edits；
4. **Auto compact**：达到阈值后做 session memory 或完整摘要压缩；
5. **Reactive compact**：API 报 prompt too long 后兜底。

## 4. `appendChineseTokenLog` 调试打印分析

### 4.1 实现位置与行为

实现文件：`src/utils/tokenDebugLogger.ts`

```ts
export async function appendChineseTokenLog(
  label: string,
  payload: Record<string, unknown>,
): Promise<void>
```

源码行为：

- 默认日志路径是 `process.cwd()/chinese-token-debug.log`，见 `packages/codeagent/src/utils/tokenDebugLogger.ts:20`。
- 也可以通过环境变量 `INNERCC_TOKEN_DEBUG_LOG` 指定路径，见 `packages/codeagent/src/utils/tokenDebugLogger.ts:45`。
- 每条日志是一个 JSON 对象，包含 `timestamp`、`label` 和 payload，见 `packages/codeagent/src/utils/tokenDebugLogger.ts:46-50`。
- 写入前会递归创建目录，写入失败会被吞掉，避免 debug logging 影响产品行为，见 `packages/codeagent/src/utils/tokenDebugLogger.ts:52-57`。
- 当前 `INNERCC_DEBUG` / `INNERCC_TOKEN_DEBUG_LOG` gating 被注释掉了，见 `packages/codeagent/src/utils/tokenDebugLogger.ts:43`，因此只要调用就会写日志。

### 4.2 已接入的打印断点

当前源码已经在关键 token/压缩/状态链路中接入了 `appendChineseTokenLog`，无需再额外加基础断点即可观察大部分上下文变化。

| 断点 | 位置 | 说明 |
|---|---|---|
| `断点：从assistant消息中读取API返回的usage` | `packages/codeagent/src/utils/tokens.ts:21-25` | 每次从 assistant message 读取 API usage 时记录模型和 usage。 |
| `断点：根据API usage计算总token` | `packages/codeagent/src/utils/tokens.ts:62-65` | 把 input/cache/output 汇总为总 token 时记录。 |
| `断点：上下文token统计使用API usage加本地估算` | `packages/codeagent/src/utils/tokens.ts:273-280` | `tokenCountWithEstimation()` 使用 API usage + 新消息估算时记录。 |
| `断点：没有API usage时完全使用本地粗略估算token` | `packages/codeagent/src/utils/tokens.ts:286-289` | 无 API usage 时 fallback 到本地估算。 |
| `断点：流式API message_delta合并usage` | `packages/codeagent/src/services/api/agent.ts:3084-3090` | 每次 streaming delta 合并 usage 时记录 before/delta/after。 |
| `断点：累计会话成本和模型token用量` | `packages/codeagent/src/cost-tracker.ts:326-337` | 单次请求成本和模型累计 token。 |
| `断点：statusline构建context_window token数据` | `packages/codeagent/src/components/StatusLine.tsx:97-103` | 状态栏构建 context_window 数据时记录。 |
| `断点：footer verbose模式读取最近API响应token` | `packages/codeagent/src/components/PromptInput/Notifications.tsx:80-88` | footer token warning 使用最近 API token 时记录。 |
| `断点：自动压缩阈值判定` | `packages/codeagent/src/services/compact/autoCompact.ts:256-265` | 自动压缩阈值判断记录 token、threshold、effective window。 |
| `断点：自动压缩未触发` | `packages/codeagent/src/services/compact/autoCompact.ts:305-310` | 未达到阈值时记录。 |
| `断点：自动压缩采用会话记忆压缩` | `packages/codeagent/src/services/compact/autoCompact.ts:329-337` | session memory compaction 成功路径。 |
| `断点：自动压缩采用完整摘要压缩` | `packages/codeagent/src/services/compact/autoCompact.ts:366-375` | 完整摘要压缩路径。 |
| `断点：自动压缩失败` | `packages/codeagent/src/services/compact/autoCompact.ts:403-412` | 自动压缩异常和 circuit breaker 状态。 |
| `断点：缓存微压缩删除工具结果` | `packages/codeagent/src/services/compact/microCompact.ts:382-390` | cached microcompact 删除工具结果时记录。 |
| `断点：时间微压缩清理旧工具结果` | `packages/codeagent/src/services/compact/microCompact.ts:513-521` | time-based microcompact 清理旧结果时记录。 |

### 4.3 建议的运行方式

默认会在当前工作目录写入：

```text
chinese-token-debug.log
```

如果想指定路径，可以这样运行：

```bash
INNERCC_TOKEN_DEBUG_LOG=/tmp/codeagent-token-debug.log bun run ./src/entrypoints/cli.tsx
```

Windows Git Bash 下也可以使用仓库内相对路径：

```bash
INNERCC_TOKEN_DEBUG_LOG=./token-debug/chinese-token-debug.log bun run ./src/entrypoints/cli.tsx
```

日志格式示例：

```json
{
  "timestamp": "2026-05-27T00:00:00.000Z",
  "label": "断点：自动压缩阈值判定",
  "message_count": 42,
  "model": "claude-sonnet-4-6",
  "query_source": "repl_main_thread",
  "token_count": 128000,
  "threshold": 120000,
  "effective_window": 200000,
  "is_above_auto_compact_threshold": true
}
```

### 4.4 如果还要继续补充打印，建议加的位置

当前断点已经覆盖 token 计算和压缩决策。若继续增强，建议补充在以下位置：

1. **query loop 发 API 前最终消息规模**
   - 位置：`packages/codeagent/src/query.ts:729-736` 之后，microcompact 之后、API 请求之前。
   - 目的：记录最终 `messagesForQuery.length`、`querySource`、是否携带 pending cache edits。

2. **tool execution 完成后新增 tool_result 规模**
   - 位置：`runTools` 返回后或 `StreamingToolExecutor` 汇总结果处。
   - 目的：定位是哪类工具结果导致上下文快速膨胀。

3. **compact boundary 生成后**
   - 位置：`services/compact/compact.ts` 的完整摘要压缩完成路径附近。
   - 目的：记录压缩前后 message count、token count、summary 字符数。

建议 payload 保持结构化，字段使用 snake_case，例如：

```ts
void appendChineseTokenLog('断点：query发起API前最终上下文', {
  query_source: querySource ?? 'unknown',
  message_count: messagesForQuery.length,
  tool_count: toolUseContext.options.tools.length,
  token_count: tokenCountWithEstimation(messagesForQuery),
})
```

注意：该 logger 当前会无条件写文件；如果用于长期运行，建议恢复 `INNERCC_DEBUG` 或 `INNERCC_TOKEN_DEBUG_LOG` gating，避免频繁 IO。

## 5. 核心目录职责速查

| 目录/文件 | 职责 |
|---|---|
| `src/entrypoints` | 最前置启动入口；处理 fast path、特殊模式、动态导入完整 CLI。 |
| `src/main.tsx` | Commander 主程序；解析 CLI options；初始化 settings、hooks、MCP、权限、REPL/headless 分流。 |
| `src/replLauncher.tsx` | 动态导入并挂载 `<App><REPL /></App>`。 |
| `src/screens` | 顶层屏幕组件；`REPL.tsx` 是交互式主屏。 |
| `src/components` | React/Ink 终端 UI 组件，包括消息、输入框、状态栏、弹窗、diff、选择器等。 |
| `src/commands` | 每个 slash command 的具体实现。 |
| `src/commands.ts` | 命令聚合、过滤、技能命令派生、远程安全白名单。 |
| `src/QueryEngine.ts` | SDK/headless 会话引擎；把 prompt 转为 query loop 并输出 SDKMessage。 |
| `src/query.ts` | agentic loop 核心；上下文处理、API streaming、工具执行、预算、压缩、重试。 |
| `src/query` | query loop 的辅助模块：配置、依赖注入、stop hooks、token budget。 |
| `src/tools.ts` | 工具池 source of truth；按 feature/env 组装工具列表。 |
| `src/tools` | 各模型工具实现，如 Bash、Read、Edit、Agent、Skill、Task、MCP、WebSearch。 |
| `src/Tool.ts` | 工具类型、权限上下文、ToolUseContext 等核心契约。 |
| `src/services/api` | 模型 API、streaming、usage、cache breakpoint、provider transform。 |
| `src/services/compact` | 上下文压缩体系：auto、manual、micro、reactive、session memory、snip。 |
| `src/services/tools` | 工具执行编排服务。 |
| `src/services/mcp` | MCP server/client/resource/tool 接入。 |
| `src/services/analytics` | 事件、指标、观测上报。 |
| `src/services/enterprise` | 企业模式配置、禁用项、策略。 |
| `src/services/http` | 网络守卫、HTTP 相关基础能力。 |
| `src/bootstrap` | 进程级 runtime 状态与 hook 注册。 |
| `src/state` | React AppState store，驱动 REPL 和组件状态。 |
| `src/context` | React context，如 notifications、stats、voice。 |
| `src/hooks` | UI 和权限相关 React hooks。 |
| `src/skills` | 技能加载、动态技能、bundled skills。 |
| `src/plugins` / `src/services/plugins` | 插件加载与插件命令/技能接入。 |
| `src/memdir` | 本地记忆目录加载。 |
| `src/history.ts` | 会话历史相关能力。 |
| `src/utils` | 通用基础设施：消息、token、settings、model、permissions、hooks、sessionStorage 等。 |
| `src/types` | 跨层类型定义。 |
| `src/constants` | prompt、tools、query source、品牌等常量。 |
| `src/schemas` | JSON schema 或结构化校验定义。 |
| `src/vendor` | 内嵌/适配的第三方或兼容代码。 |
| `src/bridge` | Remote Control / Web bridge / session worker 通信。 |
| `src/cli` | 非交互输出、remote IO、transport、CLI handlers。 |
| `src/server` | server/serve 模式。 |
| `src/assistant`、`src/buddy`、`src/coordinator`、`src/goals` | 高阶协作/目标/团队/伙伴模式。 |

## 6. 设计特点总结

1. **入口轻量化**  
   `entrypoints/cli.tsx` 通过动态 import 和 fast path 降低启动成本，只在需要时加载完整 CLI。

2. **TUI 与 Headless 共用 Query Core**  
   交互式 REPL 和 SDK/`-p` 模式最终都会进入 `query.ts` 的 agentic loop，只是上层事件输出形态不同。

3. **命令、技能、工具三套能力统一汇聚**  
   slash commands 面向用户；skills 可被用户和模型调用；tools 是模型直接 action 能力。`commands.ts` 与 `tools.ts` 分别是命令和工具的聚合点。

4. **上下文管理是核心复杂度之一**  
   项目不是简单调用模型 API，而是在每轮请求前做工具结果预算、snip、microcompact、autocompact，并在错误后做 reactive compact。

5. **状态分层明显**  
   进程级状态在 `bootstrap/state.ts`，UI 状态在 `state/AppState`，React context 在 `context`，持久化在 `sessionStorage/history/memdir`。

6. **feature flag 深度参与架构**  
   大量能力通过 `feature('...')` 条件加载，既影响构建裁剪，也影响运行时路径，例如压缩、bridge、voice、workflow、context collapse。

7. **观测和 token 调试已经贯穿关键链路**  
   `appendChineseTokenLog` 已经覆盖 API usage、token 估算、成本、状态栏、footer、自动压缩、微压缩等关键点，适合排查“为什么触发压缩”“状态栏 token 为什么不准”“cache_deleted_input_tokens 是否生效”等问题。
