import { AssetType } from '@/common/typings/asset';
import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'llm_models' })
export class LlmModelEntity extends BaseAssetEntity {
  assetType: AssetType = 'llm-model';

  @Column({
    name: 'base_model',
  })
  baseModel: string;

  @Column({
    name: 'lora_model',
    nullable: true,
  })
  loraModel?: string;

  @Column({
    name: 'llm_type',
  })
  llmType: 'chatglm' | 'baichuan' | 'llama' | string;

  @Column({
    nullable: true,
  })
  // 量化方式，目前仅支持读取通过 gptq 量化的模型
  quantization?: 'gptq';

  @Column({
    name: 'prompt_template',
    nullable: true,
  })
  // 对话模版
  // Baichuan2-13B-Chat 示例：<reserved_106>{query}<reserved_107>
  promptTemplate: string;

  @Column({
    name: 'gpu_memory_limit',
    nullable: true,
    type: 'integer',
  })
  // 运行需要的显存，单位为 GB
  gpuMemoryLimit: number;

  @Column({
    name: 'context_max_length',
    nullable: true,
    type: 'integer',
  })
  // 模型最大输入长度
  contextMaxLength: number;

  @Column({
    name: 'stop',
    nullable: true,
    type: 'varchar',
  })
  // 模型输出默认停止符
  stop: string;
}
