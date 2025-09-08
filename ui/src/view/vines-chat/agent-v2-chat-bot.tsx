import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, MessageSquareDashed, Send, Wifi, WifiOff } from 'lucide-react';

import { IAgentV2ChatMessage } from '@/apis/agents-v2/chat';
import { IVinesMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat';
import { VirtuaChatBotMessages } from '@/components/layout/workspace/vines-view/chat/chat-bot/virtua-messages';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { AgentV2FollowupQuestion } from '@/components/ui/agent-v2-followup-question';
import { AgentV2SearchResults } from '@/components/ui/agent-v2-search-results';
import { AgentV2StreamingTodo } from '@/components/ui/agent-v2-streaming-todo';
import { AgentV2TaskCompletion } from '@/components/ui/agent-v2-task-completion';
import { AgentV2TodoList } from '@/components/ui/agent-v2-todo-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AutosizeTextarea } from '@/components/ui/autosize-textarea.tsx';
import { Button } from '@/components/ui/button';
import { VinesLoading } from '@/components/ui/loading';
import { DEFAULT_AGENT_ICON_URL } from '@/consts/icons.ts';
import { useAgentV2Chat } from '@/hooks/use-agent-v2-chat';
import { useLiveTodoTracker } from '@/hooks/use-live-todo-tracker';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { useSubmitHandler } from '@/hooks/use-submit-handler.ts';
import { IParsedTaskCompletion, IParsedTodoItem, parseAgentV2Response } from '@/utils/agent-v2-response-parser';
import { IParsedWebSearchResult, parseWebSearchResult } from '@/utils/sse-event-parser';

interface IAgentV2ChatModeProps {
  agentId: string;
  sessionId?: string; // 可选的特定session ID，用于加载历史消息
  botPhoto?: string;
  height: number;
}

// 转换消息格式以适配现有的消息显示组件
const convertToVinesMessage = (message: IAgentV2ChatMessage): IVinesMessage | null => {
  // 如果是助手消息，解析其内容
  if (message.role === 'assistant' && message.content) {
    const parsedResponse = parseAgentV2Response(message.content);

    // 检查是否有实际的文本内容
    const textSegments = parsedResponse.segments.filter((segment) => segment.type === 'text');
    const hasTextContent = textSegments.some((segment) => segment.content.trim().length > 0);

    let combinedContent = '';

    if (hasTextContent) {
      // 如果有文本内容，使用文本内容
      combinedContent = textSegments.map((segment) => segment.content).join('\n\n');
    } else {
      // 如果没有文本内容，但有工具调用，生成简短的描述
      const toolDescriptions: string[] = [];

      if (parsedResponse.todoUpdate) {
        toolDescriptions.push('📝 更新了任务列表');
      }
      if (parsedResponse.webSearchResult) {
        toolDescriptions.push(`🔍 搜索了: ${parsedResponse.webSearchResult.query || '相关信息'}`);
      }
      if (parsedResponse.taskCompletion) {
        toolDescriptions.push('✅ 完成了任务');
      }
      if (parsedResponse.toolCalls && parsedResponse.toolCalls.length > 0) {
        toolDescriptions.push(`🔧 执行了 ${parsedResponse.toolCalls.length} 个工具调用`);
      }

      // 检查工具调用中的具体工具类型
      if (message.toolCalls && message.toolCalls.length > 0) {
        message.toolCalls.forEach((toolCall) => {
          if (toolCall.name === 'update_todo_list') {
            toolDescriptions.push('📝 更新了任务列表');
          } else if (toolCall.name === 'web_search') {
            toolDescriptions.push(`🔍 搜索了: ${toolCall.params?.query || '相关信息'}`);
          } else if (toolCall.name === 'attempt_completion') {
            toolDescriptions.push('✅ 完成了任务');
          }
        });
      }

      if (toolDescriptions.length > 0) {
        combinedContent = toolDescriptions.join('，');
      } else {
        // 完全没有内容，使用原始内容或过滤掉
        const rawContent = parsedResponse.content || message.content;
        combinedContent = typeof rawContent === 'string' ? rawContent : '';

        // 如果内容包含 [object Object]，尝试从工具调用中提取信息
        if (combinedContent.includes('[object Object]') && message.toolCalls) {
          const toolInfo = message.toolCalls.map((call) => `${call.name}(${call.params?.query || ''})`).join(', ');
          combinedContent = `执行了工具调用: ${toolInfo}`;
        }
      }
    }

    // 如果最终内容为空或只包含空白字符，过滤掉该消息
    if (!combinedContent.trim()) {
      return null;
    }

    return {
      id: message.id,
      content: combinedContent,
      role: message.role as 'user' | 'assistant',
      createdAt: message.createdAt,
      extra: message.toolCalls || [],
    };
  }

  // 用户消息或系统消息直接转换
  return {
    id: message.id,
    content: message.content,
    role: message.role as 'user' | 'assistant',
    createdAt: message.createdAt,
    extra: message.toolCalls || [],
  };
};

export const AgentV2ChatMode: React.FC<IAgentV2ChatModeProps> = ({
  agentId,
  sessionId: externalSessionId,
  botPhoto = DEFAULT_AGENT_ICON_URL,
  height,
}) => {
  const { userPhoto } = useVinesUser();

  const {
    messages,
    sessionId,
    isConnected,
    isLoading,
    connectionError,
    followupQuestion,
    sendMessage,
    answerFollowup,
    reconnect,
  } = useAgentV2Chat(agentId, externalSessionId);

  const [input, setInput] = useState('');
  const { ref: containerRef, height: containerHeight } = useElementSize();
  const { ref: headerRef, height: headerHeight } = useElementSize();
  const { ref: bottomRef, height: bottomHeight } = useElementSize();

  // 使用实时todo追踪器
  const todoTracker = useLiveTodoTracker(messages);

  // 解析后的结构化内容状态
  const [allTodoItems, setAllTodoItems] = useState<IParsedTodoItem[]>([]);
  const [allTaskCompletions, setAllTaskCompletions] = useState<IParsedTaskCompletion[]>([]);
  const [allSearchResults, setAllSearchResults] = useState<IParsedWebSearchResult[]>([]);
  const [followupLoading, setFollowupLoading] = useState(false);

  // 展开状态控制
  const [todoExpanded, setTodoExpanded] = useState(false);
  const [completionExpanded, setCompletionExpanded] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  // 动态高度测量 - 考虑动画延迟
  const [dynamicHeaderHeight, setDynamicHeaderHeight] = useState(0);
  const [dynamicBottomHeight, setDynamicBottomHeight] = useState(0);

  // 监听动画状态变化，重新测量高度
  useEffect(() => {
    const measureHeights = () => {
      if (headerRef.current) {
        const headerRect = headerRef.current.getBoundingClientRect();
        setDynamicHeaderHeight(headerRect.height);
      }
      if (bottomRef.current) {
        const bottomRect = bottomRef.current.getBoundingClientRect();
        setDynamicBottomHeight(bottomRect.height);
      }
    };

    // 立即测量一次
    measureHeights();

    // 在组件状态变化后延迟测量，确保动画完成
    const timer = setTimeout(measureHeights, 500);

    return () => clearTimeout(timer);
  }, [todoTracker.hasActiveTodos, allTodoItems.length, followupQuestion]);

  // 使用动态测量的高度进行计算
  const effectiveHeaderHeight = Math.max(headerHeight || 0, dynamicHeaderHeight);
  const effectiveBottomHeight = Math.max(bottomHeight || 0, dynamicBottomHeight);

  const calculatedChatHeight =
    containerHeight && effectiveHeaderHeight && effectiveBottomHeight
      ? containerHeight - effectiveHeaderHeight - effectiveBottomHeight
      : height - effectiveHeaderHeight - (effectiveBottomHeight || 120);

  // 转换消息格式，过滤掉null消息
  const vinesMessages = useMemo(() => {
    const converted = messages
      .map((msg) => convertToVinesMessage(msg))
      .filter((msg): msg is IVinesMessage => msg !== null);
    return converted;
  }, [messages]);

  // 解析助手消息中的结构化内容 (包括从消息内容中解析 followup 问题的建议)
  const parsedFollowupQuestion = useMemo(() => {
    if (!followupQuestion) {
      // 如果没有 followup question 了，清除 loading 状态
      setFollowupLoading(false);
      return null;
    }

    // 从最新的消息中解析 followup question 的建议
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.role === 'assistant' && latestMessage.content) {
      const parsed = parseAgentV2Response(latestMessage.content);
      if (parsed.followupQuestion) {
        return parsed.followupQuestion;
      }
    }

    // 如果解析不到，使用 SSE 提供的基本信息
    return {
      question: followupQuestion.question,
      suggestions: followupQuestion.suggestions?.map((s) => (typeof s === 'string' ? s : s.answer)) || [],
    };
  }, [followupQuestion, messages]);

  useMemo(() => {
    const assistantMessages = messages.filter((msg) => msg.role === 'assistant' && msg.content);
    const allTodos: IParsedTodoItem[] = [];
    const allCompletions: IParsedTaskCompletion[] = [];
    const allSearches: IParsedWebSearchResult[] = [];

    // 解析所有助手消息，收集 todo 项目、任务完成和搜索结果
    assistantMessages.forEach((msg) => {
      const parsed = parseAgentV2Response(msg.content);

      // 收集所有 todo 项目
      if (parsed.todoItems.length > 0) {
        allTodos.push(...parsed.todoItems);
      }

      // 收集任务完成
      if (parsed.taskCompletion) {
        allCompletions.push(parsed.taskCompletion);
      }

      // 收集搜索结果
      if (parsed.webSearchResult) {
        // 使用sse-event-parser解析结构化搜索结果
        const searchData = parseWebSearchResult(parsed.webSearchResult.results, parsed.webSearchResult.query);
        allSearches.push(searchData);
      }

      // 额外检查工具调用中的搜索结果
      if (msg.toolCalls) {
        msg.toolCalls.forEach((toolCall) => {
          if (toolCall.name === 'web_search' && toolCall.result) {
            const searchData = parseWebSearchResult(toolCall.result, toolCall.params?.query);
            allSearches.push(searchData);
          }
        });
      }
    });

    setAllTodoItems(allTodos);
    setAllTaskCompletions(allCompletions);
    setAllSearchResults(allSearches);
  }, [messages]);

  // 处理输入提交
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    try {
      await sendMessage(input.trim());
      setInput('');
    } catch (error) {
      // Handle error silently
    }
  }, [input, isLoading, sendMessage]);

  // 使用 submit handler hook
  const { shouldSubmit } = useSubmitHandler();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (shouldSubmit(e)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [shouldSubmit, handleSubmit],
  );

  // 处理 followup 问题回答
  const handleFollowupAnswer = async (answer: string) => {
    setFollowupLoading(true);
    try {
      await answerFollowup(answer);
      // followup 问题状态由 SSE 事件自动清除
    } catch (error) {
      // Handle error silently
    } finally {
      setFollowupLoading(false);
    }
  };

  // 连接状态指示器
  const ConnectionStatus: React.FC = () => (
    <div className="flex items-center gap-2 text-sm">
      {isConnected ? (
        <div className="flex items-center gap-2 text-green-600">
          <Wifi className="size-4" />
          <span>已连接</span>
        </div>
      ) : connectionError ? (
        <div className="flex items-center gap-2 text-red-600">
          <WifiOff className="size-4" />
          <span>连接失败</span>
          <Button variant="ghost" size="small" onClick={reconnect}>
            重连
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-yellow-600">
          <WifiOff className="size-4" />
          <span>未连接</span>
        </div>
      )}

      {sessionId && <span className="text-xs text-muted-foreground">会话: {sessionId.substring(0, 8)}...</span>}
    </div>
  );

  // 错误提示
  const ErrorAlert: React.FC = () => {
    if (!connectionError) return null;

    return (
      <Alert variant="destructive" className="mx-4 mb-4">
        <AlertCircle className="size-4" />
        <AlertDescription>
          连接错误: {connectionError.message}
          <Button variant="ghost" size="small" onClick={reconnect} className="ml-2">
            重新连接
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  // 空状态
  if (vinesMessages.length === 0 && !isLoading) {
    return (
      <div ref={containerRef} className="flex h-full flex-col" style={{ height }}>
        <div className="mb-4 flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-semibold">Agent V2 对话</h3>
          <ConnectionStatus />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <MessageSquareDashed className="mb-4 size-16 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">开始与智能体对话</p>
        </div>

        <ErrorAlert />

        <div className="border-t pt-4">
          <div className="flex gap-2">
            <AutosizeTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? '智能体准备中...' : '输入消息开始对话...'}
              disabled={isLoading || !agentId}
              className="min-h-[40px] resize-none"
              minHeight={40}
              maxHeight={120}
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || !agentId}
              size="icon"
              className="shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full flex-col" style={{ height }}>
      {/* Header */}
      <div ref={headerRef} className="relative mb-4 border-b pb-2">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">Agent V2 对话</h3>

          {/* 中间的简化组件区域 - 并排显示 */}
          <div className="flex flex-1 items-center justify-center gap-4">
            <AnimatePresence mode="popLayout">
              {todoTracker.hasActiveTodos && (
                <motion.div
                  key="active-todos"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="cursor-pointer rounded-lg bg-blue-50 px-3 py-1 transition-colors hover:bg-blue-100"
                  onClick={() => setTodoExpanded(!todoExpanded)}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-700">📝 任务规划</span>
                    {todoTracker.isStreaming && <span className="text-xs text-blue-600">(实时更新中)</span>}
                    <span className="text-xs text-blue-600">
                      ({todoTracker.currentTodos?.filter((t) => t.status === 'completed').length || 0}/
                      {todoTracker.currentTodos?.length || 0})
                    </span>
                    <span className="text-xs text-blue-500">{todoExpanded ? '▼' : '▶'}</span>
                  </div>
                </motion.div>
              )}

              {!todoTracker.hasActiveTodos && allTodoItems.length > 0 && (
                <motion.div
                  key="completed-todos"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="cursor-pointer rounded-lg bg-green-50 px-3 py-1 transition-colors hover:bg-green-100"
                  onClick={() => setTodoExpanded(!todoExpanded)}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-700">📝 任务清单</span>
                    <span className="text-xs text-green-600">
                      ({allTodoItems.filter((t) => t.status === 'completed').length}/{allTodoItems.length})
                    </span>
                    <span className="text-xs text-green-500">{todoExpanded ? '▼' : '▶'}</span>
                  </div>
                </motion.div>
              )}

              {allSearchResults.length > 0 && (
                <motion.div
                  key="search-results"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="cursor-pointer rounded-lg bg-green-50 px-3 py-1 transition-colors hover:bg-green-100"
                  onClick={() => setSearchExpanded(!searchExpanded)}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-700">🔍 搜索结果</span>
                    <span className="text-xs text-green-600">({allSearchResults.length})</span>
                    <span className="text-xs text-green-500">{searchExpanded ? '▼' : '▶'}</span>
                  </div>
                </motion.div>
              )}

              {allTaskCompletions.length > 0 && (
                <motion.div
                  key="task-completions"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="cursor-pointer rounded-lg bg-emerald-50 px-3 py-1 transition-colors hover:bg-emerald-100"
                  onClick={() => setCompletionExpanded(!completionExpanded)}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-700">✅ 任务完成</span>
                    <span className="text-xs text-emerald-600">({allTaskCompletions.length})</span>
                    <span className="text-xs text-emerald-500">{completionExpanded ? '▼' : '▶'}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ConnectionStatus />
        </div>

        {/* 悬浮的任务组件容器 - 根据展开状态显示 */}
        {(todoExpanded || searchExpanded || completionExpanded) && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full z-50 mt-2 space-y-3"
            style={{ position: 'absolute' }}
          >
            <AnimatePresence>
              {todoExpanded && todoTracker.hasActiveTodos && (
                <motion.div
                  key="expanded-active-todos"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AgentV2StreamingTodo todoState={todoTracker} className="compact-mode shadow-lg" />
                </motion.div>
              )}

              {todoExpanded && !todoTracker.hasActiveTodos && allTodoItems.length > 0 && (
                <motion.div
                  key="expanded-completed-todos"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AgentV2TodoList todoItems={allTodoItems} className="compact-mode shadow-lg" />
                </motion.div>
              )}

              {searchExpanded && allSearchResults.length > 0 && (
                <motion.div
                  key="expanded-search-results"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  {allSearchResults.map((searchResult, index) => (
                    <AgentV2SearchResults
                      key={`search-result-${index}-${searchResult.query}`}
                      searchResult={searchResult}
                      className="compact-mode shadow-lg"
                    />
                  ))}
                </motion.div>
              )}

              {completionExpanded && allTaskCompletions.length > 0 && (
                <motion.div
                  key="expanded-task-completions"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  {allTaskCompletions.map((completion, index) => (
                    <AgentV2TaskCompletion
                      key={`task-completion-${index}-${completion.result.substring(0, 20)}`}
                      result={completion.result}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <ErrorAlert />

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <VirtuaChatBotMessages
          height={calculatedChatHeight}
          data={vinesMessages}
          setMessages={() => {
            // Agent V2 消息由 hook 管理，这里不需要实现
          }}
          isLoading={isLoading}
          userPhoto={userPhoto}
          botPhoto={botPhoto}
          resend={() => {
            // TODO: 实现重新发送逻辑
          }}
        />
      </div>

      {/* Bottom Area - Followup Questions + Loading + Input */}
      <div ref={bottomRef}>
        {/* Followup Questions */}
        <AnimatePresence>
          {parsedFollowupQuestion && (
            <div className="mx-4 mb-4">
              <AgentV2FollowupQuestion
                followupQuestion={parsedFollowupQuestion}
                onAnswer={handleFollowupAnswer}
                isLoading={followupLoading}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mx-4 mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <VinesLoading size="sm" />
            <span>智能体正在思考...</span>
          </div>
        )}

        {/* Input */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <AutosizeTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                parsedFollowupQuestion ? '请先回答上面的问题...' : isLoading ? '智能体正在思考...' : '输入消息...'
              }
              disabled={isLoading || !!parsedFollowupQuestion}
              className="min-h-[40px] resize-none"
              minHeight={40}
              maxHeight={120}
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || !!parsedFollowupQuestion}
              size="icon"
              className="shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
