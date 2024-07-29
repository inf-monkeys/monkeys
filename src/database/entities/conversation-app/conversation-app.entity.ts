import { AssetType } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseAssetEntity } from '../assets/base-asset';

export interface CreateConversationAppParams {
  customModelName?: string;
  displayName?: string;
  description?: string;
  iconUrl?: string;
  model: string;
  systemPrompt?: string;
  knowledgeBase?: string;
  sqlKnowledgeBase?: string;
  tools?: string[];
  temperature?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface UpdateConversationAppParams {
  customModelName?: string;
  displayName?: string;
  description?: string;
  iconUrl?: string;
  model?: string;
  systemPrompt?: string;
  knowledgeBase?: string;
  sqlKnowledgeBase?: string;
  tools?: string[];
  temperature?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
}

@Entity({ name: 'conversation_apps' })
export class ConversationAppEntity extends BaseAssetEntity {
  assetType: AssetType = 'conversation-app';

  @Column({
    name: 'custom_model_name',
    type: 'varchar',
    nullable: true,
  })
  customModelName?: string;

  @Column({
    name: 'model',
    type: 'varchar',
  })
  model: string;

  @Column({
    name: 'system_prompt',
    type: 'varchar',
    nullable: true,
  })
  systemPrompt?: string;

  @Column({
    name: 'knowledge_base',
    type: 'varchar',
    nullable: true,
  })
  knowledgeBase?: string;

  @Column({
    name: 'sql_knowledge_base',
    type: 'varchar',
    nullable: true,
  })
  sqlKnowledgeBase?: string;

  @Column({
    name: 'tools',
    type: 'simple-json',
    nullable: true,
  })
  tools?: string[];

  @Column({
    name: 'temperature',
    type: 'float',
    nullable: true,
    default: 0.7,
  })
  temperature?: number;

  @Column({
    name: 'presence_penalty',
    type: 'float',
    nullable: true,
    default: 0.5,
  })
  presence_penalty?: number;

  @Column({
    name: 'frequency_penalty',
    type: 'float',
    nullable: true,
    default: 0.5,
  })
  frequency_penalty?: number;
}
