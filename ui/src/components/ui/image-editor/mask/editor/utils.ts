import getFileNameAndExtension from '@uppy/utils/lib/getFileNameAndExtension';
import { set } from 'lodash';
import { FileWithPath } from 'react-dropzone';

import { nanoIdUpperCase } from '@/utils';

import ImageWorker from './worker.ts?worker';

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

export const getCanvasBlob: (canvas: HTMLCanvasElement) => Promise<Blob | null> = (canvas) =>
  new Promise((resolve) => canvas.toBlob(resolve));

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

export const applyMaskCanvasToOriginalImageFile = async (
  file: File,
  maskCanvasCtx: CanvasRenderingContext2D,
  onProgress?: (progress: number) => void,
) => {
  // 创建一个临时的 canvas 用于加载原始图片
  const originalCanvas = document.createElement('canvas');
  const originalCtx = originalCanvas.getContext('2d');

  if (!originalCtx) {
    throw new Error('无法获取 Canvas 上下文');
  }

  // 加载原始图片
  const originalImage = new Image();
  originalImage.src = URL.createObjectURL(file);
  await new Promise((resolve) => (originalImage.onload = resolve));

  // 设置原始 canvas 尺寸为图片实际大小
  originalCanvas.width = originalImage.width;
  originalCanvas.height = originalImage.height;
  originalCtx.drawImage(originalImage, 0, 0);

  // 创建一个临时的 canvas 用于缩放遮罩
  const scaledMaskCanvas = document.createElement('canvas');
  const scaledMaskCtx = scaledMaskCanvas.getContext('2d', {
    willReadFrequently: true,
  });

  if (!scaledMaskCtx) {
    throw new Error('无法获取 Canvas 上下文');
  }

  // 设置缩放后的遮罩 canvas 尺寸为原始图片大小
  scaledMaskCanvas.width = originalImage.width;
  scaledMaskCanvas.height = originalImage.height;

  // 清除缩放画布
  scaledMaskCtx.clearRect(0, 0, scaledMaskCanvas.width, scaledMaskCanvas.height);

  // 将遮罩 canvas 等比缩放到原始图片大小
  const maskCanvas = maskCanvasCtx.canvas;
  scaledMaskCtx.drawImage(
    maskCanvas,
    0,
    0,
    maskCanvas.width,
    maskCanvas.height,
    0,
    0,
    originalImage.width,
    originalImage.height,
  );

  // 获取像素数据
  const originalImageBlob = await (await getCanvasBlob(originalCanvas))!.arrayBuffer();
  const maskImageBlob = await (await getCanvasBlob(scaledMaskCanvas))!.arrayBuffer();

  return new Promise((resolve) => {
    const worker = new ImageWorker();

    worker.onmessage = (event) => {
      const { type, progress, image } = event.data;

      if (type === 'progress') {
        onProgress?.(progress);
        return;
      }

      // 创建 Blob 和 File 对象
      const newBlob = new Blob([image], { type: 'image/png' });

      resolve(newBlob);

      // 关闭 Worker
      worker.terminate();
    };

    // 将数据传递给 Worker
    worker.postMessage({
      imgArrayBuffer: originalImageBlob,
      maskArrayBuffer: maskImageBlob,
    });
  });
};

export const mergeBlobToFile = (file: File, blob: Blob): File => {
  const fileNameAndExtension = getFileNameAndExtension(file.name);

  let maskFileName = fileNameAndExtension?.name ?? nanoIdUpperCase(6);
  const maskFileExtension = fileNameAndExtension?.extension ?? 'png';

  maskFileName = `${maskFileName}_mask-edited_${new Date().toISOString().slice(2, 10).replace(/-/g, '')}.${maskFileExtension}`;

  const maskFile = new File([blob], maskFileName, { type: 'image/png' }) as FileWithPath;
  set(maskFile, 'path', maskFileName);
  return maskFile;
};
