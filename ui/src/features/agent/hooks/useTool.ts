/**
 * Tool hooks
 */

import { useQuery } from '@tanstack/react-query';
import { toolApi } from '../api/agent-api';

/**
 * 获取可用工具列表
 */
export function useToolList(teamId: string) {
  return useQuery({
    queryKey: ['tools', teamId],
    queryFn: () => toolApi.listTools(teamId),
    enabled: !!teamId,
  });
}

/**
 * 获取工具调用历史
 */
export function useToolCalls(threadId: string, teamId: string) {
  return useQuery({
    queryKey: ['toolCalls', threadId, teamId],
    queryFn: () => toolApi.getToolCalls(threadId, teamId),
    enabled: !!threadId && !!teamId,
  });
}

/**
 * 获取待审批的工具调用
 */
export function usePendingToolCalls(threadId: string, teamId: string) {
  return useQuery({
    queryKey: ['pendingToolCalls', threadId, teamId],
    queryFn: () => toolApi.getPendingToolCalls(threadId, teamId),
    enabled: !!threadId && !!teamId,
    refetchInterval: 5000, // 每5秒轮询一次
  });
}

/**
 * 获取工具调用统计
 */
export function useToolCallStats(teamId: string, period: 'day' | 'week' | 'month' = 'day') {
  return useQuery({
    queryKey: ['toolCallStats', teamId, period],
    queryFn: () => toolApi.getToolCallStats(teamId, period),
    enabled: !!teamId,
  });
}
