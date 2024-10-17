import React from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { preloadUgcApplicationStore, useUgcApplicationStore } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createApplicationStoreColumns } from '@/components/layout/ugc-pages/application-store/consts.tsx';
import { OperateArea } from '@/components/layout/ugc-pages/application-store/operate-area';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ApplicationStore: React.FC = () => {
  const { t: tHook } = useTranslation();

  return (
    <main className="size-full">
      <UgcView
        assetKey="application-store"
        assetType="workflow"
        assetName={tHook('components.layout.main.sidebar.list.store.application-store.label')}
        isMarket
        useUgcFetcher={useUgcApplicationStore}
        preloadUgcFetcher={preloadUgcApplicationStore}
        createColumns={() => createApplicationStoreColumns()}
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

export const Route = createLazyFileRoute('/$teamId/application-store/')({
  component: ApplicationStore,
});
