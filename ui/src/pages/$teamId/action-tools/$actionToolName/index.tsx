import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTool } from '@/apis/tools';
import { useSearchReferenceWorkflows } from '@/apis/ugc';
import { UgcDetailInfo } from '@/components/layout/ugc/detail/info';
import { UgcDetailWorkflows } from '@/components/layout/ugc/detail/workflows';
import { createActionToolsColumns } from '@/components/layout/ugc-pages/action-tools/consts.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IActionToolDetailProps {}

export const ActionToolDetail: React.FC<IActionToolDetailProps> = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const { actionToolName } = Route.useParams();

  const { data: blockData } = useTool(actionToolName);
  const { data: blockWorkflowRefData } = useSearchReferenceWorkflows('block', actionToolName);

  return (
    <main className="flex size-full flex-col gap-4">
      <header className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              icon={<Undo2 />}
              variant="outline"
              size="small"
              className="-m-1 -ml-0.5 -mr-2 scale-85"
              onClick={() => {
                history.back();
              }}
            />
          </TooltipTrigger>
          <TooltipContent>{t('common.utils.back')}</TooltipContent>
        </Tooltip>
        <h1 className="line-clamp-1 text-2xl font-bold">{t('ugc-page.action-tools.detail.title')}</h1>
      </header>
      <Tabs
        defaultValue="info"
        className="[&_[role='tabpanel']]:mt-4 [&_[role='tabpanel']]:h-[calc(100vh-11.5rem)] [&_[role='tabpanel']]:overflow-y-auto [&_[role='tabpanel']]:overflow-x-hidden"
      >
        <TabsList>
          <TabsTrigger value="info" className="text-xs">
            {t('ugc-page.action-tools.detail.tabs.info.label')}
          </TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs">
            {t('ugc-page.action-tools.detail.tabs.workflows.label')}
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
