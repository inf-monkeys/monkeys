import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { Mousewheel, Navigation, Virtual } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { useInfiniteWorkflowExecutionAllOutputs } from '@/apis/workflow/execution/output';
import { Button } from '@/components/ui/button';
import { VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings';
import { ImagesResult } from '@/store/useExecutionImageResultStore';
import { cn } from '@/utils';
import { IVinesExecutionResultItem } from '@/utils/execution';

import 'swiper/css';
import 'swiper/css/mousewheel';
import 'swiper/css/navigation';
import 'swiper/css/virtual';

const SwiperModules = [Virtual, Mousewheel, Navigation];
const SLIDE_THRESHOLD = 10;
interface HistoryResultProps {
  loading: boolean;
  images: IVinesExecutionResultItem[];
  isMiniFrame?: boolean;
  className?: string;
  setSize: Dispatch<SetStateAction<number>>;
}

const HistoryResultInner: React.FC<HistoryResultProps> = ({ loading, images, isMiniFrame, className, setSize }) => {
  const [slidesPerView, setSlidesPerView] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算 slidesPerView 的函数
  const calculateSlidesPerView = (containerWidth: number) => {
    const slideWidth = 90; // slide width
    const spaceBetween = 12; // space between
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
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.render.key);
  };

  const slideLeftRef = useRef<HTMLButtonElement>(null);
  const slideRightRef = useRef<HTMLButtonElement>(null);

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
        allowTouchMove={false}
        spaceBetween={12}
        direction={'horizontal'}
        modules={SwiperModules}
        freeMode={false}
        grabCursor={false}
        slidesPerGroup={3}
        mousewheel={{
          forceToAxis: false,
          releaseOnEdges: true,
          sensitivity: 2000,
          thresholdDelta: 0.2,
          thresholdTime: 10,
          enabled: true,
        }}
        navigation={{
          prevEl: slideLeftRef.current,
          nextEl: slideRightRef.current,
        }}
        slidesPerView={slidesPerView}
        onSlideChange={(swiper) => {
          // 当滑动到接近最后几个slide时触发加载
          // 提前3个slide开始加载
          if (swiper.activeIndex + slidesPerView >= images.length - SLIDE_THRESHOLD) {
            console.log('requesting more');

            setSize((size) => size + 1);
          }
        }}
        className={cn('h-full w-full', className)}
        onSwiper={(swiper) => {}}
      >
        {images.length > 0 ? (
          images.map((item, index) => (
            <SwiperSlide key={item.render.key} className={cn('basis-auto')}>
              <div className={cn('h-[90px] w-[90px] cursor-move overflow-hidden rounded-md')}>
                {item.render.type === 'image' && (
                  <img
                    draggable
                    onPointerDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => handleDragStart(e, item)}
                    src={item.render.data as string}
                    alt={typeof item.render.alt === 'string' ? item.render.alt : `Image ${index + 1}`}
                    className="h-full w-full select-none object-cover"
                  />
                )}
              </div>
            </SwiperSlide>
          ))
        ) : (
          <></>
        )}
        {/* <CarouselPrevious className="h-8.5 w-9.5 absolute -left-8 top-1/2 -translate-y-1/2 rounded-md border border-slate-300 bg-white px-2.5" />
        <CarouselNext className="h-8.5 w-9.5 absolute -right-8 top-1/2 -translate-y-1/2 rounded-md border border-slate-300 bg-white px-2.5" /> */}
      </Swiper>
      <Button
        icon={<ArrowLeftIcon />}
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2"
        ref={slideLeftRef}
      ></Button>
      <Button
        icon={<ArrowRightIcon />}
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2"
        ref={slideRightRef}
      ></Button>
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
  const { data: imagesResult, setSize } = useInfiniteWorkflowExecutionAllOutputs({ limit: 20 });
  /*   const { data: imagesResult, setSize } = useInfinitaeWorkflowExecutionOutputs('67f4e64da6376c12a3b95f9a', {
    limit: 30,
  }); */
  // const { dataa}

  if (!imagesResult) return null;
  console.log('imagesResult', imagesResult);

  // @ts-ignore
  const images = convertInfiniteDataToNormal(imagesResult);

  console.log('images', images);

  return <HistoryResultInner loading={false} images={images} isMiniFrame={false} setSize={setSize} />;
};

export default function HistoryResultDefault() {
  return React.memo(HistoryResultOg);
}

export const HistoryResult = React.memo(HistoryResultOg);
