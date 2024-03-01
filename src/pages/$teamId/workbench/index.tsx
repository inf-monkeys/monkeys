import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { VinesUpdater } from '@/components/ui/updater';

export const Workbench: React.FC = () => {
  return (
    <>
      <VinesUpdater maxSize={100000}>
        <Button>上传文件</Button>
      </VinesUpdater>
    </>
  );
};

export const Route = createFileRoute('/$teamId/workbench/')({
  component: Workbench,
  beforeLoad: teamIdGuard,
});
