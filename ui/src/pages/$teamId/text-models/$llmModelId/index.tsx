import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useLLMModel } from '@/apis/llm';
import { createTextModelsColumns } from '@/components/layout/ugc-pages/text-models/consts';
import { UgcDetailInfo } from '@/components/layout/ugc/detail/info';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getI18nContent } from '@/utils';

interface IComfyUIWorkflowDetailProps {}

export const IComfyUIWorkflowDetail: React.FC<IComfyUIWorkflowDetailProps> = () => {
  const { t } = useTranslation();
  const { llmModelId } = Route.useParams();
  const { data: llmModel } = useLLMModel(llmModelId);

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
        <h1 className="line-clamp-1 text-2xl font-bold">{getI18nContent(llmModel?.displayName)}</h1>
      </header>
      <Tabs
        defaultValue="info"
        className="[&_[role='tabpanel']]:mt-4 [&_[role='tabpanel']]:h-[calc(100vh-11.5rem)] [&_[role='tabpanel']]:overflow-y-auto [&_[role='tabpanel']]:overflow-x-hidden"
      >
        <TabsList>
          <TabsTrigger value="info" className="text-xs">
            {t('ugc-page.comfyui-workflow.detail.tabs.info.label')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <UgcDetailInfo columns={createTextModelsColumns()} data={llmModel} assetKey="llm-model" />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export const Route = createFileRoute('/$teamId/text-models/$llmModelId/')({
  component: IComfyUIWorkflowDetail,
  beforeLoad: teamIdGuard,
});
