import {
  readLocalStorageValue as mantineReadLocalStorageValue,
  useLocalStorage as mantineUseLocalStorage,
} from '@mantine/hooks';
import clsx, { ClassValue } from 'clsx';
import { parse, stringify } from 'superjson';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const useLocalStorage = <T>(key: string, defaultValue: T, useJSON = true) =>
  mantineUseLocalStorage({
    key,
    defaultValue,
    serialize: stringify,
    deserialize: (str) => (str === undefined ? defaultValue : useJSON ? parse(str) : str) as T,
  });

export const readLocalStorageValue = <T>(key: string, defaultValue: T, useJSON = true) =>
  mantineReadLocalStorageValue({
    key,
    defaultValue,
    deserialize: (str) => (str === undefined ? defaultValue : useJSON ? parse(str) : str) as T,
  });
