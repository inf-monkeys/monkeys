import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { preloadUgcImageModelStore, useUgcImageModelStore } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createImageModelStoreColumns } from '@/components/layout/ugc-pages/image-model-store/consts.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ImageModelStore: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="image-model-store"
        assetType="sd-model"
        assetName="图像模型市场"
        isMarket
        useUgcFetcher={useUgcImageModelStore}
        preloadUgcFetcher={preloadUgcImageModelStore}
        createColumns={() => createImageModelStoreColumns}
        renderOptions={{
          subtitle: (item) => (
            <div className="flex gap-1">
              <span>{item.user?.name ?? '未知'}</span>
              <span>创建于</span>
              <span>{formatTimeDiffPrevious(item.createdTimestamp)}</span>
            </div>
          ),
          cover: (item) => {
            return RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' });
          },
        }}
        onItemClick={(item) => {
          // void navigate({
          //   to: `/$teamId/action-tools/${item.name}`,
          // });
        }}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/image-model-store/')({
  component: ImageModelStore,
  beforeLoad: teamIdGuard,
});
