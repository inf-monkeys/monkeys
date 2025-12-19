import { extractImageUrls, extractVideoUrls, flattenKeys } from '.';

export const convertOutputFromRawOutput = (output: Record<string, any>) => {
  let alt: string | string[] | undefined;
  const flattenOutput = flattenKeys(output, void 0, ['__display_text'], (_, dataVal) => {
    alt = dataVal;
  });

  const outputKeys = Object.keys(flattenOutput);
  const outputValues = Object.values(flattenOutput);
  const finalOutput = [];
  let isInserted = false;

  // 为每个 key-value 对单独处理
  for (let i = 0; i < outputKeys.length; i++) {
    const key = outputKeys[i];
    const currentKey = key.split('.')[key.split('.').length - 1];
    const value = outputValues[i];

    // __ 开头的 key 不处理
    if (currentKey.startsWith('__')) {
      continue;
    }

    // 提取图片和视频
    const images = extractImageUrls(value);
    const videos = extractVideoUrls(value);

    // 处理图片
    for (const image of images) {
      finalOutput.push({
        type: 'image',
        data: image,
        alt,
        key: key,
      });
      isInserted = true;
    }

    // 处理视频
    for (const video of videos) {
      finalOutput.push({
        type: 'video',
        data: video,
        key: key,
      });
      isInserted = true;
    }
  }

  // 如果没有图片和视频，处理文本或 JSON
  if (!isInserted && output) {
    if (typeof output === 'string') {
      finalOutput.push({
        type: 'text',
        data: output,
        key: 'root',
      });
    } else {
      finalOutput.push({
        type: 'json',
        data: output,
        key: 'root',
      });
    }
  }

  return finalOutput;
};

export const convertOutputFromRawOutputAsync = async (
  output: Record<string, any>,
  urlTransformer?: (url: string) => Promise<string | null | undefined>,
) => {
  let alt: string | string[] | undefined;
  const flattenOutput = flattenKeys(output, void 0, ['__display_text'], (_, dataVal) => {
    alt = dataVal;
  });

  const outputKeys = Object.keys(flattenOutput);
  const outputValues = Object.values(flattenOutput);
  const finalOutput = [];
  let isInserted = false;

  // 为每个 key-value 对单独处理
  for (let i = 0; i < outputKeys.length; i++) {
    const key = outputKeys[i];
    const currentKey = key.split('.')[key.split('.').length - 1];
    const value = outputValues[i];

    // __ 开头的 key 不处理
    if (currentKey.startsWith('__')) {
      continue;
    }

    // 提取图片和视频
    const images = extractImageUrls(value);
    const videos = extractVideoUrls(value);

    // 处理图片 - 转换私有桶 URL
    for (const image of images) {
      const transformedUrl = urlTransformer ? await urlTransformer(image) : image;
      finalOutput.push({
        type: 'image',
        data: transformedUrl,
        alt,
        key: key,
      });
      isInserted = true;
    }

    // 处理视频
    for (const video of videos) {
      finalOutput.push({
        type: 'video',
        data: video,
        key: key,
      });
      isInserted = true;
    }
  }

  // 如果没有图片和视频，处理文本或 JSON
  if (!isInserted && output) {
    if (typeof output === 'string') {
      finalOutput.push({
        type: 'text',
        data: output,
        key: 'root',
      });
    } else {
      finalOutput.push({
        type: 'json',
        data: output,
        key: 'root',
      });
    }
  }

  return finalOutput;
};
