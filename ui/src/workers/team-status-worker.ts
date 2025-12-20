/**
 * SharedWorker for Team Status SSE
 * 所有标签页共享一个 SSE 连接，通过 SharedWorker 广播事件
 */

interface TeamStatusSSEEvent {
  type: 'connected' | 'status_update' | 'heartbeat' | 'complete' | 'error';
  teamId: string;
  status?: string;
  timestamp: string;
  error?: string;
}

interface WorkerMessage {
  action: 'subscribe' | 'unsubscribe';
  teamId: string;
  token?: string;
}

// 存储每个 teamId 的 EventSource 连接
const connections = new Map<string, EventSource>();

// 存储每个 teamId 的订阅者端口
const subscribers = new Map<string, Set<MessagePort>>();

// 连接到 SSE
function connectSSE(teamId: string, token: string) {
  // 如果已经有连接，直接返回
  if (connections.has(teamId)) {
    console.log(`[Worker] SSE 连接已存在: ${teamId}`);
    return;
  }

  const url = `/api/teams/${teamId}/init-status`;

  console.log(`[Worker] 建立 SSE 连接: ${teamId}`);

  const eventSource = new EventSource(url);

  eventSource.onopen = () => {
    console.log(`[Worker] SSE 连接已打开: ${teamId}`);
    broadcast(teamId, {
      type: 'connected',
      teamId,
      timestamp: new Date().toISOString(),
    });
  };

  eventSource.onerror = (error) => {
    console.error(`[Worker] SSE 连接错误: ${teamId}`, error);
    broadcast(teamId, {
      type: 'error',
      teamId,
      timestamp: new Date().toISOString(),
      error: 'SSE connection error',
    });

    // 清理连接
    connections.delete(teamId);
    eventSource.close();
  };

  // 监听不同类型的事件
  const eventTypes = ['connected', 'status_update', 'heartbeat', 'complete'];

  eventTypes.forEach((eventType) => {
    eventSource.addEventListener(eventType, (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as TeamStatusSSEEvent;
        console.log(`[Worker] 收到事件 ${eventType}:`, data);
        broadcast(teamId, data);

        // 如果是 complete 事件，关闭连接
        if (data.type === 'complete') {
          console.log(`[Worker] 收到 complete，关闭连接: ${teamId}`);
          connections.delete(teamId);
          eventSource.close();
        }
      } catch (err) {
        console.error(`[Worker] 解析事件失败:`, err);
      }
    });
  });

  connections.set(teamId, eventSource);
}

// 广播消息给所有订阅该 teamId 的端口
function broadcast(teamId: string, message: TeamStatusSSEEvent) {
  const ports = subscribers.get(teamId);
  if (!ports) return;

  ports.forEach((port) => {
    try {
      port.postMessage(message);
    } catch (err) {
      console.error(`[Worker] 发送消息失败:`, err);
    }
  });
}

// 断开 SSE 连接
function disconnectSSE(teamId: string) {
  const eventSource = connections.get(teamId);
  if (eventSource) {
    console.log(`[Worker] 关闭 SSE 连接: ${teamId}`);
    eventSource.close();
    connections.delete(teamId);
  }
}

// SharedWorker 入口
self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0];

  port.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { action, teamId, token } = e.data;

    switch (action) {
      case 'subscribe': {
        console.log(`[Worker] 订阅请求: ${teamId}`);

        // 添加订阅者
        if (!subscribers.has(teamId)) {
          subscribers.set(teamId, new Set());
        }
        subscribers.get(teamId)!.add(port);

        // 如果还没有连接，建立 SSE 连接
        if (!connections.has(teamId)) {
          connectSSE(teamId, token || '');
        } else {
          // 如果已有连接，立即发送 connected 事件
          port.postMessage({
            type: 'connected',
            teamId,
            timestamp: new Date().toISOString(),
          });
        }
        break;
      }

      case 'unsubscribe': {
        console.log(`[Worker] 取消订阅: ${teamId}`);

        const ports = subscribers.get(teamId);
        if (ports) {
          ports.delete(port);

          // 如果没有订阅者了，断开 SSE 连接
          if (ports.size === 0) {
            subscribers.delete(teamId);
            disconnectSSE(teamId);
          }
        }
        break;
      }
    }
  };

  // 端口关闭时清理
  port.start();
};
