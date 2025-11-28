import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import { Loader2, Trash, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkflowExecution } from '@/apis/workflow/execution';
import { cn } from '@/utils';

export type HistoryImage = {
  id: string;
  url?: string;
  title?: string;
  createdAt?: string;
  status?: string;
  instanceId?: string;
};

type HistoryCard = HistoryImage & { _key: string };

const BackToTopIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" width="21" height="11.5" viewBox="0 0 21 11.5">
    <path
      d="M10.5 2.4142133 19.292894 11.207107c.140725.140482.324405.2361.523308.2361.098479 0 .195057-.01921.28599-.056895.09097-.037684.172885-.09237.254738-.147083a.905.905 0 0 0 .175035-.175205c.05469-.081877.110402-.163754.148087-.25473a.922.922 0 0 0 .056894-.285608c0-.198872-.076105-.382606-.15221-.56634a1.004 1.004 0 0 0-.240639-.240623L11.207107.29289323C11.066454.15224099 10.882683.0761205 10.7 0c-.198913 0-.382683.0761205-.523336.21677273L.29289323 9.7928934a.998.998 0 0 0-.216588.4245.963.963 0 0 0 0 .382606c.019211.09658.038422.193159.076105.284135.037684.090976.093397.172853.148105.25473.054708.081877.110416.163754.180046.233384.06963.069629.151506.125338.233382.180046.081876.054708.163753.110416.254729.1481.090976.037684.187555.056895.284135.076106.09658.019211.195052.038422.293525.038422.198873 0 .382607-.076105.566341-.15221.183734-.076106.324358-.21673.464982-.357354L10.5 2.4142133Z"
      fill="#FFFFFF"
      fillRule="evenodd"
    />
  </svg>
);

