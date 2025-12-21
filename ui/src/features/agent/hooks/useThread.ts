/**
 * useThread hook - Thread 数据管理
 */

import { useRequest } from 'ahooks';
import { threadApi } from '../api/agent-api';
import type { CreateThreadDto, Message, Thread } from '../types/agent.types';

/**
 * 获取 Thread 列表
 */
export function useThreadList(teamId: string, userId?: string) {
  return useRequest(
    () => threadApi.listThreads(teamId, userId),
    {
      ready: !!teamId,
      refreshDeps: [teamId, userId],
    },
  );
}

/**
 * 获取单个 Thread
 */
export function useThread(threadId: string, teamId: string) {
  return useRequest(
    () => threadApi.getThread(threadId, teamId),
    {
      ready: !!threadId && !!teamId,
      refreshDeps: [threadId, teamId],
    },
  );
}

/**
 * 创建 Thread
 */
export function useCreateThread(teamId: string) {
  return useRequest(
    (data: CreateThreadDto & { userId: string }) => {
      const { userId, ...threadData } = data;
      return threadApi.createThread(teamId, userId, threadData);
    },
    {
      manual: true,
    },
  );
}

/**
 * 更新 Thread
 */
export function useUpdateThread(threadId: string, teamId: string) {
  return useRequest(
    (data: Partial<Thread>) => threadApi.updateThread(threadId, teamId, data),
    {
      manual: true,
    },
  );
}

/**
 * 删除 Thread
 */
export function useDeleteThread(threadId: string, teamId: string) {
  return useRequest(
    () => threadApi.deleteThread(threadId, teamId),
    {
      manual: true,
    },
  );
}

/**
 * 获取 Thread 的消息列表
 */
export function useThreadMessages(threadId: string, teamId: string) {
  return useRequest(
    () => threadApi.getMessages(threadId, teamId),
    {
      ready: !!threadId && !!teamId,
      refreshDeps: [threadId, teamId],
    },
  );
}
