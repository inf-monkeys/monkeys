import { I18nValue } from '@inf-monkeys/monkeys';
import clsx, { ClassValue } from 'clsx';
import { customAlphabet } from 'nanoid';
import rfdc from 'rfdc';
import { twMerge } from 'tailwind-merge';

import i18n from '@/i18n';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const cloneDeep = rfdc();

export const nanoIdLowerCase = customAlphabet('6789bcdfghjkmnpqrtwz', 8);
export const nanoIdUpperCase = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 8);

const I18N_MAPPER = {
  en: 'en-US',
  zh: 'zh-CN',
};
export const getI18nContent = (content: string | I18nValue | null | undefined): string | undefined => {
  if (!content) return;
  const contentType = typeof content;
  if (contentType === 'string' || contentType === 'number') {
    return content.toString();
  }
  return content[I18N_MAPPER[i18n.language] ?? 'en-US'] ?? content['en-US'];
};

export const I18nAllContent = (content: string | I18nValue | undefined): string | undefined => {
  if (!content) return;
  if (typeof content === 'string') return content;
  const result: string[] = [];
  for (const key in content) {
    if (content[key]) {
      result.push(content[key]!);
    }
  }
  return result.join(',');
};

/**
 * Converts string to kebab case
 *
 * @param {string} string
 * @returns {string} A kebabized string
 */
export const toKebabCase = (string: string): string => string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
