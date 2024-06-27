import React, { useMemo } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { motion } from 'framer-motion';
import _ from 'lodash';
import { BookDashed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { VinesWorkflowExecutionLists } from '@/apis/workflow/execution/typings';
import { VinesLogItem } from '@/components/layout/vines-view/execution-log/item';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';

interface IVinesLogListProps {
  searchWorkflowExecutionsData?: VinesWorkflowExecutionLists;
  handleSubmit: (loadNextPage?: boolean) => void;
}

export const VinesLogList: React.FC<IVinesLogListProps> = ({ searchWorkflowExecutionsData, handleSubmit }) => {
  const { t } = useTranslation();

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
          // @ts-ignore
          params: {
            pageId: previewPage.id,
          },
        });
      }
    } else {
      toast.error(t('workspace.logs-view.list.preview-page-not-found'));
    }
  };

  const workflowExecutionLength = workflowExecutions?.length ?? 0;

  return (
    <div className="flex h-full flex-col gap-3 px-2">
      {!workflowExecutionLength && (
        <motion.div
          className="vines-center size-full flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.3 } }}
        >
          <BookDashed size={64} />
          <div className="mt-4 flex flex-col text-center">
            <h2 className="font-bold">{t('workspace.logs-view.list.empty')}</h2>
          </div>
        </motion.div>
      )}
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
          <div className="w-full cursor-default text-center text-sm opacity-75">
            {t('workspace.logs-view.list.bottom')}
          </div>
        ) : (
          <div
            className="w-full cursor-pointer bg-opacity-0 py-2 text-center hover:bg-foreground-500 hover:bg-opacity-5"
            onClick={() => handleSubmit(true)}
          >
            {t('workspace.logs-view.list.more', { data: workflowTotal - workflowExecutionLength })}
          </div>
        )
      ) : null}
    </div>
  );
};
