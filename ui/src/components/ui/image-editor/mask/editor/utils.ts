import { set } from 'lodash';
import { FileWithPath } from 'react-dropzone';

import { nanoIdUpperCase } from '@/utils';

export const canvasToBlob = (canvas: HTMLCanvasElement, type?: string, quality?: number): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      type,
      quality,
    );
  });
};

export function applyMaskToNewCanvas(
  width: number,
  height: number,
  originalCtx: CanvasRenderingContext2D,
  maskCtx: CanvasRenderingContext2D,
): HTMLCanvasElement {
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = width;
  resultCanvas.height = height;

  const resultCtx = resultCanvas.getContext('2d');

  if (!resultCtx) {
    console.error('无法获取 Canvas 上下文');
    return resultCanvas;
  }

  // 获取像素数据
  const originalImageData = originalCtx.getImageData(0, 0, width, height);
  const maskImageData = maskCtx.getImageData(0, 0, width, height);

  const originalPixels = originalImageData.data;
  const maskPixels = maskImageData.data;
  const resultImageData = resultCtx.createImageData(width, height);
  const resultPixels = resultImageData.data;

  // 遍历像素并应用遮罩
  for (let i = 0; i < originalPixels.length; i += 4) {
    // 直接复制原始图像的所有通道数据
    resultPixels[i] = originalPixels[i]; // Red
    resultPixels[i + 1] = originalPixels[i + 1]; // Green
    resultPixels[i + 2] = originalPixels[i + 2]; // Blue
    resultPixels[i + 3] = originalPixels[i + 3]; // Alpha

    // 如果遮罩像素不是完全透明的，则只将透明通道设为0
    const maskAlpha = maskPixels[i + 3];
    if (maskAlpha > 0) {
      resultPixels[i + 3] = 0;
    }
  }

  // 将处理后的像素数据放入结果 Canvas
  resultCtx.putImageData(resultImageData, 0, 0);

  return resultCanvas;
}

export const mergeBlobToFile = (file: File, blob: Blob): File => {
  let maskFileName = '';
  if (file) {
    const fileName = file.name;
    const extIndex = fileName.lastIndexOf('.');
    if (extIndex !== -1) {
      maskFileName = fileName.substring(0, extIndex);
    } else {
      maskFileName = fileName;
    }
  } else {
    maskFileName = nanoIdUpperCase(6);
  }
  maskFileName = `${maskFileName}_mask-edited_${+new Date()}.png`;

  const maskFile = new File([blob], maskFileName, { type: 'image/png' }) as FileWithPath;
  set(maskFile, 'path', maskFileName);
  return maskFile;
};
