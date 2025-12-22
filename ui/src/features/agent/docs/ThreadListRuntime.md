# ThreadListRuntime 使用指南

## 概述

`useThreadListRuntime` 实现了 assistant-ui 的 ThreadListRuntime,提供完整的多线程聊天管理功能。

## 核心特性

- ✅ 多线程管理(创建、切换、重命名、删除)
- ✅ 流式消息响应
- ✅ 工具调用支持
- ✅ 自动消息同步
- ✅ 状态管理

## 快速开始

### 1. 基础用法

```tsx
import { AgentRuntimeProvider } from '@/features/agent';
import { Thread } from '@/components/assistant-ui/thread';

function ChatPage() {
  const teamId = 'your-team-id';
  const userId = 'your-user-id';
  const agentId = 'optional-agent-id';

  return (
    <AgentRuntimeProvider teamId={teamId} userId={userId} agentId={agentId}>
      <div className="flex h-screen">
        <ThreadListSidebar />
        <Thread />
      </div>
    </AgentRuntimeProvider>
  );
}
```

### 2. 使用 ThreadList 组件

```tsx
import { ThreadList } from '@/components/assistant-ui/thread-list';

function ThreadListSidebar() {
  return (
    <aside className="w-64 border-r">
      <ThreadList />
    </aside>
  );
}
```

### 3. 自定义 Hook 用法

如果需要更多控制,可以直接使用 hook:

```tsx
import { useThreadListRuntime } from '@/features/agent';
import { AssistantRuntimeProvider } from '@assistant-ui/react';

function CustomChatProvider({ children }) {
  const { runtime, isLoadingThreads, currentThreadId, threads } = useThreadListRuntime({
    teamId: 'your-team-id',
    userId: 'your-user-id',
    agentId: 'optional-agent-id',
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {isLoadingThreads ? <LoadingSpinner /> : children}
    </AssistantRuntimeProvider>
  );
}
```

## API 参考

### useThreadListRuntime

```typescript
function useThreadListRuntime(options: UseThreadListRuntimeOptions): {
  runtime: AssistantRuntime;
  isLoadingThreads: boolean;
  currentThreadId: string | null;
  threads: Thread[];
}
```

#### 参数

- `teamId` (必需): 团队 ID
- `userId` (必需): 用户 ID
- `agentId` (可选): Agent ID

#### 返回值

- `runtime`: assistant-ui 的 Runtime 对象
- `isLoadingThreads`: 是否正在加载线程列表
- `currentThreadId`: 当前活动的线程 ID
- `threads`: 线程列表

## ThreadList Adapter 功能

Runtime 自动提供以下功能:

### 1. 创建新线程

```tsx
// UI 会自动提供"新建对话"按钮
<ThreadList />
```

### 2. 切换线程

点击线程列表中的任意线程即可切换。

### 3. 重命名线程

```tsx
// 使用 ThreadListItemPrimitive 的重命名功能
<ThreadListItemPrimitive.Title />
```

### 4. 删除线程

```tsx
// ThreadList 组件已包含删除按钮
<ThreadListItemPrimitive.Delete />
```

## 流式响应处理

Runtime 自动处理以下类型的流式事件:

- `content_delta`: 文本内容增量更新
- `tool_call`: 工具调用
- `tool_result`: 工具执行结果
- `done`: 完成
- `error`: 错误

## 状态管理

Runtime 内部管理以下状态:

- **Thread 列表**: 所有可用的对话线程
- **当前 Thread**: 当前活动的线程
- **消息列表**: 每个线程的消息历史
- **运行状态**: 是否正在生成响应

## 错误处理

Runtime 会自动捕获并记录以下错误:

- Thread 列表加载失败
- 消息加载失败
- 发送消息失败
- Thread 操作失败(创建、删除等)

错误会在控制台输出,不会中断用户操作。

## 注意事项

1. **初始化加载**: Runtime 会在挂载时自动加载 thread 列表
2. **消息持久化**: 消息通过后端 API 自动持久化
3. **状态同步**: Thread 切换时会自动加载对应的消息历史
4. **清理**: 删除 thread 时会同时清理本地状态和远程数据

## 扩展功能

### 添加归档支持

当前实现预留了归档功能接口,可以通过以下方式实现:

```typescript
// 在 Thread 类型中添加状态字段
interface Thread {
  // ...
  archived?: boolean;
}

// 更新 onArchive 和 onUnarchive 实现
onArchive: async (threadId: string) => {
  await threadApi.updateThread(threadId, teamId, {
    metadata: { ...thread.metadata, archived: true }
  });
},
```

### 添加标签支持

```typescript
// 在 ThreadMetadata 中添加标签
interface ThreadMetadata {
  tags?: string[];
}

// 使用标签过滤线程
const filteredThreads = threads.filter(t =>
  t.metadata?.tags?.includes('important')
);
```

## 性能优化建议

1. **消息分页**: 对于长对话,考虑实现消息分页加载
2. **虚拟滚动**: ThreadList 使用虚拟滚动优化大量线程渲染
3. **防抖处理**: 重命名等操作已内置防抖
4. **缓存策略**: 消息使用 Map 结构缓存,避免重复加载

## 调试

启用详细日志:

```typescript
// 在 useThreadListRuntime 中添加日志
console.log('Current thread:', currentThreadId);
console.log('Messages:', currentMessages);
console.log('Is running:', isRunning);
```

## 相关组件

- [Thread](/ui/src/components/assistant-ui/thread.tsx) - 聊天界面组件
- [ThreadList](/ui/src/components/assistant-ui/thread-list.tsx) - 线程列表组件
- [AgentChat](/ui/src/features/agent/components/AgentChat.tsx) - 完整聊天页面
