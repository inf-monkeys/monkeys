import { isBoolean, isNumber, isString } from 'lodash';

import { JSONValue } from '@/components/ui/code-editor';
import { flattenKeys } from '@/utils/flat.ts';

interface IVinesAbstractDataPreview {
  value: JSONValue;
  type: 'string' | 'boolean' | 'url' | 'image' | 'pdb' | 'video';
  name: string;
}

const URL_REGEXP = /https?:\/\/\S+/i;
const IMG_REGEXP = /https?:\/\/\S+\.(?:png|webp|jpg|jpeg)/i;
const VIDEO_REGEXP = /https?:\/\/\S+\.(?:mp4|webm)/i;
const PDB_REGEXP = /https?:\/\/\S+\.pdb/i;

export const previewDataGenerator = (data: JSONValue) => {
  const previewData: IVinesAbstractDataPreview[] = [];
  for (const [name, value] of Object.entries(flattenKeys(data))) {
    if (isString(value)) {
      if (IMG_REGEXP.test(value)) {
        previewData.push({ value, type: 'image', name });
      } else if (PDB_REGEXP.test(value)) {
        previewData.push({ value, type: 'pdb', name });
      } else if (VIDEO_REGEXP.test(value)) {
        previewData.push({ value, type: 'video', name });
      } else if (URL_REGEXP.test(value)) {
        previewData.push({ value, type: 'url', name });
      } else {
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
