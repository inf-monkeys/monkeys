# Assistant-UI Tool Result 错误完整修复

## 问题诊断

错误: `Unsupported assistant message part type: tool-result`

### 根本原因
后端返回的消息格式与 assistant-ui 期望的格式不匹配:

**后端格式** (独立的 tool-result):
```json
{
  "role": "assistant",
  "parts": [
    { "type": "tool-call", "toolCallId": "xxx", "toolName": "list_tools", "args": {} },
    { "type": "tool-result", "toolCallId": "xxx", "result": {...}, "isError": true }
  ]
}
```

**assistant-ui 期望格式** (result 在 tool-call 内):
```json
{
  "role": "assistant",
  "content": [
    {
      "type": "tool-call",
      "toolCallId": "xxx",
      "toolName": "list_tools",
      "args": {},
      "result": {...},
      "isError": true
    }
  ]
}
```

## 修复的文件

### 1. useThreadListWithTools.ts ✅ (主要使用的 hook)

**修复位置 1: Line 43-103** - `convertMessageToThreadMessage` 函数
- 收集所有 tool-result 到 Map
- 过滤掉独立的 tool-result
- 将 result 合并到对应的 tool-call 中

**修复位置 2: Line 464-484** - 流式处理 tool-result
- 找到对应的 tool-call
- 更新其 result 和 isError 字段
- 不再创建独立的 tool-result part

### 2. useAssistantUIAdapter.ts ✅ (备用 hook)

应用了相同的修复逻辑,确保两个 hook 都能正确处理 tool-result。

## 修复代码示例

### 历史消息转换 (加载时)

```typescript
function convertMessageToThreadMessage(message: Message): ThreadMessageLike {
  // 1. 收集所有 tool-result
  const toolResultsMap = new Map<string, any>();
  parts.forEach((part) => {
    if (part.type === 'tool-result') {
      toolResultsMap.set(part.toolCallId, {
        result: part.result,
        isError: part.isError,
      });
    }
  });

  // 2. 过滤 tool-result + 合并到 tool-call
  const content = parts
    .filter((part) => part.type !== 'tool-result')  // 移除独立的 tool-result
    .map((part) => {
      if (part.type === 'tool-call') {
        const resultData = toolResultsMap.get(part.toolCallId);
        if (resultData) {
          return {
            ...part,
            result: resultData.result,
            isError: resultData.isError,
          };
        }
      }
      return part;
    });

  return { id, role, content, createdAt };
}
```

### 流式消息处理 (接收时)

```typescript
// 工具结果事件处理
else if (eventType === 'a' || eventType === 'b') {
  const currentContent = toContentParts(assistantMessage.content);

  // 找到对应的 tool-call 并更新其 result
  const nextContent = currentContent.map((c) => {
    if (c.type === 'tool-call' && c.toolCallId === parsed.toolCallId) {
      return {
        ...c,
        result: parsed.result,
        isError: parsed.isError || false,
      };
    }
    return c;
  });

  assistantMessage = { ...assistantMessage, content: nextContent };
}
```

## 关键要点

1. **assistant-ui 的限制**
   - ✅ 支持角色: `user`, `assistant`, `system`
   - ❌ 不支持角色: `tool`
   - ✅ tool-call 可以包含 `result` 字段
   - ❌ 不存在独立的 `tool-result` 类型

2. **数据转换策略**
   - 从后端加载: 在 `convertMessageToThreadMessage` 中转换
   - 流式接收: 在接收到 tool-result 事件时更新现有 tool-call

3. **处理顺序**
   ```
   1. 收到 tool-call 事件 → 创建 tool-call (无 result)
   2. 收到 tool-result 事件 → 更新 tool-call (添加 result)
   3. 最终状态: tool-call 包含完整的 args 和 result
   ```

## 测试验证

### 验证步骤
1. ✅ 刷新页面,加载包含工具调用的历史消息
2. ✅ 发送新消息触发工具调用
3. ✅ 确认工具调用和结果正确显示
4. ✅ 不再出现 "Unsupported assistant message part type" 错误

### 后端数据示例

你的后端返回的实际数据:
```json
{
  "role": "assistant",
  "parts": [
    {
      "type": "tool-call",
      "toolCallId": "zbt98iauGfvZljOo",
      "toolName": "list_tools",
      "args": {},
      "isError": true
    },
    {
      "type": "tool-result",
      "toolCallId": "zbt98iauGfvZljOo",
      "result": {
        "code": "23503",
        "message": "insert or update on table..."
      },
      "isError": true
    }
  ]
}
```

转换后的格式:
```json
{
  "role": "assistant",
  "content": [
    {
      "type": "tool-call",
      "toolCallId": "zbt98iauGfvZljOo",
      "toolName": "list_tools",
      "args": {},
      "result": {
        "code": "23503",
        "message": "insert or update on table..."
      },
      "isError": true
    }
  ]
}
```

## 相关文件

- ✅ `ui/src/features/agent/hooks/useThreadListWithTools.ts` - 主要修复
- ✅ `ui/src/features/agent/hooks/useAssistantUIAdapter.ts` - 相同修复
- 📖 `node_modules/@assistant-ui/react/dist/legacy-runtime/runtime-cores/external-store/ThreadMessageLike.d.ts` - 类型定义参考

## 注意事项

1. **后端兼容性**: 后端继续返回独立的 tool-result 是可以的,前端会自动转换
2. **流式和历史消息**: 两种场景都已处理
3. **类型安全**: 使用 `as MessagePart` 确保类型正确

现在错误应该彻底解决了! 🎉
