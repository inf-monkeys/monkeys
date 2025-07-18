import React from 'react';

import { useTranslation } from 'react-i18next';

import { VinesIcon } from '@/components/ui/vines-icon';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events.ts';
interface IComplicateFakeNodeProps {
  insertFromNodeId: string;
}

export const ComplicateFakeNode: React.FC<IComplicateFakeNodeProps> = ({ insertFromNodeId }) => {
  const { t } = useTranslation();

  const workflowId = useFlowStore((s) => s.workflowId);

  const isWorkflowReadOnly = useCanvasStore((s) => s.isWorkflowReadOnly);

  const handleOnClick = () => {
    if (isWorkflowReadOnly) return;
    VinesEvent.emit('flow-select-nodes', {
      _wid: workflowId,
      targetNodeId: insertFromNodeId,
    });
  };

  return (
    <div
      className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-global"
      onClick={handleOnClick}
    >
      <VinesIcon src="emoji:⛔:#35363b" size="xl" disabledPreview />
      <h1 className="font-bold">{t('workspace.flow-view.vines.tools.fake.name')}</h1>
    </div>
  );
};
