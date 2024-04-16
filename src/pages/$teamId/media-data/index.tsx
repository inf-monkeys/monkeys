import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { preloadUgcMediaData, useUgcMediaData } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createMediaDataColumns } from '@/components/layout/ugc-pages/media-data/consts.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const MediaData: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="media-data"
        assetType="media-file"
        assetName="富媒体数据"
        useUgcFetcher={useUgcMediaData}
        preloadUgcFetcher={preloadUgcMediaData}
        createColumns={() => createMediaDataColumns()}
        renderOptions={{
          subtitle: (item) => (
            <div className="flex gap-1">
              <span>{item.user?.name ?? '未知'}</span>
              <span>创建于</span>
              <span>{formatTimeDiffPrevious(item.createdTimestamp)}</span>
            </div>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.type === 'image' ? item.url : '', size: 'gallery' }),
        }}
        subtitle={<></>}
        operateArea={(item, trigger, tooltipTriggerContent) => <></>}
        onItemClick={(item) => {}}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/media-data/')({
  component: MediaData,
  beforeLoad: teamIdGuard,
});
