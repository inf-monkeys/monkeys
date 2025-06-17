import { useState } from 'react';

import { useAsyncEffect } from 'ahooks';
import { Pagination, Virtual } from 'swiper/modules';
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
import 'swiper/css/virtual';

interface ImagesCarouselProps {
  className?: string;
}

const SwiperModules = [Virtual, Pagination];
export const ImagesCarousel: React.FC<ImagesCarouselProps> = ({ className }) => {
  return (
    <div className="h-24 w-full overflow-hidden bg-slate-3">
      <Swiper
        spaceBetween={12}
        direction={'horizontal'}
        modules={SwiperModules}
        virtual
        slidesPerView={'auto'}
        freeMode={true}
        grabCursor={true}
        mousewheel={{
          forceToAxis: true,
        }}
        // pagination={{
        //   clickable: true,
        //   dynamicBullets: true,
        // }}
        className={cn('h-full w-full', className)}
        onSlideChange={() => console.log('slide change')}
        onSwiper={(swiper) => console.log(swiper)}
      >
        <CarouselItemList />
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
          width: 'auto',
          height: '100%',
        }}
        key={image.render.key || index}
        className="flex items-center hover:cursor-pointer"
        onClick={() => handleThumbnailClick(index)}
        virtualIndex={index}
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
      className="size-16 rounded-md border border-border object-cover"
      loading="lazy"
    />
  );
}
