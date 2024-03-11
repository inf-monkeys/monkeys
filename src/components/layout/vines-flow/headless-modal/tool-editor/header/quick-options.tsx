import React from 'react';

import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import VinesEvent from '@/utils/events';

interface IQuickOptionsProps {
  nodeId?: string;
}

export const QuickOptions: React.FC<IQuickOptionsProps> = ({ nodeId }) => {
  const { vines } = useVinesFlow();

  const nodes = vines
    .getAllNodes()
    .filter(({ id }) => !['workflow_start', 'workflow_end'].includes(id) && !id.startsWith('fake_node'));

  const currentNodeIndex = nodes.findIndex(({ id }) => id === nodeId);
  const lastNodeId = nodes?.[currentNodeIndex - 1]?.id;
  const nextNodeId = nodes?.[currentNodeIndex + 1]?.id;

  const handleToggle = (id: string) => VinesEvent.emit('flow-tool-editor', id);

  const handleDelete = () => {
    if (!nodeId) {
      toast.error('节点数据异常！');
      return;
    }
    toast('确定要删除此工具吗？操作将不可取消', {
      action: {
        label: '确定',
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
        <TooltipContent>切换到上一工具</TooltipContent>
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
        <TooltipContent>切换到下一工具</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="[&_svg]:stroke-red-10" icon={<Trash2 />} variant="borderless" onClick={handleDelete} />
        </TooltipTrigger>
        <TooltipContent>删除此节点</TooltipContent>
      </Tooltip>
    </div>
  );
};
