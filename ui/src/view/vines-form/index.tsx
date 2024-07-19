import React, { useState } from 'react';

import { useEventEmitter, useResponsive } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';

import { VinesExecutionResult } from '@/components/layout/vines-view/form/execution-result';
import { VinesTabular } from '@/components/layout/vines-view/form/tabular';
import { IframeHeader } from '@/components/layout/vines-view/form/tabular/iframe-header.tsx';
import { VinesTabularEditor } from '@/components/layout/vines-view/form/tabular-editor';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IVinesFormProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesForm: React.FC<IVinesFormProps> = () => {
  const { workbenchVisible } = usePageStore();

  const [configVisible, setConfigVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const responsive = useResponsive();
  const isSmallFrame = !responsive.sm;

  const event$ = useEventEmitter();

  return (
    <>
      {isSmallFrame && <IframeHeader historyVisible={historyVisible} setHistoryVisible={setHistoryVisible} />}
      <div
        className={cn(
          'relative grid size-full grid-cols-2 p-6',
          workbenchVisible && 'px-4 py-0',
          isSmallFrame && 'h-[calc(100%-4rem)] grid-cols-1',
        )}
      >
        <VinesTabular
          className={cn(
            isSmallFrame && 'absolute z-20 size-full bg-slate-1 p-6 transition-opacity',
            isSmallFrame && historyVisible && 'pointer-events-none opacity-0',
          )}
          isSmallFrame={isSmallFrame}
          setConfigVisible={setConfigVisible}
          setHistoryVisible={setHistoryVisible}
          event$={event$}
        />

        <VinesExecutionResult event$={event$} />
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
    </>
  );
};
