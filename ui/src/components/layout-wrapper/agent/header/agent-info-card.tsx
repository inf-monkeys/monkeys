import React from 'react';

import { useParams } from '@tanstack/react-router';

import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useGetAgent } from '@/apis/agents';
import { AgentInfoEditor } from '@/components/layout/agent-space/agent-info-editor.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';

interface IAgentInfoCardProps {}

export const AgentInfoCard: React.FC<IAgentInfoCardProps> = () => {
  const { t } = useTranslation();

  const { agentId } = useParams({ from: '/$teamId/agent/$agentId/' });
  const { data } = useGetAgent(agentId);

  return (
    <Tooltip>
      <AgentInfoEditor agent={data}>
        <TooltipTrigger asChild>
          <div className="group flex cursor-pointer items-center gap-2.5">
            <VinesIcon size="sm">{data?.iconUrl || 'emoji:🤖:#ceefc5'}</VinesIcon>
            <div className="flex flex-col gap-0.5">
              <h1 className="font-bold leading-tight">{getI18nContent(data?.displayName)}</h1>
              {data?.description && <span className="text-xxs">{getI18nContent(data.description)}</span>}
            </div>

            <div className="mt-0.5 opacity-0 transition-opacity group-hover:opacity-70">
              <Pencil size={12} />
            </div>
          </div>
        </TooltipTrigger>
      </AgentInfoEditor>
      <TooltipContent>{t('agent.info.tip')}</TooltipContent>
    </Tooltip>
  );
};
