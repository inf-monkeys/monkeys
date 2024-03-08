import fs from 'fs';
import { mergeWith } from 'lodash';
import { createHash } from 'node:crypto';
import path from 'path';

export function getRandomNumber(min: number, max: number) {
  const n = Math.floor(max * Math.random());
  if (n < min) {
    return getRandomNumber(min, max);
  }
  return n;
}

export function objectForEach(obj: Record<string, unknown>, fn: (v: unknown) => unknown) {
  for (const key in obj) {
    obj[key] = fn(obj[key]);
  }
  return obj;
}

export function deduplicateArray<T>(arr: Array<T>): Array<T> {
  return Array.from(new Set(arr));
}

export function extractUpperCase(str: string) {
  const regex = /[A-Z]+/g;
  return str.match(regex);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(true), ms));
}

export function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

export function traverseObject(obj, handler) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // 递归遍历嵌套对象
      traverseObject(obj[key], handler);
    } else {
      // 使用处理函数处理值并替换原来的值
      obj[key] = handler(obj[key]);
    }
  }
}

// 提取依赖项的函数
export function extractDependencies(sourceCode: string) {
  // 使用正则表达式匹配 require 函数的调用
  const requireRegex = /require\(['"](.+?)['"]\)/g;

  const dependencies = [];
  let match;

  // 循环匹配所有 require 函数的调用
  while ((match = requireRegex.exec(sourceCode)) !== null) {
    const dependency = match[1];
    dependencies.push(dependency);
  }

  return dependencies;
}

export const convertStringToBool = (value: string) => {
  const validValues = ['true', 'false', '1', '0', 'True', 'False'];
  if (!validValues.includes(value)) {
    throw new Error(`Invalid boolean value received: ${value}`);
  }
  return ['true', '1', 'True'].includes(value);
};

export const deepMergeObject = (objValue: object, srcValue: object) => {
  const customizer = (o1: object, o2: object) => {
    if (Array.isArray(o1)) {
      return o1.concat(o2);
    }
  };
  return mergeWith(objValue, srcValue, customizer);
};

export function getBaseFolder() {
  return process.cwd();
}

export function getAndEnsureTempDataFolder() {
  const folder = path.join(getBaseFolder(), 'tmp-files');
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  return folder;
}

export function calcMd5(content: string) {
  return createHash('md5').update(content).digest('hex');
}

export function areArraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) return false;
  return [...setA].every((item) => setB.has(item));
}
