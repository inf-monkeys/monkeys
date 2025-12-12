import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/utils';

interface IVinesAbstractVideoProps {
  children: string;
  className?: string;
  autoPlay?: boolean;
}

export const VinesAbstractVideo: React.FC<IVinesAbstractVideoProps> = ({ children, className, autoPlay = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ratio, setRatio] = useState<number>(16 / 9);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState(false);

  // URL 变更时重置状态，避免卡片“缩放/跳动”
  useEffect(() => {
    setReady(false);
    setHovered(false);
    setRatio(16 / 9);
  }, [children]);

  const syncRatio = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const w = el.videoWidth || 0;
    const h = el.videoHeight || 0;
    if (w > 0 && h > 0) setRatio(w / h);
  }, []);

  const showFirstFrame = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (autoPlay) return;
    try {
      // 确保停在首帧：有些浏览器 currentTime=0 不触发渲染，用一个极小值更稳
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
  }, [autoPlay]);

  const handleLoadedMetadata = useCallback(() => {
    syncRatio();
  }, [syncRatio]);

  const handleLoadedData = useCallback(() => {
    setReady(true);
    syncRatio();
    showFirstFrame();
  }, [showFirstFrame, syncRatio]);

  const handleEnter = useCallback(() => {
    setHovered(true);
    const el = videoRef.current;
    if (!el) return;
    // hover 交互播放
    el.play().catch(() => {
      // ignore
    });
  }, []);

  const handleLeave = useCallback(() => {
    setHovered(false);
    const el = videoRef.current;
    if (!el) return;
    showFirstFrame();
  }, [showFirstFrame]);

  const controls = useMemo(() => {
    // 默认只展示首帧，hover 才显示控件/播放
    return autoPlay || hovered;
  }, [autoPlay, hovered]);

  return (
    <div
      className={cn('overflow-hidden rounded-md shadow', className)}
      style={{
        width: '100%',
        aspectRatio: `${ratio}`,
        background: '#0B1220',
        position: 'relative',
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <video
        ref={videoRef}
        src={children}
        // 不再默认自动播放；需要时仍可通过 props 开启
        autoPlay={autoPlay}
        // hover 播放时允许用户控制暂停/全屏等；非 hover 时隐藏控件避免“加载中导致缩放”
        controls={controls}
        // autoplay 需要 muted；hover 也保持静音避免突然出声（用户可在控件里手动开声音）
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedData}
        className="h-full w-full cursor-pointer object-contain"
      />

      {!ready && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
            pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.0))',
          }}
        >
          加载中…
        </div>
      )}
    </div>
  );
};
