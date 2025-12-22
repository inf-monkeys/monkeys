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

    return await response.json();
  },

  /**
   * 获取 Agent 列表
   */
  listAgents: (teamId: string): Promise<Agent[]> => {
    return vinesFetcher<Agent[]>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}?teamId=${teamId}`) as Promise<Agent[]>;
  },

  /**
   * 获取单个 Agent
   */
  getAgent: (agentId: string, teamId: string): Promise<Agent> => {
    return vinesFetcher<Agent>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/${agentId}?teamId=${teamId}`) as Promise<Agent>;
  },

  /**
   * 更新 Agent
   */
  updateAgent: (agentId: string, teamId: string, data: UpdateAgentDto): Promise<Agent> => {
    return vinesFetcher<Agent, UpdateAgentDto & { teamId: string }>({
      method: 'PUT',
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/${agentId}`, { ...data, teamId }) as Promise<Agent>;
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
   */
  listModels: (teamId: string): Promise<ModelConfig[]> => {
    return vinesFetcher<ModelConfig[]>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/models?teamId=${teamId}`) as Promise<ModelConfig[]>;
  },
};

/**
 * Thread 相关 API
 */
export const threadApi = {
  /**
   * 创建 Thread
   */
  createThread: (teamId: string, userId: string, data: CreateThreadDto): Promise<Thread> => {
    return vinesFetcher<Thread, CreateThreadDto & { teamId: string; userId: string }>({
      method: 'POST',
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/threads`, { ...data, teamId, userId }) as Promise<Thread>;
  },

  /**
   * 获取 Thread 列表
   */
  listThreads: (teamId: string, userId?: string, agentId?: string): Promise<Thread[]> => {
    const params = new URLSearchParams({ teamId });
    if (userId) params.append('userId', userId);
    if (agentId) params.append('agentId', agentId);
    return vinesFetcher<Thread[]>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/threads?${params.toString()}`) as Promise<Thread[]>;
  },

  /**
   * 获取单个 Thread
   */
  getThread: (threadId: string, teamId: string): Promise<Thread> => {
    return vinesFetcher<Thread>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/threads/${threadId}?teamId=${teamId}`) as Promise<Thread>;
  },

  /**
   * 更新 Thread
   */
  updateThread: (threadId: string, teamId: string, data: Partial<Thread>): Promise<Thread> => {
    return vinesFetcher<Thread, Partial<Thread> & { teamId: string }>({
      method: 'PUT',
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/threads/${threadId}`, { ...data, teamId }) as Promise<Thread>;
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
  getMessages: (threadId: string, teamId: string): Promise<Message[]> => {
    return vinesFetcher<Message[]>({
      simple: true,
      responseResolver: directJsonResolver
    })(`${API_BASE}/threads/${threadId}/messages?teamId=${teamId}`) as Promise<Message[]>;
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
