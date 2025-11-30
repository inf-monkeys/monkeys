import { Plus, Sparkles, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEventEmitter } from 'ahooks';
import { toast } from 'sonner';

import { executionWorkflow, useWorkflowExecutionListInfinite } from '@/apis/workflow/execution';
import { BsdImageIcon } from '@/components/icons/BsdImageIcon';
import { BsdLightIcon } from '@/components/icons/BsdLightIcon';
import { HistoryIcon, PanelCard, PanelHeader } from '@/components/layout/workbench/view/customers/scenes/components/PanelSection';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result';
import { WorkbenchOperationBar } from '@/components/ui/vines-iframe/view/operation-bar';
import { useElementSize } from '@/hooks/use-resize-observer';
import { useViewStoreOptional } from '@/store/useViewStore';
import { cn } from '@/utils';

import { BsdHistoryGrid, type HistoryImage } from './components/BsdHistoryGrid';
import type { InspirationGenerationOptions } from './InspirationGenerationPanel';
import { VinesUploader } from '@/components/ui/vines-uploader';

export type StyleFusionOptions = InspirationGenerationOptions;

type ReferenceSlot = {
  id: string;
  label: string;
  optional?: boolean;
  file?: File;
  previewUrl?: string;
  uploadedUrl?: string;
  uploading?: boolean;
};

const ReferenceImageCard: React.FC<{
  slot: ReferenceSlot;
  onSelect: (slotId: string, file: File | null) => void;
  onUploaded: (slotId: string, url: string) => void;
  onUploadingChange: (slotId: string, uploading: boolean) => void;
}> = ({ slot, onSelect, onUploaded, onUploadingChange }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const uppy$ = useEventEmitter<any>();
  const uppyRef = useRef<any>(null);
  uppy$?.useSubscription?.((uppy: any) => {
    uppyRef.current = uppy;
  });

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.info('仅支持图片格式');
      return;
    }
    onUploadingChange(slot.id, true);
    if (uppyRef.current?.addFile) {
      try {
        uppyRef.current.addFile({ data: file, name: file.name, type: file.type });
        return;
      } catch {
        // fallback
      }
    }
    onSelect?.(slot.id, file);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const { files, items } = event.clipboardData;
    if (files && files.length > 0) {
      handleFiles(files);
      return;
    }
    const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) handleFiles([file]);
    }
  };

  return (
    <div className="flex flex-col gap-0">
      <VinesUploader
        className="hidden"
        basePath="user-files/workflow-input"
        max={1}
        files={slot.uploadedUrl ? [slot.uploadedUrl] : []}
        uppy$={uppy$}
        onChange={(urls) => {
          const url = urls?.[0] ?? '';
          onUploaded(slot.id, url);
        }}
      />
      <div
        ref={containerRef}
        tabIndex={0}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onPaste={onPaste}
        onMouseEnter={() => containerRef.current?.focus()}
        className={cn(
          'group relative flex items-center justify-center text-white/80 transition focus-visible:outline-none rounded-[12px] overflow-hidden border border-[rgba(44,94,245,0.3)]',
          'bg-[rgba(44,94,245,0.15)] hover:bg-[rgba(44,94,245,0.25)]',
        )}
        style={{
          width: 101,
          height: 112,
          boxSizing: 'border-box',
          borderRadius: 12,
          zIndex: 0,
        }}
        onClick={(e) => {
          // 点击仅用于聚焦，便于粘贴
          (e.currentTarget as HTMLDivElement).focus();
        }}
      >
        {slot.previewUrl ? (
          <>
            <img src={slot.previewUrl} alt={slot.label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(slot.id, null);
                if (uppyRef.current) {
                  uppyRef.current.getFiles?.().forEach((f: any) => uppyRef.current.removeFile?.(f.id));
                }
              }}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm bg-black/60 text-white transition hover:bg-black/80 p-0"
              aria-label="移除图片"
            >
              <X className="size-3.5" stroke="white" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-white/70">
            <div
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 77,
                background: 'rgba(44, 94, 245, 0.2)',
              }}
            >
              <Plus className="size-4 text-white" strokeWidth={2.5}  stroke='white'/>
            </div>
            <span
              className="text-center"
              style={{
                fontFamily: 'Alibaba PuHuiTi 2.0',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: '16.8px',
                letterSpacing: '0.002em',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              {slot.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const StyleFusionPanel: React.FC<{ options?: StyleFusionOptions }> = ({ options }) => {
  const resolvedOptions = useMemo(() => options ?? {}, [options]);
  const { height: rightHeight, ref: rightRef } = useElementSize<HTMLDivElement>();
  const setVisible = useViewStoreOptional((s) => s?.setVisible);
  const workflowId = options?.workflowId as string | undefined;
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const [prompt, setPrompt] = useState(resolvedOptions.prompt ?? '');
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
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
  };

  const handleUploadingChange = (slotId: string, uploading: boolean) => {
    setReferenceSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, uploading } : slot)),
    );
  };

  useEffect(() => {
    setVisible?.(true);
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, [setVisible]);

  const handleStart = async () => {
    if (!workflowId) return;
    const baseSlot = referenceSlots.find((s) => s.id === 'base');
    if (!baseSlot?.file && !baseSlot?.uploadedUrl) {
      toast.error('请先上传局部修改底图');
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

      const inputData: Record<string, unknown> = {
        batch_size: 3,
        prompt_input: prompt,
        image_1: uploadMap['base'] ?? '',
        image_2: uploadMap['reference'] ?? '',
        qwkrp6: '趋势模型',
        seed: Math.floor(Math.random() * 1_000_000),
        step: 25,
      };
      void mutateExecutionList?.();
      await executionWorkflow(workflowId, inputData as any, 1);
    } catch (err) {
      toast.error('启动任务失败');
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
                  onSelect={(file) => updateSlotFile(slot.id, file)}
                  onUploaded={(slotId, url) => handleUploaded(slotId, url)}
                  onUploadingChange={(slotId, flag) => handleUploadingChange(slotId, flag)}
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
            !workflowId ||
            !referenceSlots.find((s) => s.id === 'base' && s.uploadedUrl)
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
  );
};
