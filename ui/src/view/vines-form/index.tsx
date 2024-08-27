import React, { useState } from 'react';

import { useEventEmitter } from 'ahooks';
import { ShieldBan } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VinesExecutionResult } from '@/components/layout/workspace/vines-view/form/execution-result';
import { VinesTabular } from '@/components/layout/workspace/vines-view/form/tabular';
import { IframeHeader } from '@/components/layout/workspace/vines-view/form/tabular/iframe-header.tsx';
import { useVinesOriginWorkflow } from '@/components/layout-wrapper/workspace/utils.ts';
import useUrlState from '@/hooks/use-url-state.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IVinesFormProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesForm: React.FC<IVinesFormProps> = () => {
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
  const height = containerHeight - (vinesIFrameVisible ? 0 : workbenchVisible ? 32 : 48);

  const isMiniFrame = mode === 'mini';

  return (
    <>
      {isMiniFrame && <IframeHeader historyVisible={historyVisible} setHistoryVisible={setHistoryVisible} />}
      <div
        className={cn(
          'relative grid size-full grid-cols-2 p-6',
          workbenchVisible && 'p-4',
          isMiniFrame && 'h-[calc(100%-3rem)] grid-cols-1 p-2',
          vinesIFrameVisible && 'p-4',
        )}
      >
        <VinesTabular
          className={cn(
            isMiniFrame && 'absolute z-20 size-full bg-slate-1 p-4 transition-opacity',
            isMiniFrame && historyVisible && 'pointer-events-none opacity-0',
            vinesIFrameVisible && !isMiniFrame && 'pr-4',
          )}
          isMiniFrame={isMiniFrame}
          setHistoryVisible={setHistoryVisible}
          event$={event$}
          height={height}
        />

        <VinesExecutionResult event$={event$} height={height} />
      </div>
      {openAIInterfaceEnabled && (
        <div className="vines-center absolute inset-1 size-full flex-col gap-4 backdrop-blur">
          <ShieldBan size={64} />
          <span className="text-sm font-medium">{t('workspace.form-view.not-support')}</span>
        </div>
      )}
    </>
  );
};
