import { config } from '@/common/config';
import { BuiltInMarket } from '@/common/typings/asset';
import { ComfyuiWorkflowEntity } from '@/database/entities/comfyui/comfyui-workflow.entity';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { PageInstanceType } from '@/database/entities/workflow/workflow-page';
import fs from 'fs';
import path from 'path';
import { LLM_CHAT_COMPLETION_TOOL, LLM_COMPLETION_TOOL, LLM_NAMESPACE } from '../tools/llm/llm.controller';
import { INTERNAL_BUILT_IN_MARKET } from './consts';

export type WorkflowAutoPinPage = Record<'default' | string, PageInstanceType[]>[];
export interface WorkflowMarketplaceData extends WorkflowMetadataEntity {
  tags: string[];
  autoPinPage?: WorkflowAutoPinPage;
}

// 新增：基于 appId 的分组策略配置
export interface AppIdGroupStrategy {
  // 分组名称映射
  groupNameMap: Record<string, string>;
  // 分组排序
  groupSortOrder: string[];
  // 应用在分组内的排序
  appSortOrder: Record<string, string[]>;
  // 默认分组名称
  defaultGroupName: string;
}

// 从配置文件读取分组策略
function loadAppIdGroupStrategy(): AppIdGroupStrategy {
  // 尝试从配置文件读取自定义分组策略
  const configPaths = [
    process.env.MONKEYS_APP_ID_GROUP_STRATEGY_FILE,
    path.resolve(`/etc/monkeys/appIdGroupStrategy.${config.server.appId}.json`),
    path.resolve(`./appIdGroupStrategy.${config.server.appId}.json`),
    path.resolve('/etc/monkeys/appIdGroupStrategy.json'),
    path.resolve('./appIdGroupStrategy.json'),
  ].filter(Boolean);

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const customStrategy = JSON.parse(content);
        return { ...DEFAULT_APP_ID_GROUP_STRATEGY, ...customStrategy };
      } catch (error) {
        console.warn(`Failed to load app ID group strategy from ${configPath}:`, error);
      }
    }
  }

  return DEFAULT_APP_ID_GROUP_STRATEGY;
}

// 默认分组策略配置
export const DEFAULT_APP_ID_GROUP_STRATEGY: AppIdGroupStrategy = {
  groupNameMap: {
    'llm': 'AI 对话',
    'image': '图像生成',
    'productivity': '效率工具',
    'content': '内容创作',
    'hr': '人力资源',
    'marketing': '内容营销',
    'translation': '翻译工具',
  },
  groupSortOrder: ['llm', 'image', 'productivity', 'content', 'hr', 'marketing', 'translation'],
  appSortOrder: {
    'llm': ['662a1c620b9fd2739ab8d3a6', '662a1c620b9fd2739ab8d3a7', '664f1e0db10cb3ffc558437a'],
    'image': ['665569753c72460540612445'],
    'productivity': ['66f12ee6480ed9e2e4999ef0', '66f12ee6bee1ed58fe23ea3d', '66f12ee6a15ef950b20f3e0d', '66f12ee61d4f6d54f3746d16', '66f12ee675d6716210bda905'],
    'content': ['66f12ee64acf0df5bac31fb2', '66f12ee60d1196e612a3e16a', '66f12ee654ae41d344264a26', '66f12ee669a327496f4863ec', '66f12ee6269595890b32a18a', '66f12ee6a708208b3e68b0fb', '66f12ee636c9b0a7b638d287', '66f12ee64a28439a2526aee4'],
    'hr': ['66f12ee684163d972e05a92e', '66f12ee69aca5420e6d524a1', '66f12ee623dcd505ef621063'],
    'marketing': ['66f12ee6ef2105aa0ffd4579', '66f12ee6144dbfa69b10f02f', '66f12ee69baf25f4d2f3c47f', '66f12ee604f72ddcc3e9b428', '66f12ee64ff03a9ade4832b4', '66f12ee6d96ef9b98204a77c', '66f12ee6ab287d0112e36195', '66f12ee65029ed4c91c25d60', '66f12ee61bffae9beb0adb44', '66f12ee64e9326dab341a33b', '66f12ee67d773ab9dd4789e4', '66f12ee6d66034fb571ec830', '66f12ee6677226bbda4e5a6d'],
    'translation': ['66f12ee64ff03a9ade4832b4', '66f12ee61bffae9beb0adb44', '66f12ee64e9326dab341a33b'],
  },
  defaultGroupName: '其他应用',
};

