import React, { useState } from 'react';

import { createFileRoute, useRouter } from '@tanstack/react-router';

import { Brain, TestTube, Undo2, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useGetModelTraining } from '@/apis/model-training';
import { DataUploadModule } from '@/components/layout/ugc-pages/model-training-v2/modules/data-upload';
import { ModelTestModule } from '@/components/layout/ugc-pages/model-training-v2/modules/model-test';
import { ModelTrainingModule } from '@/components/layout/ugc-pages/model-training-v2/modules/model-training';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IModelTrainingV2DetailProps {}

export const ModelTrainingV2Detail: React.FC<IModelTrainingV2DetailProps> = () => {
  const { t } = useTranslation();
  const { history } = useRouter();
  const { modelTrainingId } = Route.useParams();
  const [activeTab, setActiveTab] = useState('data-upload');

  const { data: modelTraining } = useGetModelTraining(modelTrainingId);

  if (!modelTraining) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">{t('common.utils.not-found')}</h2>
          <p className="text-muted-foreground">{t('common.utils.resource-not-found')}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex size-full flex-col gap-global">
      <header className="flex items-center gap-global">
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
        <h1 className="line-clamp-1 text-2xl font-bold">{String(modelTraining.displayName)}</h1>
      </header>

      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data-upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              数据上传/选择
            </TabsTrigger>
            <TabsTrigger value="model-training" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              模型训练
            </TabsTrigger>
            <TabsTrigger value="model-test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              模型测试
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 h-[calc(100vh-200px)]">
            <TabsContent value="data-upload" className="h-full">
              <DataUploadModule modelTrainingId={modelTrainingId} />
            </TabsContent>

            <TabsContent value="model-training" className="h-full">
              <ModelTrainingModule
                modelTrainingId={modelTrainingId}
                displayName={String(modelTraining.displayName)}
                onNavigateToTest={() => setActiveTab('model-test')}
              />
            </TabsContent>

            <TabsContent value="model-test" className="h-full">
              <ModelTestModule modelTrainingId={modelTrainingId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  );
};

export const Route = createFileRoute('/$teamId/model-training-v2/$modelTrainingId/')({
  component: ModelTrainingV2Detail,
});
