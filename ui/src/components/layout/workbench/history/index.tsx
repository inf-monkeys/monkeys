import React, { Dispatch, SetStateAction, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useAsyncEffect } from 'ahooks';
import { get } from 'lodash';
import { Maximize2, Minimize2, ScanSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { useInfiniteWorkflowAllArtifacts, WorkflowArtifactListItem } from '@/apis/workflow/execution/output';
import { ImagePreview } from '@/components/layout-wrapper/main/image-preview';
import { UniImagePreviewWrapper } from '@/components/layout-wrapper/main/uni-image-preview';
import { useVinesTeam } from '@/components/router/guard/team';
import { Button } from '@/components/ui/button';
import { checkImageUrlAvailable } from '@/components/ui/vines-image/utils';
import type { VinesWorkflowExecutionType } from '@/package/vines-flow/core/typings';
import { useOnlyShowWorkbenchIcon } from '@/store/showWorkbenchIcon';
import { ImagesResult } from '@/store/useExecutionImageResultStore';
import { useEmbedSidebar } from '@/store/useGlobalViewStore';
import { cn } from '@/utils';
import { getThumbUrl } from '@/utils/file';

// Swiper 已移除，使用原生横向滚动
interface HistoryResultProps {
  loading: boolean;
  images: ImagesResultWithOrigin[];

  className?: string;
  setSize: Dispatch<SetStateAction<number>>;
}

const HistoryResultInner: React.FC<HistoryResultProps> = ({ images, className, setSize }) => {
  // 折叠态改为原生横向滚动
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const rowScrollRef = useRef<HTMLDivElement>(null);
  const rowSentinelRef = useRef<HTMLDivElement>(null);
  const onlyShowWorkbenchIcon = useOnlyShowWorkbenchIcon();
  const [expanded, setExpanded] = useState(false);
  const [expandedRect, setExpandedRect] = useState<{ left: number; width: number; bottomOffset: number } | null>(null);

  // 虚拟列表常量
  const ITEM_SIZE = 72; // 与样式保持一致的方形边长
  const GAP = 8;
  const ROW_BUFFER = 3; // 折叠态左右缓冲项目数
  const GRID_BUFFER_ROWS = 2; // 展开态上下缓冲行数

  // 折叠态：视口与滚动位置
  const [rowViewportWidth, setRowViewportWidth] = useState(0);
  const [rowScrollLeft, setRowScrollLeft] = useState(0);

  // 使用 useLayoutEffect 确保在渲染前同步测量容器宽度
  useLayoutEffect(() => {
    const el = rowScrollRef.current;
    if (!el) return;

    // 直接设置初始宽度
    const width = el.clientWidth;
    if (width > 0) {
      setRowViewportWidth(width);
    }

    // ResizeObserver 监听后续尺寸变化
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (newWidth > 0) {
          setRowViewportWidth(newWidth);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [images.length]);

  const hasRowMeasurement = rowViewportWidth > 0;
  const totalRowWidth = images.length * ITEM_SIZE + Math.max(0, images.length - 1) * GAP;
  // 计算视口内可见的项目数
  const rowVisibleCount = hasRowMeasurement
    ? Math.max(1, Math.ceil(rowViewportWidth / (ITEM_SIZE + GAP)))
    : images.length;
  // 计算当前滚动位置对应的起始索引
  const scrollItemIndex = hasRowMeasurement ? Math.floor(rowScrollLeft / (ITEM_SIZE + GAP)) : 0;
  // 加入缓冲区，确保滚动时有预加载
  const rowFirstIndex = hasRowMeasurement ? Math.max(0, scrollItemIndex - ROW_BUFFER) : 0;
  // 计算末尾索引：可见项数 + 缓冲项数 * 2
  const rowLastIndex = hasRowMeasurement
    ? Math.min(images.length - 1, rowFirstIndex + rowVisibleCount + ROW_BUFFER * 2 - 1)
    : images.length - 1;
  const rowSlice = images.slice(rowFirstIndex, rowLastIndex + 1);
  const rowLeftSpacer = hasRowMeasurement ? Math.max(0, rowFirstIndex * (ITEM_SIZE + GAP)) : 0;
  const rowSliceWidth = rowSlice.length * ITEM_SIZE + Math.max(0, rowSlice.length - 1) * GAP;
  const rowRightSpacer = hasRowMeasurement ? Math.max(0, totalRowWidth - rowLeftSpacer - rowSliceWidth) : 0;

  const onRowScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setRowScrollLeft(target.scrollLeft);
  };
  // 折叠态使用原生横向滚动 + IO 触底加载
  useEffect(() => {
    if (expanded) return; // 仅折叠态启用
    const root = rowScrollRef.current;
    const target = rowSentinelRef.current;
    if (!root || !target) return;

    let lastTrigger = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const now = Date.now();
            if (now - lastTrigger > 300) {
              lastTrigger = now;
              setSize((size) => size + 1);
            }
          }
        }
      },
      { root, rootMargin: '300px', threshold: 0.1 },
    );

    io.observe(target);
    return () => io.disconnect();
  }, [expanded, setSize, images.length]);

  const handleDragStart = React.useCallback((e: React.DragEvent, item: ImagesResultWithOrigin, src: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', item.render.origin);
    e.dataTransfer.setData('text/uri-list', src);
  }, []);

  const slideLeftRef = useRef<HTMLButtonElement>(null);
  const slideRightRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'ArrowLeft') {
          slideLeftRef.current?.click();
        } else if (e.key === 'ArrowRight') {
          slideRightRef.current?.click();
        } else if (e.key === 'ArrowUp') {
          slideLeftRef.current?.click();
        } else if (e.key === 'ArrowDown') {
          slideRightRef.current?.click();
        }
      },
      { signal },
    );
    return () => abortController.abort();
  }, []);

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(0);

  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'border') as ISystemConfig['theme']['themeMode'];

  const density = oem?.theme.density ?? 'default';

  const isUniImagePreview = oem?.theme.uniImagePreview ?? false;

  const modern = oem?.theme.workbenchSidebarModernMode ?? false;

  const embedSidebar = useEmbedSidebar();

  // 展开态：滚动容器与 Sentinel
  const popupScrollRef = useRef<HTMLDivElement>(null);
  const gridSentinelRef = useRef<HTMLDivElement>(null);

  // 仅做“免遮挡”：展开层通过 portal 渲染到 body，避免被画板（tldraw/iframe 的 portal fixed 层）压住
  // 注意：这里不改变任何加载/虚拟列表逻辑，只负责测量定位
  useLayoutEffect(() => {
    if (!expanded) {
      setExpandedRect(null);
      return;
    }
    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;

    let raf = 0;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const bottomOffset = Math.max(0, window.innerHeight - r.bottom);
      setExpandedRect({ left: r.left, width: r.width, bottomOffset });
    };

    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    // 首帧同步测量（layout effect 阶段），避免闪烁
    measure();

    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [expanded]);
  useEffect(() => {
    if (!expanded) return;
    const root = popupScrollRef.current;
    const target = gridSentinelRef.current;
    if (!root || !target) return;

    let lastTrigger = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const now = Date.now();
            if (now - lastTrigger > 300) {
              lastTrigger = now;
              setSize((size) => size + 1);
            }
          }
        }
      },
      { root, rootMargin: '200px', threshold: 0.1 },
    );

    io.observe(target);
    return () => io.disconnect();
  }, [expanded, setSize, images.length]);

  // 展开态：虚拟网格测量
  const [gridViewportWidth, setGridViewportWidth] = useState(0);
  const [gridViewportHeight, setGridViewportHeight] = useState(0);
  const [gridScrollTop, setGridScrollTop] = useState(0);

  // 使用 useLayoutEffect 确保初始化时准确测量网格容器
  useLayoutEffect(() => {
    if (!expanded) return;

    const root = popupScrollRef.current;
    if (!root) return;

    // 直接设置初始尺寸
    const width = root.clientWidth;
    const height = root.clientHeight;
    if (width > 0) setGridViewportWidth(width);
    if (height > 0) setGridViewportHeight(height);

    // ResizeObserver 监听后续尺寸变化
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0) setGridViewportWidth(newWidth);
        if (newHeight > 0) setGridViewportHeight(newHeight);
      }
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [expanded, images.length]);

  const onGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setGridScrollTop(e.currentTarget.scrollTop);
  };

  const hasGridMeasurement = gridViewportWidth > 0 && gridViewportHeight > 0;
  const fallbackColumns = Math.max(1, Math.ceil(Math.sqrt(Math.max(images.length, 1))));
  // 根据容器宽度估算列数与单元尺寸（保持方形）
  const gridColumns = hasGridMeasurement
    ? Math.max(1, Math.floor((gridViewportWidth + GAP) / (ITEM_SIZE + GAP)))
    : fallbackColumns;
  const computedItemSize = hasGridMeasurement
    ? Math.max(1, Math.floor((gridViewportWidth - GAP * (gridColumns - 1)) / gridColumns))
    : ITEM_SIZE;
  const rowHeight = computedItemSize; // 方形
  const totalRows = Math.max(1, Math.ceil(images.length / gridColumns));
  const totalGridHeight = totalRows * rowHeight + Math.max(0, totalRows - 1) * GAP;
  const visibleRows = hasGridMeasurement
    ? Math.max(1, Math.ceil((gridViewportHeight || 1) / (rowHeight + GAP)))
    : totalRows;
  const firstVisibleRow = hasGridMeasurement
    ? Math.max(0, Math.floor(gridScrollTop / (rowHeight + GAP)) - GRID_BUFFER_ROWS)
    : 0;
  const lastVisibleRow = hasGridMeasurement
    ? Math.min(totalRows - 1, firstVisibleRow + visibleRows + GRID_BUFFER_ROWS * 2)
    : totalRows - 1;
  const firstVisibleIndex = hasGridMeasurement ? Math.min(images.length - 1, firstVisibleRow * gridColumns) : 0;
  const lastVisibleIndex = hasGridMeasurement
    ? Math.min(images.length - 1, (lastVisibleRow + 1) * gridColumns - 1)
    : images.length - 1;
  const gridTopSpacer = hasGridMeasurement
    ? Math.max(0, firstVisibleRow * rowHeight + Math.max(0, firstVisibleRow) * GAP)
    : 0;
  const gridVisibleBlockHeight = hasGridMeasurement
    ? (lastVisibleRow - firstVisibleRow + 1) * rowHeight + (lastVisibleRow - firstVisibleRow) * GAP
    : totalGridHeight;
  const gridBottomSpacer = hasGridMeasurement
    ? Math.max(0, totalGridHeight - gridTopSpacer - gridVisibleBlockHeight)
    : 0;

  return (
    <div
      className={cn(
        'relative h-[calc(var(--history-result-image-size)+var(--global-spacing)*2)] rounded-lg bg-slate-1 p-0',
        themeMode === 'border' && 'border border-input',
        themeMode === 'shadow' && 'shadow-around',
        className,
        modern
          ? 'w-[calc(var(--oem-vw)-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)*5)-320px)] max-w-[calc(var(--oem-vw)-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)))]'
          : onlyShowWorkbenchIcon
            ? density === 'compact'
              ? embedSidebar
                ? 'w-[calc(var(--oem-vw)-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)*5)-320px)] max-w-[calc(var(--oem-vw)-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)))]'
                : 'w-[calc(var(--oem-vw)-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)*5))] max-w-[calc(var(--oem-vw)-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)))]'
              : 'w-[calc(var(--oem-vw)-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)*6.5))] max-w-[calc(var(--oem-vw)-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)*3))]'
            : 'w-[calc(var(--oem-vw)-11rem-14rem-(var(--global-spacing)*3.5))] max-w-[calc(var(--oem-vw)-11rem-14rem-(var(--global-spacing)*3.5))]',
      )}
      ref={containerRef}
    >
      {/* 左侧展开/折叠按钮 */}
      <Button
        icon={expanded ? <Minimize2 /> : <Maximize2 />}
        variant="outline"
        size="icon"
        className="absolute left-global top-1/2 z-20 -translate-y-1/2"
        onClick={() => setExpanded((s) => !s)}
        disabled={images.length === 0}
      />

      {images.length > 0 ? (
        <div
          key="vines-history-content"
          className="flex size-full items-center justify-center gap-global-1/2 overflow-hidden p-global pl-[calc(var(--global-spacing)*2+2.25rem)]"
        >
          {!isUniImagePreview && (
            <ImagePreview
              images={images}
              position={position}
              onPositionChange={setPosition}
              onNext={() => {
                setPosition((position) => position + 1);
              }}
              onPrev={() => {
                setPosition((position) => position - 1);
              }}
              onClose={() => {
                setOpen(false);
              }}
              hasPrev={position > 0}
              hasNext={position < images.length - 1}
              open={open}
              setOpen={setOpen}
            />
          )}
          {/* <Button
            icon={<ArrowLeftIcon />}
            variant="outline"
            size="icon"
            ref={slideLeftRef}
            onClick={() => scrollByPage('left')}
          ></Button> */}
          <div
            ref={rowScrollRef}
            onScroll={onRowScroll}
            className={cn('max-w-full flex-1 overflow-x-hidden p-1', className)}
          >
            <div className="flex items-center" style={{ width: totalRowWidth }}>
              <div style={{ width: rowLeftSpacer, height: ITEM_SIZE }} />
              <div className="flex items-center" style={{ gap: GAP }}>
                {rowSlice.map((item, localIndex) => {
                  const index = rowFirstIndex + localIndex;
                  return (
                    <div
                      key={item.render.key}
                      className={cn(
                        'h-[var(--history-result-image-size)] w-[var(--history-result-image-size)] shrink-0 cursor-grab overflow-hidden rounded-md',
                      )}
                    >
                      {isUniImagePreview ? (
                        <UniImagePreviewWrapper
                          imageUrl={item.render.origin as string}
                          onClick={() => {
                            setPosition(index);
                          }}
                        >
                          <CarouselItemImage
                            image={item as ImagesResultWithOrigin}
                            index={index}
                            handleDragStart={handleDragStart}
                          />
                        </UniImagePreviewWrapper>
                      ) : (
                        <CarouselItemImage
                          image={item as ImagesResultWithOrigin}
                          index={index}
                          handleDragStart={handleDragStart}
                          onClick={() => {
                            setPosition(index);
                            setOpen(true);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ width: rowRightSpacer, height: ITEM_SIZE }} />
              <div ref={rowSentinelRef} className="h-1 w-1 shrink-0" />
            </div>
          </div>
          {/* <Button
            icon={<ArrowRightIcon />}
            variant="outline"
            size="icon"
            ref={slideRightRef}
            onClick={() => scrollByPage('right')}
          ></Button> */}
        </div>
      ) : (
        <div key="vines-history-empty" className="vines-center size-full flex-col gap-2">
          <ScanSearch size={48} />
          <div className="flex flex-col text-center">
            <h2 className="text-sm font-bold">{t('workbench.history.empty')}</h2>
          </div>
        </div>
      )}

      {/* 展开态：上方悬浮 Popup，网格&无限滚动 */}
      {expanded &&
        (typeof document !== 'undefined'
          ? createPortal(
              <div
                className={cn(
                  'rounded-lg bg-slate-1',
                  themeMode === 'border' && 'border border-input',
                  themeMode === 'shadow' && 'shadow-around',
                )}
                style={{
                  position: 'fixed',
                  left: expandedRect?.left ?? 0,
                  width: expandedRect?.width ?? window.innerWidth,
                  bottom: expandedRect?.bottomOffset ?? 0,
                  zIndex: 50, // 与 Dialog/Popover 同层级；靠“后挂载”覆盖画板 portal（也是 50）
                }}
              >
                <div
                  ref={popupScrollRef}
                  className="max-h-[calc(var(--oem-vh)*0.6)] overflow-y-auto p-global"
                  style={{ marginBottom: ITEM_SIZE }}
                  onScroll={onGridScroll}
                >
                  <div style={{ height: gridTopSpacer }} />
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                      gap: GAP,
                    }}
                  >
                    {images.slice(firstVisibleIndex, lastVisibleIndex + 1).map((item, sliceIdx) => {
                      const index = firstVisibleIndex + sliceIdx;
                      return (
                        <div key={item.render.key} className="aspect-square w-full overflow-hidden rounded-md">
                          {isUniImagePreview ? (
                            <UniImagePreviewWrapper
                              imageUrl={item.render.origin as string}
                              onClick={() => {
                                setPosition(index);
                              }}
                            >
                              <CarouselItemImage
                                image={item as ImagesResultWithOrigin}
                                index={index}
                                handleDragStart={handleDragStart}
                              />
                            </UniImagePreviewWrapper>
                          ) : (
                            <CarouselItemImage
                              image={item as ImagesResultWithOrigin}
                              index={index}
                              handleDragStart={handleDragStart}
                              onClick={() => {
                                setPosition(index);
                                setOpen(true);
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ height: gridBottomSpacer }} />
                  <div ref={gridSentinelRef} className="h-2 w-full" />
                </div>
                <div
                  className="absolute bottom-0 left-global flex items-center"
                  style={{ height: `calc(${ITEM_SIZE}px + (var(--global-spacing)*2))` }}
                >
                  <Button
                    icon={expanded ? <Minimize2 /> : <Maximize2 />}
                    variant="outline"
                    size="icon"
                    onClick={() => setExpanded((s) => !s)}
                    disabled={images.length === 0}
                  />
                </div>
              </div>,
              document.body,
            )
          : null)}
    </div>
  );
};

// 已不再使用的转换函数，移除

type ImagesResultWithOrigin = ImagesResult & {
  render: {
    origin: string;
  };
};

const HistoryResultOg = () => {
  const { teamId } = useVinesTeam();
  const { data: artifactPages, setSize, mutate: refreshArtifacts } = useInfiniteWorkflowAllArtifacts({ limit: 20 });

  const { data: oem } = useSystemConfig();
  const enableSystemImageThumbnail = get(oem, ['theme', 'imageThumbnail'], false);

  const lastTeamId = useRef<string | null>(null);
  useEffect(() => {
    if (teamId !== lastTeamId.current) {
      refreshArtifacts();
      lastTeamId.current = teamId;
    }
  }, [teamId, refreshArtifacts]);

  const artifacts = (artifactPages?.flat() ?? []).filter(Boolean) as WorkflowArtifactListItem[];

  const imageItems: ImagesResultWithOrigin[] = artifacts
    .filter((artifact) => artifact.type === 'image' && artifact.url)
    .map((artifact, index) => {
      const status = (artifact.status ?? 'COMPLETED') as VinesWorkflowExecutionType;
      const key = `artifact-${artifact.instanceId}-${index}`;
      return {
        status,
        startTime: artifact.startTime ?? 0,
        createTime: artifact.createdTimestamp ?? 0,
        updateTime: artifact.updateTime ?? 0,
        endTime: artifact.endTime ?? 0,
        instanceId: artifact.instanceId,
        workflowId: artifact.workflowId ?? '',
        input: [],
        output: [
          {
            key,
            type: 'image',
            data: artifact.url,
          },
        ],
        rawOutput: {
          artifactUrl: artifact.url,
          artifactType: artifact.type,
        },
        taskId: '',
        userId: artifact.userId ?? '',
        teamId: artifact.teamId ?? teamId ?? '',
        render: {
          type: 'image',
          data: artifact.url,
          origin: artifact.url,
          key,
          status,
        },
      } as ImagesResultWithOrigin;
    });

  const thumbImages: ImagesResultWithOrigin[] = imageItems.map((image) => {
    const url = image.render.origin as string;
    const thumbUrl = getThumbUrl(url, enableSystemImageThumbnail);
    return {
      ...image,
      render: {
        ...image.render,
        data: thumbUrl,
        origin: url,
      },
    };
  });

  return <HistoryResultInner loading={false} images={thumbImages} setSize={setSize} />;
};

export default function HistoryResultDefault() {
  return React.memo(HistoryResultOg);
}

export const HistoryResult = React.memo(HistoryResultOg);

const CarouselItemImage = React.memo(
  function CarouselItemImage({
    image,
    index,
    handleDragStart,
    onClick,
  }: {
    image: ImagesResultWithOrigin;
    index: number;
    handleDragStart: (e: React.DragEvent, item: ImagesResultWithOrigin, src: string) => void;
    onClick?: () => void;
  }) {
    const [currentSrc, setCurrentSrc] = useState(image.render.data as string);
    const [isInView, setIsInView] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const imgRef = useRef<HTMLImageElement>(null);

    // 只在进入视口后再做真实源可用性检查
    useEffect(() => {
      const el = imgRef.current;
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setIsInView(true);
            }
          }
        },
        { root: null, rootMargin: '200px', threshold: 0.01 },
      );
      io.observe(el);
      return () => io.disconnect();
    }, []);

    useAsyncEffect(async () => {
      if (!isInView) return;
      setIsLoading(true);
      // 检查缩略图是否可用，如果不可用则使用原图
      const thumbnailAvailable = await checkImageUrlAvailable(image.render.data as string);
      if (thumbnailAvailable) {
        setCurrentSrc(image.render.data as string);
      } else {
        // 缩略图不可用，检查原图
        const originalAvailable = await checkImageUrlAvailable(image.render.origin as string);
        if (originalAvailable) {
          setCurrentSrc(image.render.origin as string);
        }
      }
      setIsLoading(false);
    }, [image.render.data, image.render.origin, isInView]);

    return (
      <div className="relative h-full w-full">
        {isLoading && <div className="absolute inset-0 animate-pulse rounded-md bg-slate-3" />}
        <img
          ref={imgRef}
          draggable
          onPointerDown={(e) => e.stopPropagation()}
          onDragStart={(e) => handleDragStart(e, image, image.render.origin as string)}
          src={currentSrc}
          alt={typeof image.render.alt === 'string' ? image.render.alt : `Image ${index + 1}`}
          className={cn(
            'h-full w-full select-none object-contain transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
          )}
          onClick={onClick}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较函数，只有在关键属性变化时才重新渲染
    return prevProps.image.render.key === nextProps.image.render.key && prevProps.index === nextProps.index;
  },
);
