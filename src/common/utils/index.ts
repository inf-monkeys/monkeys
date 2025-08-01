import { DoWhileTaskDef, ForkJoinTaskDef, SimpleTaskDef, SubWorkflowTaskDef, SwitchTaskDef } from '@inf-monkeys/conductor-javascript';
import { MonkeyTaskDefTypes } from '@inf-monkeys/monkeys';
import crypto from 'crypto';
import { isObject, isString, merge, omit, reduce } from 'lodash';
import shortid from 'shortid';

export const enumToList = (enumItem: any) => {
  return Object.keys(enumItem).map((key) => enumItem[key]);
};

export const generateDbId = (m = Math, d = Date, h = 16, s = (s) => m.floor(s).toString(h)) => s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h));

export const generateShortId = () => {
  return shortid.generate();
};

export const isValidObjectId = (id: string) => {
  // ObjectId 是一个 24 字符的十六进制字符串
  return /^[a-fA-F0-9]{24}$/.test(id);
};

export function isValidNamespace(str: string) {
  return /^(?!.*__.*$)[a-zA-Z0-9_]*$/.test(str);
}

export function isValidToolName(str: string) {
  return /^(?!.*__.*$)[a-zA-Z0-9_]*$/.test(str);
}

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

export function getHostFromUrl(url: string): string {
  const parsedUrl = new URL(url);
  return parsedUrl.host;
}

