import React from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { Chat } from '@/components/ai-chatbot/chat';

export const VercelAi: React.FC = () => {
  return (
    <main className="size-full p-4">
      <Chat id="vercel-ai" isReadonly={false} />
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/vercel-ai/')({
  component: VercelAi,
});
