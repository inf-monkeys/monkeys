# ThreadListRuntime 调试指南

## 问题：Entry not available in the store

这个错误表明 assistant-ui 的 ThreadListRuntime 正在尝试访问一个不存在的 thread。

## 调试步骤

### 1. 打开浏览器控制台

刷新页面后，查看控制台输出的日志。你应该看到以下格式的日志：

```
[ThreadListAdapter] Creating adapter: { currentThreadId, validThreadId, threadsSize, threadIds, hasCurrentThread }
[ThreadListAdapter] Thread data array: [...]
[useThreadListRuntime] Current messages for thread xxx : 0
[useThreadListRuntime] Returning runtime, currentThreadId: xxx, threads: 1
```

### 2. 检查关键状态

在日志中查找以下信息：

#### 检查点 1: threadId 验证
```
[ThreadListAdapter] Creating adapter: {
  currentThreadId: "abc-123",
  validThreadId: "abc-123",  // ← 这个应该和 currentThreadId 相同，或者是 undefined
  threadsSize: 1,
  threadIds: ["abc-123"],
  hasCurrentThread: true     // ← 这个必须是 true
}
```

**如果 `hasCurrentThread` 是 `false`**，说明 `currentThreadId` 不在 `threads` Map 中。

#### 检查点 2: Thread data 数组
```
[ThreadListAdapter] Thread data array: [
  { threadId: "abc-123", title: "New Chat", status: "regular" }
]
```

**确保 `threadId` 和上面的 `validThreadId` 匹配。**

#### 检查点 3: 消息加载
```
[useThreadListRuntime] Current messages for thread abc-123 : 0
```

这表示成功为 thread 加载了消息（即使是空的）。

### 3. 查找错误发生的时机

记录错误发生时的完整日志序列。特别注意：

1. **初始加载**：页面首次加载时
2. **创建新 thread**：点击 "New Chat" 时
3. **切换 thread**：点击侧边栏中的 thread 时
4. **删除 thread**：删除当前 thread 时

### 4. 常见问题场景

#### 场景 A: 初始加载时就报错

**症状**：页面刚加载就出现错误

**可能原因**：
- threads 还在加载中，但 `currentThreadId` 已经被设置
- 初始 thread 创建失败

**查看日志**：
```
[ThreadListAdapter] Creating adapter: {
  currentThreadId: "abc-123",
  validThreadId: undefined,    // ← 这里是 undefined！
  threadsSize: 0,               // ← threads 还是空的
  hasCurrentThread: false
}
```

**解决方案**：确保在 threads 加载完成前，`validThreadId` 返回 `undefined`。

#### 场景 B: 删除 thread 后报错

**症状**：删除当前 thread 后立即报错

**可能原因**：
- 删除后，`currentThreadId` 切换到了一个不存在的 thread
- 状态更新顺序问题

**查看日志**：
```
[ThreadListAdapter] onDelete called: abc-123
[ThreadListAdapter] Thread deleted from server
[ThreadListAdapter] Updated threads after delete: ["def-456"]
[ThreadListAdapter] Updating currentThreadId, prev: abc-123
[ThreadListAdapter] Switching to new thread: def-456
[ThreadListAdapter] Creating adapter: {
  currentThreadId: "def-456",
  validThreadId: undefined,    // ← 问题！应该是 "def-456"
  threadsSize: 1,
  threadIds: ["def-456"],
  hasCurrentThread: true
}
```

如果看到这种情况，说明 `currentThreadId` 更新了，但 adapter 还在使用旧的 `threads` 状态。

#### 场景 C: 切换 thread 时报错

**症状**：点击侧边栏的 thread 时报错

**查看日志**：
```
[ThreadListAdapter] onSwitchToThread called: def-456
[ThreadListAdapter] Creating adapter: {
  currentThreadId: "def-456",
  validThreadId: "def-456",
  threadsSize: 2,
  threadIds: ["abc-123", "def-456"],
  hasCurrentThread: true
}
```

这种情况通常不会出错，除非 threads 数据不同步。

### 5. 深入分析：查看 React DevTools

1. 安装 React DevTools 浏览器扩展
2. 打开 DevTools，切换到 "Components" 标签
3. 找到 `AgentRuntimeProvider` 组件
4. 查看其内部的 hooks 状态：
   - `threads` (Map)
   - `currentThreadId` (string | null)
   - `threadMessages` (Map)

**验证**：`currentThreadId` 的值必须存在于 `threads` Map 的 keys 中。

### 6. 检查网络请求

打开 DevTools 的 "Network" 标签，查看：

1. **GET /api/agents/threads?teamId=xxx**
   - 确保返回了 threads 列表
   - 检查响应格式是否正确

2. **POST /api/agents/threads**
   - 创建新 thread 时的请求
   - 确保返回了完整的 thread 对象（包含 `id` 字段）

3. **DELETE /api/agents/threads/:id**
   - 删除 thread 时的请求
   - 确保成功返回 200

### 7. 临时修复：完全禁用 threadList adapter

如果需要快速验证问题是否在 threadList adapter，可以临时注释掉：

```typescript
const runtime = useExternalStoreRuntime({
  messages: currentMessages,
  isRunning,
  onNew,
  setMessages: (messages) => {
    if (currentThreadId) {
      setThreadMessages((prev) => new Map(prev).set(currentThreadId, messages));
    }
  },
  convertMessage: (message) => message,
  // adapters: {
  //   threadList: threadListAdapter,  // ← 临时注释掉
  // },
});
```

如果注释掉后错误消失，说明问题确实在 threadList adapter。

## 下一步

根据你的调试结果，告诉我：

1. 错误发生在哪个场景（初始加载/创建/切换/删除）？
2. 错误发生时的完整日志是什么？
3. `hasCurrentThread` 的值是什么？
4. `validThreadId` 和 `currentThreadId` 是否一致？

我会根据这些信息提供针对性的修复方案。
