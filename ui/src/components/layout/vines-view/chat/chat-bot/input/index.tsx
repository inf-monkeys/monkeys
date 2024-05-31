import React from 'react';

import { isEmpty } from 'lodash';
import { StopCircle, Trash2 } from 'lucide-react';

import { CleanMessages } from '@/components/layout/vines-view/chat/chat-bot/input/clean-messages.tsx';
import { useChat } from '@/components/layout/vines-view/chat/chat-bot/use-chat.ts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IVinesChatInputProps {
  chatId: string;
  multipleChat?: boolean;
}

export const VinesChatInput: React.FC<IVinesChatInputProps> = ({ chatId, multipleChat = true }) => {
  const { messages, setMessages, input, setInput, handleEnterPress, isLoading, stop } = useChat({
    chatId,
  });

  const isInputEmpty = isEmpty(input.trim());
  return (
    <div className="z-20 flex justify-between gap-2 py-2">
      {messages?.length > 0 && multipleChat && (
        <CleanMessages setMessages={setMessages}>
          <Button variant="outline" icon={<Trash2 />} />
        </CleanMessages>
      )}
      <Input
        placeholder="聊些什么..."
        disabled={isLoading}
        value={input}
        onChange={setInput}
        onEnterPress={handleEnterPress}
      />
      <Button variant="outline" loading={isLoading} disabled={isInputEmpty} onClick={handleEnterPress}>
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
  );
};
