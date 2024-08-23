import React, { useLayoutEffect, useRef, useState } from 'react';

import { useMemoizedFn, useThrottleEffect } from 'ahooks';
import { motion } from 'framer-motion';
import { ListEnd } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VinesChatMessage } from 'src/components/layout/workspace/vines-view/chat/chat-bot/virtua-messages/chat-message';
import { Virtualizer, VListHandle } from 'virtua';

import { IVinesMessage } from '@/components/layout/workspace/vines-view/chat/chat-bot/use-chat.ts';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { cn } from '@/utils';

interface IVirtuaChatBotMessagesProps {
  height: number;

  data: IVinesMessage[];
  setMessages: (messages: IVinesMessage[]) => void;
  isLoading: boolean;
  userPhoto: string;
  botPhoto: string;
  resend: (index?: number) => void;
}

export const VirtuaChatBotMessages: React.FC<IVirtuaChatBotMessagesProps> = ({
  height,
  data,
  setMessages,
  isLoading,
  userPhoto,
  botPhoto,
  resend,
}) => {
  const { t } = useTranslation();

  const ref = useRef<VListHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPrepend = useRef(false);
  useLayoutEffect(() => {
    isPrepend.current = false;
  });

  const [atBottom, setAtBottom] = useState(true);

  const messagesLength = data.length;
  const lastItemIndex = messagesLength - 1;
  const initialRef = useRef(false);
  useThrottleEffect(
    () => {
      if (!ref.current) return;

      ref.current.scrollToIndex(lastItemIndex, { align: 'end', smooth: initialRef.current });
      initialRef.current = true;
    },
    [isLoading ? data : messagesLength],
    {
      wait: 100,
    },
  );

  const handleSetMessageByIndex = useMemoizedFn((index: number, message?: Partial<IVinesMessage>) => {
    setMessages(
      data
        .map((it, i) => {
          if (index === i && message) {
            return { ...it, ...message };
          }
          return it;
        })
        .filter((_, i) => {
          return !(i === index && !message);
        }),
    );
  });

  return (
    <ScrollArea
      ref={scrollRef}
      style={{ height }}
      className="relative -mr-3 pr-3 [&>[data-radix-scroll-area-viewport]>div]:invisible [&>[data-radix-scroll-area-viewport]>div]:flex [&>[data-radix-scroll-area-viewport]>div]:min-h-full [&>[data-radix-scroll-area-viewport]>div]:flex-col [&>[data-radix-scroll-area-viewport]>div]:justify-end"
      disabledOverflowMask
    >
      <Virtualizer
        ref={ref}
        shift={isPrepend.current}
        onScroll={(offset) => {
          if (!ref.current) return;
          setAtBottom(offset - ref.current.scrollSize + ref.current.viewportSize >= -1.5);
        }}
        scrollRef={scrollRef}
      >
        {data.map((it, i) => (
          <VinesChatMessage
            key={i}
            setMessageByIndex={handleSetMessageByIndex}
            index={i}
            LastItemIndex={lastItemIndex}
            data={it}
            isLoading={isLoading}
            botPhoto={botPhoto}
            userPhoto={userPhoto}
            resend={resend}
          />
        ))}
      </Virtualizer>
      <motion.div
        className={cn('visible absolute bottom-4 right-4', atBottom && 'pointer-events-none')}
        animate={{
          opacity: atBottom ? 0 : 1,
          transition: { delay: atBottom ? 0 : 0.4 },
        }}
        transition={{ duration: 0.2 }}
      >
        <Button
          icon={<ListEnd />}
          onClick={() =>
            requestAnimationFrame(() => ref.current?.scrollToIndex(lastItemIndex, { align: 'end', smooth: true }))
          }
          variant="outline"
        >
          {t('workspace.chat-view.back-to-bottom')}
        </Button>
      </motion.div>
    </ScrollArea>
  );
};
