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

export const getI18nContent = (content: string | I18nValue | null | undefined): string | undefined => {
  if (!content) return;
  const i18nLanguage = i18n.language;
  if (typeof content === 'string') return content;
  return content[i18nLanguage] ?? content['en-US'];
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
