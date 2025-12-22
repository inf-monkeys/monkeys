/**
 * Agent API 客户端
 */

import { vinesFetcher } from '@/apis/fetcher';
import type {
  Agent,
  CreateAgentDto,
  CreateThreadDto,
  Message,
  ModelConfig,
  SendMessageDto,
  Thread,
  Tool,
  ToolCall,
  UpdateAgentDto,
} from '../types/agent.types';

const API_BASE = '/api/agents';

/**
 * 通用响应解析器 - 直接返回 JSON
 */
const directJsonResolver = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return await response.json();
};

/**
 * Agent 相关 API
 */
export const agentApi = {
  /**
   * 创建 Agent  */
  createAgent: async (teamId: string, userId: string, data: CreateAgentDto): Promise<Agent> => {
    const token = localStorage.getItem('vines-token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, teamId, createdBy: userId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    // Extract data field from SuccessResponse
    return result.data;
  },

  /**
   * 获取 Agent 列表
   * 注意：Agent Controller 返回 SuccessResponse 包装的数据
   */
  listAgents: async (teamId: string): Promise<Agent[]> => {
    const response = await vinesFetcher<{ data: Agent[] }>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}?teamId=${teamId}`);
    return (response as any)?.data || [];
  },

  /**
   * 获取单个 Agent
   * 注意：Agent Controller 返回 SuccessResponse 包装的数据
   */
  getAgent: async (agentId: string, teamId: string): Promise<Agent> => {
    const response = await vinesFetcher<{ data: Agent }>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/${agentId}?teamId=${teamId}`);
    return (response as any)?.data;
  },

  /**
   * 更新 Agent
   * 注意：Agent Controller 返回 SuccessResponse 包装的数据
   */
  updateAgent: async (agentId: string, teamId: string, data: UpdateAgentDto): Promise<Agent> => {
    const response = await vinesFetcher<{ data: Agent }, UpdateAgentDto & { teamId: string }>({
      method: 'PUT',
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/${agentId}`, { ...data, teamId });
    return (response as any)?.data;
  },

  /**
   * 删除 Agent
   */
  deleteAgent: (agentId: string, teamId: string): Promise<void> => {
    return vinesFetcher<void>({
      method: 'DELETE',
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/${agentId}?teamId=${teamId}`) as Promise<void>;
  },

  /**
   * 获取可用模型列表
   * 注意：Agent Controller 返回 SuccessResponse 包装的数据
   */
  listModels: async (teamId: string): Promise<ModelConfig[]> => {
    const response = await vinesFetcher<{ data: ModelConfig[] }>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/models?teamId=${teamId}`);
    return (response as any)?.data || [];
  },
};

/**
 * Thread 相关 API
 * 注意：Thread API 返回 SuccessResponse 包装的数据
 */
export const threadApi = {
  /**
   * 创建 Thread
   */
  createThread: async (teamId: string, userId: string, data: CreateThreadDto): Promise<Thread> => {
    const response = await vinesFetcher<{ data: Thread }, CreateThreadDto & { teamId: string; userId: string }>({
      method: 'POST',
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/threads`, { ...data, teamId, userId });
    return (response as any)?.data;
  },

  /**
   * 获取 Thread 列表
   */
  listThreads: async (teamId: string, userId?: string, agentId?: string): Promise<Thread[]> => {
    const params = new URLSearchParams({ teamId });
    if (userId) params.append('userId', userId);
    if (agentId) params.append('agentId', agentId);
    const response = await vinesFetcher<{ data: Thread[] }>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/threads?${params.toString()}`);
    return (response as any)?.data || [];
  },

  /**
   * 获取单个 Thread
   */
  getThread: async (threadId: string, teamId: string): Promise<Thread> => {
    const response = await vinesFetcher<{ data: Thread }>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/threads/${threadId}?teamId=${teamId}`);
    return (response as any)?.data;
  },

  /**
   * 更新 Thread
   */
  updateThread: async (threadId: string, teamId: string, data: Partial<Thread>): Promise<Thread> => {
    const response = await vinesFetcher<{ data: Thread }, Partial<Thread> & { teamId: string }>({
      method: 'PUT',
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/threads/${threadId}`, { ...data, teamId });
    return (response as any)?.data;
  },

  /**
   * 删除 Thread
   */
  deleteThread: (threadId: string, teamId: string): Promise<void> => {
    return vinesFetcher<void>({
      method: 'DELETE',
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/threads/${threadId}?teamId=${teamId}`) as Promise<void>;
  },

  /**
   * 获取 Thread 的消息列表
   */
  getMessages: async (threadId: string, teamId: string): Promise<Message[]> => {
    const response = await vinesFetcher<{ data: Message[] }>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/threads/${threadId}/messages?teamId=${teamId}`);
    return (response as any)?.data || [];
  },
};

/**
 * 流式聊天 API
 */
export const chatApi = {
  /**
   * 发送消息并获取流式响应（SSE格式）
   */
  streamChat: async function* (
    threadId: string,
    teamId: string,
    userId: string,
    data: SendMessageDto,
  ): AsyncGenerator<any> {
    // 获取认证 token
    const token = localStorage.getItem('vines-token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/threads/${threadId}/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userMessage: data.message,
        imageMediaIds: data.imageMediaIds,
        agentId: data.agentId,
        modelId: data.modelId,
        teamId,
        userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Request failed');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // 处理buffer中剩余的数据
          if (buffer.trim()) {
            const lines = buffer.split('\n');
            for (const line of lines) {
              if (line.trim().startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.trim().slice(6));
                  yield data;
                } catch (e) {
                  console.warn('Failed to parse SSE data:', line, e);
                }
              }
            }
          }
          break;
        }

        // 将新数据添加到buffer
        buffer += decoder.decode(value, { stream: true });

        // 按\n\n分割事件
        const parts = buffer.split('\n\n');

        // 最后一部分可能不完整，保留在buffer中
        buffer = parts.pop() || '';

        // 处理完整的事件
        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              try {
                const data = JSON.parse(line.trim().slice(6));
                yield data;
              } catch (e) {
                console.warn('Failed to parse SSE data:', line, e);
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

/**
 * Tool 相关 API
 */
export const toolApi = {
  /**
   * 获取可用工具列表
   */
  listTools: async (teamId: string): Promise<Tool[]> => {
    const response = await vinesFetcher<{ data: Tool[] }>({
      simple: true,
      responseResolver: directJsonResolver,
    })(`/api/tools?teamId=${teamId}`);
    // 后端返回 SuccessResponse 格式，需要提取 data 字段
    return (response as any)?.data || [];
  },

  /**
   * 获取线程的工具调用历史
   */
  getToolCalls: async (threadId: string, teamId: string): Promise<ToolCall[]> => {
    const response = await vinesFetcher<{ data: ToolCall[] }>({
      simple: true,
      responseResolver: directJsonResolver,
    })(`${API_BASE}/threads/${threadId}/tool-calls?teamId=${teamId}`);
    return (response as any)?.data || [];
  },

  /**
   * 获取待审批的工具调用
   */
  getPendingToolCalls: async (threadId: string, teamId: string): Promise<ToolCall[]> => {
    const response = await vinesFetcher<{ data: ToolCall[] }>({
      simple: true,
      responseResolver: directJsonResolver,
    })(`${API_BASE}/threads/${threadId}/tool-calls/pending?teamId=${teamId}`);
    return (response as any)?.data || [];
  },

  /**
   * 审批或拒绝工具调用
   */
  approveToolCall: async (
    toolCallId: string,
    approved: boolean,
    teamId: string,
    userId: string,
  ): Promise<{ success: boolean; approved: boolean }> => {
    const response = await vinesFetcher<
      { data: { success: boolean; approved: boolean } },
      { approved: boolean; teamId: string; userId: string }
    >({
      method: 'POST',
      simple: true,
      responseResolver: directJsonResolver,
    })(`${API_BASE}/tool-calls/${toolCallId}/approve`, {
      approved,
      teamId,
      userId,
    });
    return (response as any)?.data || { success: false, approved: false };
  },

  /**
   * 获取工具调用统计
   */
  getToolCallStats: async (
    teamId: string,
    period: 'day' | 'week' | 'month' = 'day',
  ): Promise<{
    totalCalls: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
    quotaUsage: {
      current: number;
      limit: number;
      percentage: number;
    };
    byTool: Record<string, { calls: number; avgDuration: number }>;
  }> => {
    const response = await vinesFetcher({
      simple: true,
      responseResolver: directJsonResolver,
    })(`${API_BASE}/tool-calls/stats?teamId=${teamId}&period=${period}`);
    return (response as any)?.data || {
      totalCalls: 0,
      successCount: 0,
      failureCount: 0,
      averageDuration: 0,
      quotaUsage: { current: 0, limit: 0, percentage: 0 },
      byTool: {},
    };
  },
};
