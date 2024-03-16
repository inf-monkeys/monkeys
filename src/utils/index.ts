import {
  readLocalStorageValue as mantineReadLocalStorageValue,
  useLocalStorage as mantineUseLocalStorage,
} from '@mantine/hooks';
import clsx, { ClassValue } from 'clsx';
import { isString } from 'lodash';
import { customAlphabet } from 'nanoid';
import { parse, stringify } from 'superjson';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

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
