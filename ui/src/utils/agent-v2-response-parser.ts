// Agent V2 响应内容解析器
// 解析模型响应中的结构化 XML 标签

export interface IParsedTodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}

export interface IParsedFollowupQuestion {
  question: string;
  suggestions: string[];
}

export interface IParsedTaskCompletion {
  result: string;
}

export interface IParsedTodoUpdate {
  todosText: string;
}

export interface IParsedWebSearchResult {
  query: string;
  results: string;
}

export interface IParsedSegment {
  id: string;
  type: 'text' | 'todo_update' | 'task_completion' | 'followup_question' | 'web_search_result';
  content: string;
  data?: any; // 结构化数据
  timestamp: number;
}

export interface IParsedAgentResponse {
  content: string; // 清理后的主要内容
  segments: IParsedSegment[]; // 分段内容
  todoItems: IParsedTodoItem[];
  followupQuestion?: IParsedFollowupQuestion;
  taskCompletion?: IParsedTaskCompletion;
  todoUpdate?: IParsedTodoUpdate;
  webSearchResult?: IParsedWebSearchResult;
  toolCalls?: string[]; // 工具调用的文本描述
}

// 解析 todo list 标签
export const parseTodoList = (text: string): IParsedTodoItem[] => {
  const todoItems: IParsedTodoItem[] = [];

  // 匹配 <todo>...</todo> 块
  const todoRegex = /<todo>([\s\S]*?)<\/todo>/gi;
  let todoMatch;

  while ((todoMatch = todoRegex.exec(text)) !== null) {
    const todoContent = todoMatch[1];

    // 解析各个 todo item
    const itemRegex =
      /<item\s*(?:id="([^"]*)")?\s*(?:status="([^"]*)")?\s*(?:priority="([^"]*)")?>([\s\S]*?)<\/item>/gi;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(todoContent)) !== null) {
      const [, id, status, priority, content] = itemMatch;

      todoItems.push({
        id: id || `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        status: (status as IParsedTodoItem['status']) || 'pending',
        priority: priority as IParsedTodoItem['priority'],
      });
    }
  }

  return todoItems;
};

// 解析 followup question 标签
export const parseFollowupQuestion = (text: string): IParsedFollowupQuestion | undefined => {
  // 匹配 <ask_followup_question>...</ask_followup_question>
  const followupRegex = /<ask_followup_question>([\s\S]*?)<\/ask_followup_question>/i;
  const followupMatch = followupRegex.exec(text);

  if (!followupMatch) return undefined;

  const followupContent = followupMatch[1];

  // 提取问题文本（在 <question>...</question> 之间）
  const questionRegex = /<question>([\s\S]*?)<\/question>/i;
  const questionMatch = questionRegex.exec(followupContent);

  if (!questionMatch) return undefined;

  const question = questionMatch[1].trim();

  // 提取建议选项（在 <follow_up> 标签内的 <suggest>...</suggest> 标签）
  const suggestions: string[] = [];

  // 先找到 follow_up 块
  const followUpRegex = /<follow_up>([\s\S]*?)<\/follow_up>/i;
  const followUpMatch = followUpRegex.exec(followupContent);

  if (followUpMatch) {
    const followUpContent = followUpMatch[1];
    const suggestRegex = /<suggest>([\s\S]*?)<\/suggest>/gi;
    let suggestMatch;

    while ((suggestMatch = suggestRegex.exec(followUpContent)) !== null) {
      const suggestion = suggestMatch[1].trim();
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
  }

  return {
    question,
    suggestions,
  };
};

// 解析任务完成标签
export const parseTaskCompletion = (text: string): IParsedTaskCompletion | undefined => {
  // 匹配 <attempt_completion>...</attempt_completion>
  const completionRegex = /<attempt_completion>([\s\S]*?)<\/attempt_completion>/i;
  const completionMatch = completionRegex.exec(text);

  if (!completionMatch) return undefined;

  const completionContent = completionMatch[1];

  // 提取结果内容（在 <result>...</result> 之间）
  const resultRegex = /<result>([\s\S]*?)<\/result>/i;
  const resultMatch = resultRegex.exec(completionContent);

  if (!resultMatch) return undefined;

  const result = resultMatch[1].trim();

  return {
    result,
  };
};

// 解析 update_todo_list 标签
export const parseTodoUpdate = (text: string): IParsedTodoUpdate | undefined => {
  // 匹配 <update_todo_list>...</update_todo_list>
  const updateRegex = /<update_todo_list>([\s\S]*?)<\/update_todo_list>/i;
  const updateMatch = updateRegex.exec(text);

  if (!updateMatch) return undefined;

  const updateContent = updateMatch[1];

  // 提取 todos 内容（在 <todos>...</todos> 之间）
  const todosRegex = /<todos>([\s\S]*?)<\/todos>/i;
  const todosMatch = todosRegex.exec(updateContent);

  if (!todosMatch) return undefined;

  const todosText = todosMatch[1].trim();

  return {
    todosText,
  };
};

// 解析 web_search_result 标签
export const parseWebSearchResult = (text: string): IParsedWebSearchResult | undefined => {
  // 匹配 <web_search_result>...</web_search_result>
  const searchRegex = /<web_search_result>([\s\S]*?)<\/web_search_result>/i;
  const searchMatch = searchRegex.exec(text);

  if (!searchMatch) return undefined;

  const searchContent = searchMatch[1];

  // 提取 query 内容（在 <query>...</query> 之间）
  const queryRegex = /<query>([\s\S]*?)<\/query>/i;
  const queryMatch = queryRegex.exec(searchContent);

  // 提取 results 内容（在 <results>...</results> 之间）
  const resultsRegex = /<results>([\s\S]*?)<\/results>/i;
  const resultsMatch = resultsRegex.exec(searchContent);

  if (!resultsMatch) return undefined;

  const query = queryMatch ? queryMatch[1].trim() : '';
  const results = resultsMatch[1].trim();

  return {
    query,
    results,
  };
};

// 解析工具调用标签
export const parseToolCalls = (text: string): string[] => {
  const toolCalls: string[] = [];

  // 匹配各种工具调用标签格式
  const toolPatterns = [/<tool_call\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/tool_call>/gi, /<(\w+_tool)>([\s\S]*?)<\/\1>/gi];

  toolPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const toolName = match[1];
      const toolContent = match[2];
      toolCalls.push(`调用工具: ${toolName} - ${toolContent.trim().substring(0, 100)}...`);
    }
  });

  return toolCalls;
};

// 清理文本，移除已解析的标签
export const cleanResponseText = (text: string): string => {
  return (
    text
      // 移除 todo 标签
      .replace(/<todo>[\s\S]*?<\/todo>/gi, '')
      // 移除 followup question 标签
      .replace(/<ask_followup_question>[\s\S]*?<\/ask_followup_question>/gi, '')
      // 移除 followup answer 相关标签
      .replace(/<follow_up>[\s\S]*?<\/follow_up>/gi, '')
      // 移除任务完成标签
      .replace(/<attempt_completion>[\s\S]*?<\/attempt_completion>/gi, '')
      // 移除任务更新标签
      .replace(/<update_todo_list>[\s\S]*?<\/update_todo_list>/gi, '')
      // 移除网络搜索结果标签
      .replace(/<web_search_result>[\s\S]*?<\/web_search_result>/gi, '')
      // 移除工具调用标签
      .replace(/<tool_call[^>]*>[\s\S]*?<\/tool_call>/gi, '')
      .replace(/<\w+_tool>[\s\S]*?<\/\w+_tool>/gi, '')
      // 清理多余的空白行
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  );
};

// 解析内容分段
export const parseContentSegments = (content: string): IParsedSegment[] => {
  const segments: IParsedSegment[] = [];
  let currentIndex = 0;
  const timestamp = Date.now();

  // 按顺序查找各种标签的位置
  const patterns = [
    { type: 'todo_update' as const, regex: /<update_todo_list>[\s\S]*?<\/update_todo_list>/gi },
    { type: 'task_completion' as const, regex: /<attempt_completion>[\s\S]*?<\/attempt_completion>/gi },
    { type: 'followup_question' as const, regex: /<ask_followup_question>[\s\S]*?<\/ask_followup_question>/gi },
    { type: 'web_search_result' as const, regex: /<web_search_result>[\s\S]*?<\/web_search_result>/gi },
  ];

  // 收集所有标签的匹配位置
  const matches: Array<{ start: number; end: number; type: IParsedSegment['type']; match: string }> = [];

  patterns.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: pattern.type,
        match: match[0],
      });
    }
  });

  // 按出现顺序排序
  matches.sort((a, b) => a.start - b.start);

  // 分割内容
  matches.forEach((tagMatch) => {
    // 添加标签前的文本内容
    if (currentIndex < tagMatch.start) {
      const textContent = content.slice(currentIndex, tagMatch.start).trim();
      if (textContent) {
        segments.push({
          id: `text-${segments.length}`,
          type: 'text',
          content: textContent,
          timestamp: timestamp + segments.length,
        });
      }
    }

    // 添加标签内容
    let parsedData: any;
    switch (tagMatch.type) {
      case 'todo_update':
        parsedData = parseTodoUpdate(tagMatch.match);
        break;
      case 'task_completion':
        parsedData = parseTaskCompletion(tagMatch.match);
        break;
      case 'followup_question':
        parsedData = parseFollowupQuestion(tagMatch.match);
        break;
      case 'web_search_result':
        parsedData = parseWebSearchResult(tagMatch.match);
        break;
    }

    segments.push({
      id: `${tagMatch.type}-${segments.length}`,
      type: tagMatch.type,
      content: tagMatch.match,
      data: parsedData,
      timestamp: timestamp + segments.length,
    });

    currentIndex = tagMatch.end;
  });

  // 添加剩余的文本内容
  if (currentIndex < content.length) {
    const remainingContent = content.slice(currentIndex).trim();
    if (remainingContent) {
      segments.push({
        id: `text-${segments.length}`,
        type: 'text',
        content: remainingContent,
        timestamp: timestamp + segments.length,
      });
    }
  }

  // 如果没有找到任何标签，将整个内容作为文本段
  if (segments.length === 0 && content.trim()) {
    segments.push({
      id: 'text-0',
      type: 'text',
      content: content.trim(),
      timestamp: timestamp,
    });
  }

  return segments;
};

// 主解析函数
export const parseAgentV2Response = (content: string): IParsedAgentResponse => {
  const segments = parseContentSegments(content);
  const todoItems = parseTodoList(content);
  const followupQuestion = parseFollowupQuestion(content);
  const taskCompletion = parseTaskCompletion(content);
  const todoUpdate = parseTodoUpdate(content);
  const webSearchResult = parseWebSearchResult(content);
  const toolCalls = parseToolCalls(content);
  const cleanedContent = cleanResponseText(content);

  return {
    content: cleanedContent,
    segments,
    todoItems,
    followupQuestion,
    taskCompletion,
    todoUpdate,
    webSearchResult,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  };
};
