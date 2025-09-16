import React, { useMemo, useState } from 'react';

import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  Settings,
  XCircle,
} from 'lucide-react';

import { IAgentV2ChatMessage } from '@/apis/agents-v2/chat';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageAvatar, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { IVinesMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat';
import { Separator } from '@/components/ui/separator';
import { useAgentV2Chat } from '@/hooks/use-agent-v2-chat';

// 转换消息格式以适配AI Elements组件
const convertToVinesMessage = (message: IAgentV2ChatMessage): IVinesMessage | null => {
  return {
    id: message.id,
    content: message.content || '',
    role: message.role as 'user' | 'assistant',
    createdAt: message.createdAt,
    extra: message.toolCalls || [],
  };
};

// 通用工具消息框组件
const ToolMessageBox = ({ tools }: { tools: any[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (tools.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-300">调用工具</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3 border-t border-gray-200 px-3 pb-3 pt-3 dark:border-gray-700">
          {tools.map((tool, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {tool.state === 'input-streaming' && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    <span className="text-gray-600">正在处理...</span>
                  </>
                )}
                {tool.state === 'input-available' && (
                  <>
                    <Clock className="h-3 w-3 text-amber-500" />
                    <span className="text-gray-600">处理中</span>
                  </>
                )}
                {tool.state === 'output-available' && (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-gray-600">已完成</span>
                  </>
                )}
                {tool.state === 'output-error' && (
                  <>
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">执行失败</span>
                  </>
                )}
                <span className="font-medium text-gray-700 dark:text-gray-300">{tool.toolName}</span>
              </div>

              {/* 简化的工具内容显示 */}
              <div className="ml-5 text-xs text-gray-500 dark:text-gray-400">
                {tool.state === 'output-available' && (
                  <div className="rounded border bg-white p-2 dark:bg-gray-700">
                    <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                      {typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output, null, 2)}
                    </pre>
                  </div>
                )}
                {tool.state === 'output-error' && <div className="text-xs text-red-600">{tool.errorText}</div>}
                {(tool.state === 'input-streaming' || tool.state === 'input-available') && tool.input && (
                  <div className="text-xs text-gray-500">
                    输入: {typeof tool.input === 'string' ? tool.input : JSON.stringify(tool.input)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ChatInterfaceProps {
  agentId?: string;
  sessionId?: string;
  botPhoto?: string;
  height?: number;
}

export function ChatInterface({ agentId, sessionId, botPhoto, height }: ChatInterfaceProps) {
  const [input, setInput] = useState('');

  // 使用真实的 Agent V2 Chat hook
  const { messages, isLoading, sendMessage } = useAgentV2Chat(agentId || '', sessionId);

  // 转换消息格式，过滤掉null消息
  const displayMessages = useMemo(() => {
    return messages.map((msg) => convertToVinesMessage(msg)).filter((msg): msg is IVinesMessage => msg !== null);
  }, [messages]);

  // 添加滚动条样式控制
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .chat-textarea {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .chat-textarea::-webkit-scrollbar {
        display: none;
      }

      .chat-textarea.show-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        -ms-overflow-style: scrollbar;
      }
      .chat-textarea.show-scrollbar::-webkit-scrollbar {
        display: block;
        width: 6px;
      }
      .chat-textarea.show-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .chat-textarea.show-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.5);
        border-radius: 3px;
      }
      .chat-textarea.show-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(156, 163, 175, 0.7);
      }
      .chat-textarea.show-scrollbar::-webkit-scrollbar-button {
        display: none;
      }
      .chat-textarea.show-scrollbar::-webkit-scrollbar-corner {
        background: transparent;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && agentId) {
      try {
        await sendMessage(input.trim());
        setInput('');
      } catch (error) {
        console.error('发送消息失败:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // 渲染消息内容和工具调用
  const renderMessageContent = (message: IVinesMessage) => {
    // 将消息内容转换为字符串
    const getTextContent = (content: IVinesMessage['content']): string => {
      if (typeof content === 'string') {
        return content;
      }
      if (Array.isArray(content)) {
        return content
          .map((item) => {
            if (item.type === 'text') {
              return item.text;
            }
            return '';
          })
          .join('');
      }
      return '';
    };

    const textContent = getTextContent(message.content);

    return (
      <div className="space-y-2">
        {/* 渲染文本内容 */}
        {textContent && <Response className="w-full">{textContent}</Response>}

        {/* 渲染工具调用框 */}
        {message.extra && message.extra.length > 0 && <ToolMessageBox tools={message.extra} />}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col" style={{ height: height ? `${height}px` : '100%' }}>
      {/* 头部 */}
      <div className="flex items-center gap-3 border-b p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">对话视图 v2</h1>
        </div>
      </div>

      {/* 消息列表 */}
      <Conversation className="flex-1">
        <ConversationContent>
          {displayMessages.map((message: IVinesMessage) => (
            <Message key={message.id} from={message.role}>
              <MessageContent variant="contained">
                {/* 渲染消息内容 */}
                {renderMessageContent(message)}
              </MessageContent>
              {message.role === 'assistant' && (
                <MessageAvatar src={botPhoto || 'https://github.com/openai.png'} name="AI助手" />
              )}
            </Message>
          ))}

          {/* 加载状态 */}
          {isLoading && (
            <Message from="assistant">
              <MessageContent variant="contained">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">正在思考...</span>
                </div>
              </MessageContent>
              <MessageAvatar src={botPhoto || 'https://github.com/openai.png'} name="AI助手" />
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <Separator />

      {/* 输入区域 */}
      <div className="w-full border-t px-4 py-6">
        <form onSubmit={handleSubmit} className="flex w-full items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={!agentId ? '请先选择智能体...' : '输入您的消息...（Shift+Enter 换行）'}
            disabled={isLoading || !agentId}
            rows={1}
            className="chat-textarea max-h-32 min-h-[48px] flex-1 resize-none overflow-y-hidden rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            style={{
              height: 'auto',
              minHeight: '48px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              const newHeight = Math.min(target.scrollHeight, 128);
              target.style.height = newHeight + 'px';

              // 当内容超过最大高度时显示滚动条
              if (target.scrollHeight > 128) {
                target.style.overflowY = 'auto';
                target.classList.add('show-scrollbar');
              } else {
                target.style.overflowY = 'hidden';
                target.classList.remove('show-scrollbar');
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !agentId}
            className="flex h-12 items-center justify-center rounded-lg bg-blue-500 px-6 text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
