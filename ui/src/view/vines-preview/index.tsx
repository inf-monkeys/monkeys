import React from 'react';

import { motion } from 'framer-motion';
import { VinesExecutionHistory } from 'src/components/layout/vines-view/execution/history';

import { VinesActuator } from '@/components/layout/vines-view/execution/actuator';
import { Separator } from '@/components/ui/separator.tsx';
import { usePageStore } from '@/store/usePageStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

export const VinesPreView: React.FC = () => {
  const { fullscreen } = useViewStore();
  const { containerHeight, workbenchVisible } = usePageStore();

  return (
    <motion.div
      className={cn('relative flex h-full max-h-full p-6', workbenchVisible && 'p-0 pl-4')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <aside className={cn('relative w-3/5', fullscreen && 'w-full')}>
        <VinesActuator height={containerHeight - 54} />
      </aside>
      <Separator orientation="vertical" className={cn('mx-3', fullscreen && 'hidden')} />
      <div className={cn('flex-1', fullscreen && 'hidden')}>
        <VinesExecutionHistory />
      </div>
    </motion.div>
  );
};