export const BsdHistoryGrid: React.FC<{
  images: HistoryImage[];
  workflowId?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onDeleted?: () => void;
  loading?: boolean;
  loadingMore?: boolean;
  height?: number;
}> = ({ images, workflowId, hasMore = false, onLoadMore, onDeleted, loading, loadingMore, height }) => {
  const { t } = useTranslation();
  const CHUNK_SIZE = 12;
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<Array<HistoryCard[]>>([[], [], []]);
  const [cursor, setCursor] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);
  const cursorRef = useRef(0);
  const prevSignatureRef = useRef<string>('');
  const prevWorkflowRef = useRef<string | null | undefined>(workflowId);
  const isLoadingMoreRef = useRef(false);
  const prevEffectiveLenRef = useRef(0);
  const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());

  const keyedImages = useMemo<HistoryCard[]>(
    () =>
      images.map((img, idx) => ({
        ...img,
        _key: `${img.id ?? img.url ?? `img-${idx}`}`,
      })),
    [images],
  );

  const effectiveImages = useMemo(
    () => keyedImages.filter((img) => !removedKeys.has(img._key)),
    [keyedImages, removedKeys],
  );
  const effectiveSignature = useMemo(
    () => effectiveImages.map((img) => `${img._key}:${img.status ?? ''}:${img.url ?? ''}`).join('|'),
    [effectiveImages],
  );

  const appendChunkFrom = React.useCallback(
    (start?: number) => {
      const begin = typeof start === 'number' ? start : cursorRef.current;
      if (begin >= effectiveImages.length) return;
      const slice = effectiveImages.slice(begin, begin + CHUNK_SIZE);
      if (!slice.length) return;

      setColumns((prev) => {
        const next = prev.map((col) => [...col]) as Array<HistoryCard[]>;
        slice.forEach((item, index) => {
          next[index % 3].push(item);
        });
        return next;
      });

      const nextCursor = begin + slice.length;
      cursorRef.current = nextCursor;
      setCursor(nextCursor);
    },
    [effectiveImages],
  );

  useEffect(() => {
    const workflowChanged = workflowId !== undefined && workflowId !== prevWorkflowRef.current;
    const len = effectiveImages.length;
    const signatureChanged = effectiveSignature !== prevSignatureRef.current;

    if (workflowChanged || len < prevEffectiveLenRef.current || signatureChanged) {
      prevWorkflowRef.current = workflowId;
      cursorRef.current = 0;
      setCursor(0);
      setShowBackTop(false);
      setColumns([[], [], []]);
      appendChunkFrom(0);
      prevEffectiveLenRef.current = len;
      prevSignatureRef.current = effectiveSignature;
      return;
    }

    if (len > prevEffectiveLenRef.current) {
      appendChunkFrom(prevEffectiveLenRef.current);
    } else if (len > 0 && cursorRef.current === 0 && columns.every((c) => c.length === 0)) {
      appendChunkFrom(0);
    }

    prevEffectiveLenRef.current = len;
    prevSignatureRef.current = effectiveSignature;
  }, [effectiveImages, effectiveSignature, workflowId, appendChunkFrom, columns]);

  useEffect(() => {
    setRemovedKeys(new Set());
  }, [workflowId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => {
      setShowBackTop(el.scrollTop > 80);
      if (el.scrollHeight <= el.clientHeight) {
        appendChunkFrom();
        return;
      }
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        if (cursorRef.current < effectiveImages.length) {
          appendChunkFrom();
          return;
        }
        if (hasMore && !isLoadingMoreRef.current) {
          isLoadingMoreRef.current = true;
          onLoadMore?.();
        }
      }
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, [cursor, effectiveImages.length, hasMore, onLoadMore, appendChunkFrom]);

  // 当容器内容不足以产生滚动时，自动继续填充下一批，避免缩放后卡在 4*3 张
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let safety = 0;
    while (el.scrollHeight <= el.clientHeight && cursorRef.current < effectiveImages.length && safety < 8) {
      appendChunkFrom();
      safety += 1;
    }
  }, [columns, effectiveImages.length, appendChunkFrom]);

  useEffect(() => {
    isLoadingMoreRef.current = false;
  }, [effectiveImages.length, hasMore, loadingMore]);

  // 已舍弃底部“正在加载新内容...”提示，保留占位以备后续需求
  // useEffect(() => {}, [loading, loadingMore]);

  const scrollToTop = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = useMemoizedFn((instanceId?: string, key?: string) => {
    if (!instanceId) return;
    const prevScrollTop = containerRef.current?.scrollTop ?? 0;
    toast.promise(
      deleteWorkflowExecution(instanceId).then(() => {
        setRemovedKeys((prev) => {
          const next = new Set(prev);
          const keysToRemove = keyedImages
            .filter((img) => img.instanceId === instanceId)
            .map((img) => img._key);
          keysToRemove.forEach((k) => next.add(k));
          if (key) next.add(key);

          // 立即更新当前列，避免等待接口回填
          const nextEffective = keyedImages.filter((img) => !next.has(img._key));
          const nextCursor = Math.min(cursorRef.current, nextEffective.length);
          const rebuilt: Array<HistoryCard[]> = [[], [], []];
          nextEffective.slice(0, nextCursor).forEach((item, idx) => {
            rebuilt[idx % 3].push(item);
          });

          cursorRef.current = nextCursor;
          setCursor(nextCursor);
          setColumns(rebuilt);
          prevEffectiveLenRef.current = nextEffective.length;

          // 尝试恢复删除前的滚动位置，避免跳动
          if (containerRef.current) {
            const target = Math.min(prevScrollTop, containerRef.current.scrollHeight - containerRef.current.clientHeight);
            window.requestAnimationFrame(() => {
              containerRef.current?.scrollTo({ top: target, behavior: 'auto' });
            });
          }

          return next;
        });
        onDeleted?.();
      }),
      {
        success: t('common.delete.success'),
        error: t('common.delete.error'),
        loading: t('common.delete.loading'),
      },
    );
  });

  const renderCard = (item: HistoryCard) => {
    const key = item._key;
    const status = (item.status || '').toUpperCase();
    const isCompleted = status === 'COMPLETED';
    const isLoading = ['SCHEDULED', 'RUNNING', 'PAUSED'].includes(status);
    const isFailed = status === 'FAILED';
    const canDelete = Boolean(item.instanceId);

    return (
      <div
        key={key}
        className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/10 backdrop-blur-md transition duration-200 hover:border-white/60"
      >
        <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
          {item.url ? (
            <img src={item.url} alt={item.title ?? 'history'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900/30 text-white/60"></div>
          )}
          {isFailed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
              <XCircle className="size-10 " stroke="red" />
            </div>
          )}
          {!isCompleted && !isFailed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
              <Loader2 className="size-10 animate-spin" stroke="white" />
            </div>
          )}
        </div>
        {item.title && (
          <div className="px-1.5 py-1 text-xs text-white/80 line-clamp-1">
            {item.title}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 bg-black/35 px-2 py-1.5 opacity-0 backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100">
          <div
            role="button"
            tabIndex={canDelete ? 0 : -1}
            aria-disabled={!canDelete}
            onClick={(e) => {
              if (!canDelete) return;
              e.stopPropagation();
              handleDelete(item.instanceId, key);
            }}
            onKeyDown={(e) => {
              if (!canDelete) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDelete(item.instanceId, key);
              }
            }}
            className={cn(
              'pointer-events-auto flex items-center justify-center rounded-md border border-white/30 bg-white/10 p-1.5 text-white transition hover:border-white/70 hover:bg-white/20',
              !canDelete && 'cursor-not-allowed opacity-50',
            )}
            title={t('common.utils.delete')}
            aria-label={t('common.utils.delete')}
          >
            <Trash className="size-4" stroke="white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 min-h-0">
      <div
        ref={containerRef}
        className="relative flex flex-1 overflow-y-auto rounded-none bg-transparent p-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ height, minHeight: 0 }}
      >
        <div className="grid flex-1 grid-cols-3 gap-4">
          {columns.map((col, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-4">
              {col.map((item) => renderCard(item))}
            </div>
          ))}
          {effectiveImages.length === 0 && (
            <div className="col-span-3 flex h-48 items-center justify-center rounded-xl border border-dashed border-white/15 text-sm text-white/50">
              {loading ? '加载中...' : '暂无历史图片'}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={scrollToTop}
        className={cn(
          'pointer-events-auto absolute bottom-3 right-3 z-[4] flex items-center justify-center rounded-full bg-[#2C5EF5] text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
          showBackTop ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        aria-label="回到顶部"
        style={{
          width: 55,
          height: 55,
          boxShadow: '0px 4px 10px 0px #727AEB',
        }}
      >
        <BackToTopIcon />
      </button>
    </div>
  );
};
