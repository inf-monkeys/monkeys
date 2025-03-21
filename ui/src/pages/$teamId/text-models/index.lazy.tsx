import React from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { preloadUgcTextModels, useUgcTextModels } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createTextModelsColumns } from '@/components/layout/ugc-pages/text-models/consts.tsx';
import { ModelSupplier } from '@/components/layout/ugc-pages/text-models/model-supplier';
import { OperateArea } from '@/components/layout/ugc-pages/text-models/operate-area';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const TextModels: React.FC = () => {
  const { t } = useTranslation();

  return (
    <main className="size-full">
      <UgcView
        assetKey="text-models"
        assetType="llm-model"
        assetName={t('components.layout.main.sidebar.list.model.text-models.label')}
        useUgcFetcher={useUgcTextModels}
        preloadUgcFetcher={preloadUgcTextModels}
        createColumns={createTextModelsColumns}
        renderOptions={{
          subtitle: (item) => {
            const userName = item.user?.name;
            return (
              <span className="line-clamp-1">
                {(userName ?? t('common.utils.system')).concat(
                  userName
                    ? t('common.utils.created-at', {
                        time: formatTimeDiffPrevious(item.createdTimestamp),
                      })
                    : '',
                )}
              </span>
            );
          },
          cover: (item) => {
            return RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' });
          },
        }}
        operateArea={(item, trigger, tooltipTriggerContent) =>
          item.channelId !== 0 && (
            <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
          )
        }
        subtitle={<ModelSupplier />}
      />
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/text-models/')({
  component: TextModels,
});
