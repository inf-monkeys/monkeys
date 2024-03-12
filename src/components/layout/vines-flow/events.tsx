import React, { useEffect } from 'react';

import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events';

interface IVinesFlowEventsProps {}

export const VinesFlowEvents: React.FC<IVinesFlowEventsProps> = () => {
  const { workflowId } = useFlowStore();
  const { vines } = useVinesFlow();

  const handleRemoveNode = (_wid: string, nodeId: string) => {
    if (workflowId !== _wid) return;
    vines.deleteNode(nodeId);
  };

  useEffect(() => {
    VinesEvent.on('flow-delete-node', handleRemoveNode);
    return () => {
      VinesEvent.off('flow-delete-node', handleRemoveNode);
    };
  }, [workflowId]);

  return null;
};
