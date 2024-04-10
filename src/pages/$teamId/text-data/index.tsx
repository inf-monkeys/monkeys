import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { preloadUgcVectors, useUgcVectors } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createTextDataColumn } from '@/components/layout/ugc-pages/text-data/consts.tsx';
import { CreateDataset } from '@/components/layout/ugc-pages/text-data/create-dataset';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const TextData: React.FC = () => {
  return (
    <main className="size-full">
      <UgcView
        assetKey="text-data"
        assetType="text-collection"
        assetName="文本数据"
        useUgcFetcher={useUgcVectors}
        preloadUgcFetcher={preloadUgcVectors}
        createColumns={() => createTextDataColumn}
        renderOptions={{
          subtitle: (item) => (
            <div className="flex gap-1">
              <span>{item.user?.name ?? '未知'}</span>
              <span>创建于</span>
              <span>{formatTimeDiffPrevious(item.createdTimestamp)}</span>
            </div>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
        }}
        subtitle={<CreateDataset />}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/text-data/')({
  component: TextData,
  beforeLoad: teamIdGuard,
});
