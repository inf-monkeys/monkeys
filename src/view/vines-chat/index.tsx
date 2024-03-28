import React from 'react';

import { VinesChatList } from '@/components/layout/view/vines-chat/list';
import { ChatSidebar } from '@/components/layout/view/vines-chat/sidebar';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { useViewStore } from '@/store/useViewStore';

export const VinesChatView: React.FC = () => {
  const { workflowId } = useVinesPage();
  const { visible } = useViewStore();

  return (
    <div className="flex size-full p-10">
      <ChatSidebar />
      <div className="flex-1 p-4">
        <VinesChatList visible={visible} workflowId={workflowId} />
      </div>
    </div>
  );
};
