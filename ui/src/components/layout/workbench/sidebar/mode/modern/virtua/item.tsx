import { createContext, forwardRef, useContext } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';

import { IPageInstanceType, IPinPage } from '@/apis/pages/typings.ts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { cn, getI18nContent } from '@/utils';

export const WorkbenchViewItemCurrentData = createContext<{ pageId?: string; groupId?: string }>({});

export type IWorkbenchViewItemPage = Omit<IPinPage, 'type'> & { groupId: string; type: IPageInstanceType | 'v-label' };

export interface IWorkbenchViewItemProps {
  page: IWorkbenchViewItemPage;
  onClick?: (page: IWorkbenchViewItemPage) => void;
  onlyShowWorkbenchIcon?: boolean;
}

export const ViewItem = forwardRef<HTMLDivElement, IWorkbenchViewItemProps>(
  ({ page, onClick, onlyShowWorkbenchIcon = false }) => {
    const { t } = useTranslation();
    const { pageId: currentPageId } = useContext(WorkbenchViewItemCurrentData);

    const info = page?.workflow || page?.agent || page?.designProject || page?.info;
    const pageId = page?.id ?? '';

    const isGlobalItem = page.type.startsWith('global-');

    const sortableProps = isGlobalItem ? { id: pageId, disabled: true } : { id: pageId };

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable(sortableProps);

    const isActive = currentPageId === pageId;

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const child = (
      <div
        ref={setNodeRef}
        style={style}
        {...(isGlobalItem ? {} : attributes)}
        {...(isGlobalItem ? {} : listeners)}
        key={pageId}
        className={cn(
          'z-10 mb-global-1/2 flex cursor-pointer items-center gap-global-1/2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
          isActive && 'group bg-[#f2f3f4] text-accent-foreground dark:bg-[#393939]',
          isDragging && 'opacity-50',
        )}
        onClick={() => onClick?.(page)}
      >
        <div>
          <VinesIcon
            className="!size-[calc(var(--global-icon-size)*2.2)]"
            backgroundClass="bg-[#f8fafc] hover:bg-[#e2e8f0]"
            size="md"
            disabledPreview
            active={isActive}
          >
            {info?.iconUrl}
          </VinesIcon>
        </div>
        {!onlyShowWorkbenchIcon && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="line-clamp-2 max-w-[160px] whitespace-normal break-words text-[0.8rem] font-bold">
                {getI18nContent(info?.displayName) ?? t('common.utils.untitled')}
              </div>
            </TooltipTrigger>
            <TooltipContent>{getI18nContent(info?.displayName) ?? t('common.utils.untitled')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    );

    return onlyShowWorkbenchIcon ? (
      <Tooltip>
        <TooltipTrigger>{child}</TooltipTrigger>
        <TooltipContent side="right">{getI18nContent(info?.displayName)}</TooltipContent>
      </Tooltip>
    ) : (
      child
    );
  },
);
ViewItem.displayName = 'VirtuaWorkbenchViewItem';
