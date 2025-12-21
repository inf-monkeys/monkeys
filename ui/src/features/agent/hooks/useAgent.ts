/**
 * useAgent hook - Agent 数据管理
 */

import { useRequest } from 'ahooks';
import { agentApi } from '../api/agent-api';
import type { Agent, CreateAgentDto, ModelConfig, UpdateAgentDto } from '../types/agent.types';

/**
 * 获取 Agent 列表
 */
export function useAgentList(teamId: string) {
  return useRequest(
    () => agentApi.listAgents(teamId),
    {
      ready: !!teamId,
      refreshDeps: [teamId],
    },
  );
}

/**
 * 获取单个 Agent
 */
export function useAgent(agentId: string, teamId: string) {
  return useRequest(
    () => agentApi.getAgent(agentId, teamId),
    {
      ready: !!agentId && !!teamId,
      refreshDeps: [agentId, teamId],
    },
  );
}

/**
 * 创建 Agent
 */
export function useCreateAgent(teamId: string) {
  return useRequest(
    (data: CreateAgentDto) => agentApi.createAgent(teamId, data),
    {
      manual: true,
    },
  );
}

/**
 * 更新 Agent
 */
export function useUpdateAgent(agentId: string, teamId: string) {
  return useRequest(
    (data: UpdateAgentDto) => agentApi.updateAgent(agentId, teamId, data),
    {
      manual: true,
    },
  );
}

/**
 * 删除 Agent
 */
export function useDeleteAgent(agentId: string, teamId: string) {
  return useRequest(
    () => agentApi.deleteAgent(agentId, teamId),
    {
      manual: true,
    },
  );
}

/**
 * 获取可用模型列表
 */
export function useModelList(teamId: string) {
  return useRequest(
    () => agentApi.listModels(teamId),
    {
      ready: !!teamId,
      refreshDeps: [teamId],
    },
  );
}
