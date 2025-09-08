import { useCallback, useEffect, useState } from 'react';

import { IAgentV2ChatMessage } from '@/apis/agents-v2/chat';
import { parseAgentV2Response } from '@/utils/agent-v2-response-parser';
import { ITodoUpdateItem, parseTodoUpdateContent } from '@/utils/todo-update-parser';

export interface ILiveTodoState {
  currentTodos: ITodoUpdateItem[];
  hasActiveTodos: boolean;
  latestUpdate: string | null;
  animationVersion: number; // 用于触发动画更新
  isStreaming: boolean; // 是否正在流式更新
  updateHistory: Array<{
    timestamp: number;
    todos: ITodoUpdateItem[];
    messageId: string;
  }>; // 历史更新记录
}

export const useLiveTodoTracker = (messages: IAgentV2ChatMessage[]) => {
  const [todoState, setTodoState] = useState<ILiveTodoState>({
    currentTodos: [],
    hasActiveTodos: false,
    latestUpdate: null,
    animationVersion: 0,
    isStreaming: false,
    updateHistory: [],
  });

  // 从消息中提取todo更新序列
  const extractTodoSequence = useCallback((messages: IAgentV2ChatMessage[]) => {
    const todoUpdates: Array<{
      timestamp: number;
      messageId: string;
      todosText: string;
      todos: ITodoUpdateItem[];
    }> = [];

    // 按时间顺序处理消息
    const sortedMessages = [...messages]
      .filter((msg) => msg.role === 'assistant')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    sortedMessages.forEach((message) => {
      if (!message.content) return;

      const parsed = parseAgentV2Response(message.content);

      // 如果这条消息包含todo更新
      if (parsed.todoUpdate) {
        const todos = parseTodoUpdateContent(parsed.todoUpdate.todosText);

        // 只有解析出有效todo项时才添加
        if (todos.length > 0) {
          todoUpdates.push({
            timestamp: message.createdAt.getTime(),
            messageId: message.id,
            todosText: parsed.todoUpdate.todosText,
            todos,
          });
        }
      }

      // 额外检查工具调用中的todo更新
      if (message.toolCalls) {
        message.toolCalls.forEach((toolCall) => {
          if (toolCall.name === 'update_todo_list') {
            let todosText = '';

            // 优先使用参数中的todos，因为result通常包含系统消息而不是纯粹的todo项
            if (toolCall.params?.todos) {
              todosText = toolCall.params.todos;
            } else if (toolCall.result) {
              // 如果结果中包含todo格式，尝试提取
              const todoMatch = toolCall.result.match(/^\[[\sx-]\].*/gm);
              if (todoMatch) {
                todosText = todoMatch.join('\n');
              } else {
                todosText = toolCall.result;
              }
            }

            if (todosText) {
              const todos = parseTodoUpdateContent(todosText);

              // 只有解析出有效todo项时才添加
              if (todos.length > 0) {
                // 避免重复添加（检查是否已经通过消息内容添加过）
                const existingUpdate = todoUpdates.find((update) => update.messageId === message.id);
                if (!existingUpdate) {
                  todoUpdates.push({
                    timestamp: message.createdAt.getTime(),
                    messageId: message.id,
                    todosText,
                    todos,
                  });
                } else if (existingUpdate.todos.length === 0 && todos.length > 0) {
                  // 如果现有更新是空的，但新的有内容，则替换
                  existingUpdate.todos = todos;
                  existingUpdate.todosText = todosText;
                }
              }
            }
          }
        });
      }
    });

    return todoUpdates;
  }, []);

  // 简化的合并todo状态逻辑
  const mergeTodoStates = useCallback(
    (updates: ReturnType<typeof extractTodoSequence>, messages: IAgentV2ChatMessage[]) => {
      if (updates.length === 0) {
        return {
          currentTodos: [],
          hasActiveTodos: false,
          latestUpdate: null,
          updateHistory: [],
          isStreaming: false,
        };
      }

      // 使用最新的更新作为当前状态
      const latestUpdate = updates[updates.length - 1];
      const currentTodos = latestUpdate.todos;

      // 构建更新历史 - 简化版本
      const updateHistory = updates.map((update) => ({
        timestamp: update.timestamp,
        todos: update.todos,
        messageId: update.messageId,
      }));

      // 检查是否有消息正在流式传输
      const hasStreamingMessage = messages.some((msg) => msg.role === 'assistant' && msg.isStreaming);

      return {
        currentTodos,
        hasActiveTodos: currentTodos.length > 0,
        latestUpdate: latestUpdate.todosText,
        updateHistory,
        isStreaming: hasStreamingMessage,
      };
    },
    [],
  );

  // 检测todo变化并触发动画
  const checkForChanges = useCallback((newState: Omit<ILiveTodoState, 'animationVersion'>) => {
    setTodoState((prevState) => {
      const hasChanges =
        prevState.latestUpdate !== newState.latestUpdate ||
        prevState.currentTodos.length !== newState.currentTodos.length ||
        prevState.currentTodos.some((todo, index) => newState.currentTodos[index]?.completed !== todo.completed);

      if (hasChanges) {
        return {
          ...newState,
          animationVersion: prevState.animationVersion + 1,
        };
      }

      return prevState;
    });
  }, []);

  // 处理消息变化
  useEffect(() => {
    const todoUpdates = extractTodoSequence(messages);
    const mergedState = mergeTodoStates(todoUpdates, messages);
    checkForChanges(mergedState);
  }, [messages, extractTodoSequence, mergeTodoStates, checkForChanges]);

  // 手动触发动画更新（用于流式消息）
  const triggerAnimation = useCallback(() => {
    setTodoState((prev) => ({
      ...prev,
      animationVersion: prev.animationVersion + 1,
    }));
  }, []);

  return {
    ...todoState,
    triggerAnimation,
  };
};
