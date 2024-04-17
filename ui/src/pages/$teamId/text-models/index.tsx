import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { preloadUgcTextModels, useUgcTextModels } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createTextModelsColumns } from '@/components/layout/ugc-pages/text-models/consts.tsx';
import { OperateArea } from '@/components/layout/ugc-pages/text-models/operate-area';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const TextModels: React.FC = () => {
  return (
    <main className="size-full">
      <UgcView
        assetKey="text-models"
        assetType="llm-model"
        assetName="语言模型"
        useUgcFetcher={useUgcTextModels}
        preloadUgcFetcher={preloadUgcTextModels}
        createColumns={() => createTextModelsColumns()}
        renderOptions={{
          subtitle: (item) => {
            return (
              <div className="flex gap-1">
                <span>{item.user?.name ?? '未知'}</span>
                <span>创建于</span>
                <span>{formatTimeDiffPrevious(item.createdTimestamp)}</span>
              </div>
            );
          },
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
