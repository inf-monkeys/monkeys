import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { preloadUgcTextModelStore, useUgcTextModelStore } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createTextModelStoreColumns } from '@/components/layout/ugc-pages/text-model-store/consts.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const TextModelStore: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="text-model-store"
        assetType="llm-model"
        assetName="文本模型市场"
        isMarket
        useUgcFetcher={useUgcTextModelStore}
        preloadUgcFetcher={preloadUgcTextModelStore}
        createColumns={() => createTextModelStoreColumns()}
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

export const Route = createFileRoute('/$teamId/text-model-store/')({
  component: TextModelStore,
  beforeLoad: teamIdGuard,
});
