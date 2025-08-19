import React, { useEffect, useRef, useState } from 'react';

import { useEventEmitter, useInViewport } from 'ahooks';
import { get } from 'lodash';
import { ShieldBan } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
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

  const { data: oem } = useSystemConfig();

  const showPreviewViewExecutionResultGrid = !get(oem, 'theme.miniMode.showPreviewViewExecutionResultGrid', true);

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
          'relative grid size-full grid-cols-5 p-global',
          workbenchVisible && 'p-global',
          isMiniFrame && 'h-[calc(100%-(var(--global-spacing)*8))] grid-cols-1 p-2',
          vinesIFrameVisible && 'p-global',
        )}
      >
        <VinesTabular
          className={cn(
            'col-span-2',
            isMiniFrame && 'absolute z-20 size-full bg-slate-1 p-global px-2 transition-opacity',
            isMiniFrame && historyVisible && 'pointer-events-none opacity-0',
            vinesIFrameVisible && !isMiniFrame && 'pr-global',
          )}
          isMiniFrame={isMiniFrame}
          onWorkflowStart={() => {
            showPreviewViewExecutionResultGrid && setHistoryVisible(true);
          }}
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
        <div className="vines-center absolute inset-1 z-50 size-full flex-col gap-global backdrop-blur">
          <ShieldBan size={64} />
          <span className="text-sm font-medium">{t('workspace.form-view.not-support')}</span>
        </div>
      )}
    </>
  );
};

export default VinesForm;
