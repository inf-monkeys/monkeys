/**
 * AgentContextProvider - Provides team and user context to agent components
 */

import { createContext, useContext, type ReactNode } from 'react';

interface AgentContextValue {
  teamId: string;
  userId: string;
  agentId?: string;
}

const AgentContext = createContext<AgentContextValue | null>(null);

interface AgentContextProviderProps {
  children: ReactNode;
  teamId: string;
  userId: string;
  agentId?: string;
}

export function AgentContextProvider({
  children,
  teamId,
  userId,
  agentId,
}: AgentContextProviderProps) {
  return (
    <AgentContext.Provider value={{ teamId, userId, agentId }}>
      {children}
    </AgentContext.Provider>
  );
}

/**
 * Hook to access agent context (teamId, userId, agentId)
 */
export function useAgentContext() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used within AgentContextProvider');
  }
  return context;
}

/**
 * Optional version that returns null if not in context
 */
export function useAgentContextOptional() {
  return useContext(AgentContext);
}
