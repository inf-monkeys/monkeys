import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useComfyuiWorkflow } from '@/apis/comfyui';
import { UgcDetailInfo } from '@/components/layout/ugc/detail/info';
import { createComfyuiWorkflowColumns } from '@/components/layout/ugc-pages/comfyui-workflows/consts';
import { ComfyuiWorkflowToolInput } from '@/components/layout/ugc-pages/comfyui-workflows/detail/tool-input';
import { ComfyuiWorkflowDetail } from '@/components/layout/ugc-pages/comfyui-workflows/detail/workflow';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IActionToolDetailProps {}

export const ActionToolDetail: React.FC<IActionToolDetailProps> = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { comfyuiWorkflowId, teamId } = Route.useParams();
  const { data: comfyuiWorkflow } = useComfyuiWorkflow(comfyuiWorkflowId);

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
        <h1 className="line-clamp-1 text-2xl font-bold">{t('ugc-page.comfyui-workflow.detail.title')}</h1>
      </header>
      <Tabs
        defaultValue="info"
        className="[&_[role='tabpanel']]:mt-4 [&_[role='tabpanel']]:h-[calc(100vh-11.5rem)] [&_[role='tabpanel']]:overflow-y-auto [&_[role='tabpanel']]:overflow-x-hidden"
      >
        <TabsList>
          <TabsTrigger value="info" className="text-xs">
            {t('ugc-page.comfyui-workflow.detail.tabs.info.label')}
          </TabsTrigger>
          <TabsTrigger value="workflow" className="text-xs">
            {t('ugc-page.comfyui-workflow.detail.tabs.workflow.label')}
          </TabsTrigger>
          <TabsTrigger value="toolsInput" className="text-xs">
            {t('ugc-page.comfyui-workflow.detail.tabs.toolsInput.label')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <UgcDetailInfo columns={createComfyuiWorkflowColumns({ hooks: { navigate } })} data={comfyuiWorkflow} />
        </TabsContent>
        <TabsContent value="workflow">
          <ComfyuiWorkflowDetail data={comfyuiWorkflow!} />
        </TabsContent>
        <TabsContent value="toolsInput">
          <ComfyuiWorkflowToolInput data={comfyuiWorkflow!} />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export const Route = createFileRoute('/$teamId/comfyui/$comfyuiWorkflowId/')({
  component: ActionToolDetail,
  beforeLoad: teamIdGuard,
});
