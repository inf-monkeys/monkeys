import React, { useEffect, useRef, useState } from 'react';

import { useEventEmitter, useInViewport } from 'ahooks';
import { ShieldBan } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VinesExecutionResult } from '@/components/layout/workspace/vines-view/form/execution-result';
import { VinesTabular } from '@/components/layout/workspace/vines-view/form/tabular';
import { IframeHeader } from '@/components/layout/workspace/vines-view/form/tabular/iframe-header.tsx';
import { useVinesOriginWorkflow } from '@/components/layout-wrapper/workspace/utils.ts';
import useUrlState from '@/hooks/use-url-state.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { usePageStore } from '@/store/usePageStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

const VinesForm: React.FC = () => {
  const { t } = useTranslation();

  const workbenchVisible = usePageStore((s) => s.workbenchVisible);
  const vinesIFrameVisible = usePageStore((s) => s.vinesIFrameVisible);

  const [historyVisible, setHistoryVisible] = useState(false);

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const event$ = useEventEmitter();

  const workflowId = useFlowStore((s) => s.workflowId);
  const { workflow } = useVinesOriginWorkflow(workflowId);
  const openAIInterfaceEnabled = workflow?.exposeOpenaiCompatibleInterface ?? false;

  const containerHeight = usePageStore((s) => s.containerHeight);
  const isMiniFrame = mode === 'mini';
  const height = containerHeight - (vinesIFrameVisible ? 32 : workbenchVisible ? (isMiniFrame ? 80 : 32) : 48);

  const ref = useRef<HTMLDivElement>(null);
  const [inViewport] = useInViewport(ref);

  const setVisible = useViewStore((s) => s.setVisible);

  useEffect(() => {
    if (isMiniFrame) {
      setVisible(!!inViewport);
    }
  }, [inViewport, isMiniFrame]);

  return (
    <>
      {isMiniFrame && <IframeHeader historyVisible={historyVisible} setHistoryVisible={setHistoryVisible} />}
      <div
        ref={ref}
        className={cn(
          'relative grid size-full grid-cols-5 p-6',
          workbenchVisible && 'p-4',
          isMiniFrame && 'h-[calc(100%-3rem)] grid-cols-1 p-2',
          vinesIFrameVisible && 'p-4',
        )}
      >
        <VinesTabular
          className={cn(
            'col-span-2 -ml-1',
            isMiniFrame && 'absolute z-20 size-full bg-slate-1 p-4 transition-opacity',
            isMiniFrame && historyVisible && 'pointer-events-none opacity-0',
            vinesIFrameVisible && !isMiniFrame && 'pr-4',
          )}
          isMiniFrame={isMiniFrame}
          setHistoryVisible={setHistoryVisible}
          event$={event$}
          height={height}
        />
        <VinesExecutionResult
          className={cn(
            'col-span-3',
            isMiniFrame && !historyVisible ? 'pointer-events-none z-0 opacity-0 [&_*]:pointer-events-none' : '',
          )}
          event$={event$}
          height={height}
          enablePostMessage={isMiniFrame}
          isMiniFrame={isMiniFrame}
        />
      </div>
      {openAIInterfaceEnabled && (
        <div className="vines-center absolute inset-1 z-50 size-full flex-col gap-4 backdrop-blur">
          <ShieldBan size={64} />
          <span className="text-sm font-medium">{t('workspace.form-view.not-support')}</span>
        </div>
      )}
    </>
  );
};

export default VinesForm;
