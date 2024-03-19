import React from 'react';

import { VinesIcon } from '@/components/ui/vines-icon';
import { NodeCustomData } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';
import { cn } from '@/utils';

interface Props {
  tool?: VinesToolDef;
  toolName: string;
  customData: NodeCustomData;
  forceCustomData?: NodeCustomData;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}
export const ComplicateNodeHeader: React.FC<Props> = ({
  tool,
  toolName,
  children,
  forceCustomData,
  customData,
  className,
  onClick,
}) => {
  const { icon: customIcon, description: customDesc, title: customDisplayName } = forceCustomData ?? customData;

  const isUnsupported = !tool;
  const toolDisplayName = tool?.displayName ?? toolName;
  const toolDisplayDesc = tool?.description ?? '';

  return (
    <header
      className={cn('flex h-20 w-full items-center justify-between px-5', className)}
      onClick={onClick}
      data-id="vines-drag"
    >
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center overflow-clip rounded-sm border shadow-sm">
          <VinesIcon src={isUnsupported ? 'emoji:⚠️:#35363b' : customIcon ?? tool?.icon} size="lg" />
        </div>
        <div className="flex max-w-[13rem] flex-col gap-1 leading-5">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-2">
              <p className="line-clamp-1 text-sm font-bold leading-tight">{customDisplayName ?? toolDisplayName}</p>
              {customDisplayName && customDisplayName !== toolDisplayName && (
                <span className="line-clamp-1 min-w-[3rem] text-xs font-light text-gray-10">{toolDisplayName}</span>
              )}
            </div>
          </div>
          <div
            className={cn('line-clamp-1 !text-xs font-normal opacity-50', isUnsupported && 'text-red-10 !opacity-100')}
          >
            {customDesc && `${customDesc}${toolDisplayDesc && ' / '}`}
            {toolDisplayDesc}
            {isUnsupported ? '不受支持的节点，请尝试重新创建' : ''}
          </div>
        </div>
      </div>
      {children}
    </header>
  );
};
