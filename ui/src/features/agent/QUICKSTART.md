# ThreadListRuntime 快速开始

## 🚀 5 分钟快速开始

### 步骤 1: 导入组件

```tsx
import { AgentRuntimeProvider } from '@/features/agent';
import { Thread } from '@/components/assistant-ui/thread';
import { ThreadList } from '@/components/assistant-ui/thread-list';
```

### 步骤 2: 包装你的应用

```tsx
function ChatApp() {
  // 从你的认证系统获取这些值
  const teamId = 'your-team-id';
  const userId = 'your-user-id';

  return (
    <AgentRuntimeProvider teamId={teamId} userId={userId}>
      <div className="flex h-screen">
        {/* 左侧: Thread 列表 */}
        <aside className="w-64 border-r">
          <ThreadList />
        </aside>

        {/* 右侧: 聊天界面 */}
        <main className="flex-1">
          <Thread />
        </main>
      </div>
    </AgentRuntimeProvider>
  );
}
```

### 步骤 3: 完成! 🎉

你现在已经有了一个功能完整的多线程聊天应用,包含:
- ✅ Thread 列表显示
- ✅ 创建新对话
- ✅ 切换对话
- ✅ 重命名对话
- ✅ 删除对话
- ✅ 流式消息响应

## 📚 下一步

### 自定义样式

```tsx
<div className="flex h-screen bg-gray-50">
  <aside className="w-80 border-r bg-white shadow-sm">
    <div className="p-4 border-b">
      <h2 className="text-xl font-bold">对话列表</h2>
    </div>
    <ThreadList className="p-4" />
  </aside>

  <main className="flex-1">
    <Thread />
  </main>
</div>
```

### 添加加载状态

```tsx
import { useThreadListRuntime } from '@/features/agent';

function ChatApp() {
  const { runtime, isLoadingThreads } = useThreadListRuntime({
    teamId: 'team-1',
    userId: 'user-1',
  });

  if (isLoadingThreads) {
    return <LoadingSpinner />;
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* 你的 UI */}
    </AssistantRuntimeProvider>
  );
}
```

### 访问当前 Thread

```tsx
const { currentThreadId, threads } = useThreadListRuntime({
  teamId, userId
});

const currentThread = threads.find(t => t.id === currentThreadId);
```

## 🎨 UI 组件

### ThreadList 组件

自动提供:
- Thread 列表
- 新建按钮
- 删除按钮
- 重命名功能
- 当前 thread 高亮

```tsx
<ThreadList className="custom-class" />
```

### Thread 组件

自动提供:
- 消息显示
- 输入框
- 发送按钮
- 流式响应显示
- 工具调用 UI

```tsx
<Thread />
```

## 🔧 高级用法

### 完整示例

查看 [AgentChatPage.tsx](./examples/AgentChatPage.tsx) 了解完整示例。

### 详细文档

查看 [ThreadListRuntime.md](./docs/ThreadListRuntime.md) 了解详细 API 文档。

### 实现细节

查看 [README.md](./README.md) 了解技术实现细节。

## 💡 常见问题

### Q: 如何切换 Agent?

```tsx
<AgentRuntimeProvider
  teamId={teamId}
  userId={userId}
  agentId={selectedAgentId}  // 动态切换
>
  {/* ... */}
</AgentRuntimeProvider>
```

### Q: 如何自定义消息样式?

修改 [thread.tsx](../../../components/assistant-ui/thread.tsx) 中的样式类。

### Q: 如何添加归档功能?

参考 [README.md](./README.md) 中的"下一步扩展"部分。

## 🐛 遇到问题?

1. 检查控制台错误
2. 确认 API 端点正确
3. 验证 teamId 和 userId
4. 查看 [故障排查](./README.md#-故障排查)

## 📞 获取帮助

- 查看 [文档](./docs/ThreadListRuntime.md)
- 查看 [示例代码](./examples/AgentChatPage.tsx)
- 提交 Issue

---

**就这么简单!** 享受你的新聊天应用吧! 🚀
