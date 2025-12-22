# Agent 嵌入式模式 (Mini Mode & Embed Mode)

本文档介绍如何使用 Agent 的嵌入式模式，包括 Mini 模式和 Embed 模式。

## 概述

Agent 支持三种显示模式：

- **Normal**: 标准全屏模式（默认）
- **Mini**: 紧凑模式，适合侧边栏显示
- **Embed**: 嵌入模式，适合集成到其他页面（如 tldraw）

## 快速开始

### 1. 使用 AgentSidebar 组件

最简单的方式是使用 `AgentSidebar` 组件：

```tsx
import { useState } from 'react';
import { AgentSidebar, openAgent, useAgentEvent } from '@/features/agent';

function MyPage() {
  const [showAgent, setShowAgent] = useState(false);

  return (
    <div>
      {/* 你的页面内容 */}
      <button onClick={() => setShowAgent(true)}>
        Open Agent
      </button>

      {/* Agent 侧边栏 */}
      <AgentSidebar
        agentId="your-agent-id"
        teamId="your-team-id"
        userId="your-user-id"
        visible={showAgent}
        onClose={() => setShowAgent(false)}
        position="right"
        showThreadList={true}
      />
    </div>
  );
}
```

### 2. 使用事件系统

通过事件系统控制 Agent 的显示：

```tsx
import { openAgent, closeAgent, useAgentEvent } from '@/features/agent';

// 打开 Agent
function handleOpenAgent() {
  openAgent({
    agentId: 'agent-123',
    teamId: 'team-456',
    userId: 'user-789',
    position: 'right',
  });
}

// 监听 Agent 事件
function MyComponent() {
  useAgentEvent('agent:open', (detail) => {
    console.log('Agent opened:', detail.agentId);
  });

  useAgentEvent('agent:state-change', (detail) => {
    if (detail.isOpen) {
      console.log('Agent is now open');
    }
  });

  return <button onClick={handleOpenAgent}>Open Agent</button>;
}
```

### 3. 自定义模式配置

使用 `AgentRuntimeProvider` 自定义模式：

```tsx
import { AgentRuntimeProvider, MiniThreadList } from '@/features/agent';
import { Thread } from '@/components/assistant-ui/thread';

function CustomAgentView() {
  return (
    <AgentRuntimeProvider
      agentId="agent-id"
      teamId="team-id"
      userId="user-id"
      mode="mini"
      modeConfig={{
        showThreadList: true,
        compact: true,
        width: 240,
        position: 'left',
      }}
    >
      <div className="flex h-screen">
        <MiniThreadList />
        <Thread />
      </div>
    </AgentRuntimeProvider>
  );
}
```

## AgentSidebar Props

| Prop | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `agentId` | `string` | - | Agent ID（必填） |
| `teamId` | `string` | - | Team ID（必填） |
| `userId` | `string` | - | User ID（必填） |
| `visible` | `boolean` | - | 是否显示（必填） |
| `onClose` | `() => void` | - | 关闭回调 |
| `position` | `'left' \| 'right'` | `'right'` | 侧边栏位置 |
| `defaultWidth` | `number` | `600` | 初始宽度（px） |
| `minWidth` | `number` | `400` | 最小宽度（px） |
| `maxWidth` | `number` | `1000` | 最大宽度（px） |
| `resizable` | `boolean` | `true` | 是否可调整大小 |
| `showThreadList` | `boolean` | `true` | 是否显示线程列表 |
| `mode` | `AgentMode` | `'mini'` | 显示模式 |
| `modeConfig` | `Partial<AgentModeConfig>` | - | 模式配置 |

## 模式配置 (AgentModeConfig)

```typescript
interface AgentModeConfig {
  mode: 'normal' | 'mini' | 'embed';
  showThreadList?: boolean;
  compact?: boolean;
  height?: string | number;
  width?: string | number;
  resizable?: boolean;
  position?: 'left' | 'right' | 'top' | 'bottom';
}
```

## 事件系统

### 事件类型

- `agent:open` - Agent 打开
- `agent:close` - Agent 关闭
- `agent:toggle` - Agent 切换
- `agent:state-change` - Agent 状态变化
- `agent:thread-created` - 线程创建
- `agent:thread-switched` - 线程切换
- `agent:message-sent` - 消息发送

### 事件函数

