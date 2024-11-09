// worker.js
import { Image } from 'image-js';

self.onmessage = async function (event: MessageEvent) {
  const { imgArrayBuffer, maskArrayBuffer } = event.data;

  self.postMessage({ type: 'progress', progress: 10 });
  // 从 ArrayBuffer 创建图像对象
  const rawImage = await Image.load(imgArrayBuffer);
  self.postMessage({ type: 'progress', progress: 20 });

  const maskImage = await Image.load(maskArrayBuffer);
  self.postMessage({ type: 'progress', progress: 30 });

  // 处理图像数据
  // 遍历每个像素,如果遮罩图像对应位置的 alpha 通道不为 0,则将原图对应位置的 alpha 设为 0
  const totalPixels = rawImage.width * rawImage.height;
  let processedPixels = 0;

  // 从30%开始计算像素处理进度,最高到90%
  const startProgress = 30;
  const endProgress = 90;
  const progressRange = endProgress - startProgress;

  for (let x = 0; x < rawImage.width; x++) {
    for (let y = 0; y < rawImage.height; y++) {
      const maskAlpha = maskImage.getValueXY(x, y, 3); // 获取遮罩的 alpha 值
      if (maskAlpha > 0) {
        rawImage.setValueXY(x, y, 3, 0); // 设置原图的 alpha 值为 0
      }

      processedPixels++;

      // 每处理1%的像素就发送一次进度
      if (processedPixels % Math.floor(totalPixels / 100) === 0) {
        const pixelProgress = processedPixels / totalPixels;
        const progress = startProgress + Math.floor(pixelProgress * progressRange);
        self.postMessage({ type: 'progress', progress });
      }
    }
  }

  // 将处理后的图像转换为 PNG buffer
  self.postMessage({ type: 'progress', progress: 99 });
  const image = rawImage.toBuffer({ format: 'png' });

  // 将结果发送回主线程
  self.postMessage({ type: 'complete', image });
};
