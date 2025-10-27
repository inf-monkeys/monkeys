import { AssetRecordType, createShapeId, Editor, toRichText } from 'tldraw';

export interface PlaceholderInfo {
  appName: string;
  appIcon?: string;
  workflowId: string;
  instanceId: string;
}

/**
 * 从结果数据中提取文本内容
 * 如果是对象，提取第一个值；如果是字符串，直接返回
 */
function extractTextContent(resultData: any): string {
  if (typeof resultData === 'string') {
    // 处理转义的换行符
    return resultData.replace(/\\n/g, '\n');
  }
  
  if (typeof resultData === 'object' && resultData !== null) {
    // 获取第一个值
    const values = Object.values(resultData);
    if (values.length > 0 && typeof values[0] === 'string') {
      // 处理转义的换行符
      return values[0].replace(/\\n/g, '\n');
    }
    // 如果没有字符串值，返回JSON格式
    return JSON.stringify(resultData, null, 2);
  }
  
  return String(resultData);
}

/**
 * 生成占位图的Canvas图片（512x512）
 * 包含应用图标、加载动画效果、应用名称
 */
export async function generatePlaceholderImage(info: PlaceholderInfo): Promise<string> {
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }

  // 背景
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(0, 0, size, size);

  // 边框
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  // 绘制加载动画圆环
  const centerX = size / 2;
  const centerY = size / 2 - 40;
  const radius = 60;

  // 背景圆
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 6;
  ctx.stroke();

  // 加载圆弧（模拟旋转效果）
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, Math.PI / 2);
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 如果有图标URL，尝试绘制（但因为是异步的，这里简化处理）
  // 实际项目中可能需要预加载图标
  if (info.appIcon && info.appIcon.startsWith('http')) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const iconSize = 48;
          ctx.drawImage(img, centerX - iconSize / 2, centerY - iconSize / 2, iconSize, iconSize);
          resolve();
        };
        img.onerror = () => reject();
        img.src = info.appIcon!;
        // 超时处理
        setTimeout(() => reject(), 2000);
      });
    } catch {
      // 图标加载失败，跳过
    }
  } else {
    // 绘制默认图标（简单的方块）
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(centerX - 24, centerY - 24, 48, 48);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AI', centerX, centerY);
  }

  // 绘制应用名称
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(info.appName, centerX, centerY + radius + 30);

  // 绘制"生成中"文字
  ctx.fillStyle = '#6b7280';
  ctx.font = '18px sans-serif';
  ctx.fillText('生成中...', centerX, centerY + radius + 65);

  // 返回Base64图片
  return canvas.toDataURL('image/png');
}

/**
 * 在Tldraw编辑器中创建占位图shape
 * 返回创建的shapeId（字符串格式）
 */
export async function createPlaceholderShape(
  editor: Editor,
  info: PlaceholderInfo,
): Promise<string> {
  // 生成占位图
  const placeholderImageUrl = await generatePlaceholderImage(info);

  // 创建asset
  const assetId = AssetRecordType.createId();
  const size = 512;

  editor.createAssets([
    {
      id: assetId,
      type: 'image',
      typeName: 'asset',
      props: {
        name: `placeholder-${info.instanceId}`,
        src: placeholderImageUrl,
        mimeType: 'image/png',
        isAnimated: false,
        w: size,
        h: size,
      },
      meta: {},
    },
  ]);

  // 获取画板中心位置
  const viewport = editor.getViewportPageBounds();
  const x = viewport.center.x - size / 2;
  const y = viewport.center.y - size / 2;

  // 创建图像shape
  const shapeId = createShapeId();
  editor.createShape({
    id: shapeId,
    type: 'image',
    x,
    y,
    props: {
      assetId: assetId,
      w: size,
      h: size,
    },
    meta: {
      placeholderInstanceId: info.instanceId,
      isPlaceholder: true,
    },
  });

  return shapeId as string;
}

/**
 * 用实际结果更新占位图shape
 */
export async function updateShapeWithResult(
  editor: Editor,
  shapeId: string,
  resultType: string,
  resultData: any,
): Promise<void> {
  const shape = editor.getShape(shapeId as any);
  if (!shape) {
    console.warn('找不到占位图shape:', shapeId);
    return;
  }

  const type = resultType.toLowerCase();

  if (type === 'image' && typeof resultData === 'string') {
    // 图片结果：创建新的asset并更新shape
    try {
      // 获取图片尺寸
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = resultData;
      });

      const assetId = AssetRecordType.createId();
      editor.createAssets([
        {
          id: assetId,
          type: 'image',
          typeName: 'asset',
          props: {
            name: assetId,
            src: resultData,
            mimeType: 'image/png',
            isAnimated: false,
            w: img.width,
            h: img.height,
          },
          meta: {},
        },
      ]);

      // 更新shape
      editor.updateShape({
        id: shapeId as any,
        type: 'image',
        props: {
          assetId: assetId,
          w: img.width,
          h: img.height,
        },
        meta: {
          isPlaceholder: false,
        },
      });
    } catch (error) {
      console.error('更新图片shape失败:', error);
    }
  } else if (type === 'text' || type === 'string') {
    // 文本结果：删除占位图，创建文本shape
    const text = extractTextContent(resultData);
    
    try {
      // 获取占位图的位置（使用shape的x和y，不是bounds）
      const posX = shape.x;
      const posY = shape.y;
      
      // 删除占位图
      editor.deleteShape(shapeId as any);

      // 创建文本shape（使用tldraw的richText格式）
      // 注意：tldraw的文本shape不直接支持markdown渲染，但支持换行
      editor.createShape({
        type: 'text',
        x: posX,
        y: posY,
        props: {
          richText: toRichText(text),
          scale: 1,
          font: 'sans',
          size: 'm',
          color: 'black',
          autoSize: true,
        } as any,
      });
    } catch (error) {
      console.error('更新文本shape失败:', error);
    }
  } else if (type === 'video' && typeof resultData === 'string') {
    // 视频结果：创建视频asset
    try {
      const assetId = AssetRecordType.createId();
      const bounds = editor.getShapeGeometry(shape).bounds;

      editor.createAssets([
        {
          id: assetId,
          type: 'video',
          typeName: 'asset',
          props: {
            name: assetId,
            src: resultData,
            mimeType: 'video/mp4',
            isAnimated: true,
            w: 512,
            h: 512,
          },
          meta: {},
        },
      ]);

      editor.updateShape({
        id: shapeId as any,
        type: 'video' as any,
        props: {
          assetId: assetId,
          w: bounds.w,
          h: bounds.h,
        },
        meta: {
          isPlaceholder: false,
        },
      });
    } catch (error) {
      console.error('更新视频shape失败:', error);
    }
  } else {
    // 其他类型：转换为文本显示
    const text = extractTextContent(resultData);

    try {
      // 获取占位图的位置
      const posX = shape.x;
      const posY = shape.y;
      
      // 删除占位图
      editor.deleteShape(shapeId as any);

      // 创建文本shape来显示数据
      editor.createShape({
        type: 'text',
        x: posX,
        y: posY,
        props: {
          richText: toRichText(text),
          scale: 1,
          font: 'sans',
          size: 'm',
          color: 'black',
          autoSize: true,
        } as any,
      });
    } catch (error) {
      console.error('更新其他类型shape失败:', error);
    }
  }
}

