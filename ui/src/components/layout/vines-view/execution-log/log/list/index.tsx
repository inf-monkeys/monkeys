import React, { useMemo } from 'react';

import { motion } from 'framer-motion';
import _ from 'lodash';
import { BookDashed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VinesWorkflowExecutionLists } from '@/apis/workflow/execution/typings.ts';
import { VinesLogItem } from '@/components/layout/vines-view/execution-log/log/item';
import { Accordion } from '@/components/ui/accordion.tsx';

interface IVinesLogViewLogListProps {
  searchWorkflowExecutionsData?: VinesWorkflowExecutionLists;
  handleSubmit: (loadNextPage?: boolean) => void;

  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

export const VinesLogViewLogList: React.FC<IVinesLogViewLogListProps> = ({
  searchWorkflowExecutionsData,
  handleSubmit,
  activeTab,
  setActiveTab,
}) => {
  const { t } = useTranslation();

  const workflowDefinitions = searchWorkflowExecutionsData?.definitions;
  const workflowExecutions = searchWorkflowExecutionsData?.data;
  const workflowTotal = searchWorkflowExecutionsData?.total;

  const workflowDefinitionIdMapper = useMemo(() => {
    return _.keyBy(workflowDefinitions, 'workflowId');
  }, [workflowDefinitions]);

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
            <h2 className="font-bold">{t('workspace.logs-view.log.list.empty')}</h2>
          </div>
        </motion.div>
      )}
      <Accordion
        type="single"
        collapsible
        className="flex w-full flex-col gap-3"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        {workflowExecutions && workflowDefinitions
          ? workflowExecutions.map((workflowExecution, index) => (
              <VinesLogItem
                key={index}
                workflowExecution={workflowExecution}
                workflowDefinition={workflowDefinitionIdMapper[workflowExecution.workflowName!]}
              />
            ))
          : null}
      </Accordion>
      {workflowExecutions && workflowDefinitions && workflowTotal ? (
        workflowTotal - workflowExecutionLength <= 0 ? (
          <div className="w-full cursor-default text-center text-sm opacity-75">
            {t('workspace.logs-view.log.list.bottom')}
          </div>
        ) : (
          <div
            className="w-full cursor-pointer bg-opacity-0 py-2 text-center hover:bg-foreground-500 hover:bg-opacity-5"
            onClick={() => handleSubmit(true)}
          >
            {t('workspace.logs-view.log.list.more', { data: workflowTotal - workflowExecutionLength })}
          </div>
        )
      ) : null}
    </div>
  );
};
