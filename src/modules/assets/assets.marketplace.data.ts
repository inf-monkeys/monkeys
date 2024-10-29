import { BuiltInMarket } from '@/common/typings/asset';
import { ComfyuiWorkflowEntity } from '@/database/entities/comfyui/comfyui-workflow.entity';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { PageInstanceType } from '@/database/entities/workflow/workflow-page';
import fs from 'fs';
import path from 'path';
import { LLM_CHAT_COMPLETION_TOOL, LLM_COMPLETION_TOOL, LLM_NAMESPACE } from '../tools/llm/llm.controller';

export interface WorkflowMarketplaceData extends WorkflowMetadataEntity {
  tags: string[];
  autoPinPage?: Record<'default' | string, PageInstanceType[]>[];
}

let rawBuiltInMarketList = [];
if (process.env.MONKEYS_BUILT_IN_MARKET_FILE) {
  rawBuiltInMarketList = [path.resolve(process.env.MONKEYS_CONFIG_FILE)];
} else {
  rawBuiltInMarketList = [path.resolve('/etc/monkeys/builtInMarket.json'), path.resolve('./builtInMarket.json'), path.resolve('./builtInMarket.example.json')];
}

rawBuiltInMarketList = rawBuiltInMarketList
  .filter(Boolean)
  .filter(fs.existsSync)
  .map((file) => fs.readFileSync(file, 'utf-8'))
  .map((content) =>
    content
      .replace(/\{\{LLM_CHAT_COMPLETION_TOOL\}\}/g, LLM_CHAT_COMPLETION_TOOL)
      .replace(/\{\{LLM_COMPLETION_TOOL\}\}/g, LLM_COMPLETION_TOOL)
      .replace(/\{\{LLM_NAMESPACE\}\}/g, LLM_NAMESPACE),
  )
  .map((content) => JSON.parse(content));

export const builtInMarketList = rawBuiltInMarketList.reduce((acc, current) => {
  for (const key in current) {
    if (Array.isArray(current[key])) {
      acc[key] = acc[key] ? acc[key].concat(current[key]) : [...current[key]];
    } else {
      acc[key] = current[key];
    }
  }
  return acc;
}, {}) as BuiltInMarket;

export const BUILT_IN_WORKFLOW_MARKETPLACE_LIST: Array<Partial<WorkflowMarketplaceData>> = builtInMarketList.workflows;

export interface ComfyUIWorkflowWorkflowMarketplaceData extends ComfyuiWorkflowEntity {
  tags: string[];
}
