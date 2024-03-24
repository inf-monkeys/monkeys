import React, { useState } from 'react';

import { Info } from 'lucide-react';

import { InputErrors } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/input-property/wrapper/errors.tsx';
import { Indicator } from '@/components/ui/indicator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VINES_VARIABLE_TAG } from '@/package/vines-flow/core/tools/consts.ts';
import { VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

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
            <span className="pointer-events-none line-clamp-1 select-none text-xs leading-tight text-gray-500">
              {name}
            </span>
          </div>
          {headerExtra}
        </div>
      )}
      {children}

      {description && (
        <div className="flex gap-2 rounded-md border border-input p-2 shadow-sm">
          <Info size={14} />
          <span className="-mt-0.5 w-[calc(100%-14px)] text-xs text-opacity-70">{description}</span>
        </div>
      )}

      <InputErrors toolDefName={name} nodeId={nodeId} />
    </main>
  );
};
