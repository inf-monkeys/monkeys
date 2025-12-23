# Tldraw Agent 集成完成

## 功能概述

已成功为 `tldraw-assistant` agent 添加画布操作能力，让 AI 可以：
- 实时查看画布状态（所有形状、用户选择）
- 创建形状（矩形、圆形、箭头、文本等）
- 更新现有形状（移动、调整大小、样式修改）
- 删除形状
- 选择形状

## 实现的组件

### 1. 后端工具注册

**文件**: `src/modules/agent/services/agent-tool-registry.service.ts`

注册了 5 个 tldraw 内置工具：

1. **`tldraw_get_canvas_state`** - 获取画布状态
   - 返回所有形状和当前选中的形状
   - Agent 可以了解画布当前内容

2. **`tldraw_create_shape`** - 创建形状
   - 支持类型: `geo` (几何图形), `arrow`, `text`, `note`, `line`
   - 参数: `type`, `x`, `y`, `props`
   - 几何图形支持: rectangle, ellipse, triangle, diamond

3. **`tldraw_update_shape`** - 更新形状
   - 参数: `shapeId`, `updates`
   - 可更新位置、尺寸、样式等属性

4. **`tldraw_delete_shapes`** - 删除形状
   - 参数: `shapeIds` (可选，为空时删除选中的形状)

5. **`tldraw_select_shapes`** - 选择形状
   - 参数: `shapeIds`

### 2. Agent 配置

**文件**: `src/modules/agent/services/agent.service.ts`

`tldraw-assistant` 默认配置已更新：
- ✅ 工具已启用 (`tools.enabled: true`)
- ✅ 所有 5 个 tldraw 工具已添加到 `toolNames` 列表
- ✅ 更新了 instructions，指导 agent 如何使用这些工具

Agent 工作流程示例：
```
用户: "添加一个矩形"
Agent:
1. 调用 tldraw_get_canvas_state 查看当前画布
2. 根据现有布局选择合适位置
3. 调用 tldraw_create_shape 创建矩形
```

### 3. 前端工具执行器

**文件**: `ui/src/features/agent/components/TldrawToolUIs.tsx`

创建了 5 个工具 UI 组件，使用 `makeAssistantToolUI` API：
- `TldrawGetCanvasStateToolUI` - 显示画布状态摘要
- `TldrawCreateShapeToolUI` - 显示创建操作
- `TldrawUpdateShapeToolUI` - 显示更新操作
- `TldrawDeleteShapesToolUI` - 显示删除操作
- `TldrawSelectShapesToolUI` - 显示选择操作

每个组件包含：
- `render`: UI 渲染函数（显示工具调用结果）
- `execute`: 工具执行函数（调用 tldraw editor API）

### 4. Editor 连接

**文件**:
- `ui/src/features/agent/contexts/TldrawContext.tsx` - Context 定义
- `ui/src/components/layout/design-space/board/index.tsx` - Editor 设置

在 tldraw `onMount` 回调中调用 `setTldrawEditor(editor)`，将 editor 实例传递给工具执行器。

### 5. Agent Runtime 集成

**文件**: `ui/src/features/agent/components/AgentRuntimeProvider.tsx`

已注册所有 5 个 tldraw 工具 UI 组件到 `AgentRuntimeProvider`，确保 agent 可以调用这些工具。

## 使用方式

### 自动创建 Agent

当用户首次打开 tldraw 页面并使用 `tldraw-assistant` 时：
1. 前端自动创建第一个 thread
2. 后端检测到 `tldraw-assistant` 不存在
3. 自动创建带完整工具配置的 agent

### Agent 对话示例

```
用户: "画一个流程图，包含开始、处理、判断和结束"

Agent 会：
1. 获取画布状态
2. 创建椭圆形（开始）
3. 创建矩形（处理）
4. 创建菱形（判断）
5. 创建椭圆形（结束）
6. 用箭头连接它们
```

```
用户: "把选中的图形删掉"

Agent 会：
1. 获取画布状态（包含选中的形状）
2. 删除选中的形状
```

## 技术细节

### 工具执行流程

1. **Agent 决定调用工具** → AI SDK 生成 tool-call 事件
2. **StreamingService 处理** → 转发给前端
3. **前端 Tool UI 执行** → 调用 tldraw editor API
4. **返回结果** → 显示在聊天界面

### Editor 全局引用

使用全局变量 `globalEditor` 存储 editor 实例，因为：
- `makeAssistantToolUI` 的 `execute` 函数不支持 React hooks
- 需要在异步执行上下文中访问 editor

### 画布状态格式

```typescript
{
  totalShapes: number,
  shapes: Array<{
    id: string,
    type: string,
    x: number,
    y: number,
    rotation: number,
    props: object
  }>,
  selectedShapes: Array<{...}>
}
```

## 文件清单

### 新增文件
1. `ui/src/features/agent/contexts/TldrawContext.tsx` - Tldraw context
2. `ui/src/features/agent/components/TldrawToolUIs.tsx` - 工具 UI 组件

### 修改文件
1. `src/modules/agent/services/agent-tool-registry.service.ts` - 注册工具
2. `src/modules/agent/services/agent.service.ts` - Agent 配置
3. `src/modules/agent/services/thread.service.ts` - 自动创建 agent
4. `ui/src/features/agent/components/AgentRuntimeProvider.tsx` - 注册工具 UI
5. `ui/src/features/agent/hooks/useThreadListRuntime.ts` - 启用自动创建 thread
6. `ui/src/features/agent/index.ts` - 导出更新
7. `ui/src/components/layout/design-space/board/index.tsx` - 设置 editor

### 删除文件
1. `ui/src/components/layout/design-space/board/localAgent.ts` - 旧的本地 agent（不再使用）

## 测试建议

1. **基本操作测试**
   - 打开 tldraw 页面
   - 打开 agent 侧边栏
   - 测试: "画一个矩形"
   - 测试: "画一个圆形"
   - 测试: "删除选中的形状"

2. **复杂场景测试**
   - "创建一个三步流程图"
   - "把所有形状排列整齐"
   - "在画布中心添加一个标题"

3. **状态感知测试**
   - 先手动选中一些形状
   - 问: "我选中了什么？"
   - 问: "把选中的移到右边"

## 注意事项

1. **只读模式**: 如果画布处于只读模式，工具执行会被拦截
2. **Editor 可用性**: 工具执行前会检查 editor 是否可用
3. **错误处理**: 所有工具都有 try-catch 包裹，返回友好的错误消息
4. **权限**: 工具不需要审批 (`needsApproval: false`)

## 未来改进方向

1. **更多工具**
   - 组合/取消组合形状
   - 调整视图（缩放、平移）
   - 图层操作（置于顶层/底层）
   - 样式批量修改

2. **智能布局**
   - 自动对齐
   - 智能间距
   - 流程图自动布局

3. **上下文增强**
   - 添加画布截图到 agent 上下文
   - 支持 vision 模型理解画布内容

4. **协作功能**
   - 多用户协作时的冲突处理
   - 实时同步 agent 操作

## 相关文档

- [Agent 系统重构总结](./AGENT_REBUILD_SUMMARY.md)
- [Agent 工具集成示例](./ui/src/features/agent/TOOL_INTEGRATION.md)
- [Tldraw 集成示例](./ui/src/features/agent/examples/TldrawAgentIntegration.tsx)
