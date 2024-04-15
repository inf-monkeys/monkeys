import React, { useEffect } from 'react';

import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';

import { cn } from '@/utils';

interface IToolDroppableProps extends React.ComponentPropsWithoutRef<'div'> {
  nodeId: string;
  id: string;
  visible: boolean;
  onOver: (isOver: boolean, id: string) => void;
}

export const ToolDroppable: React.FC<IToolDroppableProps> = ({ children, id, nodeId, visible, onOver }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `canvas-node-toolbar-${nodeId}-${id}`,
    disabled: !visible,
  });

  useEffect(() => {
    onOver && onOver(isOver, id);
  }, [isOver]);

  return (
    <motion.div
      ref={setNodeRef}
      className={cn(
        'm-auto flex h-12 w-full flex-col items-center justify-center rounded-md bg-gray-1 shadow-md',
        isOver && 'border-offset-0 outline outline-4 outline-vines-500',
      )}
      animate={{
        scale: isOver ? 0.85 : 1,
      }}
    >
      {children}
    </motion.div>
  );
};
