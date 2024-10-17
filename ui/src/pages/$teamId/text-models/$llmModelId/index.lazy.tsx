import React from 'react';

import { mutate } from 'swr';
import { createLazyFileRoute } from '@tanstack/react-router';

import { Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useLLMModel } from '@/apis/llm';
import { UgcDetailInfo } from '@/components/layout/ugc/detail/info';
import { createTextModelsColumns } from '@/components/layout/ugc-pages/text-models/consts';
import { TextModelsList } from '@/components/layout/ugc-pages/text-models/models/list.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getI18nContent } from '@/utils';

interface IComfyUIWorkflowDetailProps {}

export const IComfyUIWorkflowDetail: React.FC<IComfyUIWorkflowDetailProps> = () => {
  const { t } = useTranslation();
  const { llmModelId } = Route.useParams();
  const { data: llmModel } = useLLMModel(llmModelId);

  const modelMetadata = llmModel?.metadata;

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
        <h1 className="line-clamp-1 text-2xl font-bold">{getI18nContent(llmModel?.displayName)}</h1>
      </header>
      <div className="grid grid-cols-5 gap-4">
        <UgcDetailInfo
          className="col-span-3"
          columns={createTextModelsColumns()}
          data={llmModel}
          assetKey="llm-model"
        />
        <TextModelsList
          models={llmModel?.models ?? {}}
          properites={modelMetadata?.properites ?? []}
          modelType={modelMetadata?.id}
          modelId={llmModelId}
          afterOperate={() =>
            mutate((key) => typeof key === 'string' && key.startsWith(`/api/llm-models/${llmModelId}`))
          }
        />
      </div>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/text-models/$llmModelId/')({
  component: IComfyUIWorkflowDetail,
});
