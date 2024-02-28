import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { MIME_TYPES } from '@mantine/dropzone';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { VinesUpdater } from '@/components/ui/updater';

export const Workbench: React.FC = () => {
  return (
    <>
      <VinesUpdater accept={[MIME_TYPES.png]}>
        <Button>上传文件</Button>
      </VinesUpdater>
    </>
  );
};

export const Route = createFileRoute('/$teamId/workbench/')({
  component: Workbench,
  beforeLoad: teamIdGuard,
});
