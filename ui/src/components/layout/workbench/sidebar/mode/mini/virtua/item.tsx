import React from 'react';

import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const info = data?.workflow || data?.agent;
  const pageId = data?.id ?? '';

  const { data: workflowThumbs } = useWorkflowExecutionThumbnails(data.agent ? null : data.workflowId);

  const thumbs = workflowThumbs?.filter((it) => /(png|jpg|jpeg|webp)/.test(it)) ?? [];

  return (
    <div
      key={pageId}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-transparent py-2 transition-colors hover:bg-accent hover:text-accent-foreground',
        currentPageId === pageId && 'border-input bg-background text-accent-foreground',
        mini && 'gap-0 pb-1 pt-0',
      )}
      onClick={() => onClick?.(data)}
    >
      <Tooltip>
        <TooltipTrigger>
          <VinesIcon size="xs" className={cn('pointer-events-none select-none', mini && 'scale-75')} disabledPreview>
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
            <span>{getI18nContent(info.displayName)}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
