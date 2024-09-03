import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { preloadUgcTextModels, useUgcTextModels } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createTextModelsColumns } from '@/components/layout/ugc-pages/text-models/consts.tsx';
import { OperateArea } from '@/components/layout/ugc-pages/text-models/operate-area';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const TextModels: React.FC = () => {
  const { t: tHook } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="text-models"
        assetType="llm-model"
        assetName={tHook('components.layout.main.sidebar.list.model.text-models.label')}
        useUgcFetcher={useUgcTextModels}
        preloadUgcFetcher={preloadUgcTextModels}
        createColumns={() => createTextModelsColumns()}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? tHook('common.utils.system')} ${tHook('common.utils.created-at', {
                time: formatTimeDiffPrevious(item.createdTimestamp),
              })}`}
            </span>
          ),
          cover: (item) => {
            return RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' });
          },
        }}
        operateArea={(item, trigger, tooltipTriggerContent) => (
          <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
        )}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/text-models/')({
  component: TextModels,
  beforeLoad: teamIdGuard,
});
