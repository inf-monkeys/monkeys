import React, { useLayoutEffect } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { VinesIconSelector } from '@/components/ui/icon-selector';
import VinesEvent from '@/utils/events.ts';

export const Workbench: React.FC = () => {
  useLayoutEffect(() => {
    // Tips: 不是每个页面都需要手动设置标题
    VinesEvent.emit('vines-update-site-title', '工作台');
  }, []);

  return (
    <>
      <VinesIconSelector>
        <Button>Emoji</Button>
      </VinesIconSelector>
    </>
  );
};

export const Route = createFileRoute('/$teamId/workbench/')({
  component: Workbench,
  beforeLoad: teamIdGuard,
});
