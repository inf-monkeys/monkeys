# Tldraw Agent 工具调用修复

## 问题总结

之前的实现无法正常调用工具，原因：

1. **后端问题**：
   - 模型配置错误：使用 `gpt-4o` 而非 `openai:gpt-5.1`
   - 工具加载错误：使用 `agentId` 字符串而非 `agent.id`

2. **前端问题**：
   - 调用错误的端点：`/stream` (SSE) 而非 `/chat` (AI SDK)
   - 不支持工具调用的流式响应格式

## 修复方案

### 后端修复

1. **模型 ID 修复** ([agent.service.ts:147](src/modules/agent/services/agent.service.ts#L147))
   ```typescript
   model: 'openai:gpt-5.1'  // ✅ 正确格式，匹配配置文件
   ```

2. **工具加载修复** ([streaming.service.ts:118](src/modules/agent/services/streaming.service.ts#L118))
   ```typescript
   tools = await this.agentToolRegistry.getToolsForAgent(agent.id, teamId);
   // ✅ 使用 agent.id 而不是 agentId 参数
   ```

3. **ClientSide 工具标记** ([agent-tool-registry.service.ts](src/modules/agent/services/agent-tool-registry.service.ts))
   - 所有 tldraw 工具添加 `clientSide: true`
   - 后端跳过执行，仅传递给前端

4. **增强调试日志** ([streaming.service.ts](src/modules/agent/services/streaming.service.ts))
   - 添加 emoji 标记的详细日志
   - 显示工具数量和名称

### 前端修复

创建新的支持工具的 Runtime：

#### 1. **useThreadListWithTools** (新文件)
- 对接 `/chat` 端点（支持工具）
- 解析 AI SDK 标准流式响应格式
- 处理工具调用事件 (`type: "9"`)
- 处理工具结果事件 (`type: "a"`)

#### 2. **useAssistantUIAdapter** (新文件)
- 单 thread 的简化版本
- 同样对接 `/chat` 端点

#### 3. **AgentRuntimeProvider** (修改)
- 切换到使用 `useThreadListWithTools`
- 保持原有接口不变

#### 4. **TldrawToolUIs** (增强)
- 添加详细的 console.log 调试
- 使用 `getShapePageBounds()` 获取正确坐标
- 添加错误处理

## 文件清单

### 新增文件
1. `ui/src/features/agent/hooks/useThreadListWithTools.ts` - 支持工具的 ThreadList Runtime
2. `ui/src/features/agent/hooks/useAssistantUIAdapter.ts` - 单 Thread 适配器

### 修改文件
1. `src/modules/agent/services/agent.service.ts` - 模型 ID 修复
2. `src/modules/agent/services/streaming.service.ts` - 工具加载修复 + 调试日志
3. `src/modules/agent/services/agent-tool-registry.service.ts` - ClientSide 标记
4. `ui/src/features/agent/components/AgentRuntimeProvider.tsx` - 使用新 hook
5. `ui/src/features/agent/components/TldrawToolUIs.tsx` - 增强调试和错误处理
6. `ui/src/features/agent/index.ts` - 导出新 hooks

## AI SDK 流式响应格式

使用 AI SDK v6 的标准 text stream 格式：

```
0:"text chunk"\n           // 文本增量
9:{"toolCallId":...}\n     // 工具调用
a:{"toolCallId":...}\n     // 工具结果（成功）
b:{"toolCallId":...}\n     // 工具结果（错误）
e:{"finishReason":...}\n   // 流结束
```

## 工具执行流程

```
1. AI 决定调用工具
   ↓
2. 后端发送 type="9" 事件（工具调用）
   ↓
3. 前端接收并添加到消息
   ↓
4. assistant-ui 渲染工具 UI
   ↓
5. makeAssistantToolUI 的 execute 被调用
   ↓
6. 执行 tldraw editor 操作
   ↓
7. 返回结果到 assistant-ui
   ↓
8. 结果显示在聊天界面
```

## 测试步骤

1. **重启后端服务器**
   ```bash
   yarn start:dev
   ```

2. **查看后端日志**，应该看到：
   ```
   ✅ Loaded 5 tools for agent xxx (Tldraw Assistant)
   Tool names: tldraw_get_canvas_state, tldraw_create_shape, ...
   🚀 Starting AI SDK stream for thread xxx, tools: enabled (5 tools)
   ```

3. **在 tldraw 页面测试**：
   - 打开浏览器开发者工具
   - 发送消息："画布上有什么"
   - 查看 Console 输出：
     ```
     [ThreadListWithTools] Tool call: {...}
     [TldrawGetCanvasState] Total shapes found: X
     [TldrawGetCanvasState] Returning state: {...}
     ```

4. **测试工具调用**：
   - "画一个矩形"
   - "画一个圆形"
   - "删除选中的形状"

## 关键修复点

### 问题 1: 工具未加载
**原因**: `getToolsForAgent('tldraw-assistant', teamId)` 找不到 agent
**修复**: 使用 `agent.id` (数据库生成的真实 ID)

### 问题 2: AI 输出 JSON 而非调用工具
**原因**: 工具列表为空，AI 没有收到工具定义
**修复**: 修复工具加载 + 模型 ID

### 问题 3: 前端不执行工具
**原因**: 使用旧的 `/stream` 端点，不支持工具
**修复**: 切换到 `/chat` 端点 + AI SDK 标准格式

### 问题 4: 画布状态返回空
**原因**: 未来可能遇到，已预防
**修复**: 使用 `getShapePageBounds()` 而非直接访问 `shape.x/y`

## 下一步

如果测试成功，可以：
1. 删除旧的 `useThreadListRuntime.ts`（如果不再需要）
2. 添加更多 tldraw 工具（group, ungroup, bring-to-front, etc.）
3. 优化工具描述，让 AI 更好地理解何时使用
4. 添加画布截图到 context（vision 模型）

## 调试技巧

如果遇到问题：

1. **检查后端日志** - 查找 ✅ 和 🚀 emoji
2. **检查浏览器 Console** - 查找 `[ThreadListWithTools]` 和 `[Tldraw*]` 日志
3. **检查 Network 面板** - 确认调用的是 `/chat` 而非 `/stream`
4. **检查响应格式** - AI SDK 格式应该是 `0:text`, `9:{...}` 等
