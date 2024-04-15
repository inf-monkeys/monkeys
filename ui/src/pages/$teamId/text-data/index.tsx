import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { preloadKnowledgeBases, useUgcKnowledgeBases } from '@/apis/ugc';
import { createTextDataColumn } from '@/components/layout/ugc-pages/text-data/consts.tsx';
import { CreateDataset } from '@/components/layout/ugc-pages/text-data/create-dataset';
import { OperateArea } from '@/components/layout/ugc-pages/text-data/operate-area';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const TextData: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="text-data"
        assetType="knowledge-base"
        assetName="文本数据"
        useUgcFetcher={useUgcKnowledgeBases}
        preloadUgcFetcher={preloadKnowledgeBases}
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
        operateArea={(item, trigger, tooltipTriggerContent) => (
          <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
        )}
        onItemClick={(item) => {
          void navigate({
            to: `/$teamId/text-data/${item.name}`,
          });
        }}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/text-data/')({
  component: TextData,
  beforeLoad: teamIdGuard,
});
