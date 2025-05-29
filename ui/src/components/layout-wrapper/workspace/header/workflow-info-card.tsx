import React from 'react';

import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { WorkflowInfoEditor } from '@/components/layout/workspace/workflow-info-editor.tsx';
import { useVinesOriginWorkflow } from '@/components/layout-wrapper/workspace/utils.ts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons.ts';
import { cn, getI18nContent } from '@/utils';

interface IWorkflowInfoCardProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkflowInfoCard: React.FC<IWorkflowInfoCardProps> = () => {
  const { t } = useTranslation();

  const { workflow } = useVinesOriginWorkflow();

  const enabled = !workflow?.shortcutsFlow;

  return (
    <Tooltip>
      <WorkflowInfoEditor disabled={!enabled}>
        <TooltipTrigger asChild>
          <div className={cn('group flex cursor-default items-center gap-2.5', enabled && 'cursor-pointer')}>
            <VinesIcon size="sm">{workflow?.iconUrl || DEFAULT_WORKFLOW_ICON_URL}</VinesIcon>
            <div className="flex flex-col gap-0.5">
              <h1 className="font-bold leading-tight">{getI18nContent(workflow?.displayName)}</h1>
              <div className="flex items-center gap-1">
                {!enabled && (
                  <div className="vines-center gap-2">
                    <p className="text-ss model-tag rounded-sm border border-input bg-muted px-1 py-0.5">
                      {t('workspace.flow-view.shortcuts-flow')}
                    </p>
                  </div>
                )}
                {workflow?.description && <span className="text-xxs">{getI18nContent(workflow.description)}</span>}
              </div>
            </div>

            {enabled && (
              <div className="mt-0.5 opacity-0 transition-opacity group-hover:opacity-70">
                <Pencil size={12} />
              </div>
            )}
          </div>
        </TooltipTrigger>
      </WorkflowInfoEditor>
      {enabled && <TooltipContent>{t('workspace.wrapper.workflow-info-card.tip')}</TooltipContent>}
    </Tooltip>
  );
};
