import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { useGetWorkflow } from '@/apis/workflow';
import { Route } from '@/pages/login';
import { cn, getI18nContent } from '@/utils';

interface IWorkflowCellProps {
  workflowId: string;
}

export const WorkflowCell: React.FC<IWorkflowCellProps> = ({ workflowId }) => {
  const { t } = useTranslation();

  const navigate = useNavigate({ from: Route.fullPath });
  const { data: workflow, isLoading } = useGetWorkflow(workflowId);

  return isLoading ? (
    <span>{t('common.load.loading')}</span>
  ) : (
    <span
      className={cn({
        'cursor-pointer': workflow,
        'cursor-default': !workflow,
      })}
      onClick={() => {
        workflow &&
          navigate({
            to: '/$teamId/workspace/'.concat(workflow.workflowId),
          });
      }}
    >
      {workflow
        ? getI18nContent(workflow?.displayName) ?? t('common.utils.unknown')
        : t('common.toast.workflow-not-found')}
    </span>
  );
};
