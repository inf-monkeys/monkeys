import React, { useEffect, useMemo, useRef, useState } from 'react';

import { executionWorkflow, useWorkflowExecutionListInfinite } from '@/apis/workflow/execution';
import { BsdAssistantIcon } from '@/components/icons/BsdAssistantIcon';
import { BsdLightIcon } from '@/components/icons/BsdLightIcon';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result';
import { WorkbenchOperationBar } from '@/components/ui/vines-iframe/view/operation-bar';
import { useElementSize } from '@/hooks/use-resize-observer';
import { useViewStoreOptional } from '@/store/useViewStore';
import { cn } from '@/utils';

import { BsdHistoryGrid, type HistoryImage } from './components/BsdHistoryGrid';
import { HistoryIcon, PanelCard, PanelHeader } from './components/PanelSection';
import { ReferenceImageCard, type ReferenceSlot } from './components/ReferenceImageCard';
import { BACKGROUND_CATEGORIES, BACKGROUND_OPTIONS, LIGHT_STYLE_OPTIONS } from './lightEffectAssets';
import { Sparkles } from 'lucide-react';

export type LightEffectOptions = {
  title?: string;
  description?: string;
  workflowId?: string;
};


const defaultLightEffectOptions: LightEffectOptions = {
  title: '创意描述',
  description: '通过文字描述生成图片或使用提示词字典提升生成效果',
};


