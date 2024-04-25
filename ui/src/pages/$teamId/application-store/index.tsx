import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { preloadUgcApplicationStore, useUgcApplicationStore } from '@/apis/ugc';
import { createApplicationStoreColumns } from '@/components/layout/ugc-pages/application-store/consts.tsx';
import { OperateArea } from '@/components/layout/ugc-pages/application-store/operate-area';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ApplicationStore: React.FC = () => {
  return (
    <main className="size-full">
      <UgcView
        assetKey="application-store"
        assetType="workflow"
        assetName="应用市场"
        isMarket
        useUgcFetcher={useUgcApplicationStore}
        preloadUgcFetcher={preloadUgcApplicationStore}
        createColumns={() => createApplicationStoreColumns()}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? '系统内置'} 创建于 ${formatTimeDiffPrevious(item.createdTimestamp)}`}
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

export const Route = createFileRoute('/$teamId/application-store/')({
  component: ApplicationStore,
  beforeLoad: teamIdGuard,
});
