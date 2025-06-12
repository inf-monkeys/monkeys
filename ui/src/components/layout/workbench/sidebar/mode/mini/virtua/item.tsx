import React from 'react';

import { IPinPage } from '@/apis/pages/typings.ts';
import { useWorkflowExecutionThumbnails } from '@/apis/workflow/execution';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { cn, getI18nContent } from '@/utils';

interface IVirtuaWorkbenchMiniViewListItemProps {
  data: IPinPage;
  currentPageId?: string;
  onClick?: (page: IPinPage) => void;
  mini?: boolean;
}

export const VirtuaWorkbenchMiniViewListItem: React.FC<IVirtuaWorkbenchMiniViewListItemProps> = ({
  data,
  currentPageId,
  onClick,
  mini,
}) => {
  const info = data?.workflow || data?.agent;
  const pageId = data?.id ?? '';

  const { data: workflowThumbs } = useWorkflowExecutionThumbnails(data.agent ? null : data.workflowId);
  const thumbs = workflowThumbs?.filter((it) => /(png|jpg|jpeg|webp)/.test(it)) ?? [];

  return (
    <div
      key={pageId}
      className={cn(
        'mb-2 flex h-12 w-12 shrink-0 grow-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-transparent transition-colors hover:bg-accent hover:text-accent-foreground',
        currentPageId === pageId && 'border-input bg-neocard text-accent-foreground',
        mini && 'gap-0',
      )}
      onClick={() => onClick?.(data)}
    >
      <Tooltip>
        <TooltipTrigger>
          <VinesIcon size="sm" className={cn('pointer-events-none select-none', mini && 'scale-75')} disabledPreview>
            {info?.iconUrl}
          </VinesIcon>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" alignOffset={-9} sideOffset={8}>
          <div className="flex flex-col items-center gap-2">
            <span>
              <VinesIcon
                size="3xl"
                className={cn('pointer-events-none select-none', mini && 'scale-75')}
                disabledPreview
              >
                {thumbs.length ? thumbs[0] : info?.iconUrl}
              </VinesIcon>
            </span>
            <span>{getI18nContent(info?.displayName)}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
