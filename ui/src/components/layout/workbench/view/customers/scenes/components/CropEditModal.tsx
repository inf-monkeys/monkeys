import React, { useCallback, useEffect, useRef, useState } from 'react';

interface CropEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image?: string | null;
  onCropComplete?: (croppedImage: Blob) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

export const CropEditModal: React.FC<CropEditModalProps> = ({
  open,
  onOpenChange,
  image,
  onCropComplete,
}) => {
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [imageBounds, setImageBounds] = useState<ImageBounds>({ x: 0, y: 0, width: 0, height: 0, scale: 1 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [leftBtnHover, setLeftBtnHover] = useState(false);
  const [rightBtnHover, setRightBtnHover] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const CONTAINER_WIDTH = 800;
  const CONTAINER_HEIGHT = 500;
  const MIN_SIZE = 50;

  // 计算图片在容器中的实际显示位置和大小
  const calculateImageBounds = useCallback((imgWidth: number, imgHeight: number) => {
    const containerAspect = CONTAINER_WIDTH / CONTAINER_HEIGHT;
    const imageAspect = imgWidth / imgHeight;

    let displayWidth: number;
    let displayHeight: number;

    if (imageAspect > containerAspect) {
      // 图片更宽，以宽度为准
      displayWidth = CONTAINER_WIDTH;
      displayHeight = CONTAINER_WIDTH / imageAspect;
    } else {
      // 图片更高，以高度为准
      displayHeight = CONTAINER_HEIGHT;
      displayWidth = CONTAINER_HEIGHT * imageAspect;
    }

    const x = (CONTAINER_WIDTH - displayWidth) / 2;
    const y = (CONTAINER_HEIGHT - displayHeight) / 2;
    const scale = displayWidth / imgWidth;

    return { x, y, width: displayWidth, height: displayHeight, scale };
  }, []);

  // 图片加载完成后计算边界并初始化裁剪框
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const bounds = calculateImageBounds(img.naturalWidth, img.naturalHeight);
    setImageBounds(bounds);
    
    // 初始化裁剪框在图片中心，大小为图片的60%
    const cropWidth = Math.min(bounds.width * 0.6, bounds.width);
    const cropHeight = Math.min(bounds.height * 0.6, bounds.height);
    setCropArea({
      x: bounds.x + (bounds.width - cropWidth) / 2,
      y: bounds.y + (bounds.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
    setImageLoaded(true);
  }, [calculateImageBounds]);

  // 限制裁剪框在图片范围内
  const clampCropArea = useCallback((area: CropArea): CropArea => {
    const minX = imageBounds.x;
    const minY = imageBounds.y;
    const maxX = imageBounds.x + imageBounds.width;
    const maxY = imageBounds.y + imageBounds.height;

    let { x, y, width, height } = area;

    // 限制宽高不超过图片
    width = Math.min(width, imageBounds.width);
    height = Math.min(height, imageBounds.height);
    width = Math.max(width, MIN_SIZE);
    height = Math.max(height, MIN_SIZE);

    // 限制位置在图片范围内
    x = Math.max(minX, Math.min(x, maxX - width));
    y = Math.max(minY, Math.min(y, maxY - height));

    return { x, y, width, height };
  }, [imageBounds]);


  const handleRotateLeft = () => setRotation((prev) => Math.max(-180, prev - 90));
  const handleRotateRight = () => setRotation((prev) => Math.min(180, prev + 90));
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRotation(Number(e.target.value));
  };

  // 开始拖拽裁剪框
  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y });
  };

  // 开始调整大小
  const handleResizeMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop({ ...cropArea });
  };

  // 鼠标移动
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!imageLoaded) return;

      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setCropArea((prev) => clampCropArea({ ...prev, x: newX, y: newY }));
      } else if (resizeHandle) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        setCropArea(() => {
          let newX = initialCrop.x;
          let newY = initialCrop.y;
          let newWidth = initialCrop.width;
          let newHeight = initialCrop.height;

          const maxRight = imageBounds.x + imageBounds.width;
          const maxBottom = imageBounds.y + imageBounds.height;

          if (resizeHandle.includes('e')) {
            newWidth = Math.max(MIN_SIZE, Math.min(initialCrop.width + deltaX, maxRight - initialCrop.x));
          }
          if (resizeHandle.includes('w')) {
            const maxDelta = initialCrop.width - MIN_SIZE;
            const minDelta = imageBounds.x - initialCrop.x;
            const clampedDelta = Math.max(minDelta, Math.min(deltaX, maxDelta));
            newX = initialCrop.x + clampedDelta;
            newWidth = initialCrop.width - clampedDelta;
          }
          if (resizeHandle.includes('s')) {
            newHeight = Math.max(MIN_SIZE, Math.min(initialCrop.height + deltaY, maxBottom - initialCrop.y));
          }
          if (resizeHandle.includes('n')) {
            const maxDelta = initialCrop.height - MIN_SIZE;
            const minDelta = imageBounds.y - initialCrop.y;
            const clampedDelta = Math.max(minDelta, Math.min(deltaY, maxDelta));
            newY = initialCrop.y + clampedDelta;
            newHeight = initialCrop.height - clampedDelta;
          }

          return clampCropArea({ x: newX, y: newY, width: newWidth, height: newHeight });
        });
      }
    },
    [isDragging, resizeHandle, dragStart, initialCrop, imageLoaded, imageBounds, clampCropArea]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizeHandle(null);
  };

  // 重置状态当图片改变
  useEffect(() => {
    if (image) {
      setImageLoaded(false);
      setRotation(0);
    }
  }, [image]);

  const handleCrop = useCallback(async () => {
    if (!image || !canvasRef.current) {
      onOpenChange(false);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onOpenChange(false);
      return;
    }

    // 创建新的图片对象来避免跨域问题
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // 计算裁剪区域相对于原图的坐标
      const scaleX = img.naturalWidth / imageBounds.width;
      const scaleY = img.naturalHeight / imageBounds.height;
      
      const cropX = (cropArea.x - imageBounds.x) * scaleX;
      const cropY = (cropArea.y - imageBounds.y) * scaleY;
      const cropW = cropArea.width * scaleX;
      const cropH = cropArea.height * scaleY;

      canvas.width = cropW;
      canvas.height = cropH;

      ctx.save();
      if (rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      ctx.restore();

      canvas.toBlob((blob) => {
        if (blob && onCropComplete) {
          onCropComplete(blob);
        }
        onOpenChange(false);
      }, 'image/png');
    };

    img.onerror = () => {
      console.error('Failed to load image for cropping');
      onOpenChange(false);
    };

    img.src = image;
  }, [image, cropArea, rotation, imageBounds, onCropComplete, onOpenChange]);

  if (!open) return null;


  return (
    <>
      {/* 背景遮罩 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 999,
        }}
        onClick={() => onOpenChange(false)}
      />

      {/* 弹窗容器 */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1257,
          height: 744,
          borderRadius: 20,
          opacity: 1,
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), linear-gradient(129deg, rgba(23, 23, 23, 0) 71%, rgba(39, 77, 189, 0.715) 89%, #2D62FF 96%)',
          boxSizing: 'border-box',
          border: '1px solid rgba(49, 89, 209, 0.5)',
          backdropFilter: 'blur(50px)',
          zIndex: 1000,
        }}
      >
        {/* 标题 */}
        <div
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            opacity: 1,
            fontFamily: 'Alibaba PuHuiTi 2.0, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '22px',
            display: 'flex',
            alignItems: 'center',
            letterSpacing: '0.002em',
            color: '#FFFFFF',
          }}
        >
          编辑裁剪
        </div>

        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          style={{
            position: 'absolute',
            right: 12,
            top: 5,
            width: 40,
            height: 40,
            borderRadius: 50,
            opacity: 1,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4L12 12" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* 内容容器 - 裁切核心功能区域 */}
        <div
          style={{
            position: 'absolute',
            left: 13,
            top: 55,
            width: 1232,
            height: 618,
            borderRadius: 15,
            background: '#1A1B27',
            boxSizing: 'border-box',
            border: '1.5px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* 图片裁剪区域 */}
          <div
            ref={containerRef}
            style={{
              position: 'absolute',
              left: '50%',
              top: 20,
              transform: 'translateX(-50%)',
              width: CONTAINER_WIDTH,
              height: CONTAINER_HEIGHT,
              background: '#1A1B27',
              borderRadius: 10,
              overflow: 'hidden',
              userSelect: 'none',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 图片 */}
            {image && (
              <img
                ref={imageRef}
                src={image}
                alt="crop"
                onLoad={handleImageLoad}
                style={{
                  position: 'absolute',
                  left: imageBounds.x,
                  top: imageBounds.y,
                  width: imageBounds.width || 'auto',
                  height: imageBounds.height || 'auto',
                  maxWidth: CONTAINER_WIDTH,
                  maxHeight: CONTAINER_HEIGHT,
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.2s',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
                draggable={false}
              />
            )}

            {/* 暗色遮罩层 */}
            {imageLoaded && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(26, 27, 39, 0.7)',
                  pointerEvents: 'none',
                  clipPath: `polygon(
                    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                    ${cropArea.x}px ${cropArea.y}px,
                    ${cropArea.x}px ${cropArea.y + cropArea.height}px,
                    ${cropArea.x + cropArea.width}px ${cropArea.y + cropArea.height}px,
                    ${cropArea.x + cropArea.width}px ${cropArea.y}px,
                    ${cropArea.x}px ${cropArea.y}px
                  )`,
                }}
              />
            )}

            {/* 裁剪框 */}
            {imageLoaded && (
              <div
                style={{
                  position: 'absolute',
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                  border: '2px solid #2C5EF5',
                  boxSizing: 'border-box',
                  cursor: 'move',
                }}
                onMouseDown={handleCropMouseDown}
              >
                {/* 四角拖拽点 */}
                {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
                  <div
                    key={corner}
                    onMouseDown={(e) => handleResizeMouseDown(e, corner)}
                    style={{
                      position: 'absolute',
                      width: 12,
                      height: 12,
                      background: '#2C5EF5',
                      borderRadius: 2,
                      ...(corner.includes('n') ? { top: -6 } : { bottom: -6 }),
                      ...(corner.includes('w') ? { left: -6 } : { right: -6 }),
                      cursor: `${corner}-resize`,
                    }}
                  />
                ))}

                {/* 边缘拖拽点 */}
                {(['n', 's', 'e', 'w'] as const).map((edge) => (
                  <div
                    key={edge}
                    onMouseDown={(e) => handleResizeMouseDown(e, edge)}
                    style={{
                      position: 'absolute',
                      background: '#2C5EF5',
                      borderRadius: 2,
                      ...(edge === 'n' && { top: -4, left: '50%', transform: 'translateX(-50%)', width: 24, height: 8, cursor: 'n-resize' }),
                      ...(edge === 's' && { bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 24, height: 8, cursor: 's-resize' }),
                      ...(edge === 'e' && { right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 24, cursor: 'e-resize' }),
                      ...(edge === 'w' && { left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 24, cursor: 'w-resize' }),
                    }}
                  />
                ))}
              </div>
            )}
          </div>


          {/* 底部工具栏 */}
          <div
            style={{
              position: 'absolute',
              left: 18,
              bottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {/* 旋转滑块 */}
            <div
              style={{
                width: 231,
                height: 40,
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
                gap: 5,
                background: '#31323D',
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 17,
                  opacity: 1,
                  zIndex: 0,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#FFFFFF',
                }}
              >
                角度
              </span>
              <style>
                {`
                  .crop-rotation-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #FFFFFF;
                    border: 3px solid #2C5EF5;
                    box-sizing: border-box;
                    cursor: pointer;
                  }
                  .crop-rotation-slider::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #FFFFFF;
                    border: 3px solid #2C5EF5;
                    box-sizing: border-box;
                    cursor: pointer;
                  }
                `}
              </style>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotation}
                onChange={handleSliderChange}
                className="crop-rotation-slider"
                style={{
                  flex: 1,
                  height: 4,
                  appearance: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              />
              <div
                style={{
                  width: 36,
                  height: 21,
                  borderRadius: 5,
                  opacity: 1,
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '2px 12px',
                  gap: 10,
                  background: 'rgba(0, 0, 0, 0.2)',
                  zIndex: 2,
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>
                  {rotation}°
                </span>
              </div>
            </div>

            {/* 旋转按钮容器 */}
            <div
              style={{
                width: 84,
                height: 40,
                display: 'flex',
                flexDirection: 'row',
                padding: 0,
                gap: 4,
              }}
            >
              {/* 左转90按钮 */}
              <button
                type="button"
                onClick={handleRotateLeft}
                onMouseEnter={() => setLeftBtnHover(true)}
                onMouseLeave={() => setLeftBtnHover(false)}
                style={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  borderRadius: '10px 2px 2px 10px',
                  background: leftBtnHover ? '#525365' : '#31323D',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 10,
                  gap: 5,
                  zIndex: leftBtnHover ? 1 : 0,
                }}
              >
                <div style={{ position: 'absolute', left: 10, top: 10, width: 20, height: 20, background: 'rgba(255, 255, 255, 0)' }}>
                  <svg style={{ position: 'absolute', left: '3.01px', top: '3.6px', width: '60.87%', height: '24.03%' }} viewBox="0 0 12.174540519714355 4.806125640869141" fill="none">
                    <path d="M6.6929665,0.0000022888185C8.8406134,0.0000022888185,10.819438,1.0194142,12.073554,2.7129433C12.242651,2.9414918,12.194456,3.2638466,11.965908,3.4329431C11.737359,3.6020393,11.415004,3.5538445,11.245907,3.3252962C10.179333,1.8799714,8.4892235,1.0277112,6.692966,1.0294136C4.9712014,1.0294136,3.3782601,1.8029431,2.2812014,3.1411781L2.165319,3.2864723L0.89178944,4.6417665C0.70675719,4.8409042,0.3987692,4.861825,0.18850727,4.689538C-0.021754457,4.517251,-0.06179161,4.2111611,0.097083472,3.9905899L0.14120121,3.9364724L1.3823779,2.6205902C2.6475039,0.96725541,4.6111259,-0.0017227173,6.6929665,0.0000022888185Z" fill="#EFEFEF" />
                  </svg>
                  <svg style={{ position: 'absolute', left: '3.01px', top: '4.29px', width: '66.91%', height: '63.48%' }} viewBox="0 0 13.382353782653809 12.695883750915527" fill="none">
                    <path d="M12.867647,5.4900002L2.5735297,5.4900002C2.2892654,5.4900002,2.0588236,5.7204413,2.0588236,6.0047059L2.0588236,12.181177C2.0588236,12.465294,2.2894118,12.695884,2.5735297,12.695884L12.867647,12.695884C13.151912,12.695884,13.382354,12.465442,13.382354,12.181177L13.382354,6.0047059C13.382355,5.7204423,13.151912,5.4900002,12.867647,5.4900002ZM12.352942,6.5194125L12.352942,11.666472L3.0882354,11.666472L3.0882354,6.519413L12.352942,6.5194125ZM0.51470584,0C0.77705902,0,0.99352932,0.19588242,1.0252943,0.45000002L1.0294119,0.51470608L1.0294119,3.0876472L3.6029413,3.0876472C3.865294,3.0876472,4.0817652,3.2841179,4.1135292,3.5382354L4.1176467,3.6029413C4.11763,3.8621743,3.9248238,4.0809398,3.6676469,4.1135292L3.6029413,4.1176467L0.51470584,4.1176467C0.25527477,4.1175928,0.036434937,3.9244683,0.0041175843,3.6670587L0,3.6023529L0,0.51411742C0,0.22999993,0.23058835,-3.8146973e-7,0.51470584,0Z" fill="#EFEFEF" />
                  </svg>
                </div>
              </button>

              {/* 右转90按钮 */}
              <button
                type="button"
                onClick={handleRotateRight}
                onMouseEnter={() => setRightBtnHover(true)}
                onMouseLeave={() => setRightBtnHover(false)}
                style={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  borderRadius: '2px 10px 10px 2px',
                  background: rightBtnHover ? '#525365' : '#31323D',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 10,
                  gap: 5,
                  zIndex: rightBtnHover ? 1 : 0,
                }}
              >
                <div style={{ position: 'absolute', left: 10, top: 10, width: 20, height: 20, background: 'rgba(255, 255, 255, 0)', transform: 'scaleX(-1)' }}>
                  <svg style={{ position: 'absolute', left: '3.01px', top: '3.6px', width: '60.87%', height: '24.03%' }} viewBox="0 0 12.174540519714355 4.806125640869141" fill="none">
                    <path d="M6.6929665,0.0000022888185C8.8406134,0.0000022888185,10.819438,1.0194142,12.073554,2.7129433C12.242651,2.9414918,12.194456,3.2638466,11.965908,3.4329431C11.737359,3.6020393,11.415004,3.5538445,11.245907,3.3252962C10.179333,1.8799714,8.4892235,1.0277112,6.692966,1.0294136C4.9712014,1.0294136,3.3782601,1.8029431,2.2812014,3.1411781L2.165319,3.2864723L0.89178944,4.6417665C0.70675719,4.8409042,0.3987692,4.861825,0.18850727,4.689538C-0.021754457,4.517251,-0.06179161,4.2111611,0.097083472,3.9905899L0.14120121,3.9364724L1.3823779,2.6205902C2.6475039,0.96725541,4.6111259,-0.0017227173,6.6929665,0.0000022888185Z" fill="#EFEFEF" />
                  </svg>
                  <svg style={{ position: 'absolute', left: '3.01px', top: '4.29px', width: '66.91%', height: '63.48%' }} viewBox="0 0 13.382353782653809 12.695883750915527" fill="none">
                    <path d="M12.867647,5.4900002L2.5735297,5.4900002C2.2892654,5.4900002,2.0588236,5.7204413,2.0588236,6.0047059L2.0588236,12.181177C2.0588236,12.465294,2.2894118,12.695884,2.5735297,12.695884L12.867647,12.695884C13.151912,12.695884,13.382354,12.465442,13.382354,12.181177L13.382354,6.0047059C13.382355,5.7204423,13.151912,5.4900002,12.867647,5.4900002ZM12.352942,6.5194125L12.352942,11.666472L3.0882354,11.666472L3.0882354,6.519413L12.352942,6.5194125ZM0.51470584,0C0.77705902,0,0.99352932,0.19588242,1.0252943,0.45000002L1.0294119,0.51470608L1.0294119,3.0876472L3.6029413,3.0876472C3.865294,3.0876472,4.0817652,3.2841179,4.1135292,3.5382354L4.1176467,3.6029413C4.11763,3.8621743,3.9248238,4.0809398,3.6676469,4.1135292L3.6029413,4.1176467L0.51470584,4.1176467C0.25527477,4.1175928,0.036434937,3.9244683,0.0041175843,3.6670587L0,3.6023529L0,0.51411742C0,0.22999993,0.23058835,-3.8146973e-7,0.51470584,0Z" fill="#EFEFEF" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 确定裁剪按钮 - 右下角 */}
        <button
          type="button"
          onClick={handleCrop}
          style={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            width: 227,
            height: 42,
            borderRadius: 10,
            opacity: 1,
            background: 'linear-gradient(0deg, rgba(40, 82, 173, 0.08), rgba(40, 82, 173, 0.08)), #2C5EF5',
            boxShadow: 'inset 4px 4px 8.7px 0px rgba(255, 255, 255, 0.25)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'Alibaba PuHuiTi 3.0, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              lineHeight: '16px',
              letterSpacing: '0em',
              fontVariationSettings: '"opsz" auto',
              fontFeatureSettings: '"kern" on',
              color: '#FFFFFF',
            }}
          >
            确定裁剪
          </span>
        </button>

        {/* 隐藏的 canvas 用于裁剪 */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </>
  );
};
