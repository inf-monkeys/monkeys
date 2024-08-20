import React from 'react';

import { VinesChatWorkflowModeInput } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input';
import { VinesChatList } from '@/components/layout/workspace/vines-view/chat/workflow-mode/messages';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { useViewStore } from '@/store/useViewStore';

interface IVinesWorkflowModeProps {
  height: number;
  disabled?: boolean;
}

export const VinesWorkflowMode: React.FC<IVinesWorkflowModeProps> = ({ height, disabled = false }) => {
  const { page } = useVinesPage();
  const isSimple = page?.customOptions?.isHideExecutionProcess ?? false;

  const visible = useViewStore((s) => s.visible);
  const workflowId = useFlowStore((s) => s.workflowId);

  return (
    <>
      <div className="size-full flex-1">
        <VinesChatList visible={visible} workflowId={workflowId} useSimple={isSimple} />
      </div>
      <VinesChatWorkflowModeInput workflowId={workflowId} height={height} isSimple={isSimple} disabled={disabled} />
    </>
  );
};
