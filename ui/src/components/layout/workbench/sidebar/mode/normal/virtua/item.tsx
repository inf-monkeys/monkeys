import { createContext, forwardRef, useContext } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  onlyShowWorkbenchIcon?: boolean;
}

export const ViewItem = forwardRef<HTMLDivElement, IWorkbenchViewItemProps>(
  ({ page, onClick, onlyShowWorkbenchIcon = false }) => {
    const { t } = useTranslation();
    const { pageId: currentPageId, groupId: currentGroupId } = useContext(WorkbenchViewItemCurrentData);

    const info = page?.workflow || page?.agent || page?.designProject;
    const viewIcon = page?.instance?.icon ?? '';
    const pageId = page?.id ?? '';

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pageId });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        key={pageId}
        className={cn(
          'z-10 flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground',
          currentPageId === pageId
            ? 'group border border-input bg-neocard text-accent-foreground dark:bg-[#393939]'
            : 'p-2',
          onlyShowWorkbenchIcon ? 'mb-1 size-11 justify-center' : 'mb-2',
          isDragging && 'opacity-50',
        )}
        onClick={() => onClick?.(page)}
      >
        <VinesIcon className="shrink-0 grow-0" size="sm" disabledPreview>
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
