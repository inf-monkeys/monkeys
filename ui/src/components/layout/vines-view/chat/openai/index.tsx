import React, { useEffect, useState } from 'react';

import { useForceUpdate } from '@mantine/hooks';
import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { isEmpty } from 'lodash';
import { MessageSquareDashed, StopCircle, Trash2 } from 'lucide-react';

import { useApiKeyList } from '@/apis/api-keys/api-key.ts';
import { IApiKeyStatus } from '@/apis/api-keys/typings.ts';
import { useGetWorkflow } from '@/apis/workflow';
import { useOpenAIInterfaceChatHistory } from '@/apis/workflow/chat';
import { VirtualizedList } from '@/components/layout/vines-view/chat/openai/messages';
import { useChat } from '@/components/layout/vines-view/chat/openai/use-chat.ts';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { cloneDeep, useLocalStorage } from '@/utils';

interface IOpenAIChatProps {
  multipleChat?: boolean;
}

// million-ignore
export const OpenAIChat: React.FC<IOpenAIChatProps> = ({ multipleChat }) => {
  const { workflowId } = useFlowStore();
  const { userPhoto } = useVinesUser();

  const { vines } = useVinesFlow();

  const { data: workflow } = useGetWorkflow(workflowId);

  const workflowInputs = workflow?.variables ?? [];
  const isStreamMode = (workflowInputs?.find((it) => it.name === 'stream')?.default ?? false) as boolean;
  const handleToggleStreamMode = () => {
    const newInputs = cloneDeep(workflowInputs);
    const streamInput = newInputs.find((it) => it.name === 'stream');
    if (streamInput) {
      streamInput.default = !isStreamMode;
    }
    vines.update({ variables: newInputs });
  };

  const [chatSessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});
  const [chatId, setChatId] = useState<string>('default');

  const forceUpdate = useForceUpdate();

  const currentSession = chatSessions?.[workflowId];
  useEffect(() => {
    if (currentSession) {
      setChatId(currentSession);
    } else {
      setChatId('default');
    }
    forceUpdate();
  }, [currentSession]);

  const { data: apiKeys } = useApiKeyList();
  const finalApikey = apiKeys?.find((key) => key.status === IApiKeyStatus.Valid);

  const { data: history, error, isLoading: isHistoryLoading } = useOpenAIInterfaceChatHistory(chatId);

  const { input, setInput, handleChat, handleSubmit, isLoading, setMessages, messages, stop } = useChat(
    chatId,
    workflowId,
    finalApikey?.apiKey,
    history,
    multipleChat,
  );

  useEffect(() => {
    if (!(error instanceof Error)) {
      void setMessages(history ?? []);
    }
  }, [history, error]);

  useEffect(() => {
    if (chatId === 'default') {
      void setMessages([]);
    }
  }, [chatId]);

  const handleChatMessage = () => {
    handleSubmit();
    void handleChat();
  };

  const isInputEmpty = isEmpty(input.trim());

  return (
    <>
      <header className="flex w-full justify-between pb-4 pl-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">{!multipleChat && '单轮'}对话模式</h1>
          {chatId === 'default' && <span className="text-xs opacity-70">临时对话中，聊天记录将不会存储</span>}
        </div>
        <div className="hidden scale-80 items-center space-x-2">
          <Switch checked={isStreamMode} onClick={handleToggleStreamMode} />
          <Label htmlFor="stream-mode">流式传输</Label>
        </div>
      </header>
      <div className="size-full flex-1">
        <AnimatePresence>
          {isHistoryLoading ? (
            <motion.div
              key="vines-chat-loading"
              className="vines-center size-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
            </motion.div>
          ) : (
            <motion.div
              key="vines-chat-context"
              className="relative z-0 size-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
            >
              <VirtualizedList
                data={messages ?? []}
                userPhoto={userPhoto}
                botPhoto={vines.workflowIcon}
                isLoading={isLoading}
              />
              {!messages?.length && (
                <motion.div
                  key="vines-chat-empty"
                  className="vines-center absolute left-0 top-0 size-full flex-col"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageSquareDashed size={64} />
                  <div className="mt-4 flex flex-col text-center">
                    <h2 className="font-bold">暂无对话</h2>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="z-20 flex justify-between gap-2 py-2">
        <Tooltip>
          <AlertDialog>
            {messages?.length > 0 && multipleChat && (
              <AlertDialogTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="outline" icon={<Trash2 />} />
                </TooltipTrigger>
              </AlertDialogTrigger>
            )}
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确定要清空当前对话吗？</AlertDialogTitle>
                <AlertDialogDescription>仅清空本地对话记录，刷新可恢复历史数据。</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => setMessages([])}>确定</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <TooltipContent>清空对话（本地）</TooltipContent>
        </Tooltip>
        <Input
          placeholder="聊些什么..."
          value={input}
          onChange={setInput}
          onEnterPress={() => !isInputEmpty && handleChatMessage()}
          disabled={isLoading}
        />
        <Button variant="outline" onClick={handleChatMessage} loading={isLoading} disabled={isInputEmpty}>
          发送
        </Button>
        {isLoading && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="[&_svg]:stroke-red-10" icon={<StopCircle />} onClick={stop} />
            </TooltipTrigger>
            <TooltipContent>停止生成</TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  );
};
