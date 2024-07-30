import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { preloadUgcAgents, useUgcAgents } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createAgentsColumns } from '@/components/layout/ugc-pages/agents/consts.tsx';
import { CreateAppDialog } from '@/components/layout/ugc-pages/apps/create';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ConversationApps: React.FC = () => {
  const { t: tHook } = useTranslation();

  return (
    <main className="size-full">
      <UgcView
        assetKey="agent"
        assetType="conversation-app"
        assetIdKey="agent"
        assetName={tHook('components.layout.main.sidebar.list.agent.label')}
        useUgcFetcher={useUgcAgents}
        preloadUgcFetcher={preloadUgcAgents}
        createColumns={createAgentsColumns}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? tHook('common.utils.unknown')} ${
                item.createdTimestamp &&
                tHook('common.utils.created-at', {
                  time: formatTimeDiffPrevious(item.createdTimestamp),
                })
              }`}
            </span>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
        }}
        // onItemClick={(item) => {}}
        subtitle={
          <>
            <CreateAppDialog defaultSelect="agent" />
          </>
        }
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/agents/')({
  component: ConversationApps,
  beforeLoad: teamIdGuard,
});