export function replacerNoEscape(key: string, value: any) {
  if (typeof value === 'string') {
    return value.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
  return value;
}

export function generatePassword(length: number = 16) {
  // 定义密码字符集
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';

  // 创建随机字节数组
  const randomBytes = crypto.randomBytes(length);

  // 转换随机字节为字符
  let password = '';
  for (let i = 0; i < randomBytes.length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

export function maskString(str: string) {
  try {
    if (!str) return str; // 如果字符串为空，直接返回原字符串
    if (str.length <= 2) return str; // 如果字符串长度小于等于2，直接返回原字符串

    const half = Math.floor(str.length / 2); // 找到字符串的中间点
    const start = Math.floor(half / 2); // 找到起始位置
    const end = str.length - start; // 找到结束位置

    // 构建新的字符串
    const maskedString = str.substring(0, start) + '*'.repeat(end - start) + str.substring(end);

    return maskedString;
  } catch (error) {
    return str;
  }
}

export interface ComfyUIWorkflowDataInWorkflowTask {
  path: string;
  comfyuiWorkflowId?: string;
}
export function getComfyuiWorkflowDataListFromWorkflow(tasks: MonkeyTaskDefTypes[]): ComfyUIWorkflowDataInWorkflowTask[] {
  const result: ComfyUIWorkflowDataInWorkflowTask[] = [];
  for (const [index, task] of tasks.entries()) {
    if (task.type === 'SIMPLE') {
      if (task.name === 'comfyui:run_comfyui_workflow') {
        result.push({
          path: `[${index}].inputParameters`,
          comfyuiWorkflowId: (task as SimpleTaskDef).inputParameters?.workflow as string | undefined,
        });
      }
    } else if (task.type === 'FORK_JOIN') {
      for (const [forkIndex, forkTask] of (task as ForkJoinTaskDef).forkTasks.entries()) {
        result.push(
          ...getComfyuiWorkflowDataListFromWorkflow(forkTask).map((c) => {
            return {
              path: `[${index}].forkTasks[${forkIndex}]${c.path}`,
              comfyuiWorkflowId: c.comfyuiWorkflowId,
            };
          }),
        );
      }
    } else if (task.type === 'DO_WHILE') {
      result.push(
        ...getComfyuiWorkflowDataListFromWorkflow((task as DoWhileTaskDef).loopOver).map((c) => {
          return {
            path: `[${index}].loopOver${c.path}`,
            comfyuiWorkflowId: c.comfyuiWorkflowId,
          };
        }),
      );
    } else if (task.type === 'SUB_WORKFLOW') {
      result.push(
        ...getComfyuiWorkflowDataListFromWorkflow((task as SubWorkflowTaskDef).subWorkflowParam['workflowDefinition'].tasks).map((c) => {
          return {
            path: `[${index}].subWorkflowParam.workflowDefinition.tasks${c.path}`,
            comfyuiWorkflowId: c.comfyuiWorkflowId,
          };
        }),
      );
    } else if (task.type === 'SWITCH') {
      Object.keys((task as SwitchTaskDef).decisionCases).forEach((key) => {
        const value = (task as SwitchTaskDef).decisionCases[key];
        result.push(
          ...getComfyuiWorkflowDataListFromWorkflow(value).map((c) => {
            return {
              path: `[${index}].decisionCases["${key}"]${c.path}`,
              comfyuiWorkflowId: c.comfyuiWorkflowId,
            };
          }),
        );
      });
    }
  }
  return result;
}

export const getSubWorkflowDataList = (tasks: MonkeyTaskDefTypes[]) => {
  const result = [];
  for (const [index, task] of tasks.entries()) {
    if (task.type === 'SUB_WORKFLOW') {
      result.push({
        path: `[${index}]`,
        subWorkflowId: task.subWorkflowParam.name,
      });
    } else if (task.type === 'FORK_JOIN') {
      for (const [forkIndex, forkTask] of task.forkTasks.entries()) {
        result.push(
          ...getSubWorkflowDataList(forkTask).map((c) => {
            return {
              ...c,
              path: `[${index}].forkTasks[${forkIndex}]${c.path}`,
            };
          }),
        );
      }
    } else if (task.type === 'DO_WHILE') {
      result.push(
        ...getSubWorkflowDataList(task.loopOver).map((c) => {
          return {
            ...c,
            path: `[${index}].loopOver${c.path}`,
          };
        }),
      );
    } else if (task.type === 'SWITCH') {
      Object.keys(task.decisionCases).map((key) => {
        const value = task.decisionCases[key];
        result.push(
          ...getSubWorkflowDataList(value).map((c) => {
            return {
              ...c,
              path: `[${index}].decisionCases["${key}"].${c.path}`,
            };
          }),
        );
      });
    }
  }
  return result;
};

type FlattenedObject = Record<string, any>;

export const flattenKeys = (obj: unknown, path: string[] = [], triggerKeys?: string[], triggerCallback?: (key: string, data: any) => void): FlattenedObject =>
  isObject(obj)
    ? reduce(
        obj,
        (cum: FlattenedObject, next: unknown, key: string) => {
          // 如果是触发键，保持其值的原始结构
          if (triggerKeys?.includes(key)) {
            triggerCallback?.(key, obj[key]);
            return merge(cum, { [path.concat(key).join('.')]: next });
          }
          // 其他情况继续递归展平
          return merge(cum, flattenKeys(next, [...path, key], triggerKeys, triggerCallback));
        },
        {},
      )
    : { [path.join('.')]: obj };

export const flattenObject = (obj: any, parentKey = '', result = {}) => {
  for (const key in obj) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenObject(obj[key], fullKey, result);
    } else {
      result[fullKey] = obj[key];
    }
  }
  return result;
};

export function flattenObjectToString(obj: any): string {
  const stringValues: string[] = [];

  function recurse(current: any) {
    if (current === null || current === undefined) {
      return;
    }

    // 只处理 string 类型的值
    if (isString(current)) {
      stringValues.push(current);
    } else if (Array.isArray(current)) {
      // 如果是数组, 递归处理每个元素
      for (const item of current) {
        recurse(item);
      }
    } else if (isObject(current)) {
      // 如果是对象, 递归处理其值, 同时跳过 __context 和 extraMetadata
      const valuesToRecurse = '__context' in current || 'extraMetadata' in current ? Object.values(omit(current, ['__context', 'extraMetadata'])) : Object.values(current);
      for (const value of valuesToRecurse) {
        recurse(value);
      }
    }
    // 其他类型 (number, boolean, etc.) 会被忽略
  }

  recurse(obj);
  return stringValues.join(' ');
}

// 专门用于生成 searchableText 的函数，过滤掉不必要的内容
export function flattenObjectToSearchableText(obj: any): string {
  const stringValues: string[] = [];

  function isUrl(str: string): boolean {
    return /^https?:\/\//.test(str);
  }

  function isLongText(str: string): boolean {
    return str.length > 1000; // 放宽长度限制以保留提示词，提高到1000字符
  }

  function isUuid(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  function isFileType(str: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp|svg|mp4|avi|mov|mkv|flv|wmv|pdf|doc|docx|txt)$/i.test(str);
  }

  function isMimeType(str: string): boolean {
    return /^(image|video|audio|application|text)\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*$/i.test(str);
  }

  function recurse(current: any) {
    if (current === null || current === undefined) {
      return;
    }

    // 只处理有用的 string 类型的值
    if (isString(current)) {
      // 过滤掉不需要的内容
      if (!isUrl(current) && !isLongText(current) && !isUuid(current) && !isFileType(current) && !isMimeType(current)) {
        // 只保留有意义的文本，但放宽长度限制以包含提示词
        const trimmed = current.trim();
        if (trimmed.length > 0) {
          stringValues.push(trimmed);
        }
      }
    } else if (Array.isArray(current)) {
      // 如果是数组, 递归处理每个元素
      for (const item of current) {
        recurse(item);
      }
    } else if (isObject(current)) {
      // 如果是对象, 递归处理其值, 同时跳过 __context 和 extraMetadata
      const valuesToRecurse = '__context' in current || 'extraMetadata' in current ? Object.values(omit(current, ['__context', 'extraMetadata'])) : Object.values(current);
      for (const value of valuesToRecurse) {
        recurse(value);
      }
    }
    // 其他类型 (number, boolean, etc.) 会被忽略
  }

  recurse(obj);
  return stringValues.join(' ');
}

export const extractImageUrls = (text: unknown): string[] => {
  if (typeof text !== 'string') return [];

  const regex = /https?:\/\/[^\s"]+?\.(jpg|jpeg|png|gif|bmp|webp|svg)(?:[?#][^"]*)?/gi;
  return text.match(regex) || [];
};

