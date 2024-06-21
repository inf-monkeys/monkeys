import { IBaseEntity } from '@/apis/typings.ts';

export interface ILLMModel extends IBaseEntity {
  uuid: string;
  origin: 'built-in' | 'user';
  teamId?: string;
  displayName: string;
  description: string;
  logo: string;
  baseModel: string;
  loraModel?: string;
  llmType: 'chatglm' | 'baichuan' | 'llama' | string;
  // 量化方式，目前仅支持读取通过 gptq 量化的模型
  quantization?: 'gptq';
  // 对话模版
  // Baichuan2-13B-Chat 示例：<reserved_106>{query}<reserved_107>
  // 运行需要的显存，单位为 GB
  gpuMemoryLimit: number;
  // 模型最大输入长度
  contextMaxLength: number;
  stop: string;
  promptTemplate: string;
  ownerUserId?: string;
  isPublic?: boolean;
  forkedFromId?: string;
}
