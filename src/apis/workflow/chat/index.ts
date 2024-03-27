import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IVinesChatSession } from '@/apis/workflow/chat/typings.ts';

export const useWorkflowChatSessions = (workflowId: string) =>
  useSWR<IVinesChatSession[] | undefined>(
    workflowId ? `/api/chat-sessions?workflowId=${workflowId}` : null,
    vinesFetcher(),
  );
