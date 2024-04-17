import React from 'react';

import { VinesIcon } from '@/components/ui/vines-icon';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';
interface IComplicateFakeNodeProps {
  insertFromNodeId: string;
}

export const ComplicateFakeNode: React.FC<IComplicateFakeNodeProps> = ({ insertFromNodeId }) => {
  const { workflowId } = useFlowStore();

  const handleOnClick = () => {
    VinesEvent.emit('flow-select-nodes', {
      _wid: workflowId,
      targetNodeId: insertFromNodeId,
    });
  };

  return (
    <div
      className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4"
      onClick={handleOnClick}
    >
      <VinesIcon src="emoji:⛔:#35363b" size="xl" />
      <h1 className="font-bold">点击添加节点</h1>
    </div>
  );
};
