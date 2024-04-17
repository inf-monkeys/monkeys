import React, { useMemo } from 'react';

import { createVinesCore } from '@/package/vines-flow';

interface IVinesFlowProviderProps {
  workflowId: string;
  children: React.ReactNode;
}

export const VinesFlowProvider: React.FC<IVinesFlowProviderProps> = ({ workflowId, children }) => {
  const Wrapper = useMemo(() => {
    const { VinesProvider } = createVinesCore(workflowId);

    return VinesProvider;
  }, [workflowId]);

  return Wrapper({ children });
};
