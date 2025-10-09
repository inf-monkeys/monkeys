import React, { useMemo, useState } from 'react';

import { Loader2, MessageSquare, Send } from 'lucide-react';

import { IAgentV2ChatMessage } from '@/apis/agents-v2/chat';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageAvatar, MessageContent } from '@/components/ai-elements/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { Response } from '@/components/ai-elements/response';
import { Task, TaskContent, TaskItem, TaskTrigger } from '@/components/ai-elements/task';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
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
    messageType: message.messageType, // 传递消息类型
  } as any; // 临时使用any类型，因为IVinesMessage接口需要更新
};

// 专业的AI工具组件
const AIToolComponent = ({ tool }: { tool: any }) => {
  // 将tool数据格式转换为ai-elements需要的格式
  const toolState = tool.state || 'output-available';
  const toolType = tool.name || tool.toolName || 'unknown';

  return (
    <Tool>
      <ToolHeader type={toolType} state={toolState} />
      <ToolContent>
        {tool.params && <ToolInput input={tool.params} />}
        {(tool.output || tool.result || tool.errorText) && (
          <ToolOutput output={tool.output || tool.result} errorText={tool.errorText} />
        )}
      </ToolContent>
    </Tool>
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

  // 根据消息类型使用专业的ai-elements组件渲染
  const renderMessageContent = (message: IVinesMessage) => {
    const messageType = (message as any).messageType;

    // 直接使用原始content，不做类型过滤
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
            return JSON.stringify(item);
          })
          .join('\n');
      }
      return JSON.stringify(content);
    };

    const textContent = getTextContent(message.content);

    // 根据messageType使用不同的ai-elements组件
    switch (messageType) {
      case 'thinking':
        return (
          <Reasoning isStreaming={(message as any).isStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>{textContent}</ReasoningContent>
          </Reasoning>
        );

      case 'tool_call':
        return (
          <Task defaultOpen={true}>
            <TaskTrigger
              title={`正在调用工具: ${message.extra?.map((tool) => (tool as any).name || (tool as any).toolName || 'unknown').join(', ') || '未知工具'}`}
            />
            <TaskContent>
              {textContent && <TaskItem>{textContent}</TaskItem>}
              {message.extra && message.extra.map((tool, index) => <AIToolComponent key={index} tool={tool} />)}
            </TaskContent>
          </Task>
        );

      case 'tool_result':
        return (
          <div className="space-y-2">
            <Response className="w-full">{textContent}</Response>
            {message.extra && message.extra.map((tool, index) => <AIToolComponent key={index} tool={tool} />)}
          </div>
        );

      case 'summary':
        return (
          <div className="rounded-lg border-l-4 border-purple-400 bg-purple-50 p-3 dark:bg-purple-900/20">
            <Response className="w-full">{textContent}</Response>
            {message.extra &&
              message.extra.length > 0 &&
              message.extra.map((tool, index) => <AIToolComponent key={index} tool={tool} />)}
          </div>
        );

      case 'final_response':
        // attempt_completion 工具的最终回复，直接进行 markdown 渲染
        return <Response className="w-full">{textContent}</Response>;

      default:
        // 默认消息类型
        return (
          <div className="space-y-2">
            <Response className="w-full">{textContent}</Response>
            {message.extra &&
              message.extra.length > 0 &&
              message.extra.map((tool, index) => <AIToolComponent key={index} tool={tool} />)}
          </div>
        );
    }
  };

  return (
    <div className="flex w-full flex-col" style={{ height: height ? `${height}px` : '100%' }}>
      {/* 头部 */}
      <div className="flex items-center gap-3 border-b p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">ReAct Agent</h1>
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
