# Claude Code 架构工程结构

## ClaudeCode 整体采用什么架构分层？核心目录分别承担哪些职责？

该项目是一个以 Bun 启动、Commander 解析命令、Ink/React 渲染终端 UI、QueryEngine/Query 驱动 LLM 与工具调用的单页终端应用。整体分层可以按“入口与运行形态 → UI/命令层 → 会话/查询编排层 → 工具与扩展层 → 服务与基础设施层 → 状态与类型层”理解。

- **入口层**：`package.json:21` 的 `dev` 脚本直接执行 `src/entrypoints/cli.tsx`；`src/entrypoints/cli.tsx:39` 起是轻量 bootstrap，优先处理 `--version`、daemon、bridge、background、serve 等 fast-path，最后才动态加载 `src/main.tsx`。`src/main.tsx:591` 是完整 CLI 主入口，负责 Commander、初始化、setup、interactive/headless 分流。
- **CLI/UI 层**：`src/main.tsx` 注册全局参数和子命令；`src/screens/REPL.tsx` 是交互式 REPL 主屏；`src/components/` 放 Ink 组件；`src/ink/` 是对 Ink 渲染层的封装/扩展。
- **命令与工具层**：`src/commands.ts` 汇总 slash command；`src/commands/` 放具体命令实现；`src/tools.ts` 汇总内置工具；`src/tools/` 放 Bash、Read、Edit、Agent 等工具实现。工具执行编排在 `src/services/tools/toolOrchestration.ts`。
- **查询/会话编排层**：`src/query.ts` 是核心 query loop，负责模型流、工具调用、压缩、hook、预算、错误恢复等；`src/QueryEngine.ts:579` 把 headless/SDK 会话抽成类，一次会话一个 `QueryEngine`，每个 `submitMessage()` 是一个 turn。
- **服务层**：`src/services/api/` 是 Anthropic/OpenAI/Bedrock/Azure 等 API adapter；`src/services/mcp/` 管 MCP；`src/services/compact/` 管 compact/auto-compact/reactive compact；`src/services/enterprise/` 管企业配置；`src/services/analytics/` 管埋点。
- **状态层**：`src/bootstrap/state.ts` 是进程级全局状态访问器，包含 session、client type、logger/meter/tracer provider、interactive 状态等；React UI 的应用态由 `src/state/` 管理。
- **配置/环境/基础设施层**：`src/utils/config.ts` 负责旧全局配置 `~/.claude.json`；`src/utils/settings/` 负责 settings.json 与 managed settings；`src/utils/managedEnv.ts` 负责把配置里的 env 注入 `process.env`；`src/utils/debug.ts`、`src/utils/log.ts`、`src/utils/errors.ts` 负责日志和错误基础能力。
- **扩展层**：`src/plugins/`、`src/skills/` 是插件与技能系统；`src/bridge/`、`src/server/`、`src/daemon/` 是远程控制、会话服务和后台常驻形态。

## 项目入口函数 / 启动流程源码执行顺序是什么？初始化阶段做了哪些核心操作？

源码执行顺序大致如下：

