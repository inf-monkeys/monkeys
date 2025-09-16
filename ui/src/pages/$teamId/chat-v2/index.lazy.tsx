import { createLazyFileRoute } from '@tanstack/react-router';

import { ChatInterface } from '@/components/layout/chat-v2/chat-interface';

export const Route = createLazyFileRoute('/$teamId/chat-v2/')({
  component: ChatV2Page,
});

function ChatV2Page() {
  return (
    <div className="flex h-full w-full">
      <ChatInterface />
    </div>
  );
}
