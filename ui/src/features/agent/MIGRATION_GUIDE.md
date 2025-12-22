# 工具系统迁移指南：从自定义组件到 assistant-ui 原生组件

## 概述

我们将工具系统从自定义组件重构为使用 assistant-ui 的原生组件模式，以获得更好的集成性、类型安全和可维护性。

---

## 主要变更

### 1. 删除的文件

- ❌ `ToolApprovalPanel.tsx` - 自定义审批面板组件（已删除）

### 2. 新增的文件

- ✅ `ToolUIs.tsx` - 使用 `makeAssistantToolUI` 创建的工具 UI 组件
- ✅ `contexts/AgentContextProvider.tsx` - 提供 teamId 和 userId 的上下文
- ✅ `contexts/index.ts` - 上下文导出文件
- ✅ `examples/ToolIntegrationExample.tsx` - 完整的使用示例
- ✅ `TOOL_INTEGRATION.md` - 更新的集成文档

### 3. 修改的文件

- 🔄 `components/AgentRuntimeProvider.tsx` - 集成工具 UI 组件和上下文
- 🔄 `TOOL_INTEGRATION.md` - 更新为 assistant-ui 原生方式

---

## 架构对比

### 之前：自定义组件

```tsx
// 自定义的审批面板组件
<ToolApprovalPanel
  threadId={threadId}
  teamId={teamId}
  userId={userId}
/>

// 问题：
// - 需要手动轮询待审批的工具调用
// - 与 assistant-ui 集成不够紧密
// - 需要额外的状态管理
```

### 现在：assistant-ui 原生组件

```tsx
// 在 AgentRuntimeProvider 中自动注册
<AssistantRuntimeProvider runtime={runtime}>
  {/* 工具 UI 组件自动注册 */}
  <ApprovalToolUI />
  <WebSearchToolUI />
  <CalculatorToolUI />

  {/* 应用内容 */}
  <Thread />
</AssistantRuntimeProvider>

// 优势：
// - 自动集成到消息流
// - 使用 assistant-ui 的状态管理
// - 类型安全
// - 更简洁的代码
```

---

## 工具 UI 创建方式

### 使用 `makeAssistantToolUI`

```typescript
export const MyToolUI = makeAssistantToolUI<
  TArgs,    // 工具参数类型
  TResult   // 工具结果类型
>({
  toolName: 'my_tool',  // 必须与后端工具名称匹配
  render: ({ args, result, status, toolCallId }) => {
    // 根据状态渲染不同 UI
    if (status.type === 'running') {
      return <LoadingUI />;
    }

    if (status.type === 'requires-action') {
      return <ApprovalUI />;
    }

    if (result) {
      return <ResultUI result={result} />;
    }

    return null;
  },
});
```

### 工具状态类型

```typescript
type ToolCallMessagePartStatus =
  | { type: 'running' }                    // 执行中
  | { type: 'requires-action' }            // 需要用户操作（审批）
  | { type: 'incomplete'; reason: 'cancelled' | 'error'; error?: Error }  // 失败
  | { type: 'complete' }                   // 完成
```

---

## 审批工作流

### 之前的流程

1. 后端创建待审批的工具调用记录
2. 前端 `usePendingToolCalls` Hook 轮询（5秒一次）
3. `ToolApprovalPanel` 显示待审批列表
4. 用户点击批准/拒绝
5. 调用 `toolApi.approveToolCall()`
6. 后端继续执行

### 现在的流程

1. 后端创建待审批的工具调用记录
2. **工具调用在消息中显示，状态为 `requires-action`**
3. `ApprovalToolUI` 检测到状态，显示审批按钮
4. 用户点击批准/拒绝
5. 调用 `toolApi.approveToolCall()`
6. 工具状态更新，显示结果

**关键改进**：
- ✅ 不需要轮询
- ✅ 审批 UI 直接在消息流中
- ✅ 更好的用户体验
- ✅ 与 assistant-ui 状态同步

---

## 如何添加新工具 UI

### 步骤 1: 在 `ToolUIs.tsx` 中创建组件

```typescript
export const NewToolUI = makeAssistantToolUI<
  { param: string },
  { result: any }
>({
  toolName: 'new_tool',
  render: ({ args, result, status }) => {
    // 实现 UI 逻辑
  },
});
```

### 步骤 2: 在 `AgentRuntimeProvider.tsx` 中注册

