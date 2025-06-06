import { createContext, forwardRef, useContext } from 'react';

import { useTranslation } from 'react-i18next';

import { IPageInstanceType, IPinPage } from '@/apis/pages/typings.ts';
import { ViewItemMenu } from '@/components/layout/workbench/sidebar/mode/normal/virtua/menu.tsx';
import { EMOJI2LUCIDE_MAPPER } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/tab';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { cn, getI18nContent } from '@/utils';

export const WorkbenchViewItemCurrentData = createContext<{ pageId?: string; groupId?: string }>({});

export type IWorkbenchViewItemPage = Omit<IPinPage, 'type'> & { groupId: string; type: IPageInstanceType | 'v-label' };

export interface IWorkbenchViewItemProps {
  page: IWorkbenchViewItemPage;
  onClick?: (page: IWorkbenchViewItemPage) => void;
  onlyShowWorkenchIcon?: boolean;
}

export const ViewItem = forwardRef<HTMLDivElement, IWorkbenchViewItemProps>(
  ({ page, onClick, onlyShowWorkenchIcon = false }) => {
    const { t } = useTranslation();

    const { pageId: currentPageId, groupId: currentGroupId } = useContext(WorkbenchViewItemCurrentData);

    const info = page?.workflow || page?.agent || page?.designProject;
    const viewIcon = page?.instance?.icon ?? '';
    const pageId = page?.id ?? '';

    return (
      <div
        key={pageId}
        className={cn(
          'z-10 mb-2 flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground',
          currentPageId === pageId
            ? 'group bg-neocard text-accent-foreground outline outline-1 outline-input dark:bg-[#393939]'
            : // : 'p-[calc(0.5rem+1px)]',
              'p-2',
          onlyShowWorkenchIcon && 'size-11 justify-center',
        )}
        onClick={() => onClick?.(page)}
      >
        <VinesIcon className="shrink-0 grow-0" size="sm" disabledPreview>
          {info?.iconUrl}
        </VinesIcon>
        {!onlyShowWorkenchIcon ? (
          <>
            <div className="flex max-w-48 flex-col gap-0.5">
              <h1 className="line-clamp-1 max-w-28 text-ellipsis text-sm font-bold leading-tight">
                {getI18nContent(info?.displayName) ?? t('common.utils.untitled')}
              </h1>
              <div className="flex items-center gap-0.5">
                <VinesLucideIcon className="size-3" size={12} src={EMOJI2LUCIDE_MAPPER[viewIcon] ?? viewIcon} />
                <span className="text-xxs line-clamp-1 max-w-24 text-ellipsis">
                  {getI18nContent(info?.description) ??
                    t([`workspace.wrapper.space.tabs.${page?.displayName ?? ''}`, page?.displayName ?? ''])}
                </span>
              </div>
            </div>
            <ViewItemMenu page={page} groupId={currentGroupId} />
          </>
        ) : null}
      </div>
    );
  },
);
ViewItem.displayName = 'VirtuaWorkbenchViewItem';
