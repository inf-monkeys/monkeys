import React, { useEffect, useMemo, useState } from 'react';

import { useEventEmitter } from 'ahooks';
import { Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

import { BsdAssistantIcon } from '@/components/icons/BsdAssistantIcon';
import { BsdImageIcon } from '@/components/icons/BsdImageIcon';
import { BsdLightIcon } from '@/components/icons/BsdLightIcon';
import { BsdPromptDictionaryIcon } from '@/components/icons/BsdPromptDictionaryIcon';

import { executionWorkflow, useWorkflowExecutionListInfinite } from '@/apis/workflow/execution';
import { LOAD_LIMIT } from '@/components/layout/workspace/vines-view/form/execution-result';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkbenchOperationBar } from '@/components/ui/vines-iframe/view/operation-bar';
import { useElementSize } from '@/hooks/use-resize-observer';
import { useViewStoreOptional } from '@/store/useViewStore';
import { cn } from '@/utils';

import { BsdHistoryGrid, type HistoryImage } from './components/BsdHistoryGrid';
import { HistoryIcon, PanelCard, PanelHeader } from './components/PanelSection';
import { MODEL_LIBRARY, allowedModelIds, defaultOptions } from './constants';
import { MODEL_PROMPT_MAP_LIST } from './promptList';

export type InspirationGenerationOptions = {
  title?: string;
  description?: string;
  scenarios?: string[];
  categories?: string[];
  flavors?: string[];
  prompt?: string;
  workflowId?: string;
  models?: Array<{
    id: string;
    title: string;
    subtitle?: string;
    cover?: string;
    type?: string;
  }>;
  historyImages?: Array<{
  id: string;
  url?: string;
  title?: string;
  createdAt?: string;
  status?: string;
  instanceId?: string;
}>;
};

