import { I18nValue } from '@inf-monkeys/monkeys';
import {
  readLocalStorageValue as mantineReadLocalStorageValue,
  useLocalStorage as mantineUseLocalStorage,
} from '@mantine/hooks';
import clsx, { ClassValue } from 'clsx';
import { isString } from 'lodash';
import { customAlphabet } from 'nanoid';
import { useTranslation } from 'react-i18next';
import rfdc from 'rfdc';
import { parse, stringify } from 'superjson';
import { twMerge } from 'tailwind-merge';

import i18n from '@/i18n';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const cloneDeep = rfdc();

export const useLocalStorage = <T>(key: string, defaultValue: T, useJSON = true) =>
  mantineUseLocalStorage({
    key,
    defaultValue,
    serialize: useJSON ? stringify : (val) => val as string,
    deserialize: (str) => (str === undefined ? defaultValue : useJSON ? parse(str) : str) as T,
  });

export const readLocalStorageValue = <T>(key: string, defaultValue: T, useJSON = true) =>
  mantineReadLocalStorageValue({
    key,
    defaultValue,
    deserialize: (str) => (str === undefined ? defaultValue : useJSON ? parse(str) : str) as T,
  });

export const dispatchLocalStorageEvent = <T>(key: string, value: T) =>
  window.dispatchEvent(
    new CustomEvent('mantine-local-storage', {
      detail: {
        key,
        value,
      },
    }),
  );

export const setLocalStorage = <T>(key: string, value: T) => {
  const finalData = isString(value) ? value : stringify(value);
  localStorage.setItem(key, finalData);
  dispatchLocalStorageEvent(key, value);
};

export const nanoIdLowerCase = customAlphabet('6789bcdfghjkmnpqrtwz', 8);
export const nanoIdUpperCase = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 8);

export const I18nContent = (content: string | I18nValue | undefined): string | undefined => {
  const { i18n } = useTranslation();
  if (!content) return;
  if (typeof content === 'string') return content;
  return content[i18n.language] ? content[i18n.language] : content['en-US'];
};

export const getI18nContent = (content: string | I18nValue | null | undefined): string | undefined => {
  if (!content) return;
  if (typeof content === 'string') return content;
  return content[i18n.language] ? content[i18n.language] : content['en-US'];
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
export const execCopy = (text: string): boolean => {
  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = text;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  tempTextArea.setSelectionRange(0, 99999); // 对于移动设备
  try {
    return document.execCommand('copy');
  } catch (err) {
    return false;
  } finally {
    document.body.removeChild(tempTextArea);
  }
};
