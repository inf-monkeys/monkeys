import { createContext, forwardRef, useContext } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { IPageInstanceType, IPinPage } from '@/apis/pages/typings.ts';
import { ViewItemMenu } from '@/components/layout/workbench/sidebar/mode/normal/virtua/menu.tsx';
import { EMOJI2LUCIDE_MAPPER } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/tab';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
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
    const { pageId: currentPageId, groupId: currentGroupId } = useContext(WorkbenchViewItemCurrentData);

    const { data: oem } = useSystemConfig();

    const showMoreAction = oem?.theme.workbenchSidebarMoreAction ?? true;

    const info = page?.workflow || page?.agent || page?.designProject;
    const viewIcon = page?.instance?.icon ?? '';
    const pageId = page?.id ?? '';

    const isGlobalItem = page.type.startsWith('global-');

    const sortableProps = isGlobalItem ? { id: pageId, disabled: true } : { id: pageId };

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable(sortableProps);

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
          'z-10 flex cursor-pointer items-center gap-global-1/2 rounded-md p-global-1/2 transition-colors hover:bg-accent hover:text-accent-foreground',
          currentPageId === pageId
            ? 'group border border-input bg-neocard text-accent-foreground dark:bg-[#393939]'
            : 'p-global-1/2',
          onlyShowWorkbenchIcon ? 'mb-1 size-[var(--operation-bar-width)]' : 'mb-global-1/2',
          isDragging && 'opacity-50',
        )}
        onClick={() => onClick?.(page)}
      >
        <VinesIcon className="!size-[calc(var(--global-icon-size)+var(--global-spacing)/2)]" size="sm" disabledPreview>
          {info?.iconUrl}
        </VinesIcon>
        {!onlyShowWorkbenchIcon ? (
          <>
            <div className="flex flex-col gap-0.5">
              <h1 className="line-clamp-1 max-w-36 text-ellipsis text-sm font-bold leading-tight">
                {getI18nContent(info?.displayName) ?? t('common.utils.untitled')}
              </h1>
              <div className="flex items-center gap-0.5">
                <VinesLucideIcon className="size-3" size={12} src={EMOJI2LUCIDE_MAPPER[viewIcon] ?? viewIcon} />
                <span className="text-xxs line-clamp-1 max-w-36 text-ellipsis">
                  {getI18nContent(info?.description) ??
                    t([
                      `workspace.wrapper.space.tabs.${page?.displayName ?? ''}`,
                      getI18nContent(page?.displayName) ?? '',
                    ])}
                </span>
              </div>
            </div>
            {!page.type.startsWith('global-') && showMoreAction && (
              <ViewItemMenu page={page} groupId={currentGroupId} />
            )}
          </>
        ) : null}
      </div>
    );

    return onlyShowWorkbenchIcon ? (
      <Tooltip>
        <TooltipTrigger>{child}</TooltipTrigger>
        <TooltipContent>{getI18nContent(info?.displayName)}</TooltipContent>
      </Tooltip>
    ) : (
      child
    );
  },
);
ViewItem.displayName = 'VirtuaWorkbenchViewItem';