1. **Bun 执行入口**：`package.json:21` → `bun run ./src/entrypoints/cli.tsx`。
2. **bootstrap 入口**：`src/entrypoints/cli.tsx:44` 的 `main()` 读取 `process.argv.slice(2)`，先设置一些顶层环境变量，例如 `COREPACK_ENABLE_AUTO_PIN=0`（`src/entrypoints/cli.tsx:16`）和远程模式内存参数（`src/entrypoints/cli.tsx:20`）。
3. **fast-path 分流**：`--version` 在 `src/entrypoints/cli.tsx:65` 直接输出版本；`--acp` 在 `src/entrypoints/cli.tsx:88`；bridge/remote-control 在 `src/entrypoints/cli.tsx:150`；daemon 在 `src/entrypoints/cli.tsx:203`；后台 session 管理在 `src/entrypoints/cli.tsx:221`；`serve` 是 CAC 扩展入口，位于 `src/entrypoints/cli.tsx:286`。
4. **加载完整 CLI**：没有命中 fast-path 时，初始化内置 rg/seccomp/windows sandbox（`src/entrypoints/cli.tsx:337`），启动早期输入捕获和性能采样（`src/entrypoints/cli.tsx:351`），动态 import `src/main.tsx` 并调用 `cliMain()`（`src/entrypoints/cli.tsx:361`）。
5. **main 初始化**：`src/main.tsx:591` 的 `main()` 设置 Windows PATH 安全变量、warning handler、退出/SIGINT 处理（`src/main.tsx:594` 到 `src/main.tsx:613`），随后构造 Commander。
6. **Commander preAction**：`src/main.tsx:913` 的 `program.hook('preAction')` 在实际执行命令前运行：等待 MDM/keychain 预加载、调用 `init()`、设置进程标题、初始化 sinks、处理 `--plugin-dir`、跑 migrations、异步加载 remote managed settings/policy limits/settings sync。
7. **init() 核心初始化**：`src/entrypoints/init.ts:50` 是 memoized `init()`，核心操作包括：`enableConfigs()`（`src/entrypoints/init.ts:58`）、应用安全 env（`src/entrypoints/init.ts:67`）、应用 CA 证书配置（`src/entrypoints/init.ts:72`）、注册 graceful shutdown（`src/entrypoints/init.ts:80`）、异步补 OAuth account（`src/entrypoints/init.ts:85`）、初始化 JetBrains 探测和仓库探测（`src/entrypoints/init.ts:90`、`src/entrypoints/init.ts:95`）、初始化 remote settings/policy limits loading promise（`src/entrypoints/init.ts:100`）、记录 first start time（`src/entrypoints/init.ts:109`）、配置 mTLS/proxy/global agents（`src/entrypoints/init.ts:113`、`src/entrypoints/init.ts:123`）、预连接 Anthropic API（`src/entrypoints/init.ts:136`）、远程 CCR upstream proxy（`src/entrypoints/init.ts:144`）、注册 LSP/团队清理、scratchpad 初始化。
8. **default action 启动会话**：`src/main.tsx:1016` 的 `.action()` 处理 prompt/options；读取输入、工具、MCP 配置、setup、commands/agents。
9. **setup() 核心初始化**：`src/setup.ts:56` 检查 Node 版本、设置自定义 session、启动 UDS messaging、恢复终端备份、`setCwd()`、捕获 hooks config、初始化 FileChanged watcher、处理 worktree、初始化 session memory/context collapse、锁版本、预热命令/插件 hooks、注册 session file access/team memory watcher、`initSinks()`、打 `tengu_started`、预取 apiKey helper、检查 release notes/recent activity、校验 bypass permission 安全条件。
10. **分流执行**：如果是 `--print`，进入 `src/main.tsx:2592` 的 headless 分支，最终 import 并调用 `runHeadless()`（`src/main.tsx:2840`）；否则构建 Ink root，调用 REPL/remote/resume 相关逻辑。

## 项目全局配置、环境变量、运行时参数是如何加载与注入源码实现？

配置体系有三类来源：旧全局 config、settings 系统、CLI/runtime 参数。

