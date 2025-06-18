import { useEffect, useRef, useState } from 'react';

import { useAsyncEffect } from 'ahooks';
import { Mousewheel, Virtual } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { checkImageUrlAvailable } from '@/components/ui/vines-image/utils';
import {
  ImagesResult,
  useExecutionImages,
  useExecutionPosition,
  useSetExecutionPosition,
} from '@/store/useExecutionImageResultStore';
import { useThumbImages } from '@/store/useExecutionImageTumbStore';
import { cn } from '@/utils';

import 'swiper/css';
import 'swiper/css/mousewheel';
import 'swiper/css/virtual';

interface ImagesCarouselProps {
  className?: string;
}

export const SwiperModules = [Virtual, Mousewheel];
export const ImagesCarousel: React.FC<ImagesCarouselProps> = ({ className }) => {
  const thumbImages = useThumbImages();
  const setPosition = useSetExecutionPosition();
  const position = useExecutionPosition();
  const [slidesPerView, setSlidesPerView] = useState(1);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  // 计算 slidesPerView 的函数
  const calculateSlidesPerView = (containerWidth: number) => {
    const slideWidth = 90; // 幻灯片宽度
    const spaceBetween = 12; // 间距
    const calculated = Math.floor((containerWidth + spaceBetween) / (slideWidth + spaceBetween));
    return Math.max(1, Math.min(calculated, thumbImages?.length || 1));
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
  }, [thumbImages?.length]);

  useEffect(() => {
    if (swiperInstance && position !== undefined && position >= 0) {
      swiperInstance.slideTo(position);
    }
  }, [position, swiperInstance]);

  const handleThumbnailClick = (index: number) => {
    setPosition(index);
  };

  if (!thumbImages || thumbImages.length === 0) {
    return (
      <div className="flex h-24 w-full items-center justify-center overflow-hidden">
        <span className="text-sm text-gray-500">No images</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-24 overflow-hidden">
      <Swiper
        spaceBetween={12}
        direction={'horizontal'}
        modules={SwiperModules}
        freeMode={true}
        grabCursor={true}
        mousewheel={{
          forceToAxis: true,
        }}
        virtual
        slidesPerView={slidesPerView}
        initialSlide={position}
        className={cn('h-full w-full', className)}
        onSwiper={(swiper) => {
          setSwiperInstance(swiper);
          if (position !== undefined && position >= 0) {
            setTimeout(() => swiper.slideTo(position, 0), 0); // 0ms 无动画
            // swiper.slideTo(position);
          }
        }}
      >
        {thumbImages.map((image, index) => (
          <SwiperSlide
            key={`slide-${image.render.key || index}`}
            style={{
              width: 80,
              height: '100%',
            }}
            className="flex items-center hover:cursor-pointer"
            onClick={() => handleThumbnailClick(index)}
          >
            <CarouselItemImage image={image} index={index} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

function CarouselItemImage({ image, index }: { image: ImagesResult; index: number }) {
  const [shouldUseThumbnail, setShouldUseThumbnail] = useState(true);
  const images = useExecutionImages();
  useAsyncEffect(async () => {
    const res = await checkImageUrlAvailable(image.render.data as string);
    setShouldUseThumbnail(res);
  }, [image]);

  return (
    <img
      src={shouldUseThumbnail ? (image.render.data as string) : (images[index].render.data as string)}
      alt={`Thumbnail`}
      className="size-[90px] flex-shrink-0 rounded-md border border-border object-cover"
      loading="lazy"
    />
  );
}
