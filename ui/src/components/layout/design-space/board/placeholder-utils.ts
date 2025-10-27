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
 * 生成占位图的Canvas图片（1536x1536）
 * 包含应用图标、应用名称、生成中状态
 */
export async function generatePlaceholderImage(info: PlaceholderInfo): Promise<string> {
  const canvas = document.createElement('canvas');
  const size = 1536;
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

  // 中心位置
  const centerX = size / 2;
  const centerY = size / 2;

  // 如果有图标URL，尝试绘制
  if (info.appIcon && info.appIcon.startsWith('http')) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const iconSize = 240;
          ctx.drawImage(img, centerX - iconSize / 2, centerY - 300, iconSize, iconSize);
          resolve();
        };
        img.onerror = () => reject();
        img.src = info.appIcon!;
        // 超时处理
        setTimeout(() => reject(), 2000);
      });
    } catch {
      // 图标加载失败，绘制默认图标
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(centerX - 120, centerY - 300, 240, 240);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 144px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AI', centerX, centerY - 180);
    }
  } else {
    // 绘制默认图标（简单的方块）
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(centerX - 120, centerY - 300, 240, 240);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 144px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AI', centerX, centerY - 180);
  }

  // 绘制应用名称（更大的字体）
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 108px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(info.appName, centerX, centerY + 60);

  // 绘制"生成中"文字（更大的字体）
  ctx.fillStyle = '#8b5cf6';
  ctx.font = 'bold 84px sans-serif';
  ctx.fillText('生成中...', centerX, centerY + 210);

  // 返回Base64图片
  return canvas.toDataURL('image/png');
}

/**
 * 在Tldraw编辑器中创建占位图shape
 * 返回创建的shapeId（字符串格式）
 * @param lastModifiedShapeId 最后修改的shape的ID，用于定位占位图位置
 */
export async function createPlaceholderShape(
  editor: Editor,
  info: PlaceholderInfo,
  lastModifiedShapeId?: string | null,
): Promise<string> {
  // 生成占位图
  const placeholderImageUrl = await generatePlaceholderImage(info);

  // 创建asset
  const assetId = AssetRecordType.createId();
  const size = 1536;

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

  // 获取占位图的位置：优先放在最后修改的形状右边，否则放在画板中心
  let x: number;
  let y: number;
  
  console.log('[占位图位置] 开始计算位置，lastModifiedShapeId:', lastModifiedShapeId);
  
  try {
    let targetShape: any = null;
    
    // 优先使用最后修改的shape
    if (lastModifiedShapeId) {
      try {
        const shape = editor.getShape(lastModifiedShapeId as any);
        if (shape) {
          targetShape = shape;
          console.log('[占位图位置] 找到最后修改的形状:', {
            shapeId: lastModifiedShapeId,
            shapeType: shape.type,
            'shape.x': shape.x,
            'shape.y': shape.y,
          });
        } else {
          console.warn('[占位图位置] lastModifiedShapeId存在但无法获取shape');
        }
      } catch (error) {
        console.warn('[占位图位置] 获取最后修改的形状失败:', error);
      }
    } else {
      console.log('[占位图位置] 没有lastModifiedShapeId');
    }
    
    // 如果没有最后修改的shape，尝试使用选中的shape
    if (!targetShape) {
      const selectedShapes = editor.getSelectedShapes();
      console.log('[占位图位置] 尝试使用选中的形状，数量:', selectedShapes.length);
      if (selectedShapes.length > 0) {
        targetShape = selectedShapes[selectedShapes.length - 1];
        console.log('[占位图位置] 使用选中的形状:', {
          shapeId: targetShape.id,
          shapeType: targetShape.type,
          'shape.x': targetShape.x,
          'shape.y': targetShape.y,
        });
      }
    }
    
    if (targetShape) {
      const bounds = editor.getShapeGeometry(targetShape).bounds;
      
      // 放在目标形状的右边，间距20px
      x = (targetShape.x || 0) + bounds.w + 20;
      y = targetShape.y || 0;
      
      console.log('[占位图位置] 计算结果 - 放在形状右边:', {
        targetShapeId: targetShape.id,
        'targetShape.x': targetShape.x,
        'targetShape.y': targetShape.y,
        'bounds.w': bounds.w,
        'bounds.h': bounds.h,
        '计算后的x': x,
        '计算后的y': y,
      });
    } else {
      // 没有可用的形状，使用画板中心
      const viewport = editor.getViewportPageBounds();
      x = viewport.center.x - size / 2;
      y = viewport.center.y - size / 2;
      
      console.log('[占位图位置] 没有可用形状，使用画板中心:', {
        'viewport.center.x': viewport.center.x,
        'viewport.center.y': viewport.center.y,
        size,
        '计算后的x': x,
        '计算后的y': y,
      });
    }
  } catch (error) {
    // 出错时fallback到画板中心
    console.error('[占位图位置] 计算位置时出错:', error);
    const viewport = editor.getViewportPageBounds();
    x = viewport.center.x - size / 2;
    y = viewport.center.y - size / 2;
    console.log('[占位图位置] 使用fallback位置（画板中心）:', { x, y });
  }

  // 创建图像shape
  const shapeId = createShapeId();
  
  console.log('[占位图创建] 最终创建占位图shape:', {
    shapeId,
    x,
    y,
    size,
    assetId,
  });
  
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

  console.log('[占位图创建] Shape创建完成');
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
  console.log('[updateShapeWithResult] 开始更新', {
    shapeId,
    resultType,
    resultData: typeof resultData === 'string' ? resultData.substring(0, 100) : resultData,
  });
  
  const shape = editor.getShape(shapeId as any);
  if (!shape) {
    console.warn('找不到占位图shape:', shapeId);
    return;
  }

  const type = resultType.toLowerCase();
  console.log('[updateShapeWithResult] 准备更新为类型:', type);

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
            w: 1536,
            h: 1536,
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

