import React, { useEffect } from 'react';

import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { usePageStore } from '@/store/usePageStore';
import VinesEvent from '@/utils/events.ts';

interface IVinesFlowEventsProps {}

export const VinesFlowEvents: React.FC<IVinesFlowEventsProps> = () => {
  const { workflowId } = usePageStore();
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
