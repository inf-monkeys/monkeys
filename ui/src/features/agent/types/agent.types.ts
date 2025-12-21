/**
 * Agent 类型定义
 */

/**
 * Agent 配置
 */
export interface AgentConfig {
  model: string;
  instructions: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  tools?: {
    enabled: boolean;
    toolNames: string[];
    toolsVersion?: string;
  };
  stopWhen?: {
    maxSteps?: number;
    timeout?: number;
  };
  version?: string;
  reasoningEffort?: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high';
  };
}

/**
 * Agent 实体
 */
export interface Agent {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  createdBy: string;
  iconUrl?: string;
  config: AgentConfig;
  createdTimestamp: string;
  updatedTimestamp: string;
}

/**
 * Thread 元数据
 */
export interface ThreadMetadata {
  currentAgentId?: string;
  currentModel?: string;
  tags?: string[];
  source?: 'web' | 'api' | 'integration';
  [key: string]: any;
}

/**
 * Thread 状态
 */
export interface ThreadState {
  activeStreamId?: string;
  pendingToolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt?: string;
  }>;
  taskProgress?: {
    current: number;
    total: number;
    status: string;
    message?: string;
  };
  isRunning?: boolean;
  lastError?: string;
}

/**
 * Thread 实体
 */
export interface Thread {
  id: string;
  agentId?: string;
  teamId: string;
  userId: string;
  title?: string;
  metadata?: ThreadMetadata;
  state?: ThreadState;
  lastMessageAt?: string;
  createdTimestamp: string;
  updatedTimestamp: string;
}

/**
 * UIMessage Part 类型
 */
export type UIMessagePart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'reasoning';
      reasoning: string;
      summary?: string;
    }
  | {
      type: 'tool-call';
      toolCallId: string;
      toolName: string;
      args: any;
      argsText?: string;
      state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
      result?: any;
      isError?: boolean;
    }
  | {
      type: 'tool-result';
      toolCallId: string;
      toolName: string;
      result: any;
      isError?: boolean;
    }
  | {
      type: 'image';
      image: string;
      mediaId?: string;
    }
  | {
      type: 'file';
      file: {
        name: string;
        type: string;
        url: string;
      };
    }
  | {
      type: 'audio';
      audio: string;
    };

/**
 * Message 元数据
 */
export interface UIMessageMetadata {
  model?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason?: 'stop' | 'length' | 'tool-calls' | 'content-filter';
  reasoningSteps?: number;
  duration?: number;
  [key: string]: any;
}

/**
 * Message 实体
 */
export interface Message {
  id: string;
  threadId: string;
  teamId: string;
  role: 'system' | 'user' | 'assistant';
  parts: UIMessagePart[];
  metadata?: UIMessageMetadata;
  parentId?: string;
  branchId?: string;
  createdTimestamp: string;
  updatedTimestamp: string;
}

/**
 * 模型配置
 */
export interface ModelConfig {
  id: string;
  providerId: 'openai' | 'anthropic' | 'google' | 'openai-compatible';
  modelName: string;
  displayName?: string;
  supportsImages?: boolean;
  supportsTools?: boolean;
  maxTokens?: number;
}

/**
 * 创建 Agent DTO
 */
export interface CreateAgentDto {
  name: string;
  description?: string;
  iconUrl?: string;
  config: AgentConfig;
}

/**
 * 更新 Agent DTO
 */
export interface UpdateAgentDto extends Partial<CreateAgentDto> {}

/**
 * 创建 Thread DTO
 */
export interface CreateThreadDto {
  agentId?: string;
  title?: string;
  metadata?: ThreadMetadata;
}

/**
 * 发送消息 DTO
 */
export interface SendMessageDto {
  message: string;
  imageMediaIds?: string[];
  agentId?: string;
  modelId?: string;
}

/**
 * SSE 事件类型
 */
export type SSEEvent =
  | {
      type: 'content_delta';
      delta: string;
      timestamp: number;
    }
  | {
      type: 'tool_call';
      tool_call: {
        id: string;
        name: string;
        arguments: any;
      };
      timestamp: number;
    }
  | {
      type: 'tool_result';
      tool_call_id: string;
      result: any;
      timestamp: number;
    }
  | {
      type: 'done';
      usage?: any;
      finishReason?: string;
      timestamp: number;
    }
  | {
      type: 'error';
      error: string;
      timestamp: number;
    };
