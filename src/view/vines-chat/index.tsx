import React from 'react';

import { ChatSidebar } from '@/components/layout/view/vines-chat/sidebar';

export const VinesChatView: React.FC = () => {
  return (
    <div className="flex size-full p-10">
      <ChatSidebar />
    </div>
  );
};
