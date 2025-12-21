# ThreadListRuntime 实现总结

## 📁 实现文件

### 核心实现

1. **[useThreadListRuntime.ts](./hooks/useThreadListRuntime.ts)**
   - 核心 Runtime 实现
   - 使用 `ExternalStoreRuntime` + `ExternalStoreThreadListAdapter`
   - 管理多线程状态和消息
   - 处理流式响应

2. **[AgentRuntimeProvider.tsx](./components/AgentRuntimeProvider.tsx)**
   - Provider 包装组件
   - 简化 Runtime 使用

### 示例代码

3. **[AgentChatPage.tsx](./examples/AgentChatPage.tsx)**
   - 完整页面示例
   - 简单和高级两种用法

### 文档

4. **[ThreadListRuntime.md](./docs/ThreadListRuntime.md)**
   - 详细使用指南
   - API 参考
   - 最佳实践

## ✨ 核心特性

### 1. 多线程管理
- ✅ 创建新线程
- ✅ 切换线程
- ✅ 重命名线程
- ✅ 删除线程
- 🔲 归档线程 (预留接口)

### 2. 消息处理
- ✅ 流式消息接收
- ✅ 文本内容增量更新
- ✅ 工具调用支持
- ✅ 工具结果处理
- ✅ 错误处理

### 3. 状态管理
- ✅ Thread 列表状态
- ✅ 当前 Thread 选择
- ✅ 每个 Thread 的消息缓存
- ✅ 运行状态管理
- ✅ 加载状态管理

## 🔧 技术实现

### 使用的 Assistant-UI API

```typescript
import {
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
  type ExternalStoreThreadListAdapter,
  type ExternalStoreThreadData,
} from '@assistant-ui/react';
```

### 数据流

```
后端 API (threadApi, chatApi)
    ↓
useThreadListRuntime hook
    ↓
ExternalStoreRuntime + ThreadListAdapter
    ↓
AssistantRuntimeProvider
    ↓
UI 组件 (Thread, ThreadList)
```

### 状态结构

```typescript
{
  // Thread 映射表
  threads: Map<threadId, Thread>

  // 消息映射表
  threadMessages: Map<threadId, ThreadMessageLike[]>

  // 当前线程
  currentThreadId: string | null

  // 状态标志
  isRunning: boolean
  isLoadingThreads: boolean
}
```

## 📝 使用方法

### 方法一: 使用 Provider (推荐)

```tsx
import { AgentRuntimeProvider } from '@/features/agent';
import { Thread } from '@/components/assistant-ui/thread';
import { ThreadList } from '@/components/assistant-ui/thread-list';

function ChatPage() {
  return (
    <AgentRuntimeProvider teamId="team-1" userId="user-1">
      <div className="flex h-screen">
        <ThreadList />
        <Thread />
      </div>
    </AgentRuntimeProvider>
  );
}
```

### 方法二: 直接使用 Hook

```tsx
import { useThreadListRuntime } from '@/features/agent';
import { AssistantRuntimeProvider } from '@assistant-ui/react';

function ChatPage() {
  const { runtime, isLoadingThreads, currentThreadId } = useThreadListRuntime({
    teamId: 'team-1',
    userId: 'user-1',
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* 自定义 UI */}
    </AssistantRuntimeProvider>
  );
}
```

## 🎯 核心优势

1. **完全集成**: 与现有后端 API 无缝集成
2. **类型安全**: 完整的 TypeScript 类型支持
3. **状态管理**: 自动处理所有状态同步
4. **流式响应**: 原生支持 SSE 流式消息
5. **工具调用**: 完整的工具调用生命周期管理
6. **错误处理**: 优雅的错误处理和恢复

## 🔄 对比原有实现

### 旧实现 (useChatRuntime)
```typescript
// 只能处理单个 thread
const runtime = useChatRuntime({
  api: `/api/v1/agents/threads/${threadId}/chat`,
  initialMessages,
});
```

### 新实现 (useThreadListRuntime)
```typescript
// 完整的多 thread 管理
const { runtime } = useThreadListRuntime({
  teamId,
  userId,
  agentId,
});
// ✅ 支持多线程
// ✅ 自动加载历史
// ✅ Thread 切换
// ✅ 流式响应
```

## 🚀 下一步扩展

### 1. 添加归档功能

在 `Thread` 类型中添加 `archived` 字段,并实现归档 API:

```typescript
onArchive: async (threadId: string) => {
  await threadApi.updateThread(threadId, teamId, {
    metadata: { archived: true }
  });
}
```

### 2. 添加搜索功能

```typescript
const filteredThreads = threads.filter(thread =>
  thread.title?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### 3. 添加标签支持

```typescript
interface ThreadMetadata {
  tags?: string[];
}

// 按标签过滤
const taggedThreads = threads.filter(t =>
  t.metadata?.tags?.includes('important')
);
```

### 4. 添加消息分页

对于长对话,实现消息分页加载:

```typescript
const loadMoreMessages = async (threadId: string, offset: number) => {
  const messages = await threadApi.getMessages(threadId, teamId, {
    limit: 50,
    offset,
  });
};
```

### 5. 添加离线支持

使用 IndexedDB 缓存消息:

```typescript
import { openDB } from 'idb';

const db = await openDB('agent-chat', 1, {
  upgrade(db) {
    db.createObjectStore('messages', { keyPath: 'id' });
    db.createObjectStore('threads', { keyPath: 'id' });
  },
});
```

## 🐛 故障排查

### 问题 1: Thread 列表不显示

检查:
- teamId 和 userId 是否正确
- API 返回的数据格式是否正确
- 是否有网络错误

### 问题 2: 消息不更新

检查:
- currentThreadId 是否正确设置
- 流式响应是否正常接收
- setThreadMessages 是否正确调用

### 问题 3: 切换 Thread 后消息不变

确保:
- 使用 Map 结构缓存每个 thread 的消息
- currentThreadId 改变时触发消息加载

## 📊 性能优化

1. **使用 Map 而非数组**: O(1) 查找性能
2. **消息缓存**: 避免重复加载
3. **按需加载**: 只加载当前 thread 的消息
4. **虚拟滚动**: ThreadList 使用虚拟滚动

## 🔒 安全考虑

1. **认证**: API 调用包含认证 token
2. **权限检查**: 后端验证 teamId 和 userId
3. **输入验证**: 消息内容验证
4. **XSS 防护**: 使用 Markdown 渲染器的安全模式

## 📚 相关资源

- [Assistant-UI 文档](https://docs.assistant-ui.com)
- [ExternalStoreRuntime](https://docs.assistant-ui.com/runtimes/custom/external-store)
- [ThreadListRuntime API](https://docs.assistant-ui.com/api-reference/runtimes/ThreadListRuntime)

## 🤝 贡献

如需改进或添加功能,请:

1. 创建功能分支
2. 添加测试
3. 更新文档
4. 提交 PR

## 📄 许可

与项目主许可证相同
