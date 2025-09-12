import React, { useCallback, useMemo, useState } from 'react';

import { AlertCircle, MessageSquareDashed, Send, Wifi, WifiOff } from 'lucide-react';

import { IAgentV2ChatMessage } from '@/apis/agents-v2/chat';
import { IVinesMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat';
import { VirtuaChatBotMessages } from '@/components/layout/workspace/vines-view/chat/chat-bot/virtua-messages';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { AgentV2FollowupQuestion } from '@/components/ui/agent-v2-followup-question';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AutosizeTextarea } from '@/components/ui/autosize-textarea.tsx';
import { Button } from '@/components/ui/button';
import { VinesLoading } from '@/components/ui/loading';
import { DEFAULT_AGENT_ICON_URL } from '@/consts/icons.ts';
import { useAgentV2Chat } from '@/hooks/use-agent-v2-chat';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { useSubmitHandler } from '@/hooks/use-submit-handler.ts';
import { parseAgentV2Response } from '@/utils/agent-v2-response-parser';

interface IAgentV2ChatModeProps {
  agentId: string;
  sessionId?: string; // 可选的特定session ID，用于加载历史消息
  botPhoto?: string;
  height: number;
}

// 转换消息格式以适配现有的消息显示组件 - 简化版本，直接显示原始内容
const convertToVinesMessage = (message: IAgentV2ChatMessage): IVinesMessage | null => {
  // 调试：打印转换前后的内容
  const result = {
    id: message.id,
    content: message.content || '',
    role: message.role as 'user' | 'assistant',
    createdAt: message.createdAt,
    extra: message.toolCalls || [],
  };

  console.log(`convertToVinesMessage ${message.id}:`, {
    原始消息: message,
    转换结果: result,
    content类型: typeof result.content,
    content内容: result.content,
  });

  return result;
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

  const [followupLoading, setFollowupLoading] = useState(false);

  // 计算聊天区域高度
  const calculatedChatHeight =
    containerHeight && headerHeight && bottomHeight
      ? containerHeight - headerHeight - bottomHeight
      : height - (headerHeight || 60) - (bottomHeight || 120);

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
      <div ref={headerRef} className="mb-4 border-b pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Agent V2 对话</h3>
          <ConnectionStatus />
        </div>
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
        {parsedFollowupQuestion && (
          <div className="mx-4 mb-4">
            <AgentV2FollowupQuestion
              followupQuestion={parsedFollowupQuestion}
              onAnswer={handleFollowupAnswer}
              isLoading={followupLoading}
            />
          </div>
        )}

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
