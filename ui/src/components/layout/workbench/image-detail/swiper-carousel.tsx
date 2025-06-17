import { useEffect, useRef, useState } from 'react';

import { useAsyncEffect } from 'ahooks';
import { Pagination } from 'swiper/modules';
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
import 'swiper/css/pagination';

interface ImagesCarouselProps {
  className?: string;
}

const SwiperModules = [Pagination];
export const ImagesCarousel: React.FC<ImagesCarouselProps> = ({ className }) => {
  const thumbImages = useThumbImages();
  const setPosition = useSetExecutionPosition();
  const position = useExecutionPosition();
  const containerRef = useRef<HTMLDivElement>(null);
  const [slidesPerView, setSlidesPerView] = useState(1);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

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

  // 监听 position 变化，控制 swiper 滚动到指定位置
  useEffect(() => {
    if (swiperInstance && position !== undefined && position >= 0) {
      swiperInstance.slideTo(position);
    }
  }, [position, swiperInstance]);

  // 处理点击缩略图
  const handleThumbnailClick = (index: number) => {
    setPosition(index);
  };

  // 确保数据存在且有效
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
        slidesPerView={slidesPerView}
        // pagination={{
        //   clickable: true,
        //   dynamicBullets: true,
        // }}
        className={cn('h-full w-full', className)}
        onSlideChange={() => console.log('slide change')}
        onSwiper={(swiper) => {
          setSwiperInstance(swiper);
          console.log(swiper);
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

function CarouselItemList() {
  const position = useExecutionPosition();
  const setPosition = useSetExecutionPosition();
  const thumbImages = useThumbImages();

  // useEffect(() => {
  //   if (position !== undefined) {
  //     carouselApi.scrollTo(position);
  //   }
  // }, [carouselApi, position]);

  // 如果只有一张图片或没有图片，不显示 carousel
  // if (!thumbImages || thumbImages.length <= 1) {
  //   return null;
  // }

  // 处理点击缩略图
  const handleThumbnailClick = (index: number) => {
    if (index === position) return;
    setPosition(index);
  };

  return thumbImages.map((image, index) => {
    return (
      <SwiperSlide
        style={{
          width: 80,
          height: '100%',
        }}
        virtualIndex={index}
        key={image.render.key || index}
        className="flex items-center hover:cursor-pointer"
        onClick={() => handleThumbnailClick(index)}
      >
        <CarouselItemImage image={image} index={index} />
      </SwiperSlide>
    );
  });
}

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
      onError={(e) => {
        console.log('Image load error:', e);
      }}
    />
  );
}
