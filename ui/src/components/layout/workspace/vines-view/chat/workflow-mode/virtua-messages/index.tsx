import React, { useLayoutEffect, useRef, useState } from 'react';

import { useThrottleEffect } from 'ahooks';
import { motion } from 'framer-motion';
import { ListEnd } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Virtualizer, VListHandle } from 'virtua';

import { IVinesChatListItem } from '@/components/layout/workspace/vines-view/chat/workflow-mode/typings.ts';
import { ChatMessage } from '@/components/layout/workspace/vines-view/chat/workflow-mode/virtua-messages/chat-message';
import { VinesRealTimeChatMessage } from '@/components/layout/workspace/vines-view/chat/workflow-mode/virtua-messages/chat-message/real-time.tsx';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { cn } from '@/utils';

interface IVirtuaWorkflowChatMessagesProps {
  data: IVinesChatListItem[];
  height: number;
  useSimple?: boolean;
}

export const VirtuaWorkflowChatMessages: React.FC<IVirtuaWorkflowChatMessagesProps> = ({ data, height, useSimple }) => {
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
    [data],
    {
      wait: 100,
    },
  );

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
          <ChatMessage key={i} data={it} isLast={i === lastItemIndex} useSimple={useSimple} />
        ))}
      </Virtualizer>
      {!useSimple && (
        <VinesRealTimeChatMessage
          onActive={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
        />
      )}
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
