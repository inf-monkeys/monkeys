import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/utils';

export interface MediaPreviewProps {
  src: string;
  alt?: string;
  type?: 'image' | 'video' | '3d' | 'auto';
  thumbnail?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

/**
 * 检测文件类型
 */
function detectMediaType(src: string): 'image' | 'video' | '3d' {
  const url = src.toLowerCase();

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
}: MediaPreviewProps) {
  const mediaType = type === 'auto' ? detectMediaType(src) : type;

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
    className
  );

  // 图片预览
  if (mediaType === 'image') {
    return (
      <div className={containerClass}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // 视频预览
  if (mediaType === 'video') {
    return (
      <div className={cn(containerClass, 'relative group')}>
        {/* 视频播放器 */}
        <video
          src={src}
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
      const modelViewer = document.querySelector(`model-viewer[src="${src}"]`);

      if (modelViewer) {
        modelViewer.addEventListener('load', handleLoad);
        return () => modelViewer.removeEventListener('load', handleLoad);
      }
    }, [src]);

    // 根据 aspectRatio 决定是否使用固定最小高度
    const useFixedHeight = aspectRatio !== 'square';
    const innerDivClass = useFixedHeight ? "relative w-full h-full min-h-[400px]" : "relative w-full h-full";
    const modelStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      position: 'relative',
      zIndex: 1,
    };

    if (useFixedHeight) {
      modelStyle.minHeight = '400px';
    }

    return (
      <div className={containerClass} style={{ minHeight: aspectRatio === 'square' ? 'auto' : '400px' }}>
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
            src={src}
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

  // 不支持的类型
  return (
    <div className={cn(containerClass, 'flex items-center justify-center')}>
      <p className="text-sm text-muted-foreground">不支持的媒体格式</p>
    </div>
  );
}
