import React, { useEffect, useState } from 'react';

import { useSetState } from '@mantine/hooks';
import { ChevronDownSquare, ChevronUpSquare, PencilRuler, Workflow, XSquare } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events';

interface IContextMenuProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ContextMenu: React.FC<IContextMenuProps> = () => {
  const { workflowId, canvasMode, isLatestWorkflowVersion } = useFlowStore();
  const { canvasDisabled } = useCanvasStore();

  const [{ x, y }, setPosition] = useSetState({ x: 0, y: 0 });
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'NODE' | 'CANVAS'>('CANVAS');
  const [currentNodeId, setCurrentNodeId] = useState<string>('');

  useEffect(() => {
    VinesEvent.on(
      'canvas-context-menu',
      (_wid: string, e: React.MouseEvent<MouseEvent>, _type: 'NODE' | 'CANVAS', nodeId: string) => {
        if (_wid !== workflowId) return;

        if (nodeId?.startsWith('fake_node')) {
          VinesEvent.emit('flow-select-nodes', {
            _wid: workflowId,
            targetNodeId: nodeId,
          });
          return;
        }
        if (['workflow_start', 'workflow_end'].includes(nodeId) || canvasMode !== CanvasStatus.EDIT) {
          return;
        }

        const { clientX, clientY } = e;
        setPosition({ x: clientX, y: clientY });

        setOpen(true);

        _type && setType(_type);
        nodeId && setCurrentNodeId(nodeId);
      },
    );
    return () => {
      VinesEvent.off('canvas-context-menu');
    };
  }, [canvasMode, workflowId]);

  const finalOpen = open && !canvasDisabled;
  const disabled = !isLatestWorkflowVersion || canvasMode === CanvasStatus.READONLY;

  return (
    <DropdownMenu open={finalOpen} onOpenChange={(val) => canvasMode !== CanvasStatus.READONLY && setOpen(val)}>
      <DropdownMenuTrigger asChild>
        <div
          className="fixed left-0 top-0 z-20 opacity-0"
          style={{ transform: `translate(calc(${x}px - 4px), calc(${y}px - 10px))` }}
        >
          _
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuGroup>
          {type === 'CANVAS' ? (
            <DropdownMenuItem
              className={cn('flex gap-2', disabled && 'hidden')}
              onClick={() =>
                VinesEvent.emit('flow-select-nodes', {
                  _wid: workflowId,
                  targetNodeId: '',
                })
              }
            >
              <Workflow strokeWidth={1.5} size={16} />
              <span>添加工具</span>
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                className={cn('flex gap-2', disabled && 'hidden')}
                onClick={() =>
                  VinesEvent.emit('flow-select-nodes', {
                    _wid: workflowId,
                    targetNodeId: currentNodeId,
                    insertBefore: true,
                  })
                }
              >
                <ChevronUpSquare strokeWidth={1.5} size={16} />
                <span>向上插入工具</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex gap-2"
                onClick={() => VinesEvent.emit('flow-tool-editor', workflowId, currentNodeId)}
              >
                <PencilRuler strokeWidth={1.5} size={16} />
                <span>编辑工具</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn('flex gap-2', disabled && 'hidden')}
                onClick={() =>
                  VinesEvent.emit('flow-select-nodes', {
                    _wid: workflowId,
                    targetNodeId: currentNodeId,
                  })
                }
              >
                <ChevronDownSquare strokeWidth={1.5} size={16} />
                <span>向下插入工具</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={cn('flex gap-2 text-red-10', disabled && 'hidden')}
                onClick={() => VinesEvent.emit('flow-delete-node', workflowId, currentNodeId)}
              >
                <XSquare strokeWidth={1.5} size={16} />
                <span>删除工具</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
