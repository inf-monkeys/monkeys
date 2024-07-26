import React, { useState } from 'react';

import { useEventEmitter, useResponsive } from 'ahooks';

import { VinesExecutionResult } from '@/components/layout/vines-view/form/execution-result';
import { VinesTabular } from '@/components/layout/vines-view/form/tabular';
import { IframeHeader } from '@/components/layout/vines-view/form/tabular/iframe-header.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IVinesFormProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesForm: React.FC<IVinesFormProps> = () => {
  const { workbenchVisible, vinesIFrameVisible } = usePageStore();

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
          vinesIFrameVisible && 'p-4',
        )}
      >
        <VinesTabular
          className={cn(
            isSmallFrame && 'absolute z-20 size-full bg-slate-1 p-4 transition-opacity',
            isSmallFrame && historyVisible && 'pointer-events-none opacity-0',
            vinesIFrameVisible && !isSmallFrame && 'pr-4',
          )}
          isSmallFrame={isSmallFrame}
          setHistoryVisible={setHistoryVisible}
          event$={event$}
          minimalGap={vinesIFrameVisible}
        />

        <VinesExecutionResult event$={event$} minimalGap={vinesIFrameVisible} />
      </div>
    </>
  );
};
