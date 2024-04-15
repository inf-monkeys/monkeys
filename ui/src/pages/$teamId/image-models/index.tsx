import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { preloadUgcImageModels, useUgcImageModels } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createImageModelsColumns } from '@/components/layout/ugc-pages/image-models/consts.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ImageModels: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="image-models"
        assetType="sd-model"
        assetName="图像模型"
        useUgcFetcher={useUgcImageModels}
        preloadUgcFetcher={preloadUgcImageModels}
        createColumns={() => createImageModelsColumns}
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
        onItemClick={(item) => {
          void navigate({
            to: `/$teamId/image-models/${item.name}`,
          });
        }}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/image-models/')({
  component: ImageModels,
  beforeLoad: teamIdGuard,
});