```typescript
// 打开 Agent
openAgent({
  agentId: string,
  teamId: string,
  userId: string,
  threadId?: string,
  position?: 'left' | 'right',
});

// 关闭 Agent
closeAgent(agentId?: string);

// 切换 Agent
toggleAgent({ ... });

// 更新状态
updateAgentState({
  agentId: string | null,
  threadId: string | null,
  isOpen: boolean,
});

// 监听事件
useAgentEvent('agent:open', (detail) => {
  // 处理事件
});
```

## 集成到 tldraw

在 tldraw 中集成 Agent：

```tsx
import { useState } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import { AgentSidebar, openAgent } from '@/features/agent';
import { Bot } from 'lucide-react';

function TldrawWithAgent() {
  const [showAgent, setShowAgent] = useState(false);

  return (
    <div className="relative h-screen w-screen">
      {/* tldraw 画布 */}
      <Tldraw>
        {/* 自定义工具栏按钮 */}
        <button
          className="absolute top-4 right-4 z-10 rounded-lg bg-white p-2 shadow-md"
          onClick={() => setShowAgent(true)}
        >
          <Bot className="h-6 w-6" />
        </button>
      </Tldraw>

      {/* Agent 侧边栏 */}
      <AgentSidebar
        agentId="tldraw-agent"
        teamId={teamId}
        userId={userId}
        visible={showAgent}
        onClose={() => setShowAgent(false)}
        position="right"
        defaultWidth={500}
        showThreadList={true}
      />
    </div>
  );
}
```

## 样式自定义

### 紧凑模式样式

在 mini/embed 模式下，组件会自动应用紧凑样式：

- Thread 最大宽度从 `44rem` 减少到 `36rem`
- Padding 从 `px-4 pt-4` 减少到 `px-2 pt-2`
- Welcome 文字大小相应缩小
- Footer padding 从 `pb-32` 减少到 `pb-20`

### 自定义 CSS

你可以通过 CSS 变量或 Tailwind 类名进一步自定义样式：

```css
/* 自定义 Thread 最大宽度 */
.aui-thread-root {
  --thread-max-width: 40rem;
}

/* 自定义背景色 */
.agent-sidebar {
  @apply bg-slate-50 dark:bg-slate-900;
}
```

## 最佳实践

1. **性能优化**
   - 使用 `visible` prop 控制 AgentSidebar 的渲染
   - 避免频繁创建/销毁 Runtime
   - 合理使用事件监听

2. **用户体验**
   - 提供明显的打开/关闭按钮
   - 支持键盘快捷键（如 `Cmd+K`）
   - 保存用户的侧边栏宽度偏好

3. **错误处理**
   - 处理 Agent/Thread 加载失败
   - 提供友好的错误提示
   - 支持重试机制

## 示例：完整的 tldraw 集成

查看完整示例代码：

```tsx
// ui/src/features/agent/examples/TldrawAgentIntegration.tsx
import { useState, useEffect } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import { AgentSidebar, useAgentEvent, openAgent } from '@/features/agent';
import { Bot, X } from 'lucide-react';

export function TldrawAgentIntegration() {
  const [showAgent, setShowAgent] = useState(false);
  const [agentId] = useState('tldraw-assistant');

  // 监听快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowAgent((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 监听 Agent 事件
  useAgentEvent('agent:open', () => {
    setShowAgent(true);
  });

  useAgentEvent('agent:close', () => {
    setShowAgent(false);
  });

  return (
    <div className="relative h-screen w-screen">
      <Tldraw>
        {/* Agent 触发按钮 */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-md hover:bg-gray-50"
            onClick={() => setShowAgent(!showAgent)}
            title="Toggle Agent (Cmd+K)"
          >
            {showAgent ? (
              <>
                <X className="h-5 w-5" />
                <span>Close Agent</span>
              </>
            ) : (
              <>
                <Bot className="h-5 w-5" />
                <span>Open Agent</span>
              </>
            )}
          </button>
        </div>
      </Tldraw>

      {/* Agent 侧边栏 */}
      <AgentSidebar
        agentId={agentId}
        teamId="your-team-id"
        userId="your-user-id"
        visible={showAgent}
        onClose={() => setShowAgent(false)}
        position="right"
        defaultWidth={600}
        minWidth={400}
        maxWidth={800}
        showThreadList={true}
        resizable={true}
      />
    </div>
  );
}
```

## 参考文档

- [Agent QUICKSTART](./QUICKSTART.md) - Agent 快速开始
- [ThreadListRuntime API](./docs/ThreadListRuntime.md) - Runtime API 文档
- [Agent Types](./types/agent.types.ts) - 完整类型定义
