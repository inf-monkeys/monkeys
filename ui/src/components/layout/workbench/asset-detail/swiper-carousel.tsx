import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { Mousewheel, Navigation, Virtual } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import {
  Vines3DModelRenderModeContext,
  VinesAbstract3DModel,
} from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/3d-model';
import { Button } from '@/components/ui/button';
import { VinesMarkdown } from '@/components/ui/markdown';
import {
  useExecutionAssetPosition,
  useExecutionAssets,
  useSetExecutionAssetPosition,
} from '@/store/useExecutionAssetResultStore';
import { cn } from '@/utils';
import { detectAssetPreview } from '@/utils/asset-preview';

import 'swiper/css';
import 'swiper/css/mousewheel';
import 'swiper/css/navigation';

const SwiperModules = [Virtual, Mousewheel, Navigation];

function safeStringify(data: any) {
  try {
    return typeof data === 'string' ? data : JSON.stringify(data);
  } catch {
    return String(data ?? '');
  }
}

export const AssetsCarousel: React.FC<{ className?: string }> = ({ className }) => {
  const assets = useExecutionAssets();
  const position = useExecutionAssetPosition();
  const setPosition = useSetExecutionAssetPosition();
  const [slidesPerView, setSlidesPerView] = useState(1);
  const slideLeftRef = useRef<HTMLButtonElement>(null);
  const slideRightRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  const calculateSlidesPerView = (containerWidth: number) => {
    const slideWidth = 120;
    const spaceBetween = 12;
    const calculated = Math.floor((containerWidth + spaceBetween) / (slideWidth + spaceBetween));
    return Math.max(1, Math.min(calculated, assets?.length || 1));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setSlidesPerView(calculateSlidesPerView(width));
      }
    });
    resizeObserver.observe(container);

    const initialWidth = container.offsetWidth;
    if (initialWidth > 0) setSlidesPerView(calculateSlidesPerView(initialWidth));

    return () => resizeObserver.disconnect();
  }, [assets?.length]);

  useEffect(() => {
    if (swiperInstance && position !== undefined && position >= 0) swiperInstance.slideTo(position);
  }, [position, swiperInstance]);

  if (!assets || assets.length === 0) return null;

  return (
    <div ref={containerRef} className={cn('flex h-24 items-center gap-global-1/2 overflow-hidden', className)}>
      <Button icon={<ArrowLeftIcon />} variant="outline" size="icon" ref={slideLeftRef} />
      <Swiper
        spaceBetween={12}
        slidesPerGroup={3}
        direction="horizontal"
        modules={SwiperModules}
        freeMode
        grabCursor
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
        className={cn('size-full')}
        onSwiper={(swiper) => {
          setSwiperInstance(swiper);
          if (position !== undefined && position >= 0) setTimeout(() => swiper.slideTo(position, 0), 0);
        }}
        navigation={{
          prevEl: slideLeftRef.current,
          nextEl: slideRightRef.current,
        }}
      >
        {assets.map((item, index) => (
          <SwiperSlide
            key={`asset-slide-${item.render.key || index}`}
            style={{ width: 120, height: '100%' }}
            className={cn(
              'flex items-center rounded-lg p-[2px] hover:cursor-pointer',
              index === position ? 'border-[2px] border-vines-500' : 'border border-border',
            )}
            onClick={() => setPosition(index)}
          >
            <AssetThumb item={item} />
          </SwiperSlide>
        ))}
      </Swiper>
      <Button icon={<ArrowRightIcon />} variant="outline" size="icon" ref={slideRightRef} />
    </div>
  );
};

function AssetThumb({ item }: { item: any }) {
  const preview = useMemo(() => {
    const detected = detectAssetPreview(item?.render?.type, item?.render?.data);
    return {
      ...detected,
      text: detected.text ?? safeStringify(item?.render?.data ?? ''),
    };
  }, [item]);

  return (
    // 去掉顶部文字与 icon，让缩略图像图片一样只展示内容（预览交互不变）
    <div className="relative h-full w-full overflow-hidden rounded-md border border-border bg-[#F8FAFC] dark:bg-[#111113]">
        {preview.type === 'video' && preview.url ? (
          <VideoThumbnail url={preview.url} />
        ) : preview.type === '3d' && preview.url ? (
          <Vines3DModelRenderModeContext.Provider value="list">
            {/* 3D 缩略：内部按 200px 生成缩略图，但在小卡片里居中缩放，避免“白屏/裁切” */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                style={{
                  width: 220,
                  height: 200,
                  transform: 'scale(0.95)',
                  transformOrigin: 'center center',
                }}
              >
                <VinesAbstract3DModel>{preview.url}</VinesAbstract3DModel>
              </div>
            </div>
          </Vines3DModelRenderModeContext.Provider>
        ) : (
          <div className="absolute inset-0 overflow-hidden p-2">
            <div className="line-clamp-6 text-[11px] leading-snug text-foreground">
              <VinesMarkdown className="max-w-full [&_*]:text-[11px]">{preview.text}</VinesMarkdown>
            </div>
          </div>
        )}
    </div>
  );
}

function VideoThumbnail({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
  }, [url]);

  const showFirstFrame = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    try {
      el.pause();
      if (Number.isFinite(el.duration) && el.duration > 0) {
        el.currentTime = 0.01;
      } else {
        el.currentTime = 0;
      }
      el.pause();
    } catch {
      // ignore
    }
  }, []);

  const handleLoadedData = useCallback(() => {
    setReady(true);
    showFirstFrame();
  }, [showFirstFrame]);

  return (
    <div className="absolute inset-0 bg-[#0B1220]">
      <video
        ref={videoRef}
        src={url}
        muted
        playsInline
        preload="metadata"
        onLoadedData={handleLoadedData}
        className="h-full w-full object-cover"
      />
      {!ready && <div className="absolute inset-0 bg-black/20" />}
    </div>
  );
}