export const LightEffectPanel: React.FC<{ options?: LightEffectOptions }> = ({ options }) => {
  const resolvedOptions = useMemo(() => ({ ...defaultLightEffectOptions, ...options }), [options]);
  const { height: rightHeight, ref: rightRef } = useElementSize<HTMLDivElement>();
  const setVisible = useViewStoreOptional((s) => s?.setVisible);
  const workflowId = options?.workflowId as string | undefined;

  // 状态
  const [referenceSlots, setReferenceSlots] = useState<ReferenceSlot[]>([{ id: 'base', label: '参考图' }]);
  const [prompt, setPrompt] = useState('');
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  // 面板展开状态
  const [selectorType, setSelectorType] = useState<'background' | 'lightStyle' | null>(null);
  const [showAll, setShowAll] = useState(false);

  // 背景选择
  const [backgroundCategory, setBackgroundCategory] = useState('outdoor');
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);

  // 光照风格选择
  const [selectedLightStyle, setSelectedLightStyle] = useState<string | null>(null);

  useEffect(() => {
    setVisible?.(true);
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, [setVisible]);

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

  const handleUploadingChange = (slotId: string, nextUploading: boolean) => {
    setReferenceSlots((prev) => prev.map((slot) => (slot.id === slotId ? { ...slot, uploading: nextUploading } : slot)));
  };

  const getAllBackgroundOptions = () => Object.values(BACKGROUND_OPTIONS).flat();

  const generatePromptText = (bgId: string | null, lightId: string | null) => {
    const parts: string[] = [];
    if (bgId) {
      const bgOption = getAllBackgroundOptions().find((o) => o.id === bgId);
      if (bgOption) parts.push(bgOption.label);
    }
    if (lightId) {
      const lightOption = LIGHT_STYLE_OPTIONS.find((o) => o.id === lightId);
      if (lightOption) parts.push(lightOption.label);
    }
    return parts.join('，');
  };

  const handleToggleSelector = (type: 'background' | 'lightStyle') => {
    if (selectorType === type) {
      setSelectorType(null);
    } else {
      setSelectorType(type);
      setShowAll(false);
    }
  };

  const handleSelectBackground = (id: string) => {
    const newBg = selectedBackground === id ? null : id;
    setSelectedBackground(newBg);
    setPrompt(generatePromptText(newBg, selectedLightStyle));
  };

  const handleSelectLightStyle = (id: string) => {
    const newLight = selectedLightStyle === id ? null : id;
    setSelectedLightStyle(newLight);
    setPrompt(generatePromptText(selectedBackground, newLight));
  };

  const randomSeed15 = () => Math.floor(1e14 + Math.random() * 9e14);

  const handleStart = async () => {
    if (!workflowId) return;
    const baseSlot = referenceSlots.find((s) => s.id === 'base');
    if (!baseSlot?.file && !baseSlot?.uploadedUrl) {
      toast?.error?.('请先上传参考图');
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
      void mutateExecutionList?.();
      await executionWorkflow(
        workflowId,
        {
          image: uploadMap['base'] ?? '',
          bfzhrq: selectedBackground ?? '',
          rd7zfc: selectedLightStyle ?? '',
          prompt,
          seed: randomSeed15(),
        },
        1,
      );
    } finally {
      setStarting(false);
      setUploading(false);
      void mutateExecutionList?.();
    }
  };

  const { data: executionListData, size, setSize, isLoading, isValidating, mutate: mutateExecutionList } = useWorkflowExecutionListInfinite(workflowId || null, LOAD_LIMIT);

  const executionItems = useMemo(() => {
    const list = executionListData?.flatMap((page) => page?.data ?? []) ?? [];
    const items = list.flatMap((output) => {
      const outputs = Array.isArray(output?.output) ? output.output : [];
      return outputs.map((item, index) => ({ ...output, render: { ...item, key: `${output.instanceId}-${index}`, status: output.status } }));
    });
    const placeholders = list.filter((output) => !Array.isArray(output?.output) || (output?.output?.length ?? 0) === 0)
      .map((output) => ({ ...output, render: { type: 'image' as const, data: null, key: `${output.instanceId}-placeholder`, status: output.status } }));
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

  const executionImages = useMemo<HistoryImage[]>(() => executionItems.map((item, idx) => ({
    id: item.render?.key ?? `${item.instanceId ?? 'unknown'}-${idx}`,
    url: item.render.status === 'COMPLETED' && item.render.type === 'image' && item.render.data ? String(item.render.data) : undefined,
    status: item.render.status,
    instanceId: item.instanceId,
  })), [executionItems]);

  const [displayImages, setDisplayImages] = useState<HistoryImage[]>([]);
  useEffect(() => { if (executionImages.length > 0) setDisplayImages(executionImages); }, [executionImages]);
  useEffect(() => { setDisplayImages([]); }, [workflowId]);

  const hasMoreExec = executionListData && executionListData.length > 0 && (executionListData[size - 1]?.data?.length ?? 0) === LOAD_LIMIT;
  const loadMoreExec = () => { if (hasMoreExec) setSize((prev) => prev + 1); };

  useEffect(() => {
    if (!workflowId) return;
    const hasPending = executionItems.some((item) => ['SCHEDULED', 'RUNNING', 'PAUSED'].includes(item.render?.status));
    if (!hasPending) return;
    const timer = window.setInterval(() => { void mutateExecutionList?.(); }, 2000);
    return () => window.clearInterval(timer);
  }, [executionItems, workflowId, mutateExecutionList]);

  const currentBgOptions = BACKGROUND_OPTIONS[backgroundCategory] || [];


  return (
    <div className="flex w-full gap-4 pr-1">
      {/* 左侧：配置面板 */}
      <div className="flex w-[400px] min-h-0 flex-col gap-3">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 光影模版上传 */}
      <PanelCard className="gap-3" padding={12}>
        <PanelHeader icon={<BsdLightIcon className="size-5" />} title="光影模版" description="上传需要重打光和换背景的图片模版" />
        <div className="flex flex-row flex-wrap gap-3">
          {referenceSlots.map((slot) => (
            <ReferenceImageCard
              key={slot.id}
              slot={slot}
              onSelect={updateSlotFile}
              onUploaded={handleUploaded}
              onUploadingChange={handleUploadingChange}
            />
          ))}
        </div>
      </PanelCard>

          {/* 创意描述（融合背景和光照选择） */}
          <PanelCard className="gap-3" padding={12}>
            <PanelHeader icon={<BsdLightIcon className="size-5" />} title={resolvedOptions.title ?? '创意描述'} description={resolvedOptions.description} />

            {/* 背景和光照风格选择按钮 */}
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleSelector('background')}
                className={cn('flex-1 rounded-lg px-4 py-2 text-sm text-white transition-colors', selectorType === 'background' ? 'bg-[#1668dc]' : 'bg-[#232734] hover:bg-[#2a2f3d]')}
              >
                背景{selectedBackground ? `：${getAllBackgroundOptions().find(o => o.id === selectedBackground)?.label}` : ''}
              </button>
              <button
                onClick={() => handleToggleSelector('lightStyle')}
                className={cn('flex-1 rounded-lg px-4 py-2 text-sm text-white transition-colors', selectorType === 'lightStyle' ? 'bg-[#1668dc]' : 'bg-[#232734] hover:bg-[#2a2f3d]')}
              >
                光照{selectedLightStyle ? `：${LIGHT_STYLE_OPTIONS.find(o => o.id === selectedLightStyle)?.label}` : ''}
              </button>
            </div>

            {/* 背景选择面板 */}
            {selectorType === 'background' && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">选择背景</p>
                  <div className="flex gap-2">
                    {currentBgOptions.length > 6 && (
                      <button className="text-xs text-white/60 hover:text-white" onClick={() => setShowAll(v => !v)}>{showAll ? '收起' : '更多'}</button>
                    )}
                    <button className="text-xs text-white/60 hover:text-white" onClick={() => setSelectorType(null)}>关闭</button>
                  </div>
                </div>
                <div className="mb-3 flex gap-2">
                  {BACKGROUND_CATEGORIES.map((cat) => (
                    <button key={cat.id} onClick={() => setBackgroundCategory(cat.id)} className={cn('rounded-lg px-3 py-1.5 text-xs text-white transition-colors', backgroundCategory === cat.id ? 'bg-[#1668dc]' : 'bg-[#232734] hover:bg-[#2a2f3d]')}>{cat.label}</button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {currentBgOptions.slice(0, showAll ? undefined : 6).map((opt) => (
                    <button key={opt.id} onClick={() => handleSelectBackground(opt.id)} className={cn('relative overflow-hidden rounded-xl border transition', selectedBackground === opt.id ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.35)]' : 'border-white/10 hover:border-white/30')}>
                      <img src={opt.image} alt={opt.label} className="aspect-square w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-xs text-white truncate">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 光照风格选择面板 */}
            {selectorType === 'lightStyle' && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">选择光照风格</p>
                  <div className="flex gap-2">
                    {LIGHT_STYLE_OPTIONS.length > 6 && (
                      <button className="text-xs text-white/60 hover:text-white" onClick={() => setShowAll(v => !v)}>{showAll ? '收起' : '更多'}</button>
                    )}
                    <button className="text-xs text-white/60 hover:text-white" onClick={() => setSelectorType(null)}>关闭</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {LIGHT_STYLE_OPTIONS.slice(0, showAll ? undefined : 6).map((opt) => (
                    <button key={opt.id} onClick={() => handleSelectLightStyle(opt.id)} className={cn('relative overflow-hidden rounded-xl border transition', selectedLightStyle === opt.id ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.35)]' : 'border-white/10 hover:border-white/30')}>
                      <img src={opt.image} alt={opt.label} className="aspect-square w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-xs text-white truncate">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 文本输入框 */}
            <div className="rounded-2xl border border-white/15 p-4 transition-colors hover:border-white/40" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className="w-full resize-none bg-transparent text-sm leading-relaxed text-white placeholder:text-white/40 focus:outline-none" placeholder="请输入创意描述" />
              <div className="mt-2 flex items-center text-xs text-white/60">
                <button className="inline-flex items-center gap-2 text-white/70"><BsdAssistantIcon className="h-5 w-5" />提示词助手</button>
              </div>
            </div>
          </PanelCard>
        </div>

        {/* 底部按钮 */}
        <div className="flex w-full items-center justify-between gap-3 pb-1 pt-1">
          <button
            type="button"
            onClick={handleStart}
            disabled={starting || uploading || !workflowId || !referenceSlots.find((s) => s.id === 'base' && s.uploadedUrl)}
            className="relative flex h-[42px] w-full items-center justify-center gap-2 overflow-hidden rounded-[10px] px-5 text-white transition hover:brightness-110"
            style={{ background: 'linear-gradient(0deg, rgba(40, 82, 173, 0.08), rgba(40, 82, 173, 0.08)), #2C5EF5' }}
          >
            <span className="pointer-events-none absolute bottom-0 left-1/2 h-2 w-2/3 -translate-x-1/2 translate-y-[6px] rounded-full bg-white/60 blur-[12px]" />
            <Sparkles className="size-5" stroke="none" fill="#FFFFFF" />
            <span style={{ fontFamily: 'Microsoft YaHei UI, sans-serif', fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>开始生图</span>
          </button>
          <div className="flex h-full items-center"><WorkbenchOperationBar /></div>
        </div>
      </div>

      {/* 右侧：历史生成 */}
      <PanelCard ref={rightRef} className="flex min-h-0 flex-1 gap-3 overflow-hidden" padding={12}>
        <div className="mb-2"><PanelHeader icon={<HistoryIcon />} title="历史生成" description="查看当前生成图片和历史生成图片" /></div>
        <div className="flex min-h-0 flex-1">
          <BsdHistoryGrid images={displayImages.length ? displayImages : executionImages} workflowId={workflowId} hasMore={hasMoreExec} onLoadMore={loadMoreExec} onDeleted={() => mutateExecutionList?.()} loading={isLoading && executionImages.length === 0 && displayImages.length === 0} loadingMore={isValidating && (executionImages.length > 0 || displayImages.length > 0)} height={rightHeight || 800} />
        </div>
      </PanelCard>
    </div>
  );
};
