import React from 'react';

import { createLazyFileRoute, useNavigate, useRouter } from '@tanstack/react-router';

import { Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useComfyuiWorkflow } from '@/apis/comfyui';
import { UgcDetailInfo } from '@/components/layout/ugc/detail/info';
import { createComfyuiWorkflowColumns } from '@/components/layout/ugc-pages/comfyui-workflows/consts';
import { ComfyuiWorkflowDependency } from '@/components/layout/ugc-pages/comfyui-workflows/detail/dependency';
import { ComfyuiWorkflowToolInput } from '@/components/layout/ugc-pages/comfyui-workflows/detail/tool-input';
import { ComfyuiWorkflowDetail } from '@/components/layout/ugc-pages/comfyui-workflows/detail/workflow';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IComfyUIWorkflowDetailProps {}

export const IComfyUIWorkflowDetail: React.FC<IComfyUIWorkflowDetailProps> = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { history } = useRouter();

  const { comfyuiWorkflowId } = Route.useParams();
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
              className="scale-85 -m-1 -ml-0.5 -mr-2"
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
          <TabsTrigger value="dependency" className="text-xs">
            {t('ugc-page.comfyui-workflow.detail.tabs.dependency.label')}
          </TabsTrigger>
          <TabsTrigger value="toolsInput" className="text-xs">
            {t('ugc-page.comfyui-workflow.detail.tabs.toolsInput.label')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <UgcDetailInfo
            columns={createComfyuiWorkflowColumns({ hooks: { navigate } })}
            data={comfyuiWorkflow}
            assetKey="comfyui-workflow"
          />
        </TabsContent>
        <TabsContent value="workflow">
          <ComfyuiWorkflowDetail data={comfyuiWorkflow!} />
        </TabsContent>
        <TabsContent value="dependency">
          <ComfyuiWorkflowDependency comfyuiWorkflow={comfyuiWorkflow!} />
        </TabsContent>
        <TabsContent value="toolsInput">
          <ComfyuiWorkflowToolInput data={comfyuiWorkflow!} />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/comfyui/$comfyuiWorkflowId/')({
  component: IComfyUIWorkflowDetail,
});
