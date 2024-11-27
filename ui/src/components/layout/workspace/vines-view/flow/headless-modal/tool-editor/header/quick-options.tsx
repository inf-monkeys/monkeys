import React from 'react';

import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IQuickOptionsProps {
  nodeId?: string;
}

export const QuickOptions: React.FC<IQuickOptionsProps> = ({ nodeId }) => {
  const { t } = useTranslation();

  const isLatestWorkflowVersion = useFlowStore((s) => s.isLatestWorkflowVersion);
  const isWorkflowReadOnly = useCanvasStore((s) => s.isWorkflowReadOnly);

  const { vines } = useVinesFlow();

  const nodes = vines
    .getAllNodes()
    .filter(({ id }) => !['workflow_start', 'workflow_end'].includes(id) && !id.startsWith('fake_node'));

  const currentNodeIndex = nodes.findIndex(({ id }) => id === nodeId);
  const lastNodeId = nodes?.[currentNodeIndex - 1]?.id;
  const nextNodeId = nodes?.[currentNodeIndex + 1]?.id;

  const handleToggle = (id: string) => VinesEvent.emit('flow-tool-editor', vines.workflowId, id);

  const handleDelete = () => {
    if (!nodeId) {
      toast.error(t('workspace.flow-view.vines.tools.error'));
      return;
    }
    toast(t('workspace.flow-view.headless-modal.tool-editor.header.quick-options.del.tips'), {
      action: {
        label: t('workspace.flow-view.headless-modal.tool-editor.header.quick-options.del.action'),
        onClick: () => vines.deleteNode(nodeId),
      },
    });
  };

  return (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="[&_svg]:stroke-gold-12"
            icon={<ArrowLeft />}
            variant="borderless"
            disabled={!lastNodeId}
            onClick={() => handleToggle(lastNodeId)}
          />
        </TooltipTrigger>
        <TooltipContent>
          {t('workspace.flow-view.headless-modal.tool-editor.header.quick-options.toggle-prev-tool')}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="[&_svg]:stroke-gold-12"
            icon={<ArrowRight />}
            variant="borderless"
            disabled={!nextNodeId}
            onClick={() => handleToggle(nextNodeId)}
          />
        </TooltipTrigger>
        <TooltipContent>
          {t('workspace.flow-view.headless-modal.tool-editor.header.quick-options.toggle-next-tool')}
        </TooltipContent>
      </Tooltip>
      {!isWorkflowReadOnly && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn('[&_svg]:stroke-red-10', !isLatestWorkflowVersion && 'hidden')}
              icon={<Trash2 />}
              variant="borderless"
              onClick={handleDelete}
            />
          </TooltipTrigger>
          <TooltipContent>
            {t('workspace.flow-view.headless-modal.tool-editor.header.quick-options.del.button-tips')}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
