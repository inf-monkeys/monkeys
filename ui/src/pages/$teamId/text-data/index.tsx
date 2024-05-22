import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { preloadKnowledgeBases, useUgcKnowledgeBases } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createTextDataColumns } from '@/components/layout/ugc-pages/text-data/consts.tsx';
import { CreateDataset } from '@/components/layout/ugc-pages/text-data/create-dataset';
import { OperateArea } from '@/components/layout/ugc-pages/text-data/operate-area';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const TextData: React.FC = () => {
  const { t: tHook } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="text-data"
        assetType="knowledge-base"
        assetName={tHook('components.layout.main.sidebar.list.media.text-data.label')}
        useUgcFetcher={useUgcKnowledgeBases}
        preloadUgcFetcher={preloadKnowledgeBases}
        createColumns={() => createTextDataColumns({ hooks: { navigate } })}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? tHook('common.utils.unknown')} ${tHook('common.utils.created-at', {
                time: formatTimeDiffPrevious(item.createdTimestamp),
              })}`}
            </span>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
        }}
        subtitle={<CreateDataset />}
        operateArea={(item, trigger, tooltipTriggerContent) => (
          <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
        )}
        onItemClick={(item) => {
          void navigate({
            to: `/$teamId/text-data/${item.uuid}`,
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
