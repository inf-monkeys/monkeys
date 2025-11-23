import React, { useEffect } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { preloadUgcModelTraining, useUgcModelTraining } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { createModelTrainingColumns } from '@/components/layout/ugc-pages/model-training/consts';
import { CreateModelTrainingDialog } from '@/components/layout/ugc-pages/model-training/create';
import { OperateArea } from '@/components/layout/ugc-pages/model-training/operate-area';
import { useMediaDataFilter,useSetMediaDataFilter } from '@/store/useMediaDataStore';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ModelTrainingV2: React.FC = () => {
  const { t: tHook } = useTranslation();
  const setFilter = useSetMediaDataFilter();
  const currentFilter = useMediaDataFilter();

  // 设置默认的 versionType 过滤为 2
  useEffect(() => {
    // 每次进入页面时，确保 versionType 为 2
    setFilter({ ...currentFilter, versionType: 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="size-full">
      <UgcView
        assetKey="model-training-v2"
        assetType="model-training"
        assetName={tHook('components.layout.main.sidebar.list.model.model-training-v2.label')}
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
          <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
        )}
        subtitle={
          <>
            <CreateModelTrainingDialog versionType={2} />
          </>
        }
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/model-training-v2/')({
  component: ModelTrainingV2,
});
