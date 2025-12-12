import { isBoolean, isNumber, isString } from 'lodash';

import { JSONValue } from '@/components/ui/code-editor';
import { flattenKeys } from '@/utils/flat.ts';

export const extractImageUrls = (text: unknown): string[] => {
  if (typeof text !== 'string') return [];

  const regex = /https?:\/\/[^\s"]+?\.(jpg|jpeg|png|gif|bmp|webp|svg)/gi;
  return text.match(regex) || [];
};

export const extractVideoUrls = (text: unknown): string[] => {
  if (typeof text !== 'string') return [];

  const regex = /https?:\/\/[^\s"]+?\.(mp4|avi|mov|mkv|flv|wmv|webm)/gi;
  return text.match(regex) || [];
};

export const extractPdbUrls = (text: unknown): string[] => {
  if (typeof text !== 'string') return [];

  const regex = /https?:\/\/[^\s"]+?\.pdb/gi;
  return text.match(regex) || [];
};

export const extract3DModelUrls = (text: unknown): string[] => {
  if (typeof text !== 'string') return [];

  // 与 execution-result/grid/index.tsx 的 MODEL_URL_REGEX 保持一致：
  // - 避免吃到 markdown 的 ")" 或引号包裹的结尾
  // - 支持查询参数
  const regex = /https?:\/\/[^\s"')]+?\.(glb|gltf|usdz|fbx|obj)(\?[^\s"')]+)?/gi;
  return text.match(regex) || [];
};

export const extractOtherUrls = (text: unknown): string[] => {
  if (typeof text !== 'string') return [];

  const excludeRegex = /https?:\/\/[^\s"]+\.(jpg|jpeg|png|gif|bmp|webp|svg|mp4|avi|mov|mkv|flv|wmv|webm|pdb|glb|gltf|usdz|fbx|obj)/gi;
  const allUrlsRegex = /https?:\/\/\S+/gi;

  const allUrls = text.match(allUrlsRegex) || [];

  return allUrls.filter((url) => !excludeRegex.test(url));
};

interface IVinesAbstractDataPreview {
  value: JSONValue;
  type: 'string' | 'boolean' | 'url' | 'image' | 'pdb' | 'video' | '3d-model';
  name: string;
}
export const previewDataGenerator = (data: JSONValue) => {
  const previewData: IVinesAbstractDataPreview[] = [];
  for (const [name, value] of Object.entries(flattenKeys(data))) {
    if (isString(value)) {
      const images = extractImageUrls(value);
      const videos = extractVideoUrls(value);
      const pdbs = extractPdbUrls(value);
      const model3ds = extract3DModelUrls(value);
      const others = extractOtherUrls(value);

      const hasImage = images.length > 0;
      const hasVideo = videos.length > 0;
      const hasPdb = pdbs.length > 0;
      const has3DModel = model3ds.length > 0;
      const hasOther = others.length > 0;

      if (hasImage) {
        images.forEach((image) => previewData.push({ value: image, type: 'image', name }));
      }

      if (hasPdb) {
        pdbs.forEach((pdb) => previewData.push({ value: pdb, type: 'pdb', name }));
      }

      if (hasVideo) {
        videos.forEach((video) => previewData.push({ value: video, type: 'video', name }));
      }

      if (has3DModel) {
        model3ds.forEach((model) => previewData.push({ value: model, type: '3d-model', name }));
      }

      if (hasOther) {
        others.forEach((url) => previewData.push({ value: url, type: 'url', name }));
      }

      if (!hasImage && !hasVideo && !hasPdb && !has3DModel && !hasOther) {
        previewData.push({ value, type: 'string', name });
      }
    } else if (isNumber(value)) {
      previewData.push({ value: value.toString(), type: 'string', name });
    } else if (isBoolean(value)) {
      previewData.push({ value, type: 'boolean', name });
    }
  }
  return previewData;
};
