import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { MonkeyWorkflow } from '@inf-monkeys/vines';

import { IPaginationListData } from '@/apis/typings.ts';
import { listUgcWorkflowsMock } from '@/apis/ugc/mock.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcSidebar } from '@/components/layout/ugc/sidebar';
import { UgcView } from '@/components/layout/ugc/view';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const Workflows: React.FC = () => {
  return (
    <main className="flex size-full">
      <UgcSidebar title="工作流" />
      <UgcView
        // fetchFunction={async () => listUgcWorkflowsMock as unknown as IPaginationListData<IAssetItem<MonkeyWorkflow>>}
        data={listUgcWorkflowsMock as unknown as IPaginationListData<IAssetItem<MonkeyWorkflow>>}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/workflows/')({
  component: Workflows,
  beforeLoad: teamIdGuard,
});