- **旧全局 config**：`src/utils/config.ts:189` 定义 `GlobalConfig`，包含 `projects`、`theme`、`verbose`、`primaryApiKey`、`env`、`autoCompactEnabled` 等；`src/utils/config.ts:75` 定义 `ProjectConfig`，保存项目级历史、信任、MCP、worktree session 等。该文件还提供 `getOrCreateUserID()`、`recordFirstStartTime()` 等持久化逻辑（`src/utils/config.ts:1793`、`src/utils/config.ts:1804`）。
- **settings.json/managed settings**：`src/utils/settings/settings.ts:177` 的 `parseSettingsFile()` 读取并用 Zod schema 校验 settings；`loadManagedFileSettings()` 合并 `managed-settings.json` 和 drop-in 文件（`src/utils/settings/settings.ts:73`）。setting source 包括 user/project/local/policy/flag 等，`getSettingsRootPathForSource()` 在 `src/utils/settings/settings.ts:238` 按 source 定位根目录。
- **CLI flag 注入**：`src/main.tsx:508` 的 `eagerLoadSettings()` 在 `init()` 前解析 `--settings` 和 `--setting-sources`，确保初始化阶段能看到 flag settings；`src/main.tsx:438` 的 `loadSettingsFromFlag()` 支持 JSON 字符串或文件路径。
- **Commander 参数解析**：`src/main.tsx:978` 之后注册大量全局参数，如 `--debug`、`--print`、`--bare`、`--output-format`、`--permission-mode`、`--continue`、`--resume`、`--model`、`--settings`、`--add-dir`、`--session-id`、`--agents` 等；这些参数在 `.action()` 内被归一化并传入 setup、工具权限、headless/REPL。
- **安全 env 注入**：`src/utils/managedEnv.ts:123` 的 `applySafeConfigEnvironmentVariables()` 会在信任对话框前执行，只应用用户/flag/policy 等可信来源的 env，以及 project/local 中 `SAFE_ENV_VARS` 白名单内的 env。注释明确说明 project-scoped env 可能恶意重定向 API（`src/utils/managedEnv.ts:92` 到 `src/utils/managedEnv.ts:103`）。
- **完整 env 注入**：`src/utils/managedEnv.ts:186` 的 `applyConfigEnvironmentVariables()` 在信任建立后执行，把全局 config 和 merged settings env 注入 `process.env`，然后清理 CA/mTLS/proxy 缓存并重新配置 global agents（`src/utils/managedEnv.ts:191` 到 `src/utils/managedEnv.ts:197`）。`--print` 因为跳过 trust dialog，被视为 trusted，会在 `src/main.tsx:2598` 到 `src/main.tsx:2601` 直接应用完整 env。
- **运行时状态注入**：`src/bootstrap/state.ts` 暴露 setter/getter，例如 `setIsInteractive()`/`getIsNonInteractiveSession()`（`src/bootstrap/state.ts:1061` 到 `src/bootstrap/state.ts:1070`）、`setClientType()`、`setFlagSettingsPath()`、`setSdkBetas()` 等。CLI 参数和 entrypoint 会写入这里，后续 query、tool、UI 统一读取。
- **构建时注入**：`src/entrypoints/cli.tsx:5` 在 dev 时补 `MACRO`，生产构建由 build define 注入版本/包名等；项目还大量使用 `feature('FLAG')` 做编译期 dead-code elimination。`configs/args.json` 这类构建参数会在构建脚本中注入为 `process.env.ARGS_*`，源码再用运行时 env 覆盖构建默认值；例如工具并发上限的优先级是运行时 `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` 高于 `ARGS_MAX_TOOL_USE_CONCURRENCY`，最后才回退到默认值。类似模式也用于上下文窗口、自动 compact 阈值、文件读取 token 上限等参数。

## 源码中如何区分命令行交互、后台运行、会话模式三种运行形态？

源码主要用“entrypoint fast-path + 全局 interactive 状态 + 不同 runner”区分三种运行形态。

### 1. 命令行交互模式

交互模式是默认路径：没有 `-p/--print` 且未命中特殊 fast-path。`initializeEntrypoint()` 会把 `CLAUDE_CODE_ENTRYPOINT` 设为 `cli`（`src/main.tsx:523` 到 `src/main.tsx:545`）。全局状态中 `getIsNonInteractiveSession()` 返回 `!STATE.isInteractive`（`src/bootstrap/state.ts:1061`），交互模式下为 false。

交互模式会走 `setup()`，建立 Ink root，然后进入 REPL。REPL 会显示 UI、处理 trust dialog、IDE、MCP 状态、权限弹窗、resume picker 等。相关入口在 `src/main.tsx` 的 default action 后半段；远程/assistant/resume 最终都通过 `launchRepl()` 启动，如 assistant attach 在 `src/main.tsx:3353`，remote TUI 在 `src/main.tsx:3502`。`launchRepl()` 本身是一个轻量动态加载边界：`src/replLauncher.tsx:12` 定义函数，`src/replLauncher.tsx:13` 到 `src/replLauncher.tsx:18` 动态 import `App` 和 `REPL`，再在 `src/replLauncher.tsx:19` 到 `src/replLauncher.tsx:21` 组合 `<App><REPL /></App>` 后交给 Ink root 渲染。这样 main 启动阶段不必立即求值完整 React UI 树。

### 2. 后台运行模式

