

## 概述
本文档详细分析了 free-code CLI 工具从用户输入 prompt 开始，到模型交互，最终返回呈现给用户的完整调用链。涵盖主要执行流程、压缩触发机制、系统提示词处理和工具调用机制。

## 目录
1. [整体架构概览](#整体架构概览)
2. [用户输入到模型响应的完整流程](#用户输入到模型响应的完整流程)
3. [压缩触发与处理机制](#压缩触发与处理机制)
4. [系统提示词处理](#系统提示词处理)
5. [工具调用机制](#工具调用机制)
6. [关键代码文件路径](#关键代码文件路径)

## 整体架构概览
```plain
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   REPL.tsx UI   │───▶│  QueryEngine    │───▶│   Model API     │
│   (用户输入)    │    │   (查询引擎)    │    │   (Claude API)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ PromptInput     │    │   query.ts     │    │  模型响应处理   │
│   (输入处理)    │    │   (查询逻辑)    │    │   (响应解析)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  工具执行 &     │
                                                │  结果渲染       │
                                                └─────────────────┘
```

## 用户输入到模型响应的完整流程
### 1. 用户输入处理 (`src/screens/REPL.tsx`)
**入口点**: `screens/REPL.tsx:3162`

```typescript
const onSubmit = useCallback(async (input: string, helpers: PromptInputHelpers, speculationAccept?: {
```

**主要步骤**:

1. **输入接收**: `PromptInput` 组件接收用户输入
2. **输入验证**: 验证输入格式和长度
3. **上下文更新**: 更新应用状态和会话状态
4. **权限检查**: 检查工具使用权限
5. **消息预处理**: 创建用户消息对象

**关键代码**:

+ `screens/REPL.tsx:846-849`: 输入验证和预处理
+ `screens/REPL.tsx:3162-3170`: onSubmit 回调处理

### 2. 查询引擎启动 (`src/QueryEngine.ts`)
**入口点**: `QueryEngine.ts:35`

```typescript
import { query } from './query.js'
```

**主要步骤**:

1. **状态初始化**: 初始化查询上下文和工具使用上下文
2. **工具准备**: 获取可用工具列表和权限设置
3. **系统提示词构建**: 构建完整的系统提示词
4. **消息组装**: 组装系统消息、用户消息和历史消息

**关键代码**:

+ `QueryEngine.ts:565`: 工具上下文初始化
+ `QueryEngine.ts:35`: 查询函数调用

### 3. 查询处理 (`src/query.ts`)
**入口点**: `query.ts:100`

主要流程分解:

#### 3.1 消息准备阶段
1. **消息标准化**: `normalizeMessagesForAPI()`
2. **上下文构建**: 构建完整的对话上下文
3. **压缩检查**: 检查是否需要压缩上下文

#### 3.2 系统提示词处理
1. **基础系统提示词**: `getSystemPrompt()`
2. **用户上下文**: `getUserContext()`
3. **系统上下文**: `getSystemContext()`
4. **自定义提示词**: 处理用户自定义系统提示词

#### 3.3 压缩触发逻辑 (`query.ts:600-800`)
```typescript
// 检查是否需要自动压缩
export function calculateTokenWarningState(...)
// 压缩处理
export function buildPostCompactMessages(...)
```

#### 3.4 API 调用
1. **模型选择**: 根据配置选择合适的模型
2. **请求构造**: 构造 Anthropic API 请求
3. **流式处理**: 处理模型响应流
4. **工具调用处理**: 处理模型发起的工具调用

### 4. 模型 API 调用 (`src/services/api/`)
**关键文件**:

+ `claude.ts`: Claude API 客户端
+ `withRetry.ts`: 带重试机制 API 调用

**主要流程**:

1. **认证**: 验证 API 密钥或 OAuth 令牌
2. **请求发送**: 发送请求到 Anthropic API
3. **响应处理**: 处理流式响应
4. **错误处理**: 处理各种错误情况

### 5. 响应处理与渲染
#### 5.1 工具调用执行 (`src/services/tools/toolOrchestration.ts`)
```typescript
export async function* runTools(
  toolUseMessages: ToolUseBlock[],
  assistantMessages: AssistantMessage[],
  canUseTool: CanUseToolFn,
  toolUseContext: ToolUseContext,
): AsyncGenerator<MessageUpdate, void>
```

#### 5.2 工具调度策略
1. **并发执行**: 安全的工具调用并发执行
2. **顺序执行**: 有依赖关系的工具顺序执行
3. **权限验证**: 每个工具执行前的权限检查

#### 5.3 结果渲染 (`src/components/`)
+ `AssistantTextMessage.tsx`: 助手文本消息渲染
+ `ToolUseSummaryMessage.tsx`: 工具使用摘要渲染
+ `VirtualMessageList.tsx`: 虚拟消息列表渲染

## 压缩触发与处理机制
### 自动压缩 (`src/services/compact/autoCompact.ts`)
#### 压缩触发条件 (`autoCompact.ts:76-100`)
```typescript
export function getAutoCompactThreshold(model: string): number {
  const effectiveContextWindow = getEffectiveContextWindowSize(model)

  // 主要公式：基于百分比的自动压缩
  const argsPct = process.env.ARGS_AUTOCOMPACT_PCT
  let autocompactThreshold: number
  if (argsPct) {
    const parsed = parseFloat(argsPct)
    autocompactThreshold = !isNaN(parsed) && parsed > 0 && parsed <= 100
      ? Math.floor(effectiveContextWindow * (parsed / 100))
      : effectiveContextWindow - AUTOCOMPACT_BUFFER_TOKENS
  } else {
    autocompactThreshold = effectiveContextWindow - AUTOCOMPACT_BUFFER_TOKENS
  }
}
```

#### 关键配置常量
```typescript
export const AUTOCOMPACT_BUFFER_TOKENS = 13_000        // 自动压缩缓冲区
export const WARNING_THRESHOLD_BUFFER_TOKENS = 20_000  // 警告阈值缓冲区
export const ERROR_THRESHOLD_BUFFER_TOKENS = 20_000   // 错误阈值缓冲区
export const MANUAL_COMPACT_BUFFER_TOKENS = 3_000     // 手动压缩缓冲区
```

#### 压缩策略层级
1. **警告级别**: 接近限制时显示警告
2. **自动压缩**: 达到阈值时自动压缩
3. **手动压缩**: 用户主动触发压缩
4. **错误处理**: 超过限制时处理错误

### 压缩执行流程 (`src/services/compact/compact.ts`)
#### 主要压缩方法
1. **微压缩**: `compactConversation()` - 对话压缩
2. **会话内存压缩**: `trySessionMemoryCompaction()` - 会话内存压缩
3. **响应式压缩**: `reactiveCompact()` - 响应式压缩

#### 压缩后的消息构建
```typescript
export function buildPostCompactMessages(
  messages: Message[],
  compactResult: CompactionResult,
): Message[] {
  // 构建压缩后的消息列表
}
```

### 压缩触发时机
#### 1. 基于阈值的触发
+ **自动压缩阈值**: `getAutoCompactThreshold()`
+ **警告阈值**: `getWarningThreshold()`
+ **错误阈值**: `getErrorThreshold()`

#### 2. 基于事件的触发
+ **工具使用结果**: 大工具结果触发压缩
+ **消息添加**: 新消息添加时检查
+ **上下文分析**: 上下文分析后决定

#### 3. 手动触发
+ **用户命令**: `/compact` 命令
+ **菜单操作**: UI 中的压缩选项
+ **配置变更**: 配置变化时触发

## 系统提示词处理
### 系统提示词构建 (`src/utils/systemPrompt.ts`)
#### 优先级顺序
```typescript
export function buildEffectiveSystemPrompt({
  mainThreadAgentDefinition,
  toolUseContext,
  customSystemPrompt,
  defaultSystemPrompt,
  appendSystemPrompt,
  overrideSystemPrompt,
}: {
  // 0. 覆盖系统提示词（最高优先级）
  // 1. 协调器系统提示词（协调器模式激活时）
  // 2. 代理系统提示词（设置时）
  // 3. 自定义系统提示词（--system-prompt 指定）
  // 4. 默认系统提示词（标准 Claude Code 提示词）
}): SystemPrompt[] {
```

#### 提示词组成结构
1. **基础提示词**: `getSystemPrompt()` - 标准系统指令
2. **用户上下文**: `getUserContext()` - 用户相关上下文
3. **系统上下文**: `getSystemContext()` - 系统配置上下文
4. **工具描述**: 可用工具的描述和用法
5. **代理特定**: 特定代理的额外指令

#### 条件性内容注入
```typescript
// 根据功能标志注入
if (feature('BUILTIN_EXPLORE_PLAN_AGENTS')) {
  // 添加探索/计划代理提示词
}

// 根据配置注入
if (isScratchpadEnabled()) {
  // 添加便签本功能提示词
}

// 根据权限注入
if (toolUseContext.options.permissionMode) {
  // 添加权限相关提示词
}
```

### 提示词管理功能
#### 提示词缓存
+ **内存缓存**: 减少重复构建开销
+ **文件缓存**: 跨会话提示词缓存
+ **版本管理**: 提示词版本控制

#### 提示词安全处理
+ **敏感信息过滤**: 移除或标记敏感内容
+ **长度限制**: 确保不超过 API 限制
+ **格式验证**: 验证提示词格式

#### 动态提示词构建
```typescript
// 基于当前状态动态构建
const stateDependentPrompt = buildDynamicPrompt({
  currentTask: getCurrentTask(),
  availableTools: getAvailableTools(),
  recentActions: getRecentActions(),
  userPreferences: getUserPreferences(),
})
```

## 工具调用机制
### 工具注册与发现 (`src/Tool.ts`)
#### 工具类型定义
```typescript
export type Tools = {
  [toolName: string]: Tool
}

export type Tool = {
  name: string
  description: string
  inputSchema: JSONSchema
  executor: ToolExecutor
  validateInput?: (input: any) => ValidationResult
  progress?: ProgressCallback
}
```

#### 工具注册流程
1. **工具发现**: 扫描工具目录
2. **验证**: 验证工具定义
3. **注册**: 注册到工具注册表
4. **权限检查**: 设置工具权限

### 工具执行调度 (`src/services/tools/toolOrchestration.ts`)
#### 执行策略
```typescript
export async function* runTools(
  toolUseMessages: ToolUseBlock[],
  assistantMessages: AssistantMessage[],
  canUseTool: CanUseToolFn,
  toolUseContext: ToolUseContext,
): AsyncGenerator<MessageUpdate, void>
```

#### 并发控制
```typescript
function getMaxToolUseConcurrency(): number {
  return (
    parseInt(
      process.env.CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY ||
        process.env.ARGS_MAX_TOOL_USE_CONCURRENCY ||
        '10',
      10,
    ) || 10
  )
}
```

#### 工具分区执行
1. **安全并发**: 无副作用的工具并发执行
2. **顺序执行**: 有依赖关系的工具顺序执行
3. **批处理**: 大量工具的批处理执行

### 工具权限管理
#### 权限模式
```typescript
export type PermissionMode =
  | 'auto'      // 自动批准安全操作
  | 'approve'   // 需要用户批准
  | 'deny'      // 拒绝所有操作
  | 'local'     // 本地文件系统操作
```

#### 权限检查流程
1. **预检查**: 执行前的权限验证
2. **运行时检查**: 执行中的动态检查
3. **后验证**: 执行结果验证

### 工具结果处理
#### 结果标准化
```typescript
export type ToolResult = {
  success: boolean
  output?: string
  error?: string
  metadata?: Record<string, any>
}
```

#### 结果缓存
+ **内存缓存**: 提高重复操作性能
+ **文件缓存**: 大结果的持久化缓存
+ **智能缓存**: 基于内容的结果去重

#### 错误处理
```typescript
export class ToolExecutionError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public originalError?: unknown
  ) {
    super(message)
  }
}
```

## 关键代码文件路径
### 核心流程文件
+ **用户输入**: `src/screens/REPL.tsx`
+ **查询引擎**: `src/QueryEngine.ts`
+ **查询逻辑**: `src/query.ts`
+ **工具执行**: `src/services/tools/toolOrchestration.ts`

### 压缩相关文件
+ **自动压缩**: `src/services/compact/autoCompact.ts`
+ **压缩执行**: `src/services/compact/compact.ts`
+ **响应式压缩**: `src/services/compact/reactiveCompact.ts`
+ **微压缩**: `src/services/compact/microCompact.ts`

### 系统提示词文件
+ **基础提示词**: `src/constants/prompts.ts`
+ **提示词构建**: `src/utils/systemPrompt.ts`
+ **提示词类型**: `src/utils/systemPromptType.ts`

### 工具相关文件
+ **工具定义**: `src/Tool.ts`
+ **工具注册**: `src/tools.ts`
+ **工具执行**: `src/services/tools/toolExecution.ts`
+ **工具权限**: `src/utils/permissions/`

### API 相关文件
+ **Claude API**: `src/services/api/claude.ts`
+ **API 客户端**: `src/services/api/anthropicSdk.js`
+ **重试机制**: `src/services/api/withRetry.ts`

这个架构展示了一个功能完整的 AI 编程助手系统，具备高效的上下文管理、智能的压缩策略、灵活的工具调用和安全的权限控制系统。整个流程从用户输入到结果渲染经过多个精心设计的处理阶段，确保了良好的用户体验和系统稳定性。


