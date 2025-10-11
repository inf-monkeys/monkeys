import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IVinesChatSession } from '@/apis/workflow/chat/typings.ts';

// Data transformation functions
export const transformAgentV2SessionToVinesChatSession = (
  agentV2Session: IAgentV2SessionListResponse['data']['sessions'][0],
): IVinesChatSession => {
  return {
    id: agentV2Session.id,
    displayName: agentV2Session.title,
    creatorUserId: agentV2Session.userId,
    // teamId will be inherited from the agent context
    workflowId: agentV2Session.agentId, // Use agentId as workflowId for compatibility
    createdTimestamp: agentV2Session.createdTimestamp,
    updatedTimestamp: agentV2Session.updatedTimestamp,
    isDeleted: false,
  };
};

// Agent V2 Chat types
export interface IAgentV2ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: any[];
  createdAt: Date;
  isStreaming?: boolean;
  senderId?: string;
  isSystem?: boolean;
  messageType?: 'thinking' | 'tool_call' | 'tool_result' | 'summary' | 'final_response'; // 新增消息类型标识
}

export interface IAgentV2SessionStatus {
  sessionId: string;
  isActive: boolean;
  activeProcessing: boolean;
  taskStatus: {
    status: 'pending' | 'running' | 'completed' | 'failed' | 'not_found';
    currentLoopCount?: number;
    consecutiveMistakeCount?: number;
    lastProcessedMessageId?: string;
  };
  queueInfo: {
    totalQueued: number;
    totalProcessing: number;
    totalProcessed: number;
    totalFailed: number;
  };
  contextInfo?: {
    agentId: string;
    sessionId: string;
  };
}

export interface IAgentV2SessionListResponse {
  success: boolean;
  data: {
    sessions: Array<{
      id: string;
      createdTimestamp: number;
      updatedTimestamp: number;
      isDeleted: boolean;
      agentId: string;
      userId: string;
      title: string;
      metadata: any;
    }>;
    total: number;
  };
  error?: string;
}

export interface IAgentV2MessagesResponse {
  success: boolean;
  data: {
    messages: Array<{
      id: string;
      sessionId: string;
      senderId: string;
      content: string;
      isSystem: boolean;
      toolCalls?: any[];
      createdTimestamp: number;
      updatedTimestamp: number;
    }>;
    total: number;
  };
  error?: string;
}

export interface IAgentV2ContextUsageResponse {
  success: boolean;
  data: {
    sessionId: string;
    messageCount: number;
    estimatedTokens: number;
    maxTokens: number;
    usagePercentage: number;
    isNearLimit: boolean;
    isOverLimit: boolean;
    canAcceptNewMessages: boolean;
    recommendedAction: 'normal' | 'approaching_limit' | 'context_limit_reached';
  };
  error?: string;
}

// API functions
export const useAgentV2SessionStatus = (sessionId?: string) => {
  const key = sessionId ? `/api/agent-v2/sessions/${sessionId}/status` : 'agentv2-session-status:disabled';
  return useSWR<IAgentV2SessionStatus | undefined>(
    key,
    (url) =>
      sessionId
        ? vinesFetcher<{ success: boolean; data: IAgentV2SessionStatus }>()(url).then((response) =>
            response?.success ? response.data : undefined,
          )
        : Promise.resolve(undefined),
    {
      refreshInterval: sessionId ? 10000 : 0, // 每10秒轮询一次，仅在有sessionId时
      revalidateOnFocus: !!sessionId,
      isPaused: () => !sessionId, // 明确暂停
    },
  );
};

export const useAgentV2Sessions = (agentId?: string) => {
  return useSWR<IAgentV2SessionListResponse | undefined>(
    agentId ? `/api/agent-v2/${agentId}/sessions?limit=20` : null,
    (url) => vinesFetcher<IAgentV2SessionListResponse>()(url),
  );
};

// Compatible hook for ChatSidebar component - returns transformed data
export const useAgentV2SessionsAsVinesFormat = (agentId?: string) => {
  const { data, error, mutate, isLoading } = useAgentV2Sessions(agentId);

  // Handle both wrapped and unwrapped response formats
  let transformedData: IVinesChatSession[] | undefined;
  if (data?.success) {
    // Wrapped format: {success: true, data: {sessions: []}}
    transformedData = data.data.sessions.map(transformAgentV2SessionToVinesChatSession);
  } else if ((data as any)?.sessions) {
    // Direct format: {sessions: [], total: 1}
    transformedData = (data as any).sessions.map(transformAgentV2SessionToVinesChatSession);
  } else {
    transformedData = undefined;
  }

  return {
    data: transformedData,
    error,
    mutate,
    isLoading,
  };
};

export const useAgentV2Messages = (sessionId?: string) => {
  return useSWR<IAgentV2MessagesResponse | undefined>(
    sessionId ? `/api/agent-v2/sessions/${sessionId}/messages?limit=100` : null,
    (url) => vinesFetcher<IAgentV2MessagesResponse>()(url),
    {
      revalidateOnFocus: false,
    },
  );
};

export const useAgentV2ContextUsage = (sessionId?: string) => {
  return useSWR<IAgentV2ContextUsageResponse | undefined>(
    sessionId ? `/api/agent-v2/sessions/${sessionId}/context-usage` : null,
    (url) => vinesFetcher<IAgentV2ContextUsageResponse>()(url),
  );
};

// API call functions
export const sendMessageToSession = async (sessionId: string, message: string): Promise<boolean> => {
  try {
    const response = await vinesFetcher<{ success: boolean; message?: string }>({
      method: 'POST',
      simple: true,
    })(`/api/agent-v2/sessions/${sessionId}/message`, { message });

    return response?.success || false;
  } catch (error) {
    console.error('Failed to send message to session:', error);
    return false;
  }
};

export const resumeSession = async (sessionId: string): Promise<boolean> => {
  try {
    const response = await vinesFetcher<{ success: boolean }>({
      method: 'POST',
      simple: true,
    })(`/api/agent-v2/sessions/${sessionId}/resume`);

    return response?.success || false;
  } catch (error) {
    console.error('Failed to resume session:', error);
    return false;
  }
};

export const stopSession = async (sessionId: string): Promise<boolean> => {
  try {
    const response = await vinesFetcher<{ success: boolean }>({
      method: 'POST',
      simple: true,
    })(`/api/agent-v2/sessions/${sessionId}/stop`);

    return response?.success || false;
  } catch (error) {
    console.error('Failed to stop session:', error);
    return false;
  }
};

export const submitFollowupAnswer = async (sessionId: string, answer: string): Promise<boolean> => {
  try {
    const response = await vinesFetcher<{ success: boolean }>({
      method: 'POST',
      simple: true,
    })(`/api/agent-v2/sessions/${sessionId}/followup-answer`, { answer });

    return response?.success || false;
  } catch (error) {
    console.error('Failed to submit followup answer:', error);
    return false;
  }
};
