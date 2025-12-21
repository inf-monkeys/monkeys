/**
 * AgentList 组件 - Agent 列表
 */

import { useAgentList } from '../hooks/useAgent';
import type { Agent } from '../types/agent.types';
import { formatDistanceToNow } from 'date-fns';

interface AgentListProps {
  teamId: string;
  onAgentSelect: (agentId: string) => void;
  onAgentCreate?: () => void;
  selectedAgentId?: string;
  className?: string;
}

/**
 * Agent 列表组件
 */
export function AgentList({
  teamId,
  onAgentSelect,
  onAgentCreate,
  selectedAgentId,
  className = '',
}: AgentListProps) {
  const { data: agents = [], loading, error, refresh } = useAgentList(teamId);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-sm text-gray-500">Loading agents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-sm text-red-500">Failed to load agents</div>
        <button
          onClick={refresh}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Agents</h2>
        {onAgentCreate && (
          <button
            onClick={onAgentCreate}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Agent
          </button>
        )}
      </div>

      {/* Agent Grid */}
      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12">
          <div className="text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No agents</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new agent.</p>
            {onAgentCreate && (
              <button
                onClick={onAgentCreate}
                className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Agent
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={agent.id === selectedAgentId}
              onClick={() => onAgentSelect(agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Agent 卡片
 */
function AgentCard({
  agent,
  isSelected,
  onClick,
}: {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(agent.updatedTimestamp), {
    addSuffix: true,
  });

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col rounded-lg border p-4 text-left transition-all hover:shadow-md
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      {/* Icon and Name */}
      <div className="flex items-start space-x-3">
        {agent.iconUrl ? (
          <img
            src={agent.iconUrl}
            alt={agent.name}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <span className="text-lg font-semibold">
              {agent.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{agent.name}</h3>
          {agent.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {agent.description}
            </p>
          )}
        </div>
      </div>

      {/* Model Info */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span className="rounded bg-gray-100 px-2 py-1">
          {agent.config.model}
        </span>
        <span>{timeAgo}</span>
      </div>

      {/* Tags */}
      <div className="mt-2 flex flex-wrap gap-1">
        {agent.config.tools?.enabled && (
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
            Tools
          </span>
        )}
        {agent.config.reasoningEffort?.enabled && (
          <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
            Reasoning
          </span>
        )}
      </div>
    </button>
  );
}
