import React from 'react';

import { Info, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

import { useWorkflowValidate, useWorkflowValidation } from '@/apis/workflow/validation';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';

interface IInputErrorsProps extends React.ComponentPropsWithoutRef<'div'> {
  nodeId: string;
  toolDefName: string;
}

export const InputErrors: React.FC<IInputErrorsProps> = ({ nodeId, toolDefName }) => {
  const { workflowId } = useFlowStore();
  const { vines } = useVinesFlow();

  const { data: validation, mutate } = useWorkflowValidation(workflowId, vines.version);
  const { trigger, isMutating } = useWorkflowValidate();

  const errors =
    validation?.validationIssues?.filter(
      ({ detailReason, taskReferenceName }) => detailReason.name === toolDefName && taskReferenceName === nodeId,
    ) ?? [];

  const handleReValidate = () => {
    toast.promise(trigger({ tasks: vines.getRaw(), output: vines.workflowInput }), {
      loading: '正在重新验证...',
      success: (newValidation) => {
        newValidation && mutate(newValidation);
        return !newValidation?.validated && newValidation?.validationIssues.length
          ? '验证完成，但仍存在错误，请检查'
          : '验证成功';
      },
      error: '验证失败',
    });
  };

  return errors?.map((it, index) => (
    <div
      className="flex justify-between gap-2 rounded border border-input bg-red-600 bg-opacity-20 px-2 py-1 shadow-sm"
      key={index}
    >
      <div className="mt-1 flex gap-2 text-red-10">
        <Info size={14} className="stroke-red-10" />
        <span className="-mt-0.5 w-[calc(100%-14px)] text-xs text-red-10 text-opacity-70 dark:text-gold-12/70">
          {it.humanMessage.zh}
        </span>
      </div>
      <Tooltip>
        <Button
          icon={<RefreshCcw />}
          className="-my-1.5 -mr-2.5 !size-8 !scale-[0.6]"
          variant="outline"
          loading={isMutating}
          onClick={handleReValidate}
        />
      </Tooltip>
    </div>
  ));
};
