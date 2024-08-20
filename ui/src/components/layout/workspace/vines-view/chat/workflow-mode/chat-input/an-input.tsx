import React from 'react';

import { useEventEmitter } from 'ahooks';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ChatInputMoreOperations } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input/more-operations';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { cn } from '@/utils';

interface IAnInputProps {
  loading: boolean;
  disabled: boolean;
  inputs: VinesWorkflowVariable[];
  onClick: () => void;
}

export const AnInput: React.FC<IAnInputProps> = ({ inputs, onClick, disabled, loading }) => {
  const { t } = useTranslation();

  const tabular$ = useEventEmitter<TTabularEvent>();
  const isInputNotEmpty = inputs.length > 0;

  return (
    <TabularRender
      inputs={inputs}
      formClassName={cn('flex-row items-end w-full gap-0', disabled && 'pointer-events-none opacity-85')}
      scrollAreaClassName="flex-1"
      itemClassName="w-full border-transparent bg-transparent py-0 space-y-1 [&_input]:bg-transparent"
      onSubmit={onClick}
      event$={tabular$}
      miniMode
    >
      <div className="flex items-center gap-2">
        {isInputNotEmpty && <ChatInputMoreOperations tabular$={tabular$} />}
        <Button variant="outline" icon={<Play />} type="submit" disabled={disabled} loading={loading || disabled}>
          {t('workspace.chat-view.workflow-mode.execution')}
        </Button>
      </div>
    </TabularRender>
  );
};