后台运行有两层：

- **命令 fast-path 的后台 session 管理**：`src/entrypoints/cli.tsx:221` 检测 `ps|logs|attach|kill` 或 `--bg/--background`，只加载 `src/cli/bg.js`，执行 `psHandler/logsHandler/attachHandler/killHandler/handleBgFlag`。这是对 `~/.claude/sessions/` registry 的快速管理路径，不加载完整 UI。
- **daemon/worker 常驻后台**：`src/entrypoints/cli.tsx:138` 处理 `--daemon-worker`，`src/entrypoints/cli.tsx:203` 处理 `daemon` 子命令，加载 `src/daemon/workerRegistry.js` 或 `src/daemon/main.js`。这类进程是 supervisor/worker 模式，注释明确说 worker 保持 lean，不在 bootstrap 层初始化完整 configs/analytics。

此外，交互/print 内部也会启动 background housekeeping，例如 `setup()` 中插件 hooks、team memory watcher、session access hooks 是 fire-and-forget（`src/setup.ts:325`、`src/setup.ts:363`、`src/setup.ts:367`），`startDeferredPrefetches()` 在首屏后异步预取用户上下文、系统上下文、analytics gates 等（`src/main.tsx:400` 到 `src/main.tsx:435`）。

### 3. 会话模式 / 非交互 headless / SDK 模式

`-p/--print` 是非交互 headless 入口。Commander 参数定义在 `src/main.tsx:986`；`src/main.tsx:3898` 会在 print mode 跳过大量子命令注册，减少启动开销。default action 中 `src/main.tsx:2592` 进入 `--print mode` 分支：设置 formatted output、应用完整 env、初始化 telemetry、启动 SessionStart hooks、构建 headless `AppState`，最后调用 `runHeadless()`（`src/main.tsx:2840` 到 `src/main.tsx:2875`）。

`src/cli/print.ts:682` 之后加载 initial messages，支持 `--continue`、`--resume`、`--resume-session-at`、`--fork-session`、SDK URL、deferred tool resume 等；`src/cli/print.ts:782` 到 `src/cli/print.ts:819` 校验 headless 输入要求。

会话恢复/远程会话是交互与 headless 都会用到的“session mode”能力。交互 resume 逻辑从 `src/main.tsx:3370` 开始，支持 session id、自定义 title、PR filter、teleport/remote、transcript file 等；headless resume 则在 `runHeadless()` 的 `loadInitialMessages()` 阶段处理（`src/cli/print.ts:682` 到 `src/cli/print.ts:698`）。

## 依赖注入 / 模块解耦在源码里用了什么设计模式，具体体现在哪段代码？

项目没有使用传统 IoC 容器，而是组合了几类轻量解耦模式：

1. **函数依赖对象（Dependency Parameter Object）**  
   `src/query/deps.ts:20` 定义 `QueryDeps`，把 `callModel`、`microcompact`、`autocompact`、`uuid` 作为可替换依赖；`productionDeps()` 在 `src/query/deps.ts:32` 返回真实实现。注释说明这是为测试注入 fake，避免到处 spy module（`src/query/deps.ts:7` 到 `src/query/deps.ts:19`）。`src/query.ts:405` 在参数里接受 `deps?: QueryDeps`，`QueryEngineConfig` 也允许 headless goal test overrides 注入 `queryDeps`（`src/QueryEngine.ts:557` 到 `src/QueryEngine.ts:565`）。这是最典型的依赖注入。

2. **配置对象 + 构造器注入**  
   `src/QueryEngine.ts:526` 定义 `QueryEngineConfig`，把 cwd、tools、commands、mcpClients、agents、canUseTool、getAppState/setAppState、transcriptRecorder、abortController 等都作为构造参数；`QueryEngine` 构造函数在 `src/QueryEngine.ts:607` 接收并保存 config。这样 QueryEngine 不直接依赖 React store 或 CLI 全局对象，headless/SDK 可以复用。

