import React, { createContext, forwardRef, useContext } from 'react';

import { useTranslation } from 'react-i18next';
import { CustomItemComponentProps } from 'virtua';

import { IPageInstanceType, IPinPage } from '@/apis/pages/typings.ts';
import { EMOJI2LUCIDE_MAPPER } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/tab.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { cn, getI18nContent } from '@/utils';

export const WorkbenchViewListStickyIndexContext = createContext(-1);
export const WorkbenchViewListStickyIndexesContext = createContext(new Set([-1]));

export const WorkbenchViewListStickyItem = forwardRef<HTMLDivElement, CustomItemComponentProps>(
  ({ children, style, index }, ref) => {
    const activeIndex = useContext(WorkbenchViewListStickyIndexContext);
    const stickyIndexes = useContext(WorkbenchViewListStickyIndexesContext);

    return (
      <div
        ref={ref}
        className={cn(stickyIndexes.has(index) && '!z-20', activeIndex === index && '!sticky !top-0')}
        style={style}
      >
        {children}
      </div>
    );
  },
);
WorkbenchViewListStickyItem.displayName = 'VirtuaWorkbenchViewListStickyItem';

export const WorkbenchViewItemCurrentData = createContext<{ pageId?: string; groupId?: string }>({});

export type IWorkbenchViewItemPage = Omit<IPinPage, 'type'> & { groupId: string; type: IPageInstanceType | 'v-label' };

export interface IWorkbenchViewItemProps {
  page: IWorkbenchViewItemPage;
  onClick?: (page: IWorkbenchViewItemPage) => void;
}

export const ViewItem = forwardRef<HTMLDivElement, IWorkbenchViewItemProps>(({ page, onClick }) => {
  const { t } = useTranslation();

  const { pageId: currentPageId, groupId: currentGroupId } = useContext(WorkbenchViewItemCurrentData);

  const info = page?.workflow || page?.agent;
  const viewIcon = page?.instance?.icon ?? '';
  const pageId = page?.id ?? '';

  return (
    <div
      key={pageId}
      className={cn(
        'z-10 flex cursor-pointer items-start space-x-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
        currentPageId === pageId && page.groupId === currentGroupId
          ? 'border border-input bg-background p-2 text-accent-foreground'
          : 'p-[calc(0.5rem+1px)]',
      )}
      onClick={() => onClick?.(page)}
    >
      <VinesIcon size="sm">{info?.iconUrl}</VinesIcon>
      <div className="flex max-w-44 flex-col gap-0.5">
        <h1 className="text-sm font-bold leading-tight">
          {getI18nContent(info?.displayName) ?? t('common.utils.untitled')}
        </h1>
        <div className="flex items-center gap-0.5">
          <VinesLucideIcon className="size-3" size={12} src={EMOJI2LUCIDE_MAPPER[viewIcon] ?? viewIcon} />
          <span className="text-xxs">
            {t([`workspace.wrapper.space.tabs.${page?.displayName ?? ''}`, page?.displayName ?? ''])}
          </span>
        </div>
      </div>
    </div>
  );
});
ViewItem.displayName = 'VirtuaWorkbenchViewItem';
