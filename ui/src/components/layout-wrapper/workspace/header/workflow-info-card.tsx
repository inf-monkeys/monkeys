import React from 'react';

import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { WorkflowInfoEditor } from '@/components/layout/workspace/workflow-info-editor.tsx';
import { useVinesOriginWorkflow } from '@/components/layout-wrapper/workspace/utils.ts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';

interface IWorkflowInfoCardProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkflowInfoCard: React.FC<IWorkflowInfoCardProps> = () => {
  const { t } = useTranslation();

  const { workflow } = useVinesOriginWorkflow();

  return (
    <Tooltip>
      <WorkflowInfoEditor>
        <TooltipTrigger asChild>
          <div className="group flex cursor-pointer items-center gap-2.5">
            <VinesIcon size="sm">{workflow?.iconUrl || 'emoji:🍀:#ceefc5'}</VinesIcon>
            <div className="flex flex-col gap-0.5">
              <h1 className="font-bold leading-tight">{getI18nContent(workflow?.displayName)}</h1>
              {workflow?.description && <span className="text-xxs">{getI18nContent(workflow?.description)}</span>}
            </div>

            <div className="mt-0.5 opacity-0 transition-opacity group-hover:opacity-70">
              <Pencil size={12} />
            </div>
          </div>
        </TooltipTrigger>
      </WorkflowInfoEditor>
      <TooltipContent>{t('workspace.wrapper.workflow-info-card.tip')}</TooltipContent>
    </Tooltip>
  );
};