```typescript
import { NewToolUI } from './ToolUIs';

// 在 return 中添加：
<AssistantRuntimeProvider runtime={runtime}>
  <ApprovalToolUI />
  <WebSearchToolUI />
  <NewToolUI />  {/* <-- 添加这里 */}
  {children}
</AssistantRuntimeProvider>
```

### 步骤 3: 在后端创建对应的工具

确保后端有匹配的工具定义，工具名称必须一致。

---

## 使用 ToolFallback

对于没有自定义 UI 的工具，assistant-ui 会自动使用 `ToolFallback` 组件。

**`ToolFallback` 显示**：
- 工具名称
- 输入参数（可折叠）
- 输出结果（可折叠）
- 执行状态图标

**配置位置**：`thread.tsx`

```tsx
<MessagePrimitive.Parts
  components={{
    Text: MarkdownText,
    tools: { Fallback: ToolFallback },
  }}
/>
```

**何时使用**：
- ✅ 简单工具，不需要特殊 UI
- ✅ 很少使用的工具
- ✅ 开发/测试阶段的工具

---

## 上下文系统

### AgentContextProvider

提供 `teamId` 和 `userId` 给工具 UI 组件：

```typescript
// 在组件中使用
function MyToolUI() {
  const { teamId, userId, agentId } = useAgentContext();

  // 使用这些值调用 API
  await toolApi.approveToolCall(toolCallId, approved, teamId, userId);
}
```

**重要**：`AgentContextProvider` 必须包裹在工具 UI 组件外层。

---

## API 使用

### 工具列表

```typescript
import { useToolList } from '@/features/agent/hooks/useTool';

const { data: tools } = useToolList(teamId);
```

### 工具调用历史

```typescript
import { useToolCalls } from '@/features/agent/hooks/useTool';

const { data: toolCalls } = useToolCalls(threadId, teamId);
```

### 待审批工具

```typescript
import { usePendingToolCalls } from '@/features/agent/hooks/useTool';

const { data: pendingCalls } = usePendingToolCalls(threadId, teamId);
// 仍然可用，但通常不需要显式使用
// 工具会在消息中自动显示审批 UI
```

### 审批工具

```typescript
import { toolApi } from '@/features/agent/api/agent-api';

await toolApi.approveToolCall(toolCallId, approved, teamId, userId);
```

---

## 迁移检查清单

如果你有现有的代码使用旧的 `ToolApprovalPanel`：

- [ ] 删除所有 `<ToolApprovalPanel />` 引用
- [ ] 确保 `AgentRuntimeProvider` 已更新到新版本
- [ ] 确认工具 UI 组件已注册
- [ ] 测试工具审批流程
- [ ] 检查是否需要创建自定义工具 UI
- [ ] 验证 `ToolFallback` 正常工作

---

## 常见问题

### Q: 我的工具没有显示审批 UI？

**A**: 检查：
1. 后端工具是否设置了 `needsApproval: true`
2. 工具调用状态是否为 `requires-action`
3. `ApprovalToolUI` 是否已在 `AgentRuntimeProvider` 中注册

### Q: 如何为特定工具自定义审批 UI？

**A**: 创建一个专门的工具 UI 组件：

```typescript
export const MySpecialToolUI = makeAssistantToolUI({
  toolName: 'my_special_tool',
  render: ({ status, args, resume }) => {
    if (status.type === 'requires-action') {
      return <CustomApprovalUI onApprove={...} />;
    }
    // ... 其他状态
  },
});
```

### Q: ToolFallback 和自定义 Tool UI 哪个优先？

**A**: 自定义 Tool UI 优先。如果有匹配的 `makeAssistantToolUI` 组件，将使用它；否则使用 `ToolFallback`。

### Q: 如何调试工具 UI？

**A**:
1. 检查 `status` 对象的值
2. 确认 `toolName` 匹配
3. 在 render 函数中添加 `console.log`
4. 使用 React DevTools 查看组件树

---

## 资源链接

- [TOOL_INTEGRATION.md](./TOOL_INTEGRATION.md) - 完整集成文档
- [ToolIntegrationExample.tsx](./examples/ToolIntegrationExample.tsx) - 使用示例
- [assistant-ui 官方文档](https://docs.assistant-ui.com) - assistant-ui 文档

---

## 总结

新的工具系统更加：
- ✅ **标准化** - 遵循 assistant-ui 最佳实践
- ✅ **类型安全** - 完整的 TypeScript 支持
- ✅ **易维护** - 更少的自定义代码
- ✅ **用户友好** - 更好的 UX
- ✅ **可扩展** - 易于添加新工具

迁移到新系统将使代码更简洁、更可靠，并且更容易维护！
