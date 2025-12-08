import { I18nValue } from '@inf-monkeys/monkeys';

/**
 * 工作流场景模板接口
 */
export interface WorkflowTemplate {
  /** 场景标识 */
  scenario: string;

  /** 显示名称 */
  displayName: I18nValue;

  /** 场景描述 */
  description: I18nValue;

  /** 所需的工具完整名称列表 */
  requiredTools: string[];

  /** 完整的工作流示例（包含正确的工具名称和参数结构） */
  workflowExample: WorkflowExampleJson;

  /** 用户提示词示例 */
  userPromptExample: string;

  /** 场景关键词（用于匹配） */
  keywords: string[];
}

/**
 * 工作流示例JSON结构
 */
export interface WorkflowExampleJson {
  displayName: I18nValue;
  description: I18nValue;
  iconUrl: string;
  variables: any[];
  tasks: any[];
  output: Array<{ key: string; value: string }>;
}