3. **Strategy / Adapter 模式**  
   API provider、MCP、工具、权限等都通过统一接口适配不同实现。比如 query 层只调用 `queryModelWithStreaming`、`runTools`，实际 provider 分布在 `src/services/api/`；工具池由 `assembleToolPool()` / `getTools()` 组合，具体工具在 `src/tools/`。权限判断通过 `CanUseToolFn` 注入，`QueryEngine.submitMessage()` 内还包装一层 `wrappedCanUseTool` 来记录 SDK permission denial（`src/QueryEngine.ts:653` 到 `src/QueryEngine.ts:681`）。

4. **动态 import + feature gate 解耦**  
   大量模块使用 `feature('FLAG')` 加动态 `require/import`，既减少启动成本，又让功能编译期可裁剪。例子：`src/query.ts:15` 按 `REACTIVE_COMPACT` 加载 reactive compact；`src/QueryEngine.ts:142` 按 `COORDINATOR_MODE` 加载 coordinator；`src/entrypoints/cli.tsx:39` 注释说明所有 fast-path 用动态 import 减少模块求值。

5. **事件/Hook/Sink 模式**  
   日志和 analytics 不是直接在所有地方写文件/网络，而是先 queue，初始化 sinks 后 drain。`src/utils/log.ts:89` 定义 queued error event，`attachErrorLogSink()` 在 `src/utils/log.ts:108` 挂 sink 并 drain。`setup()` 和 `preAction` 都会调用 `initSinks()`，确保子命令和默认会话都能记录事件（`src/main.tsx:934` 到 `src/main.tsx:942`、`src/setup.ts:372`）。Hook 系统也通过 settings 定义并由 setup 捕获快照（`src/setup.ts:163` 到 `src/setup.ts:172`），避免业务模块直接耦合外部自动化。

6. **全局状态 Facade**  
   `src/bootstrap/state.ts` 暴露 getter/setter，而不是让各模块直接访问可变对象。例如 logger/meter/tracer provider（`src/bootstrap/state.ts:1029` 到 `src/bootstrap/state.ts:1058`）、interactive/client/session source 等（`src/bootstrap/state.ts:1061` 到 `src/bootstrap/state.ts:1121`）。这是 Facade + module singleton 的折中方案。

7. **轻重模块分离 + 延迟挂载**  
   日志 sink 是一个典型例子：`src/utils/log.ts` 只保留轻量接口、内存队列和 `ErrorLogSink` 类型；`src/utils/errorLogSink.ts:1` 到 `src/utils/errorLogSink.ts:11` 明确说明重实现被拆出以避免 import cycle。启动时 `src/utils/sinks.ts:13` 的 `initSinks()` 调用 `initializeErrorLogSink()` 与 `initializeAnalyticsSink()`，再由 `src/utils/errorLogSink.ts:225` 的 `initializeErrorLogSink()` 通过 `attachErrorLogSink()` 挂载真实后端并 drain 早期队列。

## 项目日志分级、错误码体系在源码中如何定义与统一抛出？

日志分为 debug log、diagnostic log、error log、analytics/telemetry 几类。

