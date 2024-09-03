import React from 'react';

import { useEventEmitter } from 'ahooks';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { ChatInputMoreOperations } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input/more-operations';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IFormInputProps {
  height: number;
  inputs: VinesWorkflowVariable[];
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const FormInput: React.FC<IFormInputProps> = ({ inputs, height, onClick, disabled, loading }) => {
  const { t } = useTranslation();

  const { ref, width } = useElementSize();

  const tabular$ = useEventEmitter<TTabularEvent>();
  const workflowId = useFlowStore((s) => s.workflowId);

  const isInputNotEmpty = inputs.length > 0;

  return (
    <motion.div
      ref={ref}
      className={cn('w-full overflow-hidden px-3', disabled && 'pointer-events-none opacity-85')}
      animate={{ marginRight: disabled ? -width - 35 : 0 }}
    >
      <TabularRender inputs={inputs} height={height} onSubmit={onClick} event$={tabular$} workflowId={workflowId}>
        <div className="flex w-full items-center gap-2">
          {isInputNotEmpty && <ChatInputMoreOperations tabular$={tabular$} />}
          <Button
            variant="outline"
            type="submit"
            className="line-clamp-1 w-full"
            loading={loading || disabled}
            disabled={disabled}
          >
            {t('workspace.chat-view.workflow-mode.execution')}
          </Button>
        </div>
      </TabularRender>
    </motion.div>
  );
};
