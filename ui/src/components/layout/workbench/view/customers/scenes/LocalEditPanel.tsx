import { useEventEmitter } from 'ahooks';
import { Sparkles } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { executionWorkflow, useWorkflowExecutionListInfinite } from '@/apis/workflow/execution';
import { BsdImageIcon } from '@/components/icons/BsdImageIcon';
import { BsdLightIcon } from '@/components/icons/BsdLightIcon';
import { HistoryIcon, PanelCard, PanelHeader } from '@/components/layout/workbench/view/customers/scenes/components/PanelSection';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result';
import { MaskEditorDialog } from '@/components/mask-editor';
import { WorkbenchOperationBar } from '@/components/ui/vines-iframe/view/operation-bar';
import { VinesUploader } from '@/components/ui/vines-uploader';
import { useElementSize } from '@/hooks/use-resize-observer';
import { useViewStoreOptional } from '@/store/useViewStore';

import { BsdHistoryGrid, type HistoryImage } from './components/BsdHistoryGrid';
import { ReferenceImageCard, type ReferenceSlot } from './components/ReferenceImageCard';
import type { InspirationGenerationOptions } from './InspirationGenerationPanel';

export type LocalEditOptions = InspirationGenerationOptions;

export const LocalEditPanel: React.FC<{ options?: LocalEditOptions }> = ({ options }) => {
  const resolvedOptions = useMemo(() => options ?? {}, [options]);
  const { height: rightHeight, ref: rightRef } = useElementSize<HTMLDivElement>();
  const setVisible = useViewStoreOptional((s) => s?.setVisible);
  const workflowId = options?.workflowId as string | undefined;
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const [prompt, setPrompt] = useState(resolvedOptions.prompt ?? '');
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [maskEditorOpen, setMaskEditorOpen] = useState(false);
  const [maskEditorImage, setMaskEditorImage] = useState<File | string | null>(null);
  const [maskFile, setMaskFile] = useState<File | null>(null);
  const [maskPreviewUrl, setMaskPreviewUrl] = useState<string | null>(null);
  const [maskUploadedUrl, setMaskUploadedUrl] = useState<string | null>(null);
  const [maskUploading, setMaskUploading] = useState(false);
  const maskUppy$ = useEventEmitter<any>();
  const maskUppyRef = useRef<any>(null);
  maskUppy$?.useSubscription?.((uppy: any) => {
    maskUppyRef.current = uppy;
  });
  const [referenceSlots, setReferenceSlots] = useState<ReferenceSlot[]>([
    { id: 'base', label: '局部修改底图' },
    { id: 'reference', label: '参考图', optional: true },
  ]);

  const updateSlotFile = (slotId: string, file: File | null) => {
    setReferenceSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== slotId) return slot;
        if (slot.previewUrl) {
          URL.revokeObjectURL(slot.previewUrl);
          previewUrlsRef.current.delete(slot.previewUrl);
        }
        if (!file) {
          return { ...slot, previewUrl: undefined, uploadedUrl: undefined, uploading: false, file: undefined };
        }
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
        if (slotId === 'base') {
          setMaskEditorImage(file);
          setMaskEditorOpen(true);
        }
        return { ...slot, previewUrl, uploading: true, file };
      }),
    );
  };

  const handleUploaded = (slotId: string, url: string) => {
    setReferenceSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              uploadedUrl: url || undefined,
              uploading: false,
              previewUrl: url || slot.previewUrl,
              file: undefined,
            }
          : slot,
      ),
    );
    if (slotId === 'base' && url) {
      setMaskEditorImage(url);
      setMaskEditorOpen(true);
    }
  };

  const handleUploadingChange = (slotId: string, uploading: boolean) => {
    setReferenceSlots((prev) => prev.map((slot) => (slot.id === slotId ? { ...slot, uploading } : slot)));
  };

  useEffect(() => {
    setVisible?.(true);
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
      if (maskPreviewUrl) URL.revokeObjectURL(maskPreviewUrl);
    };
  }, [setVisible, maskPreviewUrl]);

  const randomSeed15 = () => Math.floor(1e14 + Math.random() * 9e14);

  const handleStart = async () => {
    if (!workflowId) return;
    const baseSlot = referenceSlots.find((s) => s.id === 'base');
    if (!baseSlot?.file && !baseSlot?.uploadedUrl) {
      toast.error('请先上传局部修改底图');
      return;
    }
    if (!maskUploadedUrl && !maskPreviewUrl && !maskFile) {
      toast.error('请先生成并上传遮罩');
      return;
    }

    try {
      setStarting(true);
      setUploading(true);
      const uploadMap = referenceSlots.reduce<Record<string, string>>((acc, slot) => {
        acc[slot.id] = slot.uploadedUrl ?? '';
        return acc;
      }, {});
      setUploading(false);

      const clothImage = uploadMap['base'] ?? '';
      const referenceImage = uploadMap['reference'] ?? '';
      const clothMask = maskUploadedUrl || maskPreviewUrl || '';
      if (!clothMask) {
        toast.error('遮罩未就绪，请重新生成遮罩');
        setStarting(false);
        setUploading(false);
        return;
      }

      const inputData: Record<string, unknown> = {
        cloth_image: clothImage,
        cloth_mask: clothMask,
        reference_image: referenceImage,
        seed: randomSeed15(),
      };
      void mutateExecutionList?.();
      await executionWorkflow(workflowId, inputData as any, 1);
    } catch (err) {
      toast.error(`启动任务失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setStarting(false);
      setUploading(false);
      void mutateExecutionList?.();
    }
  };

  // 历史/轮询逻辑与灵感生成保持一致
  const {
    data: executionListData,
    size,
    setSize,
    isLoading,
    isValidating,
    mutate: mutateExecutionList,
  } = useWorkflowExecutionListInfinite(workflowId || null, LOAD_LIMIT);
  const executionItems = useMemo(() => {
    const list = executionListData?.flatMap((page) => page?.data ?? []) ?? [];
    const items = list.flatMap((output) => {
      const outputs = Array.isArray(output?.output) ? output.output : [];
      return outputs.map((item, index) => ({
        ...output,
        render: {
          ...item,
          key: `${output.instanceId}-${index}`,
          status: output.status,
        },
      }));
    });
    const placeholders = list
      .filter((output) => !Array.isArray(output?.output) || (output?.output?.length ?? 0) === 0)
      .map((output) => ({
        ...output,
        render: {
          type: 'image',
          data: null,
          key: `${output.instanceId}-placeholder`,
          status: output.status,
        },
      }));

    const merged = [...items, ...placeholders];
    const seen = new Set<string>();
    const deduped: typeof merged = [];
    for (let i = merged.length - 1; i >= 0; i--) {
      const key = merged[i]?.render?.key;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      deduped.unshift(merged[i]);
    }
    return deduped;
  }, [executionListData]);

  const executionImages = useMemo(
    () => {
      const mapped = executionItems.map((item, idx) => {
        const id = item.render?.key ?? `${item.instanceId ?? 'unknown'}-${idx}`;
        return {
          id,
          url:
            item.render.status === 'COMPLETED' && item.render.type === 'image' && item.render.data
              ? String(item.render.data)
              : undefined,
          title: item.raw?.input?.prompt as string | undefined,
          status: item.render.status,
          instanceId: item.instanceId,
        };
      });
      const unique = new Map<string, (typeof mapped)[number]>();
      for (const item of mapped) {
        unique.set(item.id, item);
      }
      return Array.from(unique.values());
    },
    [executionItems],
  );

  const [displayImages, setDisplayImages] = useState<HistoryImage[]>([]);
  useEffect(() => {
    if (executionImages.length > 0) {
      setDisplayImages(executionImages);
    }
  }, [executionImages]);

  useEffect(() => {
    setDisplayImages([]);
  }, [workflowId]);

  const hasMoreExec =
    executionListData && executionListData.length > 0 && (executionListData[size - 1]?.data?.length ?? 0) === LOAD_LIMIT;
  const loadMoreExec = () => {
    if (hasMoreExec) {
      setSize((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (!workflowId) return;
    const hasPending = executionItems.some((item) =>
      ['SCHEDULED', 'RUNNING', 'PAUSED'].includes(item.render?.status),
    );
    if (!hasPending) return;
    const timer = window.setInterval(() => {
      void mutateExecutionList?.();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [executionItems, workflowId, mutateExecutionList]);

  return (
    <>
      <div className="flex w-full gap-4 pr-1">
        <div className="flex w-[400px] min-h-0 flex-col gap-3">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <PanelCard className="gap-4" padding={12}>
              <PanelHeader
                icon={<BsdImageIcon className="size-5" />}
                title={resolvedOptions.title ?? '图像参考'}
                description="上传图像参考"
              />
              <div className="flex flex-row flex-wrap gap-3">
                {referenceSlots.map((slot) => (
                  <ReferenceImageCard
                    key={slot.id}
                    slot={slot}
                    onSelect={updateSlotFile}
                    onUploaded={handleUploaded}
                    onUploadingChange={handleUploadingChange}
                    maskPreviewUrl={slot.id === 'base' ? maskPreviewUrl ?? undefined : undefined}
                    onOpenMask={(slotId, image) => {
                      if (slotId === 'base') {
                        setMaskEditorImage(image);
                        setMaskEditorOpen(true);
                      }
                    }}
                  />
                ))}
              </div>
            </PanelCard>

            <PanelCard className="gap-3" padding={12}>
              <PanelHeader
                icon={<BsdLightIcon className="size-5" />}
                title="创意描述"
                description="通过文字描述生成图片或使用提示词字典提升生成效果"
              />
              <div
                className="rounded-2xl border border-white/15 p-4 transition-colors duration-400 hover:border-white/40"
                style={{ background: 'rgba(255, 255, 255, 0.08)' }}
              >
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={5}
                  className="h-36 w-full resize-none bg-transparent text-sm leading-relaxed text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="请输入创意描述"
                />
              </div>
            </PanelCard>
          </div>

          <div className="flex w-full items-center justify-between gap-3 pb-1 pt-1">
            <button
              type="button"
              onClick={handleStart}
              className="relative flex h-[42px] w-full items-center justify-center gap-2 overflow-hidden rounded-[10px] px-5 text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={{
                background: 'linear-gradient(0deg, rgba(40, 82, 173, 0.08), rgba(40, 82, 173, 0.08)), #2C5EF5',
              }}
              disabled={
                starting ||
                uploading ||
                maskUploading ||
                !workflowId ||
                !referenceSlots.find((s) => s.id === 'base' && s.uploadedUrl) ||
                (!maskUploadedUrl && !maskPreviewUrl && !maskFile)
              }
            >
              <span className="pointer-events-none absolute bottom-0 left-1/2 h-2 w-2/3 -translate-x-1/2 translate-y-[6px] rounded-full bg-white/60 blur-[12px]" />
              <Sparkles className="size-5" stroke="none" fill="#FFFFFF" />
              <span
                style={{
                  fontFamily: 'Microsoft YaHei UI, Microsoft YaHei, Alibaba PuHuiTi 3.0, sans-serif',
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: '20px',
                  letterSpacing: '0em',
                  color: '#FFFFFF',
                  fontVariationSettings: '"opsz" auto',
                  fontFeatureSettings: '"kern" on',
                  textShadow: '0 1px 6px rgba(0, 0, 0, 0.25)',
                }}
              >
                开始生成
              </span>
            </button>
            <div className="flex h-full items-center">
              <WorkbenchOperationBar />
            </div>
          </div>
        </div>

        <PanelCard ref={rightRef} className="flex flex-1 min-h-0 gap-3 overflow-hidden" padding={12}>
          <div className="mb-2">
            <PanelHeader icon={<HistoryIcon />} title="历史生成" description="查看当前生成图片和历史生成图片" />
          </div>
          <div className="flex flex-1 min-h-0">
            <BsdHistoryGrid
              images={displayImages.length ? displayImages : executionImages}
              workflowId={workflowId}
              hasMore={hasMoreExec}
              onLoadMore={loadMoreExec}
              onDeleted={() => mutateExecutionList?.()}
              loading={isLoading && (executionImages.length === 0 && displayImages.length === 0)}
              loadingMore={isValidating && (executionImages.length > 0 || displayImages.length > 0)}
              height={rightHeight || 800}
            />
          </div>
        </PanelCard>
      </div>
      <MaskEditorDialog
        open={maskEditorOpen}
        onOpenChange={setMaskEditorOpen}
        image={maskEditorImage}
        onMaskGenerated={(file) => {
          if (maskPreviewUrl) URL.revokeObjectURL(maskPreviewUrl);
          const url = URL.createObjectURL(file);
          setMaskPreviewUrl(url);
          setMaskFile(file);
          setMaskUploadedUrl(null);
          setMaskUploading(true);
          if (maskUppyRef.current?.addFile) {
            try {
              maskUppyRef.current.addFile({ data: file, name: file.name, type: file.type });
            } catch (err) {
              console.error('mask upload failed to start', err);
              setMaskUploading(false);
            }
          } else {
            setMaskUploading(false);
          }
          setMaskEditorOpen(false);
        }}
        title="编辑遮罩"
      />
      <VinesUploader
        className="hidden"
        basePath="user-files/workflow-input"
        max={1}
        files={maskUploadedUrl ? [maskUploadedUrl] : []}
        uppy$={maskUppy$}
        onChange={(urls) => {
          const url = urls?.[0] ?? '';
          setMaskUploadedUrl(url || null);
          setMaskUploading(false);
        }}
      />
    </>
  );
};
