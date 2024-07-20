import { isString } from 'lodash';
import { parse, stringify } from 'superjson';

import { createStorage, readValue } from './create-storage';

export const useLocalStorage = <T>(key: string, defaultValue: T, useJSON = true) =>
  createStorage<T>(
    'localStorage',
    'use-local-storage',
  )({
    key,
    defaultValue,
    serialize: useJSON ? stringify : (val) => val as string,
    deserialize: (str) => (str === undefined ? defaultValue : useJSON ? parse(str) : str) as T,
  });

export const readLocalStorageValue = <T>(key: string, defaultValue: T, useJSON = true) =>
  readValue('localStorage')({
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

export const deleteLocalStorage = (key: string, dispatch = true, value = '') => {
  localStorage.removeItem(key);
  dispatch && dispatchLocalStorageEvent(key, value);
};

export const clearAllLocalData = () => {
  localStorage.clear();
  document.cookie
    .split(';')
    .forEach((c) => (document.cookie = c.trim().split('=')[0] + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'));
};
