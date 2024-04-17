import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { preloadUgcApplicationStore, useUgcApplicationStore } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createApplicationStoreColumns } from '@/components/layout/ugc-pages/application-store/consts.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ApplicationStore: React.FC = () => {
  return (
    <main className="size-full">
      <UgcView
        assetKey="application-store"
        assetType="workflow-template"
        assetName="应用市场"
        isMarket
        useUgcFetcher={useUgcApplicationStore}
        preloadUgcFetcher={preloadUgcApplicationStore}
        createColumns={() => createApplicationStoreColumns()}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? '未知'} 创建于 ${formatTimeDiffPrevious(item.createdTimestamp)}`}
            </span>
          ),
          cover: (item) => {
            return RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' });
          },
        }}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/application-store/')({
  component: ApplicationStore,
  beforeLoad: teamIdGuard,
});
