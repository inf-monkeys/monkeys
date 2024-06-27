import React, { memo, useCallback } from 'react';

import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';

interface INodeControllerProps {
  nodes: VinesNode[];
  nodeStagger: number;
}

export const NodeController: React.FC<INodeControllerProps> = memo(({ nodes, nodeStagger }) => {
  const { t } = useTranslation();

  const { isLatestWorkflowVersion } = useFlowStore();
  const { canvasMode } = useCanvasStore();
  const { canvasDisabled } = useCanvasInteractionStore();

  const controller = nodes
    .map((node) => node.getController().map((it, index) => ({ id: `${node.id}_controller_${index}`, ...it })))
    .flat();

  const handleOnClick = useCallback((onClick: () => void, confirmation?: string) => {
    if (confirmation) {
      toast(confirmation, {
        action: {
          label: t('common.utils.confirm'),
          onClick: onClick,
        },
      });
    } else {
      onClick();
    }
  }, []);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 1 },
        visible: { opacity: 1, transition: { staggerChildren: nodeStagger } },
      }}
      initial="hidden"
      animate="visible"
      className={cn(
        'transition-all',
        (canvasDisabled || canvasMode !== CanvasStatus.EDIT || !isLatestWorkflowVersion) &&
          'pointer-events-none !opacity-0',
      )}
    >
      {controller.map(({ id, icon, position: { x, y }, onClick, needConfirmation, disabled }) => (
        <motion.div
          key={id}
          className="pointer-events-auto absolute z-20 rounded-md"
          style={{ top: y, left: x }}
          variants={{ hidden: { scale: 0.6, opacity: 0 }, visible: { scale: 0.75, opacity: 1 } }}
        >
          {icon === '+' && (
            <Button
              variant="outline"
              size="small"
              icon={<Plus />}
              onClick={() => handleOnClick(onClick, needConfirmation)}
              disabled={disabled}
            />
          )}
          {icon === '-' && (
            <Button
              variant="outline"
              size="small"
              icon={<Minus />}
              onClick={() => handleOnClick(onClick, needConfirmation)}
              disabled={disabled}
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
});

NodeController.displayName = 'VinesFlowNodeController';
