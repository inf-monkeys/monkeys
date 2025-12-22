# Agent 工具系统集成文档 (使用 assistant-ui 原生组件)

## 概述

Agent 工具系统已完全集成到前端，使用 **assistant-ui 的原生组件**实现：
- ✅ 工具管理 API
- ✅ Agent 配置中的工具选择器
- ✅ 消息中的工具调用显示（使用 `ToolFallback`）
- ✅ 工具审批 UI（使用 `makeAssistantToolUI`）

---

## 架构设计

### assistant-ui 工具系统

我们使用 assistant-ui 的原生工具系统，而不是自定义组件：

1. **Tool UI Components** - 使用 `makeAssistantToolUI` 创建
2. **ToolFallback** - 内置的默认工具 UI
3. **Tool Execution** - 后端处理，前端仅展示
4. **HITL Approval** - 使用工具状态管理

### 组件层次

```
AssistantRuntimeProvider
  ├─ AgentContextProvider (提供 teamId, userId)
  │   ├─ ApprovalToolUI (通用审批 UI)
  │   ├─ WebSearchToolUI (Web 搜索工具 UI)
  │   ├─ CalculatorToolUI (计算器工具 UI)
  │   └─ Thread
  │       └─ MessagePrimitive.Parts
  │           └─ tools: { Fallback: ToolFallback }
```

---

## 新增文件

### 1. **工具 UI 组件** - `ToolUIs.tsx`

使用 `makeAssistantToolUI` 创建的工具 UI 组件：

```typescript
// 通用审批工具 UI
export const ApprovalToolUI = makeAssistantToolUI<
  Record<string, unknown>,
  unknown
>({
  toolName: '*', // 匹配所有工具
  render: ({ toolName, args, result, status, toolCallId }) => {
    // 根据 status.type 显示不同状态
    // - 'requires-action': 显示审批 UI
    // - 'running': 显示加载状态
    // - 'incomplete': 显示错误或取消状态
    // - 完成: 显示结果
  },
});

// 特定工具的自定义 UI
export const WebSearchToolUI = makeAssistantToolUI<
  { query: string },
  { results: Array<{...}> }
>({
  toolName: 'web_search',
  render: ({ args, result, status }) => {
    // 自定义的搜索结果显示
  },
});
```

### 2. **Agent 上下文** - `AgentContextProvider.tsx`

提供 `teamId` 和 `userId` 给工具 UI 组件：

```typescript
export function AgentContextProvider({ teamId, userId, children }) {
  // 提供上下文给子组件
}

export function useAgentContext() {
  // Hook to access teamId, userId
}
```

### 3. **更新的 AgentRuntimeProvider**

集成工具 UI 组件：

```tsx
<AssistantRuntimeProvider runtime={runtime}>
  {/* 注册工具 UI 组件 */}
  <ApprovalToolUI />
  <WebSearchToolUI />
  <CalculatorToolUI />

  {/* 应用内容 */}
  {children}
</AssistantRuntimeProvider>
```

---

## 使用示例

### 1. 添加新的工具 UI

创建自定义工具 UI 组件：

```tsx
// 在 ToolUIs.tsx 中
export const MyCustomToolUI = makeAssistantToolUI<
  { param1: string },
  { result: string }
>({
  toolName: 'my_custom_tool',
  render: ({ args, result, status }) => {
    if (status.type === 'running') {
      return <div>Loading...</div>;
    }

    if (result) {
      return <div>Result: {result.result}</div>;
    }

    return null;
  },
});

// 在 AgentRuntimeProvider 中注册
<AssistantRuntimeProvider runtime={runtime}>
  <MyCustomToolUI />
  {children}
</AssistantRuntimeProvider>
```

### 2. 工具审批流程

审批流程通过工具状态自动处理：

1. **后端工具需要审批**：
   - 工具元数据包含 `needsApproval: true`
   - 后端 `AgentToolExecutorService` 等待审批

2. **前端显示审批 UI**：
   - `ApprovalToolUI` 检测到 `status.type === 'requires-action'`
   - 显示审批按钮
   - 用户点击批准/拒绝

3. **审批通过/拒绝**：
   - 调用 `toolApi.approveToolCall(toolCallId, approved, teamId, userId)`
   - 后端继续/取消工具执行
   - 状态更新，UI 显示结果

### 3. 使用默认 ToolFallback

对于没有自定义 UI 的工具，assistant-ui 会自动使用 `ToolFallback`：

```tsx
// 在 thread.tsx 中已配置
<MessagePrimitive.Parts
  components={{
    Text: MarkdownText,
    tools: { Fallback: ToolFallback }, // 默认工具 UI
  }}
/>
```

`ToolFallback` 会显示：
- 工具名称
- 输入参数（可折叠）
- 输出结果（可折叠）
- 执行状态

---

## 工具状态类型

assistant-ui 的工具状态类型：

```typescript
type ToolCallMessagePartStatus =
  | { type: 'running' }
  | { type: 'requires-action'; reason?: string }
  | { type: 'incomplete'; reason: 'cancelled' | 'error'; error?: Error }
  | { type: 'complete' };
```

---

## 后端 API 端点

### 工具列表
```
GET /api/tools?teamId={teamId}
```

### 工具调用历史
```
GET /api/agents/threads/:threadId/tool-calls?teamId={teamId}
```

### 待审批工具
```
GET /api/agents/threads/:threadId/tool-calls/pending?teamId={teamId}
```

### 审批工具调用
```
POST /api/agents/tool-calls/:toolCallId/approve
Body: { approved: boolean, teamId: string, userId: string }
```

### 工具统计
```
GET /api/agents/tool-calls/stats?teamId={teamId}&period=day
```

---

## 与 assistant-ui 的集成

### 工具 UI 注册

工具 UI 组件通过在 `AssistantRuntimeProvider` 内渲染来注册：

```tsx
<AssistantRuntimeProvider runtime={runtime}>
  {/* 这些组件会自动注册到 assistant-ui */}
  <ApprovalToolUI />
  <WebSearchToolUI />
  <MyCustomToolUI />

  {/* 应用内容 */}
  <Thread />
</AssistantRuntimeProvider>
```

### 工具显示优先级

1. **自定义 Tool UI** - 如果有匹配的 `makeAssistantToolUI` 组件
2. **ToolFallback** - 默认 UI，显示工具名称、参数和结果

---

## 优势

使用 assistant-ui 原生组件的优势：

1. **标准化** - 遵循 assistant-ui 的最佳实践
2. **类型安全** - 完整的 TypeScript 类型支持
3. **自动集成** - 与 assistant-ui 运行时无缝集成
4. **简化维护** - 无需维护自定义组件
5. **扩展性强** - 易于添加新工具 UI

---

## 注意事项

1. **工具必须先创建**：在 Agent 配置中选择工具前，需要先在后端创建工具
2. **工具 UI 是可选的**：没有自定义 UI 的工具会使用 `ToolFallback`
3. **审批是后端驱动的**：前端仅显示 UI，实际审批逻辑在后端
4. **上下文提供**：确保 `AgentContextProvider` 在工具 UI 组件之上

---

## 下一步

可以考虑添加：

- 更多专用工具 UI（图像生成、数据可视化等）
- 工具执行进度显示
- 工具调用历史页面
- 批量审批功能
- 工具性能监控图表
