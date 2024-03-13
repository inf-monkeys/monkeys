import React, { useState } from 'react';

import { Info, RefreshCcw } from 'lucide-react';

import { useWorkflowValidation } from '@/apis/workflow/validation';
import { Button } from '@/components/ui/button';
import { Indicator } from '@/components/ui/indicator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VINES_VARIABLE_TAG } from '@/package/vines-flow/core/tools/consts.ts';
import { VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { useFlowStore } from '@/store/useFlowStore';

interface IInputPropertyWrapperProps {
  def: VinesToolDefProperties;
  children: React.ReactNode;
  nodeId: string;
  workflowVersion: number;
  headerExtra?: React.ReactNode;
  isMultiple?: boolean;
  hasValue?: boolean;
  headerVisible?: boolean;
}

export const InputPropertyWrapper: React.FC<IInputPropertyWrapperProps> = ({
  nodeId,
  workflowVersion,
  children,
  headerExtra,
  def: { type, displayName, name, description, required = false },
  hasValue = false,
  isMultiple = false,
  headerVisible = true,
}) => {
  const { workflowId } = useFlowStore();
  const { data: validation } = useWorkflowValidation(workflowId, workflowVersion);

  const errors =
    validation?.validationIssues?.filter(
      ({ detailReason, taskReferenceName }) => detailReason.name === name && taskReferenceName === nodeId,
    ) ?? [];

  const tag = VINES_VARIABLE_TAG[type];

  const [tipsOpen, setTipsOpen] = useState(false);
  const tips = !tag ? '不受支持的类型' : required ? '必填项' : '';

  return (
    <main className="flex flex-col gap-3">
      {headerVisible && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tooltip open={tipsOpen} onOpenChange={(val) => tips && setTipsOpen(val)}>
              <TooltipTrigger asChild>
                <Indicator dot={!hasValue && required}>
                  <div
                    className="text-xxs cursor-default select-none whitespace-nowrap rounded-sm px-1 py-1 font-bold leading-none shadow-inner"
                    style={{
                      backgroundColor: (isMultiple ? tag?.multipleColor : tag?.color) ?? '#2b2e35',
                    }}
                  >
                    {tag?.name ?? type}
                    {isMultiple ? '列表' : ''}
                  </div>
                </Indicator>
              </TooltipTrigger>
              <TooltipContent>{tips}</TooltipContent>
            </Tooltip>
            <span className="ml-1 line-clamp-1 text-sm font-bold leading-tight">{displayName}</span>
            <span className="text-text1 pointer-events-none line-clamp-1 select-none leading-tight">{name}</span>
          </div>
          {headerExtra}
        </div>
      )}
      {children}

      {description && (
        <div className="flex gap-2 rounded-md bg-gray-600 bg-opacity-20 p-2 shadow-sm">
          <Info size={14} />
          <span className="-mt-0.5 w-[calc(100%-14px)] text-xs text-opacity-70">{description}</span>
        </div>
      )}

      {errors?.map((it, index) => (
        <div className="flex justify-between gap-2 rounded bg-red-600 bg-opacity-20 px-2 py-1 shadow-sm" key={index}>
          <div className="flex gap-2 text-red-10">
            <Info size={14} />
            <span className="-mt-0.5 w-[calc(100%-14px)] text-xs text-opacity-70">{it.humanMessage.zh}</span>
          </div>
          <Tooltip>
            <Button icon={<RefreshCcw />} className="-my-1.5 -mr-2.5 !size-8 !scale-[0.6]" />
          </Tooltip>
        </div>
      ))}
    </main>
  );
};
