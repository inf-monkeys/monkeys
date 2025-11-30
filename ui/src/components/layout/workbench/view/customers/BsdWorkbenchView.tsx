import React, { useEffect } from 'react';

import { IPinPage } from '@/apis/pages/typings';
import { getI18nContent } from '@/utils';
import { createFlowStore, FlowStoreProvider, useFlowStore } from '@/store/useFlowStore';
import { createExecutionStore, ExecutionStoreProvider } from '@/store/useExecutionStore';
import { createOutputSelectionStore, OutputSelectionStoreProvider } from '@/store/useOutputSelectionStore';
import { createViewStore, ViewStoreProvider } from '@/store/useViewStore';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import {
  InspirationGenerationOptions,
  InspirationGenerationPanel,
} from './scenes/InspirationGenerationPanel';
import { StyleFusionPanel, type StyleFusionOptions } from './scenes/StyleFusionPanel';

export const BSD_CONTAINER_BORDER_RADIUS = 20;

interface IBsdWorkbenchViewProps {
  page: Partial<IPinPage>;
}

type CustomOptions = {
  inspiration?: InspirationGenerationOptions;
  styleFusion?: StyleFusionOptions;
};

const getCustomOptions = (page: Partial<IPinPage>): CustomOptions =>
  (page.customOptions as CustomOptions) ?? {};

const getPageInfo = (page?: Partial<IPinPage>) => page?.workflow ?? page?.agent ?? page?.designProject ?? page?.info;

const FlowInitializer: React.FC<{ workflowId?: string }> = ({ workflowId }) => {
  const setWorkflowId = useFlowStore((s) => s.setWorkflowId);
  useEffect(() => {
    if (workflowId) {
      setWorkflowId(workflowId);
    }
  }, [workflowId, setWorkflowId]);
  return null;
};

export const BsdWorkbenchView: React.FC<IBsdWorkbenchViewProps> = ({ page }) => {
  const displayName =
    getI18nContent(getPageInfo(page)?.displayName) ?? getI18nContent(page.displayName) ?? '波司登工作台';
  const { inspiration, styleFusion } = getCustomOptions(page);
  const workflowId = page?.workflowId ?? page?.workflow?.id ?? '';

  const trimmedName = (displayName ?? '').trim();
  const isStyleFusion = trimmedName === '风格融合' || trimmedName === 'Style Fusion';
  const PanelComponent = isStyleFusion ? StyleFusionPanel : InspirationGenerationPanel;
  const panelOptions = isStyleFusion ? styleFusion : inspiration;

  return (
    <div
      className="relative flex h-full w-full justify-center overflow-hidden p-4 text-white lg:p-6"
      style={{
        borderRadius: BSD_CONTAINER_BORDER_RADIUS,
        background:
          'linear-gradient(0deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), linear-gradient(157deg, rgba(23, 23, 23, 0) 65%, rgba(39, 77, 189, 0.715) 88%, #2D62FF 97%)',
        backdropFilter: 'blur(32px)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          padding: '1px',
          borderRadius: BSD_CONTAINER_BORDER_RADIUS,
          background:
            'conic-gradient(from 158deg at 74% 49%, #12DCFF -5deg, #3159D1 51deg, #8099E3 159deg, #3159D1 259deg, #258AE2 295deg, #12DCFF 355deg, #3159D1 411deg)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />
      <VinesFlowProvider workflowId={workflowId}>
        <FlowStoreProvider key={workflowId} createStore={createFlowStore}>
          <ExecutionStoreProvider createStore={createExecutionStore}>
            <OutputSelectionStoreProvider createStore={createOutputSelectionStore}>
              <ViewStoreProvider createStore={createViewStore}>
                <FlowInitializer workflowId={workflowId} />
                <PanelComponent options={{ workflowId, title: displayName, ...panelOptions }} />
              </ViewStoreProvider>
            </OutputSelectionStoreProvider>
          </ExecutionStoreProvider>
        </FlowStoreProvider>
      </VinesFlowProvider>
    </div>
  );
};
