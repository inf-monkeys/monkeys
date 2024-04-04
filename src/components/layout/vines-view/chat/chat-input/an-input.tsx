import React from 'react';

import { Play } from 'lucide-react';
import { VinesWorkflowInput } from 'src/components/layout/vines-view/execution/workflow-input';

import { Button } from '@/components/ui/button';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';

interface IAnInputProps {
  inputs: VinesWorkflowVariable[];
  onClick: () => void;
}

export const AnInput: React.FC<IAnInputProps> = ({ inputs, onClick }) => {
  return (
    <>
      <VinesWorkflowInput
        inputs={inputs}
        formClassName="flex-row items-end w-full gap-0"
        scrollAreaClassName="flex-1"
        itemClassName="w-full border-transparent bg-transparent py-0 space-y-1 [&_input]:bg-transparent"
        onSubmit={onClick}
      >
        <Button className="mb-1 min-h-10" variant="outline" icon={<Play />} type="submit">
          运行
        </Button>
      </VinesWorkflowInput>
    </>
  );
};
