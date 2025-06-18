import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import { useInViewport } from 'ahooks';
import { Swiper, SwiperSlide } from 'swiper/react';

import { useInfiniteWorkflowExecutionAllOutputs } from '@/apis/workflow/execution/output';
import { Card } from '@/components/ui/card';
import { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings';
import { ImagesResult } from '@/store/useExecutionImageResultStore';
import { cn } from '@/utils';
import { IVinesExecutionResultItem } from '@/utils/execution';

import { SwiperModules } from '../image-detail/swiper-carousel';

interface HistoryResultProps {
  loading: boolean;
  images: IVinesExecutionResultItem[];
  isMiniFrame?: boolean;
  className?: string;
  setSize: Dispatch<SetStateAction<number>>;
}

const HistoryResultInner: React.FC<HistoryResultProps> = ({ loading, images, isMiniFrame, className, setSize }) => {
  const [draggedItem, setDraggedItem] = useState<IVinesExecutionResultItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);
  const [inViewPort] = useInViewport(lastRef, {
    callback: () => {
      setSize((size) => size + 1);
    },
  });
  const [slidesPerView, setSlidesPerView] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

  // 计算 slidesPerView 的函数
  const calculateSlidesPerView = (containerWidth: number) => {
    const slideWidth = 90; // 幻灯片宽度
    const spaceBetween = 12; // 间距
    const calculated = Math.floor((containerWidth + spaceBetween) / (slideWidth + spaceBetween));
    return Math.max(1, Math.min(calculated, images?.length || 1));
  };
  // 监听容器宽度变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const newSlidesPerView = calculateSlidesPerView(width);
        setSlidesPerView(newSlidesPerView);
      }
    });

    resizeObserver.observe(container);

    // 初始计算
    const initialWidth = container.offsetWidth;
    if (initialWidth > 0) {
      setSlidesPerView(calculateSlidesPerView(initialWidth));
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [images?.length]);

  const handleDragStart = (e: React.DragEvent, item: IVinesExecutionResultItem) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.render.key);
    setDraggedItem(item);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedKey = e.dataTransfer.getData('text/plain');
    if (draggedKey && dragOverIndex !== null) {
      const newItems = [...images];
      const draggedIndex = newItems.findIndex((item) => item.render.key === draggedKey);
      if (draggedIndex !== -1) {
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);
        // TODO: Add callback to update parent state
      }
    }
    handleDragEnd();
  };

  const handleWatchDrag = useCallback(() => {
    return !isDragging;
  }, [isDragging]);
  return (
    <div
      className={cn(
        'relative col-span-5 mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-1 px-12 py-6 shadow-sm',
        isMiniFrame && 'mt-2',
        className,
      )}
      ref={containerRef}
      style={{
        width: window.innerWidth * 0.765,
        height: '140px',
      }}
    >
      <Swiper
        virtual
        spaceBetween={12}
        direction={'horizontal'}
        modules={SwiperModules}
        freeMode={true}
        grabCursor={true}
        mousewheel={{
          forceToAxis: true,
        }}
        slidesPerView={14}
        className={cn('h-full w-full', className)}
        onSwiper={(swiper) => {}}
      >
        {images.length > 0 ? (
          images.map((item, index) => (
            <SwiperSlide key={item.render.key} className={cn('basis-auto', dragOverIndex === index && '')}>
              <Card
                className={cn(
                  'h-[90px] w-[90px] cursor-move overflow-hidden',
                  draggedItem?.render.key === item.render.key && 'opacity-50',
                )}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
              >
                {item.render.type === 'image' && (
                  <img
                    src={item.render.data as string}
                    alt={typeof item.render.alt === 'string' ? item.render.alt : `Image ${index + 1}`}
                    className="h-full w-full select-none object-cover"
                  />
                )}
              </Card>
            </SwiperSlide>
          ))
        ) : (
          // <SwiperSlide className={cn('basis-auto', dragOverIndex === index && '')}>
          //   <div className="h-[90px] w-[90px] cursor-move overflow-hidden">
          //     <div className="h-full w-full bg-slate-100"></div>
          //   </div>
          // </SwiperSlide>
          <></>
        )}
        {/* <CarouselPrevious className="h-8.5 w-9.5 absolute -left-8 top-1/2 -translate-y-1/2 rounded-md border border-slate-300 bg-white px-2.5" />
        <CarouselNext className="h-8.5 w-9.5 absolute -right-8 top-1/2 -translate-y-1/2 rounded-md border border-slate-300 bg-white px-2.5" /> */}
        <SwiperSlide key={'last'}>
          <div ref={lastRef} draggable className="h-[90px] w-[90px] cursor-move overflow-hidden bg-red-800"></div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
};

const convertInfiniteDataToNormal = (data: VinesWorkflowExecutionOutputListItem[][] | undefined): ImagesResult[] => {
  if (!data) return [];
  return data.flat().flatMap((result) =>
    result.output.flatMap((item, index) => {
      const res = [];
      if (item.type === 'image') {
        // @ts-ignore
        res.push({
          ...item,
          render: {
            type: 'image',
            // data: getThumbUrl(item.data as string),
            data: item.data,
            key: result.instanceId + '-' + result.status + '-' + index,
          },
        });
      }
      return res;
    }),
  );
};

const HistoryResultOg = () => {
  const { data: imagesResult, setSize } = useInfiniteWorkflowExecutionAllOutputs({ limit: 10 });
  /*   const { data: imagesResult, setSize } = useInfinitaeWorkflowExecutionOutputs('67f4e64da6376c12a3b95f9a', {
    limit: 30,
  }); */
  // const { dataa}

  if (!imagesResult) return null;
  console.log('imagesResult', imagesResult);

  // @ts-ignore
  const images = convertInfiniteDataToNormal(imagesResult);

  return <HistoryResultInner loading={false} images={images} isMiniFrame={false} setSize={setSize} />;
};

export default function HistoryResultDefault() {
  return React.memo(HistoryResultOg);
}

export const HistoryResult = React.memo(HistoryResultOg);
