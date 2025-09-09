/**
 * Agent V2 工具相关常量定义
 */

// Agent V2 内置工具列表 - 这些工具不受配置控制，始终可用
export const AGENT_V2_BUILTIN_TOOLS = ['ask_followup_question', 'attempt_completion', 'update_todo_list', 'web_search'] as const;

// 工具分类定义
export const AGENT_V2_TOOL_CATEGORIES = {
  BUILTIN: 'builtin', // 内置工具
  EXTERNAL: 'external', // 外部工具
  SYSTEM: 'system', // 系统工具
} as const;

// 工具类型定义
export type AgentV2BuiltinTool = (typeof AGENT_V2_BUILTIN_TOOLS)[number];
export type AgentV2ToolCategory = (typeof AGENT_V2_TOOL_CATEGORIES)[keyof typeof AGENT_V2_TOOL_CATEGORIES];

// 内置工具的显示信息
export const AGENT_V2_BUILTIN_TOOL_INFO = {
  ask_followup_question: {
    displayName: 'Ask Followup Question',
    description: '询问用户获取更多信息',
    category: AGENT_V2_TOOL_CATEGORIES.BUILTIN,
  },
  attempt_completion: {
    displayName: 'Attempt Completion',
    description: '完成任务并提供最终结果',
    category: AGENT_V2_TOOL_CATEGORIES.BUILTIN,
  },
  update_todo_list: {
    displayName: 'Update Todo List',
    description: '更新任务列表和进度跟踪',
    category: AGENT_V2_TOOL_CATEGORIES.BUILTIN,
  },
  web_search: {
    displayName: 'Web Search',
    description: '搜索互联网获取最新信息',
    category: AGENT_V2_TOOL_CATEGORIES.BUILTIN,
  },
} as const;

// 检查是否为内置工具的辅助函数
export function isAgentV2BuiltinTool(toolName: string): toolName is AgentV2BuiltinTool {
  return AGENT_V2_BUILTIN_TOOLS.includes(toolName as AgentV2BuiltinTool);
}
