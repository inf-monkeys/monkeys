import React, { startTransition, useCallback, useEffect, useMemo, useState } from 'react';

import { createLazyFileRoute, useParams, useRouter } from '@tanstack/react-router';

import { get } from 'lodash';
import { ChevronDownIcon, ChevronUpIcon, TrashIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCustomConfigs } from '@/apis/authz/team/custom-configs';
import { useSystemConfig } from '@/apis/common';
import { deleteWorkflowExecution, getWorkflowExecution, getWorkflowExecutionSimple } from '@/apis/workflow/execution';
import { AssetsCarousel } from '@/components/layout/workbench/asset-detail/swiper-carousel';
import { TabularFooterButtons } from '@/components/layout/workbench/image-detail/tabular-footer-buttons';
import { TabularRenderWrapper } from '@/components/layout/workbench/image-detail/tabular-wrapper';
import {
  Vines3DModelRenderModeContext,
  VinesAbstract3DModel,
} from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/3d-model';
import { VinesAbstractVideo } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/video';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';
import { VinesMarkdown } from '@/components/ui/markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { WorkbenchOperationBar } from '@/components/ui/vines-iframe/view/operation-bar';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import useUrlState from '@/hooks/use-url-state';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { useExecutionAssetResultStore, useHasNextAsset, useHasPrevAsset } from '@/store/useExecutionAssetResultStore';
import { createFlowStore, FlowStoreProvider, useFlowStore } from '@/store/useFlowStore';
import {
  createOutputSelectionStore,
  OutputSelectionStoreProvider,
  useOutputSelectionStore,
} from '@/store/useOutputSelectionStore';
import { cn } from '@/utils';
import { detectAssetPreview } from '@/utils/asset-preview';
import { IVinesExecutionResultItem } from '@/utils/execution';

function safeStringify(data: any) {
  try {
    return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  } catch {
    return String(data ?? '');
  }
}

const AssetDetailSidebar: React.FC<{
  onBack: () => void;
  onDelete: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}> = ({ onBack, onDelete, hasPrev, hasNext, onPrev, onNext }) => {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-between gap-global rounded-bl-xl rounded-br-xl rounded-tl-xl rounded-tr-xl border border-input bg-slate-1 p-global shadow-sm dark:bg-[#111113]">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<X />} variant="outline" onClick={onBack} />
        </TooltipTrigger>
        <TooltipContent>{t('common.utils.back')}</TooltipContent>
      </Tooltip>

      <div className="flex flex-col items-center gap-global">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronUpIcon />} variant="outline" disabled={!hasPrev} onClick={onPrev} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.prev-image', '上一条')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronDownIcon />} variant="outline" disabled={!hasNext} onClick={onNext} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.next-image', '下一条')}</TooltipContent>
        </Tooltip>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<TrashIcon />} variant="outline" onClick={onDelete} />
        </TooltipTrigger>
        <TooltipContent>{t('workspace.image-detail.delete')}</TooltipContent>
      </Tooltip>
    </div>
  );
};

