import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import { useAsyncEffect } from 'ahooks';
import { get } from 'lodash';
import { Maximize2, Minimize2, ScanSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { useInfiniteWorkflowExecutionAllOutputs } from '@/apis/workflow/execution/output';
import { ImagePreview } from '@/components/layout-wrapper/main/image-preview';
import { UniImagePreviewWrapper } from '@/components/layout-wrapper/main/uni-image-preview';
import { useVinesTeam } from '@/components/router/guard/team';
import { Button } from '@/components/ui/button';
import { checkImageUrlAvailable } from '@/components/ui/vines-image/utils';
import { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings';
import { useOnlyShowWorkbenchIcon } from '@/store/showWorkbenchIcon';
import { ImagesResult } from '@/store/useExecutionImageResultStore';
import { useEmbedSidebar } from '@/store/useGlobalViewStore';
import { cn } from '@/utils';
import { newConvertExecutionResultToItemList } from '@/utils/execution';

import { getThumbUrl } from '../../workspace/vines-view/form/execution-result/virtua/item/image';

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

  // 虚拟列表常量
  const ITEM_SIZE = 72; // 与样式保持一致的方形边长
  const GAP = 8;
  const ROW_BUFFER = 3; // 折叠态左右缓冲项目数
  const GRID_BUFFER_ROWS = 2; // 展开态上下缓冲行数

  // 折叠态：视口与滚动位置
  const [rowViewportWidth, setRowViewportWidth] = useState(0);
  const [rowScrollLeft, setRowScrollLeft] = useState(0);

  useEffect(() => {
    const el = rowScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setRowViewportWidth(el.clientWidth));
    ro.observe(el);
    setRowViewportWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const totalRowWidth = images.length * ITEM_SIZE + Math.max(0, images.length - 1) * GAP;
  const rowVisibleCount = Math.max(1, Math.ceil(rowViewportWidth / (ITEM_SIZE + GAP)));
  const rowFirstIndex = Math.max(0, Math.floor(rowScrollLeft / (ITEM_SIZE + GAP)) - ROW_BUFFER);
  const rowLastIndex = Math.min(images.length - 1, rowFirstIndex + rowVisibleCount + ROW_BUFFER * 2);
  const rowSlice = images.slice(rowFirstIndex, rowLastIndex + 1);
  const rowLeftSpacer = Math.max(0, rowFirstIndex * (ITEM_SIZE + GAP));
  const rowSliceWidth = rowSlice.length * ITEM_SIZE + Math.max(0, rowSlice.length - 1) * GAP;
  const rowRightSpacer = Math.max(0, totalRowWidth - rowLeftSpacer - rowSliceWidth);

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

  const handleDragStart = (e: React.DragEvent, item: ImagesResultWithOrigin, src: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.render.origin);
    e.dataTransfer.setData('text/uri-list', src);
  };

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

  const embedSidebar = useEmbedSidebar();

  // 展开态：滚动容器与 Sentinel
  const popupScrollRef = useRef<HTMLDivElement>(null);
  const gridSentinelRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const root = popupScrollRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => {
      setGridViewportWidth(root.clientWidth);
      setGridViewportHeight(root.clientHeight);
    });
    ro.observe(root);
    setGridViewportWidth(root.clientWidth);
    setGridViewportHeight(root.clientHeight);
    return () => ro.disconnect();
  }, [expanded]);

  const onGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setGridScrollTop(e.currentTarget.scrollTop);
  };

  // 根据容器宽度估算列数与单元尺寸（保持方形）
  const gridColumns = Math.max(1, Math.floor((gridViewportWidth + GAP) / (ITEM_SIZE + GAP)));
  const computedItemSize = Math.max(1, Math.floor((gridViewportWidth - GAP * (gridColumns - 1)) / gridColumns));
  const rowHeight = computedItemSize; // 方形
  const totalRows = Math.max(1, Math.ceil(images.length / gridColumns));
  const totalGridHeight = totalRows * rowHeight + Math.max(0, totalRows - 1) * GAP;
  const visibleRows = Math.max(1, Math.ceil((gridViewportHeight || 1) / (rowHeight + GAP)));
  const firstVisibleRow = Math.max(0, Math.floor(gridScrollTop / (rowHeight + GAP)) - GRID_BUFFER_ROWS);
  const lastVisibleRow = Math.min(totalRows - 1, firstVisibleRow + visibleRows + GRID_BUFFER_ROWS * 2);
  const firstVisibleIndex = Math.min(images.length - 1, firstVisibleRow * gridColumns);
  const lastVisibleIndex = Math.min(images.length - 1, (lastVisibleRow + 1) * gridColumns - 1);
  const gridTopSpacer = Math.max(0, firstVisibleRow * rowHeight + Math.max(0, firstVisibleRow) * GAP);
  const gridVisibleBlockHeight =
    (lastVisibleRow - firstVisibleRow + 1) * rowHeight + (lastVisibleRow - firstVisibleRow) * GAP;
  const gridBottomSpacer = Math.max(0, totalGridHeight - gridTopSpacer - gridVisibleBlockHeight);

  return (
    <div
      className={cn(
        'relative h-[calc(var(--history-result-image-size)+var(--global-spacing)*2)] rounded-lg bg-slate-1 p-0',
        themeMode === 'border' && 'border border-input',
        themeMode === 'shadow' && 'shadow-around',
        className,
        onlyShowWorkbenchIcon
          ? density === 'compact'
            ? embedSidebar
              ? 'w-[calc(100vw-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)*5)-320px)] max-w-[calc(100vw-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)))]'
              : 'w-[calc(100vw-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)*5))] max-w-[calc(100vw-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)))]'
            : 'w-[calc(100vw-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)*6.5))] max-w-[calc(100vw-var(--global-spacing)-var(--operation-bar-width)-1px-36px-(var(--global-spacing)*3))]'
          : 'w-[calc(100vw-11rem-14rem-(var(--global-spacing)*3.5))] max-w-[calc(100vw-11rem-14rem-(var(--global-spacing)*3.5))]',
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
                        <UniImagePreviewWrapper>
                          <CarouselItemImage
                            image={item as ImagesResultWithOrigin}
                            index={index}
                            handleDragStart={handleDragStart}
                            onClick={() => {
                              setPosition(index);
                            }}
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
      {expanded && (
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 z-[1000] rounded-lg bg-slate-1',
            themeMode === 'border' && 'border border-input',
            themeMode === 'shadow' && 'shadow-around',
          )}
        >
          <div
            ref={popupScrollRef}
            className="max-h-[60vh] overflow-y-auto p-global"
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
                      <UniImagePreviewWrapper>
                        <CarouselItemImage
                          image={item as ImagesResultWithOrigin}
                          index={index}
                          handleDragStart={handleDragStart}
                          onClick={() => {
                            setPosition(index);
                          }}
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
        </div>
      )}
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
  const { data: imagesResult, setSize, mutate: RefreshAll } = useInfiniteWorkflowExecutionAllOutputs({ limit: 20 });

  const lastTeamId = useRef<string | null>(null);
  useEffect(() => {
    if (teamId !== lastTeamId.current) {
      RefreshAll();
      lastTeamId.current = teamId;
    }
  }, [teamId]);

  const executionResultList = newConvertExecutionResultToItemList(
    (imagesResult?.flat() ?? []).filter(Boolean) as VinesWorkflowExecutionOutputListItem[],
  );
  const allImages = executionResultList.filter((item) => item.render.type.toLowerCase() === 'image');
  // const filerMap = new Map<string, any>();
  const thumbImages: ImagesResultWithOrigin[] = [];
  for (const image of allImages) {
    const url = image.render.data as string;
    const thumbUrl = getThumbUrl(url);

    thumbImages.push({ ...image, render: { ...image.render, data: thumbUrl, origin: url } } as ImagesResultWithOrigin);
  }

  return <HistoryResultInner loading={false} images={thumbImages} setSize={setSize} />;
};

export default function HistoryResultDefault() {
  return React.memo(HistoryResultOg);
}

export const HistoryResult = React.memo(HistoryResultOg);

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
  const [shouldUseThumbnail, setShouldUseThumbnail] = useState(true);
  const [isInView, setIsInView] = useState(false);
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
    const res = await checkImageUrlAvailable(image.render.data as string);
    setShouldUseThumbnail(res);
  }, [image, isInView]);

  return (
    <img
      ref={imgRef}
      draggable
      onPointerDown={(e) => e.stopPropagation()}
      onDragStart={(e) => handleDragStart(e, image, image.render.origin as string)}
      src={shouldUseThumbnail ? (image.render.data as string) : (image.render.origin as string)}
      alt={typeof image.render.alt === 'string' ? image.render.alt : `Image ${index + 1}`}
      className="h-full w-full select-none object-cover"
      onClick={onClick}
    />
  );
}
