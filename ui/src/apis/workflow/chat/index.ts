import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IVinesChatSession, IVinesCreateChatSessionParams } from '@/apis/workflow/chat/typings.ts';

export const useWorkflowChatSessions = (workflowId: string) =>
  useSWR<IVinesChatSession[] | undefined>(
    workflowId ? `/api/workflow/chat-sessions?workflowId=${workflowId}` : null,
    vinesFetcher(),
  );

export const useCreateWorkflowChatSession = () =>
  useSWRMutation<IVinesChatSession | undefined, unknown, string, IVinesCreateChatSessionParams>(
    '/api/workflow/chat-sessions',
    vinesFetcher({ method: 'POST' }),
  );

export const useDeleteWorkflowChatSession = (sessionId?: string) =>
  useSWRMutation<{ success: boolean } | undefined, unknown, string | null>(
    sessionId ? `/api/workflow/chat-sessions/${sessionId}` : null,
    vinesFetcher({ method: 'DELETE' }),
  );