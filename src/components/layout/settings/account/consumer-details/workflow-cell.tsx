import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useGetWorkflow } from '@/apis/workflow';
import { Route } from '@/pages/login.tsx';
import { cn } from '@/utils';

interface IWorkflowCellProps {
  workflowId: string;
}

export const WorkflowCell: React.FC<IWorkflowCellProps> = ({ workflowId }) => {
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: workflow, isLoading } = useGetWorkflow('', workflowId);

  return isLoading ? (
    <span>加载中</span>
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
      {workflow ? workflow?.name ?? '未知' : '工作流不存在'}
    </span>
  );
};
