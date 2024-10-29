import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { SimpleTaskDef } from '@inf-monkeys/conductor-javascript';
import { MonkeyWorkflowDef } from '@inf-monkeys/monkeys';
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
  index: number;
  comfyuiWorkflowId?: string;
}
export function getComfyuiWorkflowDataListFromWorkflow(workflow: MonkeyWorkflowDef | WorkflowMetadataEntity): ComfyUIWorkflowDataInWorkflowTask[] {
  const result: ComfyUIWorkflowDataInWorkflowTask[] = [];
  for (const [index, task] of workflow.tasks.entries()) {
    if (task.name === 'comfyui:run_comfyui_workflow') {
      result.push({
        index,
        comfyuiWorkflowId: (workflow.tasks[index] as SimpleTaskDef).inputParameters?.workflow as string | undefined,
      });
    }
  }
  return result;
}
