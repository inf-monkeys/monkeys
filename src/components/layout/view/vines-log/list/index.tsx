import React, { useMemo } from 'react';

import { useNavigate } from '@tanstack/react-router';

import _ from 'lodash';
import { toast } from 'sonner';

import { VinesWorkflowExecutionLists } from '@/apis/workflow/execution/typings';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { VinesLogItem } from '@/components/layout/view/vines-log/item';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';

interface IVinesLogListProps {
  searchWorkflowExecutionsData?: VinesWorkflowExecutionLists;
  handleSubmit: (loadNextPage?: boolean) => void;
}

export const VinesLogList: React.FC<IVinesLogListProps> = ({ searchWorkflowExecutionsData, handleSubmit }) => {
  const { vines } = useVinesFlow();
  const { pages } = useVinesPage();
  const navigate = useNavigate();

  const workflowDefinitions = searchWorkflowExecutionsData?.definitions;
  const workflowExecutions = searchWorkflowExecutionsData?.data;
  const workflowTotal = searchWorkflowExecutionsData?.total;

  const workflowDefinitionIdMapper = useMemo(() => {
    return _.keyBy(workflowDefinitions, 'workflowId');
  }, [workflowDefinitions]);

  const handleNavigateToPreview = (execution: VinesWorkflowExecution) => {
    const previewPage = pages?.find(({ type }) => type === 'preview');
    if (previewPage) {
      if (vines.swapExecutionInstance(execution)) {
        void navigate({
          to: '/$teamId/workspace/$workflowId/$pageId',
          params: {
            pageId: previewPage.id,
          },
        });
      }
    } else {
      toast.error('打开详情失败！找不到预览视图');
    }
  };

  const workflowExecutionLength = workflowExecutions?.length ?? 0;

  return (
    <div className="flex h-full flex-col gap-3 px-2">
      {!workflowExecutionLength && <div className="vines-center size-full">暂无数据</div>}
      {workflowExecutions && workflowDefinitions
        ? workflowExecutions.map((workflowExecution, index) => (
            <VinesLogItem
              key={index}
              onClick={() => handleNavigateToPreview(workflowExecution)}
              workflowExecution={workflowExecution}
              workflowDefinition={workflowDefinitionIdMapper[workflowExecution.workflowName!]}
            />
          ))
        : null}
      {workflowExecutions && workflowDefinitions && workflowTotal ? (
        workflowTotal - workflowExecutionLength <= 0 ? (
          <div className="w-full cursor-default text-center">到底了</div>
        ) : (
          <div
            className="w-full cursor-pointer bg-opacity-0 py-2 text-center hover:bg-foreground-500 hover:bg-opacity-5"
            onClick={() => handleSubmit(true)}
          >
            剩余 {workflowTotal - workflowExecutionLength} 项，点击加载
          </div>
        )
      ) : null}
    </div>
  );
};
