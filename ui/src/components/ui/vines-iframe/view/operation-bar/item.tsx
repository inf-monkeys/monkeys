import React, { forwardRef, startTransition } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import _ from 'lodash';
import { Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useWorkspacePages } from '@/apis/pages';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import { useVinesTeam } from '@/components/router/guard/team';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { useSetCurrentPage } from '@/store/useCurrentPageStore';
import { useOutputSelectionStore } from '@/store/useOutputSelectionStore';
import { useSetWorkbenchCacheVal } from '@/store/workbenchFormInputsCacheStore';
import { cn, getI18nContent } from '@/utils';

export interface IWorkbenchOperationItemProps {
  data: IWorkflowAssociation;
  onClick?: () => void;
}

export const OperationItem = forwardRef<HTMLDivElement, IWorkbenchOperationItemProps>(({ data, onClick }) => {
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();
  const setCurrentPage = useSetCurrentPage();
  const { data: workspaceData } = useWorkspacePages();

  const { selectedOutputItems } = useOutputSelectionStore();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: data.id });

  const setWorkbenchCacheVal = useSetWorkbenchCacheVal();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const onItemClick = () => {
    if (selectedOutputItems.length == 0) {
      toast.error(t('workspace.form-view.operation-bar.select-none'));
      return;
    }

    const originData = selectedOutputItems[0];

    const targetInput = {};

    for (const { origin, target, default: defaultVal } of data.mapper) {
      if (origin === '__value') {
        _.set(targetInput, target, originData.render.data);
        continue;
      }
      _.set(targetInput, target, _.get(originData.rawOutput, origin, defaultVal ?? null));
    }

    setWorkbenchCacheVal(data.targetWorkflowId, targetInput);

    // 跳转到目标工作流页面
    if (data.targetWorkflowId && workspaceData?.pages) {
      // 在所有 pinned pages 中查找对应的 page
      const targetPage = workspaceData.pages.find(
        (page) => page.workflow?.workflowId === data.targetWorkflowId && page.type === 'preview',
      );
      const targetPageGroup = workspaceData.groups.find((item) => item.pageIds.includes(targetPage?.id ?? ''));

      if (targetPage && targetPageGroup) {
        // setCurrentPage({ [teamId]: targetPage });
        startTransition(() => {
          // setCurrentPage((prev) => ({ ...prev, [teamId]: { ...page, groupId } }));
          // setUrlState({ activePageFromWorkflowDisplayName: undefined });
          setCurrentPage({ [teamId]: { ...targetPage, groupId: targetPageGroup.id } });
        });
      } else {
        toast.error('未找到目标工作流页面');
      }
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          key={data.id}
          className={cn(
            'z-10 flex size-11 cursor-pointer items-center justify-center gap-2 rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground',
            isDragging && 'opacity-50',
          )}
          onClick={onItemClick}
        >
          {typeof data.iconUrl === 'string' ? (
            <VinesLucideIcon className="size-[20px] shrink-0" size={20} src={data.iconUrl} />
          ) : (
            React.createElement(Folder, { className: 'size-[20px] shrink-0', size: 20 })
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>{getI18nContent(data.displayName)}</TooltipContent>
    </Tooltip>
  );
});
OperationItem.displayName = 'VirtuaWorkbenchOperationItem';
