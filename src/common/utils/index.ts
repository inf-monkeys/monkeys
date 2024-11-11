import { DoWhileTaskDef, ForkJoinTaskDef, SimpleTaskDef, SubWorkflowTaskDef } from '@inf-monkeys/conductor-javascript';
import { MonkeyTaskDefTypes } from '@inf-monkeys/monkeys';
import crypto from 'crypto';
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
  const urlPattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name and extension
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?' + // port
      '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
      '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i',
  ); // fragment locator
  return !!urlPattern.test(url);
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
    }
  }
  return result;
}

import { isObject, merge, reduce } from 'lodash';

type FlattenedObject = Record<string, any>;

export const flattenKeys = (obj: unknown, path: string[] = [], triggerKeys?: string[], triggerCallback?: (key: string, data: any) => void): FlattenedObject =>
  isObject(obj)
    ? reduce(
        obj,
        (cum: FlattenedObject, next: unknown, key: string) => {
          if (triggerKeys) {
            if (triggerKeys.includes(key)) {
              triggerCallback?.(key, obj[key]);
            }
          }
          return merge(cum, flattenKeys(next, [...path, key], triggerKeys, triggerCallback));
        },
        {},
      )
    : { [path.join('.')]: obj };

export const extractImageUrls = (text: unknown): string[] => {
  if (typeof text !== 'string') return [];

  const regex = /https?:\/\/[^\s"]+?\.(jpg|jpeg|png|gif|bmp|webp|svg)/gi;
  return text.match(regex) || [];
};

export const extractVideoUrls = (text: unknown): string[] => {
  if (typeof text !== 'string') return [];

  const regex = /https?:\/\/[^\s"]+?\.(mp4|avi|mov|mkv|flv|wmv|webm)/gi;
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
