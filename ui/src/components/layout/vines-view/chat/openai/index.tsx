import React, { useEffect, useState } from 'react';

import { useForceUpdate } from '@mantine/hooks';

import { useGetWorkflow } from '@/apis/workflow';
import { ChatPanel } from '@/components/layout/vines-view/chat/openai/chat-panel';
import { OpenAIMessages } from '@/components/layout/vines-view/chat/openai/messages';
import { Label } from '@/components/ui/label.tsx';
import { Switch } from '@/components/ui/switch';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { cloneDeep, useLocalStorage } from '@/utils';

interface IOpenAIChatProps {}

export const OpenAIChat: React.FC<IOpenAIChatProps> = () => {
  const { workflowId } = useFlowStore();

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

  useEffect(() => {
    if (chatSessions[workflowId]) {
      setChatId(chatSessions[workflowId]);
      forceUpdate();
    }
  }, [chatSessions]);

  return (
    <>
      <header className="flex w-full justify-between pb-4 pl-4">
        <h1 className="text-xl font-bold">对话模式</h1>
        <div className="hidden scale-80 items-center space-x-2">
          <Switch checked={isStreamMode} onClick={handleToggleStreamMode} />
          <Label htmlFor="stream-mode">流式传输</Label>
        </div>
      </header>
      <div className="size-full flex-1">
        <OpenAIMessages chatId={chatId} />
      </div>
      <ChatPanel workflowId={workflowId} chatId={chatId} />
    </>
  );
};
