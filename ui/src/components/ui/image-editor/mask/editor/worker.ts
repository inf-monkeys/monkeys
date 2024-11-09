// worker.js
import * as png from '@stevebel/png';
import { COLOR_TYPES } from '@stevebel/png/lib/helpers/color-types';

self.onmessage = async function (event) {
  const { imgArrayBuffer, maskArrayBuffer } = event.data;

  // 解码原始图像
  const rawMetadata = png.decode(imgArrayBuffer);

  // 解码遮罩图像
  const maskMetadata = png.decode(maskArrayBuffer);

  // 处理图像数据
  const newData = rawMetadata.data;
  for (let i = 0; i < rawMetadata.data.length; i += 4) {
    if (maskMetadata.data[i + 3]) newData[i + 3] = 0;
  }

  // 生成新的图像元数据
  const newMetadata = {
    ...rawMetadata,
    colorType: COLOR_TYPES.TRUE_COLOR_WITH_ALPHA,
    data: newData,
  };

  // 编码新图像为 PNG 格式
  const newPng = png.encode(newMetadata);

  // 将结果发送回主线程
  self.postMessage({ newPng });
};