export const AssetDetail: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { history } = router;

  const { workflowId } = useParams({ from: '/$teamId/workspace/$workflowId/asset-detail/' });
  const [{ mode, instanceId: instanceIdRaw, outputIndex: outputIndexRaw }] = useUrlState<{
    mode?: 'normal' | 'fast' | 'mini';
    instanceId?: string;
    outputIndex?: string | number;
  }>({ mode: 'normal' });

  const isMiniFrame = mode === 'mini';
  const instanceId = instanceIdRaw ?? '';
  const outputIndex = useMemo(() => {
    const n = typeof outputIndexRaw === 'number' ? outputIndexRaw : Number(outputIndexRaw ?? 0);
    return Number.isFinite(n) ? n : 0;
  }, [outputIndexRaw]);

  const { showFormInImageDetail, imagePreviewOperationBarStyle } = useCustomConfigs();

  // OEM Theme
  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');
  const isShadowMode = themeMode === 'shadow';

  // State for right form
  const [processedInputs, setProcessedInputs] = useState<any[]>([]);
  const [showInputDiffBanner, setShowInputDiffBanner] = useState(false);
  const [originalInputValues, setOriginalInputValues] = useState<Record<string, any>>({});
  const [tabularEvent$, setTabularEvent$] = useState<any>(null);

  // Store-driven history + paging (like image-detail)
  const { assets, position, nextAsset, prevAsset, clearAssets } = useExecutionAssetResultStore();
  const hasPrev = useHasPrevAsset();
  const hasNext = useHasNextAsset();
  const currentAsset = assets?.[position];

  // Execution + output item for selection/import + left preview
  const [execution, setExecution] = useState<VinesWorkflowExecution | undefined>();
  const [outputItem, setOutputItem] = useState<IVinesExecutionResultItem | undefined>();

  useEffect(() => {
    const targetInstanceId = currentAsset?.instanceId || instanceId;
    if (!targetInstanceId) return;
    getWorkflowExecution(targetInstanceId).then((executionResult) => {
      if (!executionResult) return;
      setExecution(executionResult);
    });
  }, [instanceId, currentAsset?.instanceId]);

  useEffect(() => {
    // fallback for direct open: when store is empty use URL params to load one item
    if (currentAsset) {
      setOutputItem(currentAsset);
      return;
    }
    if (!instanceId) return;
    getWorkflowExecutionSimple(instanceId)
      .then((simple) => {
        const out = simple?.output?.[outputIndex];
        if (!simple || !out) return;
        setOutputItem({
          ...(simple as any),
          render: {
            ...out,
            key: `${simple.instanceId}-${outputIndex}`,
            status: simple.status,
          },
        });
      })
      .catch(() => {
        // ignore
      });
  }, [instanceId, outputIndex, currentAsset]);

  const preview = useMemo(() => {
    const renderType = outputItem?.render?.type;
    const renderData = outputItem?.render?.data;
    const detected = detectAssetPreview(renderType, renderData);
    return {
      previewType: detected.type,
      url: detected.url,
      text: detected.text,
      raw: renderData,
    };
  }, [outputItem]);

  const handleDelete = useCallback(() => {
    const targetInstanceId = currentAsset?.instanceId || instanceId;
    if (!targetInstanceId) return;
    toast.promise(deleteWorkflowExecution(targetInstanceId), {
      success: () => {
        clearAssets();
        history.back();
        return t('common.delete.success');
      },
      error: t('common.delete.error'),
      loading: t('common.delete.loading'),
    });
  }, [history, currentAsset?.instanceId, instanceId, clearAssets, t]);

  useEffect(() => {
    const controller = new AbortController();
    document.body.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          prevAsset();
          return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          nextAsset();
          return;
        }
        if (e.key === 'Escape') {
          clearAssets();
          history.back();
        }
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, [history, nextAsset, prevAsset, clearAssets]);

  const [workflowAssociationList, setWorkflowAssociationList] = useState<any[]>([]);

  const baseWidth = showFormInImageDetail ? '70vw' : '100vw';
  const spacingFormula =
    imagePreviewOperationBarStyle === 'simple'
      ? '0'
      : workflowAssociationList.length > 0
        ? '(var(--global-spacing) * 10) - (var(--operation-bar-width) * 2)'
        : '(var(--global-spacing) * 7) - var(--operation-bar-width)';
  const width = isMiniFrame
    ? 'calc(100vw - var(--operation-bar-width) - (var(--global-spacing)))'
    : `calc(${baseWidth} - ${spacingFormula})`;

  return (
    <VinesFlowProvider workflowId={workflowId}>
      <FlowStoreProvider createStore={createFlowStore}>
        <OutputSelectionStoreProvider createStore={createOutputSelectionStore}>
          <AssetDetailInitializer workflowId={workflowId} outputItem={outputItem} />
          <div className={cn('flex h-full gap-global bg-neocard', isMiniFrame ? 'justify-center' : 'w-full')}>
            <main
              className={cn(
                `flex size-full flex-1 rounded-lg border border-input bg-slate-1 p-global dark:bg-[#111113] md:flex-row`,
                isMiniFrame && 'justify-center',
                !isMiniFrame && !showFormInImageDetail && 'justify-center',
              )}
            >
              {/* Left preview */}
              <div
                className={cn('flex h-full flex-col pr-global dark:bg-[#111113]')}
                style={{ width }}
              >
                {/* Preview area: scrolls independently, keeps history always visible */}
                <div className="flex w-full flex-1 min-h-0">
                  <div className="size-full min-h-0">
                    {preview.previewType === 'video' && preview.url ? (
                      <div className="h-full w-full p-global">
                        <VinesAbstractVideo autoPlay playOnHover={false} className="w-full">
                          {preview.url}
                        </VinesAbstractVideo>
                      </div>
                    ) : preview.previewType === '3d' && preview.url ? (
                      <div
                        className="h-full w-full p-global"
                        style={{
                          // 保留底部历史条空间
                          ['--vines-3d-detail-height' as any]: 'calc(100vh - 340px)',
                        }}
                      >
                        <Vines3DModelRenderModeContext.Provider value="detail">
                          <VinesAbstract3DModel>{preview.url}</VinesAbstract3DModel>
                        </Vines3DModelRenderModeContext.Provider>
                      </div>
                    ) : preview.previewType === 'text' ? (
                      <ScrollArea className="h-full w-full" disabledOverflowMask>
                        <VinesMarkdown className="max-w-full p-global">
                          {preview.text ?? safeStringify(preview.raw)}
                        </VinesMarkdown>
                      </ScrollArea>
                    ) : preview.previewType === 'json' ? (
                      <div className="h-full w-full p-global">
                        <CodeEditor readonly className="h-full w-full" data={preview.raw as any} />
                      </div>
                    ) : (
                      <div className="vines-center size-full text-center text-3xl text-muted-foreground">
                        {t('workspace.image-detail.no-image', '无可预览数据')}
                      </div>
                    )}
                  </div>
                </div>

                {/* History carousel (like image-detail) */}
                <div className="flex w-full shrink-0 flex-col gap-global overflow-hidden">
                  <div className={cn('w-full')}>
                    <AssetsCarousel />
                  </div>
                </div>
              </div>

              {/* Right form */}
              {!isMiniFrame && showFormInImageDetail && (
                <div
                  className={`relative flex h-full flex-1 flex-col gap-global ${isShadowMode ? 'rounded-r-lg rounded-tr-lg' : 'rounded-r-xl rounded-tr-xl'} border-l border-input pl-global dark:bg-[#111113]`}
                >
                  <ScrollArea disabledOverflowMask className="flex-1 overflow-hidden">
                    <TabularRenderWrapper
                      execution={execution}
                      processedInputs={processedInputs}
                      showInputDiffBanner={showInputDiffBanner}
                      originalInputValues={originalInputValues}
                      onProcessedInputsChange={setProcessedInputs}
                      onShowInputDiffBannerChange={setShowInputDiffBanner}
                      onOriginalInputValuesChange={setOriginalInputValues}
                      onTabularEventCreated={setTabularEvent$}
                    />
                  </ScrollArea>
                  <div className="z-20 dark:bg-[#111113]">
                    <TabularFooterButtons processedInputs={processedInputs} event$={tabularEvent$} />
                  </div>
                </div>
              )}

              {/* Top-right toolbar for simple/miniframe */}
              {(imagePreviewOperationBarStyle === 'simple' || isMiniFrame) && (
                <div className="absolute right-global top-global flex gap-global">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button icon={<TrashIcon />} variant="outline" onClick={handleDelete} />
                    </TooltipTrigger>
                    <TooltipContent>{t('workspace.image-detail.delete')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<X />}
                        variant="outline"
                        onClick={() => {
                          clearAssets();
                          history.back();
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('common.utils.back')}</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </main>

            {/* Operation bar + sidebar (normal style) */}
            {imagePreviewOperationBarStyle === 'normal' && !isMiniFrame && (
              <>
                <WorkbenchOperationBar onDataChange={setWorkflowAssociationList} />
                <AssetDetailSidebar
                  onBack={() => {
                    clearAssets();
                    history.back();
                  }}
                  onDelete={() => {
                    startTransition(() => handleDelete());
                  }}
                  hasPrev={!!hasPrev}
                  hasNext={!!hasNext}
                  onPrev={() => startTransition(() => prevAsset())}
                  onNext={() => startTransition(() => nextAsset())}
                />
              </>
            )}
          </div>
        </OutputSelectionStoreProvider>
      </FlowStoreProvider>
    </VinesFlowProvider>
  );
};

const AssetDetailInitializer: React.FC<{ workflowId: string; outputItem?: IVinesExecutionResultItem }> = ({
  workflowId,
  outputItem,
}) => {
  const setWorkflowId = useFlowStore((s) => s.setWorkflowId);
  const { setOutputSelections } = useOutputSelectionStore();

  useEffect(() => {
    setWorkflowId(workflowId);
  }, [workflowId, setWorkflowId]);

  useEffect(() => {
    if (!outputItem) return;
    setOutputSelections([
      {
        outputId: outputItem.render?.key ?? outputItem.instanceId,
        item: outputItem,
      },
    ]);
  }, [outputItem, setOutputSelections]);

  return null;
};

export const Route = createLazyFileRoute('/$teamId/workspace/$workflowId/asset-detail/')({
  component: AssetDetail,
});