- **Debug 日志分级**：`src/utils/debug.ts:17` 定义 `DebugLogLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error'`，`LEVEL_ORDER` 在 `src/utils/debug.ts:19` 给出等级顺序。最小等级通过 `CLAUDE_CODE_DEBUG_LOG_LEVEL` 控制，默认 `debug`（`src/utils/debug.ts:31` 到 `src/utils/debug.ts:42`）。
- **Debug 开关**：`isDebugMode()` 在 `src/utils/debug.ts:54` 检测 runtimeDebug、`CLAUDE_CODE_DEFAULT_DEBUG`、`DEBUG`、`DEBUG_SDK`、`--debug/-d`、`--debug-to-stderr/-D`、`--debug=pattern`、`--debug-file`。`logForDebugging()` 在 `src/utils/debug.ts:336` 统一格式化为 `timestamp [LEVEL] message`，可写 stderr 或 debug 文件；默认路径由 `getDebugLogPath()` 决定，支持 `--debug-file`、`CLAUDE_CODE_DEBUG_LOGS_DIR`、`~/.claude/debug/<timestamp>_<session>.txt`（`src/utils/debug.ts:367` 到 `src/utils/debug.ts:380`），并维护 `~/.claude/debug/latest` symlink（`src/utils/debug.ts:383` 到 `src/utils/debug.ts:395`）。
- **Diagnostic 日志**：`src/utils/diagLogs.ts:4` 定义 `DiagnosticLogLevel = 'debug' | 'info' | 'warn' | 'error'`，`logForDiagnosticsNoPII()` 写 JSON line 到 `CLAUDE_CODE_DIAGNOSTICS_FILE`（`src/utils/diagLogs.ts:26` 到 `src/utils/diagLogs.ts:60`）。注释强调不能写 PII、文件路径、repo、prompt 等。
- **Error log 统一入口**：`src/utils/log.ts:158` 的 `logError(error)` 会把 unknown 通过 `toError()` 归一为 Error，写入 in-memory error log，sink 未挂载时进入队列，sink 挂载后写持久化错误日志/MCP 日志；云 provider、`DISABLE_ERROR_REPORTING`、essential traffic only 会禁用上报（`src/utils/log.ts:167` 到 `src/utils/log.ts:176`）。真实 sink 在 `src/utils/errorLogSink.ts`：`getErrorsPath()` 和 `getMCPLogsPath()` 分别在 `src/utils/errorLogSink.ts:29`、`src/utils/errorLogSink.ts:36` 生成 JSONL 路径；`logErrorImpl()` 在 `src/utils/errorLogSink.ts:152` 到 `src/utils/errorLogSink.ts:173` 同时写 debug log 和错误 JSONL；`logMCPErrorImpl()` / `logMCPDebugImpl()` 在 `src/utils/errorLogSink.ts:179` 到 `src/utils/errorLogSink.ts:212` 写 MCP server 日志。普通 error 持久化通过 `appendToLog()` 受 `USER_TYPE === 'ant'` 限制（`src/utils/errorLogSink.ts:111` 到 `src/utils/errorLogSink.ts:125`），MCP 日志则直接写入对应 server 的 MCP log 文件。
- **错误基类与常见错误**：`src/utils/errors.ts:2` 定义 `ClaudeError`；`MalformedCommandError`、`AbortError`、`ConfigParseError`、`ShellError`、`TeleportOperationError`、`TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS` 等在 `src/utils/errors.ts:9` 到 `src/utils/errors.ts:99`。同时提供 `toError()`、`errorMessage()`、`getErrnoCode()`、`isAbortError()` 等 catch-site 归一工具（`src/utils/errors.ts:26`、`src/utils/errors.ts:110`、`src/utils/errors.ts:118`、`src/utils/errors.ts:127`）。
- **API 错误消息体系**：`src/services/api/errors.ts:51` 定义 `API_ERROR_MESSAGE_PREFIX = 'API Error'`，`PROMPT_TOO_LONG_ERROR_MESSAGE`、`CREDIT_BALANCE_TOO_LOW_ERROR_MESSAGE`、`INVALID_API_KEY_ERROR_MESSAGE`、`TOKEN_REVOKED_ERROR_MESSAGE`、`API_TIMEOUT_ERROR_MESSAGE` 等常量集中在 `src/services/api/errors.ts:59` 到 `src/services/api/errors.ts:166`。不同运行形态会给不同提示，例如 PDF/image/request too large 根据 `getIsNonInteractiveSession()` 返回 headless 或 interactive 文案（`src/services/api/errors.ts:167` 到 `src/services/api/errors.ts:192`）。
- **错误码并不完全统一成单一 enum**：源码没有一个全局 `ErrorCode` enum。错误体系更多是“类型化 Error class + errno code 提取 + API message constant + 进程退出码”。例如 settings 编辑工具存在局部 `errorCode`（可搜索到 `src/utils/settings/validateEditTool.ts:40`），shell 失败用 `ShellError.code`（`src/utils/errors.ts:50` 到 `src/utils/errors.ts:59`），CLI 校验失败多处直接 `process.stderr.write/console.error` 后 `process.exit(1)`。因此“统一抛出”的边界主要在 catch-site：配置解析错误在 `init()` 中特殊处理（`src/entrypoints/init.ts:192` 到 `src/entrypoints/init.ts:214`），普通错误用 `logError()` 记录并用 `errorMessage()` 展示；API 错误由 `src/services/api/errors.ts` 分类成 assistant API error message，再进入 query loop。