// 加载实际使用的分组策略
export const APP_ID_GROUP_STRATEGY = loadAppIdGroupStrategy();

// 根据 appId 获取分组名称
export function getGroupNameByAppId(appId: string, strategy: AppIdGroupStrategy = APP_ID_GROUP_STRATEGY): string {
  for (const [groupKey, appIds] of Object.entries(strategy.appSortOrder)) {
    if (appIds.includes(appId)) {
      return strategy.groupNameMap[groupKey] || groupKey;
    }
  }
  return strategy.defaultGroupName;
}

// 根据 appId 获取分组键
export function getGroupKeyByAppId(appId: string, strategy: AppIdGroupStrategy = APP_ID_GROUP_STRATEGY): string {
  for (const [groupKey, appIds] of Object.entries(strategy.appSortOrder)) {
    if (appIds.includes(appId)) {
      return groupKey;
    }
  }
  return 'default';
}

// 获取应用在分组内的排序索引
export function getAppSortIndex(appId: string, strategy: AppIdGroupStrategy = APP_ID_GROUP_STRATEGY): number {
  const groupKey = getGroupKeyByAppId(appId, strategy);
  const appIds = strategy.appSortOrder[groupKey] || [];
  const index = appIds.indexOf(appId);
  return index >= 0 ? index : 999999; // 未找到的应用排在最后
}

// 获取分组的排序索引
export function getGroupSortIndex(groupKey: string, strategy: AppIdGroupStrategy = APP_ID_GROUP_STRATEGY): number {
  const index = strategy.groupSortOrder.indexOf(groupKey);
  return index >= 0 ? index : 999999; // 未找到的分组排在最后
}

let rawBuiltInMarketList = [];
if (process.env.MONKEYS_BUILT_IN_MARKET_FILE) {
  rawBuiltInMarketList = [path.resolve(process.env.MONKEYS_BUILT_IN_MARKET_FILE)];
} else {
  const appBuiltInMarketFileList = [path.resolve(`/etc/monkeys/builtInMarket.${config.server.appId}.json`), path.resolve(`./builtInMarket.${config.server.appId}.json`)];
  rawBuiltInMarketList = appBuiltInMarketFileList.some(fs.existsSync) ? appBuiltInMarketFileList : [path.resolve('/etc/monkeys/builtInMarket.json'), path.resolve('./builtInMarket.json')];
}

rawBuiltInMarketList = rawBuiltInMarketList
  .filter(Boolean)
  .filter(fs.existsSync)
  .map((file) => fs.readFileSync(file, 'utf-8'));

rawBuiltInMarketList.push(JSON.stringify(INTERNAL_BUILT_IN_MARKET));

rawBuiltInMarketList = rawBuiltInMarketList
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

const overwriteWorkflowIds = builtInMarketList['overwrite-workflows']?.map((ow) => ow.id);

export const PAGE_GROUP_SORT_LIST = builtInMarketList['page-group-sorts'] ?? [];

export const BUILT_IN_WORKFLOW_MARKETPLACE_LIST: Array<Partial<WorkflowMarketplaceData>> = overwriteWorkflowIds
  ? builtInMarketList.workflows.map((w) => {
      if (overwriteWorkflowIds.includes(w.id)) {
        const ow = builtInMarketList['overwrite-workflows'].find((ow) => ow.id === w.id);
        return {
          ...w,
          ...ow,
        };
      }
      return w;
    })
  : builtInMarketList.workflows;
export const BUILT_IN_COMFYUI_WORKFLOW_MARKETPLACE_LIST: Array<Partial<ComfyuiWorkflowEntity>> = builtInMarketList['comfyui-workflows'];

export interface ComfyUIWorkflowWorkflowMarketplaceData extends ComfyuiWorkflowEntity {
  tags: string[];
}
