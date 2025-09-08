// SSE事件解析器 - 处理新的Agent V2 SSE事件格式
// 解析工具调用结果并转换为UI组件可用的数据格式

import { ITodoUpdateItem } from '@/utils/todo-update-parser';

export interface ISSEToolCall {
  id: string;
  name: string;
  params: Record<string, any>;
}

export interface ISSEToolResult {
  tool: ISSEToolCall;
  result: {
    output: string;
  };
}

export interface IParsedWebSearchResult {
  query: string;
  results: ISearchResultItem[];
  summary?: string;
}

export interface ISearchResultItem {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface IParsedToolResult {
  type: 'todo_update' | 'web_search_result' | 'task_completion' | 'unknown_tool';
  data: any;
  rawOutput: string;
}

// 解析工具执行结果
export const parseToolResult = (toolResult: ISSEToolResult): IParsedToolResult => {
  const { tool, result } = toolResult;

  switch (tool.name) {
    case 'update_todo_list':
      return {
        type: 'todo_update',
        data: parseTodoFromText(result.output),
        rawOutput: result.output,
      };

    case 'web_search':
      return {
        type: 'web_search_result',
        data: parseWebSearchResult(result.output, tool.params?.query),
        rawOutput: result.output,
      };

    case 'attempt_completion':
      return {
        type: 'task_completion',
        data: {
          result: tool.params?.result || result.output,
        },
        rawOutput: result.output,
      };

    default:
      return {
        type: 'unknown_tool',
        data: {
          toolName: tool.name,
          params: tool.params,
          output: result.output,
        },
        rawOutput: result.output,
      };
  }
};

// 解析todo文本格式
// 支持格式: "[x] 任务1\n[-] 任务2\n[ ] 任务3" 或纯文本行
export const parseTodoFromText = (todoText: string): ITodoUpdateItem[] => {
  if (!todoText || !todoText.trim()) {
    return [];
  }

  const lines = todoText.split('\n').filter((line) => line.trim());

  return lines.map((line, index) => {
    // 尝试匹配markdown checkbox格式: [x], [-], [ ]
    const checkboxMatch = line.match(/^\[(.)\]\s*(.+)$/);
    if (checkboxMatch) {
      const [, statusChar, content] = checkboxMatch;
      let status: 'pending' | 'in_progress' | 'completed';
      let completed = false;

      switch (statusChar.toLowerCase()) {
        case 'x':
          status = 'completed';
          completed = true;
          break;
        case '-':
          status = 'in_progress';
          completed = false;
          break;
        default:
          status = 'pending';
          completed = false;
      }

      return {
        id: `todo-${Date.now()}-${index}`,
        content: content.trim(),
        status,
        completed,
      };
    }

    // 如果不是checkbox格式，当作普通待处理任务
    return {
      id: `todo-${Date.now()}-${index}`,
      content: line.trim(),
      status: 'pending' as const,
      completed: false,
    };
  });
};

// 解析网络搜索结果
export const parseWebSearchResult = (searchOutput: string | any, query?: string): IParsedWebSearchResult => {
  const result: IParsedWebSearchResult = {
    query: query || '',
    results: [],
    summary: undefined,
  };

  try {
    // 确保searchOutput是字符串
    const searchText = typeof searchOutput === 'string' ? searchOutput : String(searchOutput || '');

    if (!searchText || searchText.trim() === '') {
      return result;
    }

    // 尝试解析结构化的搜索结果
    if (searchText.includes('## Web Search Results') || searchText.includes('##')) {
      // 解析包含标题和链接的搜索结果格式
      const resultItems: ISearchResultItem[] = [];

      // 匹配markdown链接格式: [title](url) 或 **title**: content
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)|(\*\*[^*]+\*\*):([^*]+)/g;
      let match;

      while ((match = linkRegex.exec(searchText)) !== null) {
        if (match[1] && match[2]) {
          // 标准链接格式 [title](url)
          resultItems.push({
            title: match[1].trim(),
            url: match[2].trim(),
            snippet: '',
            source: extractDomain(match[2]),
          });
        } else if (match[3] && match[4]) {
          // 粗体标题格式 **title**: content
          const title = match[3].replace(/\*\*/g, '').trim();
          const content = match[4].trim();

          resultItems.push({
            title: title,
            url: '',
            snippet: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
            source: title,
          });
        }
      }

      result.results = resultItems;

      // 提取摘要 - 通常在开头或结尾
      const summaryMatch = searchText.match(/(?:摘要|总结|Summary)[：:]\s*([^#\n]+)/i);
      if (summaryMatch) {
        result.summary = summaryMatch[1].trim();
      }
    } else {
      // 如果不是结构化格式，将整个输出作为摘要
      result.summary = searchText.substring(0, 500) + (searchText.length > 500 ? '...' : '');
      result.results = [];
    }
  } catch (error) {
    // 解析失败时，将原始输出作为摘要
    const fallbackText = typeof searchOutput === 'string' ? searchOutput : String(searchOutput || '');
    result.summary = fallbackText.substring(0, 500) + (fallbackText.length > 500 ? '...' : '');
    result.results = [];
  }

  return result;
};

// 从URL中提取域名
const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
};

// 检查SSE事件是否为工具相关事件
export const isToolEvent = (eventType: string): boolean => {
  return ['tool_calls', 'tool_result'].includes(eventType);
};

// 检查SSE事件是否为消息相关事件
export const isMessageEvent = (eventType: string): boolean => {
  return ['message_chunk', 'response_complete'].includes(eventType);
};

// 检查SSE事件是否为会话控制事件
export const isSessionEvent = (eventType: string): boolean => {
  return ['session_start', 'session_metadata', 'heartbeat'].includes(eventType);
};

// 检查工具是否需要UI展示
export const shouldShowToolInUI = (toolName: string): boolean => {
  return ['update_todo_list', 'web_search', 'attempt_completion'].includes(toolName);
};

// 提取工具调用的简短描述
export const getToolCallDescription = (toolCall: ISSEToolCall): string => {
  switch (toolCall.name) {
    case 'update_todo_list':
      return '更新任务列表';
    case 'web_search':
      return `搜索: ${toolCall.params?.query || ''}`;
    case 'attempt_completion':
      return '尝试完成任务';
    default:
      return `调用工具: ${toolCall.name}`;
  }
};
