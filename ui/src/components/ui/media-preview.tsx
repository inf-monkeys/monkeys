import { cn } from '@/utils';
import { Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StepViewer } from './media-preview/step-viewer';

export interface MediaPreviewProps {
  src: string | string[];
  alt?: string;
  type?: 'image' | 'video' | '3d' | 'step' | 'auto';
  thumbnail?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  onViewAll?: () => void;
}

/**
 * 检测文件类型
 */
function detectMediaType(src: string): 'image' | 'video' | '3d' | 'step' | 'text' {
  const url = src.toLowerCase();

  // 文本文件格式
  if (url.match(/\.(txt|md|csv|json|xml|log|conf|ini|yaml|yml)$/)) {
    return 'text';
  }

  // CAD STEP 格式
  if (url.match(/\.(step|stp)$/)) {
    return 'step';
  }

  // 3D 模型格式
  if (url.endsWith('.glb') || url.endsWith('.gltf')) {
    return '3d';
  }

  // 视频格式
  if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/)) {
    return 'video';
  }

  // 默认为图片
  return 'image';
}

export function MediaPreview({
  src,
  alt = 'Media preview',
  type = 'auto',
  thumbnail,
  className,
  aspectRatio = 'square',
  onViewAll,
}: MediaPreviewProps) {
  // 处理数组类型的 src，使用第一个作为主图
  const srcArray = Array.isArray(src) ? src : [src];
  const primarySrc = srcArray[0];
  const hasMultiple = srcArray.length > 1;

  const mediaType = type === 'auto' ? detectMediaType(primarySrc) : type;

  // 动态加载 model-viewer 脚本
  useEffect(() => {
    if (mediaType === '3d' && !customElements.get('model-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, [mediaType]);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  };

  const containerClass = cn(
    'w-full overflow-hidden bg-muted',
    aspectClasses[aspectRatio],
    // 在卡片视图中限制最大高度
    aspectRatio === 'square' && 'max-h-[300px]',
    className
  );

  // 图片预览
  if (mediaType === 'image') {
    return (
      <div className={cn(containerClass, 'relative group')}>
        <img
          src={primarySrc}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* 多图角标 */}
        {hasMultiple && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{srcArray.length}</span>
          </div>
        )}
        {/* 点击查看全部的提示 */}
        {hasMultiple && onViewAll && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={onViewAll}
          >
            <div className="bg-white/90 px-4 py-2 rounded-lg text-sm font-medium">
              查看全部 {srcArray.length} 张图片
            </div>
          </div>
        )}
      </div>
    );
  }

  // 视频预览
  if (mediaType === 'video') {
    return (
      <div className={cn(containerClass, 'relative group')}>
        {/* 视频播放器 */}
        <video
          src={primarySrc}
          poster={thumbnail}
          controls
          preload="metadata"
          className="w-full h-full object-cover"
        >
          您的浏览器不支持视频播放
        </video>

        {/* 播放图标覆盖层（仅在没有开始播放时显示） */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-900 ml-1" />
          </div>
        </div>
      </div>
    );
  }

  // 3D 模型预览
  if (mediaType === '3d') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isModelLoaded, setIsModelLoaded] = useState(false);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const handleLoad = () => setIsModelLoaded(true);
      const modelViewer = document.querySelector(`model-viewer[src="${primarySrc}"]`);

      if (modelViewer) {
        modelViewer.addEventListener('load', handleLoad);
        return () => modelViewer.removeEventListener('load', handleLoad);
      }
    }, [primarySrc]);

    // 在卡片视图中使用固定宽高比，在详情页使用固定高度
    const use3DCardMode = aspectRatio === 'square';
    const containerStyle = use3DCardMode
      ? { maxHeight: '300px' }
      : { minHeight: '400px' };
    const innerDivClass = use3DCardMode
      ? "relative w-full h-full"
      : "relative w-full h-full min-h-[400px]";
    const modelStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      position: 'relative',
      zIndex: 1,
    };

    if (!use3DCardMode) {
      modelStyle.minHeight = '400px';
    }

    return (
      <div className={containerClass} style={containerStyle}>
        <div className={innerDivClass}>
          {/* 加载提示 - 只在未加载完成时显示 */}
          {!isModelLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
              <div className="text-center">
                <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm text-muted-foreground">加载 3D 模型...</p>
              </div>
            </div>
          )}

          {/* 3D 模型查看器 */}
          <model-viewer
            src={primarySrc}
            alt={alt}
            poster={thumbnail}
            loading="lazy"
            camera-controls
            auto-rotate
            interaction-prompt="auto"
            style={modelStyle}
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  // STEP CAD 模型预览
  if (mediaType === 'step') {
    return (
      <StepViewer
        src={primarySrc}
        alt={alt}
        className={className}
        aspectRatio={aspectRatio}
      />
    );
  }

  // 不支持的类型
  return (
    <div className={cn(containerClass, 'flex items-center justify-center')}>
      <p className="text-sm text-muted-foreground">不支持的媒体格式</p>
    </div>
  );
}
