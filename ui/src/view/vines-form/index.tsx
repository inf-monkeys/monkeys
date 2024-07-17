import React, { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { VinesExecutionResult } from '@/components/layout/vines-view/form/execution-result';
import { VinesTabular } from '@/components/layout/vines-view/form/tabular';
import { VinesTabularEditor } from '@/components/layout/vines-view/form/tabular-editor';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IVinesFormProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesForm: React.FC<IVinesFormProps> = () => {
  const { workbenchVisible } = usePageStore();

  const [configVisible, setConfigVisible] = useState(false);

  return (
    <div className={cn('relative grid size-full grid-cols-2 p-6', workbenchVisible && 'p-0')}>
      <VinesTabular setConfigVisible={setConfigVisible} />
      <VinesExecutionResult />
      <AnimatePresence>
        {configVisible && (
          <motion.div
            className="absolute left-0 top-0 size-full bg-slate-1 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <VinesTabularEditor setConfigVisible={setConfigVisible} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
