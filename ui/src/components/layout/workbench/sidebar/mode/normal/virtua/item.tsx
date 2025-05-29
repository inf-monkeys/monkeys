import { createContext, forwardRef, useContext } from 'react';

import { useTranslation } from 'react-i18next';

import { IPageInstanceType, IPinPage } from '@/apis/pages/typings.ts';
import { ViewItemMenu } from '@/components/layout/workbench/sidebar/mode/normal/virtua/menu.tsx';
import { EMOJI2LUCIDE_MAPPER } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/tab.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { cn, getI18nContent } from '@/utils';

export const WorkbenchViewItemCurrentData = createContext<{ pageId?: string; groupId?: string }>({});

export type IWorkbenchViewItemPage = Omit<IPinPage, 'type'> & { groupId: string; type: IPageInstanceType | 'v-label' };

export interface IWorkbenchViewItemProps {
  page: IWorkbenchViewItemPage;
  onClick?: (page: IWorkbenchViewItemPage) => void;
}

export const ViewItem = forwardRef<HTMLDivElement, IWorkbenchViewItemProps>(({ page, onClick }) => {
  const { t } = useTranslation();

  const { pageId: currentPageId, groupId: currentGroupId } = useContext(WorkbenchViewItemCurrentData);

  const info = page?.workflow || page?.agent || page?.designProject;
  const viewIcon = page?.instance?.icon ?? '';
  const pageId = page?.id ?? '';

  return (
    <div
      key={pageId}
      className={cn(
        'relative z-10 mb-1 flex cursor-pointer items-center space-x-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
        currentPageId === pageId
          ? 'group border border-input bg-card-light p-2 text-accent-foreground dark:bg-[#393939]'
          : 'p-[calc(0.5rem+1px)]',
      )}
      onClick={() => onClick?.(page)}
    >
      <VinesIcon size="sm" disabledPreview>
        {info?.iconUrl}
      </VinesIcon>
      <div className="flex max-w-40 flex-col gap-0.5">
        <h1 className="text-sm font-bold leading-tight">
          {getI18nContent(info?.displayName) ?? t('common.utils.untitled')}
        </h1>
        <div className="flex items-center gap-0.5">
          <VinesLucideIcon className="size-3" size={12} src={EMOJI2LUCIDE_MAPPER[viewIcon] ?? viewIcon} />
          <span className="text-xxs">
            {getI18nContent(info?.description) ??
              t([`workspace.wrapper.space.tabs.${page?.displayName ?? ''}`, page?.displayName ?? ''])}
          </span>
        </div>
      </div>
      <ViewItemMenu page={page} groupId={currentGroupId} />
    </div>
  );
});
ViewItem.displayName = 'VirtuaWorkbenchViewItem';
