import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { useTool } from '@/apis/tools';
import { useSearchReferenceWorkflows } from '@/apis/ugc';
import { UgcDetailInfo } from '@/components/layout/ugc/detail/info';
import { UgcDetailWorkflows } from '@/components/layout/ugc/detail/workflows';
import { createActionToolsColumns } from '@/components/layout/ugc-pages/action-tools/consts.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';

interface IActionToolDetailProps {}

export const ActionToolDetail: React.FC<IActionToolDetailProps> = () => {
  const navigate = useNavigate();

  const { actionToolName } = Route.useParams();

  const { data: blockData } = useTool(actionToolName);
  const { data: blockWorkflowRefData } = useSearchReferenceWorkflows('block', actionToolName);

  return (
    <main className="flex size-full flex-col gap-4">
      <h1 className="text-2xl font-bold">组件详情</h1>
      <Tabs
        defaultValue="info"
        className="[&_[role='tabpanel']]:mt-4 [&_[role='tabpanel']]:h-[calc(100vh-11.5rem)] [&_[role='tabpanel']]:overflow-y-auto [&_[role='tabpanel']]:overflow-x-hidden"
      >
        <TabsList>
          <TabsTrigger value="info" className="text-xs">
            基本信息
          </TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs">
            关联工作流
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <UgcDetailInfo columns={createActionToolsColumns({ hooks: { navigate } })} data={blockData} />
        </TabsContent>
        <TabsContent value="workflows">
          <UgcDetailWorkflows data={blockWorkflowRefData ?? []} />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export const Route = createFileRoute('/$teamId/action-tools/$actionToolName/')({
  component: ActionToolDetail,
  beforeLoad: teamIdGuard,
});
