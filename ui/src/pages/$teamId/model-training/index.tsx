import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { preloadUgcModelTraining, useUgcModelTraining } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { createModelTrainingColumns } from '@/components/layout/ugc-pages/model-training/consts';
import { CreateModelTrainingDialog } from '@/components/layout/ugc-pages/model-training/create';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ModelTraining: React.FC = () => {
  const { t: tHook } = useTranslation();

  return (
    <main className="size-full">
      <UgcView
        assetKey="model-training"
        assetType="model-training"
        assetName={tHook('components.layout.main.sidebar.list.model.model-training.label')}
        useUgcFetcher={useUgcModelTraining}
        preloadUgcFetcher={preloadUgcModelTraining}
        createColumns={() =>
          createModelTrainingColumns({
            hooks: {
              tHook,
            },
          })
        }
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? tHook('common.utils.unknown')} ${tHook('common.utils.created-at', {
                time: formatTimeDiffPrevious(item.createdTimestamp),
              })}`}
            </span>
          ),
        }}
        operateArea={(item, trigger, tooltipTriggerContent) => (
          // <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
          <></>
        )}
        subtitle={
          <>
            <CreateModelTrainingDialog />
          </>
        }
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/model-training/')({
  component: ModelTraining,
});
