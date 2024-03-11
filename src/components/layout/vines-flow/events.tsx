import React, { useEffect } from 'react';

import { useVinesFlow } from '@/package/vines-flow/use.ts';
import VinesEvent from '@/utils/events';

interface IVinesFlowEventsProps {}

export const VinesFlowEvents: React.FC<IVinesFlowEventsProps> = () => {
  const { vines } = useVinesFlow();

  const handleRemoveNode = (nodeId: string) => vines.deleteNode(nodeId);

  useEffect(() => {
    VinesEvent.on('flow-delete-node', handleRemoveNode);
    return () => {
      VinesEvent.off('flow-delete-node', handleRemoveNode);
    };
  }, []);

  return null;
};