export const extractVideoUrls = (text: unknown): string[] => {
  if (typeof text !== 'string') return [];

  const regex = /https?:\/\/[^\s"]+?\.(mp4|avi|mov|mkv|flv|wmv|webm)(?:[?#][^"]*)?/gi;
  return text.match(regex) || [];
};

export const getDataType = (data: any): 'json' | 'number' | 'boolean' | 'text' | 'image' | 'video' | 'unknown' => {
  if (typeof data === 'string') {
    if (/https?:\/\/[^\s"]+?\.(jpg|jpeg|png|gif|bmp|webp|svg)/gi.test(data)) return 'image';
    if (/https?:\/\/[^\s"]+?\.(mp4|avi|mov|mkv|flv|wmv|webm)/gi.test(data)) return 'video';
    return 'text';
  } else if (typeof data === 'object') {
    return 'json';
  } else if (typeof data === 'number') {
    return 'number';
  } else if (typeof data === 'boolean') {
    return 'boolean';
  } else {
    return 'unknown';
  }
};

export const maskUrl = (url: string) => {
  const parts = url.split('//');
  const domain = parts[1];
  const domainParts = domain.split('.');

  const hideDomain = domainParts
    .map((part) => {
      if (part.length <= 4) {
        return part.slice(0, -2) + '**';
      }
      const mid = Math.floor(part.length / 2);
      return part.slice(0, 2) + '*'.repeat(2) + part.slice(mid - 2, mid + 3) + '*'.repeat(2) + part.slice(-2);
    })
    .join('.');

  const hiddenAddress = parts[0] + '//' + hideDomain;
  return hiddenAddress;
};
