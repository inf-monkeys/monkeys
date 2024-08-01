import React from 'react';

import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TabularRender } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { cn } from '@/utils';

interface IAnInputProps {
  disabled: boolean;
  inputs: VinesWorkflowVariable[];
  onClick: () => void;
}

export const AnInput: React.FC<IAnInputProps> = ({ inputs, onClick, disabled }) => {
  const { t } = useTranslation();

  return (
    <>
      <TabularRender
        inputs={inputs}
        formClassName={cn('flex-row items-end w-full gap-0', disabled && 'pointer-events-none opacity-85')}
        scrollAreaClassName="flex-1"
        itemClassName="w-full border-transparent bg-transparent py-0 space-y-1 [&_input]:bg-transparent"
        onSubmit={onClick}
        miniMode
      >
        <Button className="mb-1 min-h-10" variant="outline" icon={<Play />} type="submit" loading={disabled}>
          {t('workspace.chat-view.workflow-mode.execution')}
        </Button>
      </TabularRender>
    </>
  );
};
