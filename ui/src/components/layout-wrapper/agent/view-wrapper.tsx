import React, { useEffect } from 'react';

import { useAgentStore } from '@/store/useAgentStore';

interface IVinesAgentViewWrapperProps {
  children?: React.ReactNode;
  agentId?: string;
}

export const VinesAgentViewWrapper: React.FC<IVinesAgentViewWrapperProps> = ({ children, agentId }) => {
  const setAgentId = useAgentStore((s) => s.setAgentId);

  useEffect(() => {
    if (agentId) {
      setAgentId(agentId);
    }
  }, [agentId]);

  return children;
};
