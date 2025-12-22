# Canvas 灵感推送功能 - 使用说明

## 功能概述

当用户在画布上超过 **5秒无操作** 时，系统会：
1. 自动获取当前画布内容
2. 调用 AI 分析创作状态（发散/收敛/停滞）
3. 根据状态向用户推送 3-5 条灵感建议
4. 灵感消息会直接显示在 Agent 对话中

## 实现架构

### 前端组件

1. **`useCanvasInspirationPush.ts`** - 核心 Hook
   - 路径: `ui/src/components/layout/design-space/board/hooks/useCanvasInspirationPush.ts`
   - 功能:
     - 监听画布操作（editor.on('change')）
     - 5秒倒计时
     - 调用后端 API
     - 详细的 console 日志输出

2. **`CanvasInspirationManager.tsx`** - 集成组件
   - 路径: `ui/src/components/layout/design-space/board/CanvasInspirationManager.tsx`
   - 功能:
     - 获取当前 threadId（从 AgentRuntimeProvider）
     - 调用 useCanvasInspirationPush Hook
     - 将测试函数暴露到 window

3. **`ExternalLayerPanel.tsx`** - 集成入口
   - 在 `AgentRuntimeProvider` 内部添加 `<CanvasInspirationManager />`
   - 只在 Agent 面板可见时启用

### 后端 API

已有的后端接口（无需修改）：

1. **`GET /agents/canvas/should-push-inspiration`**
   - 检查是否应该推送（Thread 状态、冷却时间）
   - 参数: `threadId`, `teamId`

2. **`POST /agents/canvas/push-inspiration`** ⭐️ 主接口
   - 分析画布状态并推送灵感
   - 请求体:
     ```json
     {
       "teamId": "string",
       "userId": "string",
       "threadId": "string",
       "canvasData": {
         "shapes": [...],
         "selectedShapeIds": [...],
         "viewport": { "x": 0, "y": 0, "z": 1 }
       }
     }
     ```
   - 响应:
     ```json
     {
       "success": true,
       "data": {
         "messageId": "msg_xxx",
         "state": "divergent" | "convergent" | "stagnant",
         "suggestionCount": 4
       }
     }
     ```

3. **`POST /agents/canvas/test-inspiration`** 🧪 测试接口
   - 使用模拟数据快速测试
   - 参数: `scenario` = "empty" | "divergent" | "convergent" | "complex"

## 使用方法

### 自动触发（生产环境）

1. 打开设计画板页面
2. 点击左侧工具栏的 "Sparkles" 按钮打开 Agent 面板
3. 创建或选择一个对话（Thread）
4. 在画布上操作（绘图、添加元素等）
5. **停止操作 5 秒**
6. 系统自动分析并推送灵感建议到 Agent 对话中

### 手动测试（开发调试）

打开浏览器 Console，可以使用以下命令：

```javascript
// 1. 快速测试（使用模拟数据）
window.testInspirationPush('divergent')  // 发散状态
window.testInspirationPush('convergent') // 收敛状态
window.testInspirationPush('stagnant')   // 停滞状态（空画布）
window.testInspirationPush('complex')    // 复杂场景

// 2. 测试真实画布数据
window.testInspirationPush()             // 使用当前画布数据
```

### Console 日志说明

功能运行时会输出详细的日志：

```
🎨 [CanvasInspiration] 已挂载，currentThreadId: thread_xxx
⏱️  [CanvasInspiration] 距离灵感推送: 4秒 (已无操作: 1秒)
⏱️  [CanvasInspiration] 距离灵感推送: 3秒 (已无操作: 2秒)
🚀 [CanvasInspiration] 触发灵感推送（5秒无操作）
📊 [CanvasInspiration] 画布数据: { 图形数量: 8, 选中数量: 0 }
🔍 [CanvasInspiration] 检查推送条件...
✅ [CanvasInspiration] 推送条件满足，开始推送...
✨ [CanvasInspiration] 推送成功! { 耗时: '1234ms', 消息ID: 'msg_xxx', 创作状态: 'divergent', 建议数量: 4 }
```

## 配置选项

在 `CanvasInspirationManager` 中可以配置：

```tsx
<CanvasInspirationManager
  editor={editor}
  teamId={teamId}
  userId={userId}
  enabled={true}  // 可以关闭功能
/>
```

在 `useCanvasInspirationPush` Hook 中可以配置：

```ts
useCanvasInspirationPush({
  editor,
  teamId,
  userId,
  threadId,
  enabled: true,
  idleTimeout: 5000,  // 5秒，可修改
  onInspirationPushed: (result) => {
    // 自定义回调
  }
})
```

## 防重复机制

后端已实现：
- ✅ Thread 运行状态检查（不在对话时推送）
- ✅ 5分钟冷却时间（避免频繁推送）
- ✅ 消息去重（metadata 标记）

## 创作状态类型

AI 会分析画布并判断为以下三种状态之一：

### 1. 发散状态 (divergent)
- 特征：元素分散、类型多样、空间利用率低
- 灵感建议：
  - 整理和分组建议
  - 主题聚焦提示
  - 层次结构建议

### 2. 收敛状态 (convergent)
- 特征：元素集中、布局紧凑、有明确方向
- 灵感建议：
  - 细化和优化建议
  - 添加细节提示
  - 完善和扩展建议

### 3. 停滞状态 (stagnant)
- 特征：元素少、无明显进展
- 灵感建议：
  - 启发性问题
  - 创意方向建议
  - 参考资源推荐

## 灵感建议类型

每条建议包含：
- **type**: "question" | "idea" | "action" | "resource"
- **content**: 建议内容
- **reasoning**: AI 的分析理由

示例消息格式：
```
🎨 创作状态分析

当前状态: 发散阶段 🌟 (置信度: 85%)

💡 灵感建议:

1. 💭 考虑将相似的元素进行分组，创建视觉层次
2. 🎯 尝试确定一个核心主题，让设计更聚焦
3. 🔧 使用网格布局来组织分散的元素
4. 📚 参考：卡片式设计布局
```

## 调试技巧

1. **查看倒计时**：每10秒打印一次剩余时间，最后10秒每秒打印
2. **测试不同场景**：使用 `testInspirationPush()` 测试四种预设场景
3. **查看网络请求**：Network 面板查看 `/agents/canvas/push-inspiration` 请求
4. **检查 threadId**：确保 Agent 面板打开且有活跃的对话

## 常见问题

### Q: 为什么5秒后没有推送？

A: 检查以下条件：
- ✅ Agent 面板是否打开
- ✅ 是否有活跃的 Thread（对话）
- ✅ 是否在5分钟冷却期内
- ✅ Thread 是否正在运行（等待 AI 响应）

### Q: 如何修改等待时间？

A: 在 `useCanvasInspirationPush` Hook 中修改 `idleTimeout` 参数（单位：毫秒）

### Q: 如何临时禁用功能？

A:
```tsx
<CanvasInspirationManager enabled={false} />
```

### Q: 能否手动触发？

A: 可以，在 Console 中运行:
```javascript
window.testInspirationPush()
```

## 技术栈

- **前端**: React Hooks, tldraw Editor API
- **后端**: NestJS, AI SDK
- **AI 模型**: 通过 agent 配置的默认模型
- **消息系统**: Thread Messages API

## 未来改进

- [ ] 添加推送成功的 UI 提示（toast/notification）
- [ ] 支持自定义等待时间配置
- [ ] 支持更细粒度的状态分析
- [ ] 添加灵感建议的评分和反馈机制
- [ ] 支持多语言灵感建议
