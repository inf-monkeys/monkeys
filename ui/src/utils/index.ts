import { I18nValue } from '@inf-monkeys/monkeys';
import clsx, { ClassValue } from 'clsx';
import { isArray, isObject } from 'lodash';
import { customAlphabet } from 'nanoid';
import { useTranslation } from 'react-i18next';
import rfdc from 'rfdc';
import { twMerge } from 'tailwind-merge';

import { LANGUAGE_MAPPER } from '@/components/layout/workspace/vines-view/flow/toolbar/more/association-editor/field/display-name';
import i18n from '@/i18n';
import { IVinesExecutionResultItem } from '@/utils/execution.ts';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const cloneDeep = rfdc();

export const nanoIdLowerCase = customAlphabet('6789bcdfghjkmnpqrtwz', 8);
export const nanoIdUpperCase = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 8);

const I18N_MAPPER = {
  en: 'en-US',
  zh: 'zh-CN',
};

export const LANGUAGE = {
  'en-US': 'English',
  'zh-CN': '中文',
};

export const getI18nContent = (content: string | I18nValue | null | undefined): string | undefined => {
  if (!content) return;
  const contentType = typeof content;
  if (contentType === 'string' || contentType === 'number') {
    try {
      const parseContent = JSON.parse(content.toString());
      return parseContent[I18N_MAPPER[i18n.language] ?? 'en-US'] ?? parseContent['en-US'];
    } catch (e) {
      return content.toString();
    }
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

export const getAlt = (result: IVinesExecutionResultItem) => {
  const { alt, data } = result.render;
  const label = isArray(alt)
    ? alt[0]
    : (isObject(alt?.[data as string]) ? alt?.[data as string].label : alt?.[data as string]) || alt || '';
  const value = isArray(alt)
    ? label
    : (isObject(alt?.[data as string]) && alt?.[data as string].type === 'copy-param'
        ? JSON.stringify({
            type: 'input-parameters',
            data: [...result.input, ...(alt?.[data as string]?.data ?? [])],
          })
        : alt?.[data as string]) ?? '';
  return {
    label,
    value,
  };
};

export const useGetDisplayTextFromPlainTextJson = (displayName: string) => {
  const { i18n } = useTranslation();
  try {
    const realDisplayName = JSON.parse(displayName);
    const currentLanguageKey = LANGUAGE_MAPPER[i18n.language as keyof typeof LANGUAGE_MAPPER] || 'zh-CN';
    const content = realDisplayName[currentLanguageKey];

    // return t([`workspace.wrapper.space.tabs.${content || 'unknown'}`, content || 'Unknown Group']);
    return content;
  } catch {
    return displayName;
  }
};

export const isJSONString = (str: any) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};