const SelectField: React.FC<{
  label: string;
  options?: string[];
  value?: string;
  onChange: (value: string) => void;
}> = ({ label, options = [], value, onChange }) => {
  if (!options.length) return null;
  const resolvedValue = value ?? options[0];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p
        className="text-white"
        style={{ fontFamily: 'Noto Sans SC', fontSize: 14, fontWeight: 400, lineHeight: '140%', color: 'rgba(255,255,255,0.6)' }}
      >
        {label}
      </p>
      <Select value={resolvedValue} onValueChange={onChange}>
        <SelectTrigger
          className="flex h-9 w-full items-center rounded-2xl border border-white/20 px-4 text-left text-sm text-white transition hover:border-white/30 focus:border-white/40 focus:ring-0 [&>span]:flex [&>span]:h-full [&>span]:w-full [&>span]:items-center [&>span]:font-['Noto_Sans_SC'] [&>span]:text-[14px] [&>span]:font-normal [&>span]:leading-[140%] [&>span]:tracking-[0em] [&>span]:text-white [&>span[data-placeholder]]:text-white/50"
          style={{ background: 'rgba(44, 94, 245, 0.15)' }}
        >
          <SelectValue placeholder={`请选择${label}`} />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-slate-900/95 text-white" position="popper">
          {options.map((option) => (
            <SelectItem
              key={option}
              value={option}
              className="text-sm text-white data-[state=checked]:bg-white data-[state=checked]:text-slate-900"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const ModelCard: React.FC<{
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  backgroundUrl?: string;
}> = ({ title, active, disabled, onClick, backgroundUrl }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={cn(
      'relative flex h-[108px] w-[180px] items-center justify-center overflow-hidden rounded-2xl border bg-cover bg-center text-lg font-semibold text-white transition',
      disabled
        ? 'cursor-not-allowed border-white/5 bg-slate-700/40 text-white/50'
        : active
          ? 'border-[#6ea2ff] shadow-[0_0_25px_rgba(96,165,250,0.35)]'
          : 'border-white/10 bg-gradient-to-r from-slate-500/60 to-slate-800/60 hover:border-white/30',
    )}
  >
    {backgroundUrl && (
      <div
        className={cn('absolute inset-0 bg-cover bg-center', disabled && 'grayscale brightness-75')}
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
    )}
    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/50" />
    <span className="relative z-10 flex flex-col items-center gap-1">{/* title hidden per request */}</span>
  </button>
);

export const InspirationGenerationPanel: React.FC<{ options?: InspirationGenerationOptions }> = ({ options }) => {
  const resolvedOptions = useMemo(() => ({ ...defaultOptions, ...options }), [options]);
  const event$ = useEventEmitter<void>();
  const { height: rightHeight, ref: rightRef } = useElementSize<HTMLDivElement>();
  const setVisible = useViewStoreOptional((s) => s?.setVisible);
  const workflowId = options?.workflowId as string | undefined;

  const enrichedModels = useMemo(
    () =>
      Object.entries(MODEL_LIBRARY).map(([cn, entry]) => ({
        cn,
        ...entry,
        visible: entry.visible !== false,
      })),
    [],
  );

  const visibleModels = useMemo(() => enrichedModels.filter((m) => m.visible), [enrichedModels]);

  const baseScenarios = useMemo(
    () => Array.from(new Set(visibleModels.flatMap((m) => m.scenarios))),
    [visibleModels],
  );

  const [scenario, setScenario] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState(resolvedOptions.prompt ?? '');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectorType, setSelectorType] = useState<'style' | 'brand' | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [styleSelections, setStyleSelections] = useState<string[]>([]);
  const [brandSelections, setBrandSelections] = useState<string[]>([]);
  const [selectionOrder, setSelectionOrder] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);
  const prevPrimaryModelRef = React.useRef<string | undefined>(undefined);

  const scenarioOptions = useMemo(() => baseScenarios, [baseScenarios]);

  const categoryOptions = useMemo(() => {
    const pool = visibleModels.filter((m) => !scenario || m.scenarios.includes(scenario));
    return Array.from(new Set(pool.flatMap((m) => m.categories)));
  }, [scenario, visibleModels]);

  // 保证下拉联动：场景/品类变更时自动对齐可选列表
  useEffect(() => {
    if (!scenarioOptions.length) {
      setScenario(undefined);
      return;
    }
    if (!scenario || !scenarioOptions.includes(scenario)) {
      setScenario(scenarioOptions[0]);
    }
  }, [scenarioOptions, scenario]);

  useEffect(() => {
    if (!categoryOptions.length) {
      setCategory(undefined);
      return;
    }
    if (!category || !categoryOptions.includes(category)) {
      setCategory(categoryOptions[0]);
    }
  }, [categoryOptions, category]);

  const displayedModels = useMemo(
    () => (resolvedOptions.models ?? []).filter((model) => allowedModelIds.includes(model.id)).slice(0, 2),
    [resolvedOptions.models],
  );

  const filteredModels = useMemo(() => {
    return visibleModels.filter(
      (m) => (!scenario || m.scenarios.includes(scenario)) && (!category || m.categories.includes(category)),
    );
  }, [category, scenario, visibleModels]);

  const availableModelSets = useMemo(() => {
    const styleModels = filteredModels.filter((m) => m.modelType === 'style');
    const brandModels = filteredModels.filter((m) => m.modelType === 'brand');
    return { styleModels, brandModels };
  }, [filteredModels]);

  const handleOpenSelector = (type: 'style' | 'brand') => {
    const list = type === 'style' ? availableModelSets.styleModels : availableModelSets.brandModels;
    if (!list.length) return;
    if (panelOpen && selectorType === type) {
      setPanelOpen(false);
      setSelectorType(null);
      setSelectedModels((prev) => prev.filter((id) => id !== type));
      return;
    }
    setSelectorType(type);
    setPanelOpen(true);
    setShowAll(false);
    setSelectedModels([type]);
  };

  const updateSelections = (current: string[], value: string) => {
    if (current.includes(value)) {
      return current.filter((item) => item !== value);
    }
    if (current.length >= 3) {
      return current;
    }
    return [...current, value];
  };

  const toggleOption = (value: string) => {
    if (!selectorType) return;

    const nextStyle =
      selectorType === 'style' ? updateSelections(styleSelections, value) : [...styleSelections];
    const nextBrand =
      selectorType === 'brand' ? updateSelections(brandSelections, value) : [...brandSelections];

    const selectionCount = (selectorType === 'style' ? nextStyle : nextBrand).length;
    const hasAdded =
      selectorType === 'style'
        ? !styleSelections.includes(value) && nextStyle.includes(value)
        : !brandSelections.includes(value) && nextBrand.includes(value);
    if (hasAdded && selectionCount > 3) {
      toast.info('最多选择 3 个模型');
      return;
    }

    setStyleSelections(nextStyle);
    setBrandSelections(nextBrand);
    setSelectionOrder((prev) => {
      const stillSelected = new Set([...nextStyle, ...nextBrand]);
      const filtered = prev.filter((item) => stillSelected.has(item));

      const wasSelected =
        selectorType === 'style' ? styleSelections.includes(value) : brandSelections.includes(value);
      const isSelectedNow =
        selectorType === 'style' ? nextStyle.includes(value) : nextBrand.includes(value);
      if (!wasSelected && isSelectedNow) {
        filtered.push(value);
      }
      return filtered;
    });
  };

  const removeSelection = (value: string) => {
    setStyleSelections((prev) => prev.filter((item) => item !== value));
    setBrandSelections((prev) => prev.filter((item) => item !== value));
    setSelectionOrder((prev) => prev.filter((item) => item !== value));
  };

  useEffect(() => {
    setVisible?.(true);
  }, [setVisible]);

  // 当首选模型变化时，随机填充对应提示词
  useEffect(() => {
    const primary = selectionOrder[0];
    if (!primary || primary === prevPrimaryModelRef.current) return;
    const prompts = MODEL_PROMPT_MAP_LIST[primary];
    prevPrimaryModelRef.current = primary;
    if (Array.isArray(prompts) && prompts.length > 0) {
      const idx = Math.floor(Math.random() * prompts.length);
      setPrompt(prompts[idx]);
    }
  }, [selectionOrder]);

  const handleStart = async () => {
    if (!workflowId) return;
    const finalScenario = scenario ?? scenarioOptions[0];
    const finalCategory = category ?? categoryOptions[0];
    const fallbackStyle = filteredModels.find((m) => m.modelType === 'style');
    const fallbackBrand = filteredModels.find((m) => m.modelType === 'brand');
    const styleModel = styleSelections[0] ?? fallbackStyle?.show_name ?? fallbackStyle?.cn ?? '';
    const brandModel = brandSelections[0] ?? fallbackBrand?.show_name ?? fallbackBrand?.cn ?? '';

    const inputData = {
      BaseModel: '趋势模型',
      batch_size: 3,
      category: finalCategory ?? '',
      description: prompt,
      height: 1024,
      jftj9f: brandModel,
      rhpqgw: resolvedOptions.flavors?.[0] ?? '',
      scene: finalScenario ?? '',
      seed: -1,
      steps: 25,
      styleModel,
      width: 768,
    };

    try {
      setStarting(true);
      // 立即刷新一次历史列表，避免等待下一次定时轮询
      void mutateExecutionList?.();
      await executionWorkflow(workflowId, inputData, 1);
    } catch (err) {
      //console.error('[InspirationPanel] start execution failed', err);
    } finally {
      setStarting(false);
      void mutateExecutionList?.();
    }
  };

  // 获取当前工作流的历史生成图片
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
    // 没有输出时补充占位项，确保 RUNNING/PAUSED 也能展示
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
    // 同一 instanceId + index 可能跨分页重复，去重保留最新一条
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
      // 去重，按 id 保留最新
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

  // 切换 workflow 时清空缓存，其余 revalidate 不清空，避免加载过程闪空
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

  // 如果存在运行中的任务，定期刷新，确保占位状态能回填为完成图片
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
          <PanelCard className="gap-3" padding={12}>
            <PanelHeader
              icon={<BsdLightIcon className="size-5" />}
              title={resolvedOptions.title}
              description={resolvedOptions.description}
            />

            <div className="mt-3 flex items-center gap-4">
              <SelectField label="场景" options={scenarioOptions} value={scenario} onChange={setScenario} />
              <SelectField label="品类" options={categoryOptions} value={category} onChange={setCategory} />
              <div className="flex w-[120px] flex-none flex-col gap-3">
                <p
                  className="text-white"
                  style={{ fontFamily: 'Noto Sans SC', fontSize: 14, fontWeight: 400, lineHeight: '140%', color: 'rgba(255,255,255,0.6)' }}
                >
                  更多
                </p>
                <div className="flex h-9 items-center rounded-2xl transition hover:brightness-110 -translate-y-[2px]">
                  <BsdPromptDictionaryIcon className="h-full w-auto" />
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl border border-white/15 p-4 transition-colors duration-400 hover:border-white/40"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={6}
                className="h-40 w-full resize-none bg-transparent text-sm leading-relaxed text-white placeholder:text-white/40 focus:outline-none"
                placeholder="请输入创意描述"
              />
              <div className="mt-2 flex items-center justify-start text-xs text-white/60">
                <button className="inline-flex items-center gap-2 text-white/70">
                  <BsdAssistantIcon className="h-6 w-6" />
                  提示词助手
                </button>
              </div>

            </div>

            {selectionOrder.length > 0 && (
              <div className="mt-0 flex flex-wrap items-center gap-2 text-xs text-white/70">
                {selectionOrder.map((item, idx) => (
                  <span
                    key={`${item}-${idx}`}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[12px] text-white"
                    style={{ maxWidth: '33%' }}
                  >
                    <span className="truncate text-white" title={item}>
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelection(item);
                      }}
                      className="rounded-full p-0.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                      aria-label="移除模型"
                    >
                      <X className="size-3.5" stroke='white'/>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard className="gap-4" padding={12}>
            <PanelHeader
              icon={<BsdImageIcon className="size-5" />}
              title="个性化模型（可选）"
              description="包含“风格 / 品牌”，点击后在下方弹出选择（最多三个）"
            />

            <div className="mt-1 grid gap-4 md:grid-cols-2">
              {displayedModels.map((model) => {
                const list = model.id === 'style' ? availableModelSets.styleModels : availableModelSets.brandModels;
                const backgroundUrl =
                  model.id === 'style'
                    ? 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/icon/inspire-style_resized.jpg'
                    : model.id === 'brand'
                      ? 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/TemporaryImages/bsd/icon/inspire-brand_resized.jpg'
                      : undefined;
                return (
                  <ModelCard
                    key={model.id}
                    title={model.title}
                    active={selectedModels.includes(model.id)}
                    disabled={list.length === 0}
                    backgroundUrl={backgroundUrl}
                    onClick={() => handleOpenSelector(model.id as 'style' | 'brand')}
                  />
                );
              })}
            </div>

            {panelOpen && selectorType && (
              <div className="mt-0 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <header className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">{selectorType === 'style' ? '选择风格' : '选择品牌'}</p>
                    <p className="text-xs text-white/60">最多选择 3 个，可重复点击取消</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-full px-2 py-1 text-sm text-white/70 transition hover:bg-white/10"
                      onClick={() => setPanelOpen(false)}
                    >
                      关闭
                    </button>
                    {(selectorType === 'style' ? availableModelSets.styleModels : availableModelSets.brandModels).length > 6 && (
                      <button
                        className="rounded-full px-2 py-1 text-sm text-white/70 transition hover:bg-white/10"
                        onClick={() => setShowAll((v) => !v)}
                      >
                        {showAll ? '收起' : '更多'}
                      </button>
                    )}
                  </div>
                </header>

                <div className="grid grid-cols-3 gap-3">
                  {(selectorType === 'style' ? availableModelSets.styleModels : availableModelSets.brandModels)
                    .slice(0, showAll ? undefined : 6)
                    .map((option) => {
                      const name = option.show_name ?? option.cn ?? option.en;
                      const selected = selectorType === 'style' ? styleSelections.includes(name) : brandSelections.includes(name);
                      return (
                        <button
                          key={option.en}
                          onClick={() => toggleOption(name)}
                          className={cn(
                            'relative flex aspect-square w-full overflow-hidden rounded-xl border bg-black/70 transition',
                            selected ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.35)]' : 'border-white/10 hover:border-white/30',
                          )}
                        >
                          <img src={option.path} alt={name} className="h-full w-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-xs text-white truncate">{name}</div>
                        </button>
                      );
                    })}
                  {(selectorType === 'style' ? availableModelSets.styleModels : availableModelSets.brandModels).length === 0 && (
                    <span className="text-sm text-white/60">暂无可用选项</span>
                  )}
                </div>
              </div>
            )}
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
            disabled={starting || !workflowId}
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
              开始生图
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
