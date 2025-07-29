import { useEffect, useRef, useState } from 'react';

import { useAsyncEffect } from 'ahooks';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { Mousewheel, Navigation, Virtual } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { Button } from '@/components/ui/button';
import { checkImageUrlAvailable } from '@/components/ui/vines-image/utils';
import { cn } from '@/utils';

import 'swiper/css';
import 'swiper/css/mousewheel';
import 'swiper/css/navigation';
import 'swiper/css/virtual';

interface CarouselProps {
  className?: string;
  images: Array<{
    render?: {
      data: string;
      key?: string;
      origin: string;
    };
    instanceId: string;
  }>;
  position: number;
  onPositionChange: (position: number) => void;
}

const SwiperModules = [Virtual, Mousewheel, Navigation];

export const Carousel: React.FC<CarouselProps> = ({ className, images, position, onPositionChange }) => {
  const { data: oem } = useSystemConfig();
  const imagePreviewStyle: ISystemConfig['theme']['imagePreviewStyle'] = oem?.theme.imagePreviewStyle ?? 'simple';

  const [slidesPerView, setSlidesPerView] = useState(1);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  const slideLeftRef = useRef<HTMLButtonElement>(null);
  const slideRightRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (swiperInstance && position !== undefined && position >= 0) {
      swiperInstance.slideTo(position);
    }
  }, [position, swiperInstance]);

  const handleThumbnailClick = (index: number) => {
    onPositionChange(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className="flex h-24 w-full items-center justify-center overflow-hidden">
        <span className="text-sm text-gray-500">No images</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="justify-content flex h-24 items-center gap-global-1/2 overflow-hidden">
      {imagePreviewStyle === 'normal' && (
        <Button icon={<ArrowLeftIcon />} variant="outline" size="icon" ref={slideLeftRef}></Button>
      )}

      <Swiper
        spaceBetween={12}
        slidesPerGroup={3}
        direction={'horizontal'}
        modules={SwiperModules}
        freeMode={false}
        grabCursor={false}
        allowTouchMove={false}
        mousewheel={{
          forceToAxis: false,
          releaseOnEdges: true,
          sensitivity: 2000,
          thresholdDelta: 0.2,
          thresholdTime: 10,
          enabled: true,
        }}
        virtual
        slidesPerView={slidesPerView}
        initialSlide={position}
        className={cn('h-full w-full', className)}
        onSwiper={(swiper) => {
          setSwiperInstance(swiper);
          if (position !== undefined && position >= 0) {
            setTimeout(() => swiper.slideTo(position, 0), 0); // 0ms 无动画
          }
        }}
        navigation={{
          prevEl: slideLeftRef.current,
          nextEl: slideRightRef.current,
        }}
      >
        {images.map((image, index) => (
          <SwiperSlide
            key={`slide-${image.render?.key || index}`}
            style={{
              width: 80,
              height: '100%',
            }}
            className={cn(
              'flex items-center rounded-lg hover:cursor-pointer',
              imagePreviewStyle === 'normal' && index === position ? 'border-[2px] border-vines-500' : 'p-[2px]',
            )}
            onClick={() => handleThumbnailClick(index)}
          >
            <CarouselItemImage image={image} />
          </SwiperSlide>
        ))}
      </Swiper>
      {imagePreviewStyle === 'normal' && (
        <Button icon={<ArrowRightIcon />} variant="outline" size="icon" ref={slideRightRef}></Button>
      )}
    </div>
  );
};

interface CarouselItemImageProps {
  image: {
    render?: {
      data: string;
      key?: string;
      origin: string;
    };
    instanceId: string;
  };
}

function CarouselItemImage({ image }: CarouselItemImageProps) {
  const [shouldUseThumbnail, setShouldUseThumbnail] = useState(true);

  useAsyncEffect(async () => {
    if (!image.render?.data) return;
    const res = await checkImageUrlAvailable(image.render.data);
    // console.log(res);
    setShouldUseThumbnail(res);
  }, [image]);

  if (!image.render?.data || !image.render?.origin) {
    return null;
  }

  return (
    <img
      src={shouldUseThumbnail ? image.render.data : image.render.origin}
      alt={`Thumbnail`}
      className="size-full flex-shrink-0 rounded-md border object-cover"
      loading="lazy"
    />
  );
}
