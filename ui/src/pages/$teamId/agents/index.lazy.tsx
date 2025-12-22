/**
 * Agents 列表页面 - 使用统一的 UgcView 组件
 */

import React from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { preloadUgcAgents, useUgcAgents } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createAgentsColumns } from '@/components/layout/ugc-pages/agents/consts.tsx';
import { OperateArea } from '@/components/layout/ugc-pages/agents/operate-area';
import { CreateAgentDialog } from '@/components/layout/ugc-pages/agents/create-agent-dialog';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const AgentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();

  return (
    <main className="size-full">
      <UgcView
        assetKey="agents"
        assetType="agent"
        assetIdKey="id"
        assetName={t('components.layout.main.sidebar.list.apps.agents.label')}
        useUgcFetcher={(dto) => useUgcAgents({ ...dto, filter: { ...dto.filter, teamId } })}
        preloadUgcFetcher={(dto) => preloadUgcAgents({ ...dto, filter: { ...dto.filter, teamId } })}
        createColumns={createAgentsColumns}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? t('common.utils.unknown-user')} ${t('common.utils.created-at', { time: formatTimeDiffPrevious(item.createdTimestamp) })}`}
            </span>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
        }}
        operateArea={(item, trigger, tooltipTriggerContent) => (
          <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
        )}
        onItemClick={(item) => {
          open(`/${item.teamId}/agents/${item.id}`, '_blank');
        }}
        subtitle={<CreateAgentDialog teamId={teamId} />}
      />
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/agents/')({
  component: AgentsPage,
});
