import React, { useEffect, useMemo } from 'react';

import { useParams } from '@tanstack/react-router';

import _ from 'lodash';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { VinesLogItem } from '@/components/layout/view/vines-log/item';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

export const VinesLogView: React.FC = () => {
  const { workflowId: pageWorkflowId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId' });

  const { data: searchWorkflowExecutionsData, trigger } = useSearchWorkflowExecutions();

  const workflowDefinitions = searchWorkflowExecutionsData?.definitions;
  const workflowExecutions = searchWorkflowExecutionsData?.data;
  const workflowTotal = searchWorkflowExecutionsData?.total;

  const workflowDefinitionIdMapper = useMemo(() => {
    return _.keyBy(workflowDefinitions, 'workflowId');
  }, [workflowDefinitions]);

  useEffect(() => {
    if (pageWorkflowId) {
      void trigger({
        workflowId: pageWorkflowId,
      });
    }
  }, [pageWorkflowId]);

  return (
    <main className="flex p-4">
      <div className="w-[220px]">筛选区域</div>
      <div className="flex-1">
        <ScrollArea className="h-[calc(100vh-3.5rem-0.5rem-0.25rem-1rem-2rem-2rem)]">
          <div className="flex flex-col gap-3">
            {workflowExecutions &&
              workflowDefinitions &&
              workflowExecutions.map((workflowExecution, index) => (
                <VinesLogItem
                  key={index}
                  workflowExecution={workflowExecution}
                  workflowDefinition={workflowDefinitionIdMapper[workflowExecution.workflowName!]}
                />
              ))}
          </div>
        </ScrollArea>
      </div>
    </main>
  );
};
