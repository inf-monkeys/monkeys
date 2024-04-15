import React from 'react';

import { Play } from 'lucide-react';
import { VinesWorkflowInput } from 'src/components/layout/vines-view/execution/workflow-input';

import { Button } from '@/components/ui/button';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { cn } from '@/utils';

interface IAnInputProps {
  disabled: boolean;
  inputs: VinesWorkflowVariable[];
  onClick: () => void;
}

export const AnInput: React.FC<IAnInputProps> = ({ inputs, onClick, disabled }) => {
  return (
    <>
      <VinesWorkflowInput
        inputs={inputs}
        formClassName={cn('flex-row items-end w-full gap-0', disabled && 'pointer-events-none opacity-85')}
        scrollAreaClassName="flex-1"
        itemClassName="w-full border-transparent bg-transparent py-0 space-y-1 [&_input]:bg-transparent"
        onSubmit={onClick}
      >
        <Button className="mb-1 min-h-10" variant="outline" icon={<Play />} type="submit" loading={disabled}>
          运行
        </Button>
      </VinesWorkflowInput>
    </>
  );
};
