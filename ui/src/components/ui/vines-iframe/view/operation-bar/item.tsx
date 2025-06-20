import React, { forwardRef, startTransition } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import _ from 'lodash';
import { Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createDesignProject } from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings';
import { useWorkspacePages } from '@/apis/pages';
import { IAssetItem } from '@/apis/ugc/typings';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import { useVinesTeam } from '@/components/router/guard/team';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import useUrlState from '@/hooks/use-url-state';
import { useSetCurrentPage } from '@/store/useCurrentPageStore';
import { useSetTemp } from '@/store/useGlobalTempStore';
import { useOutputSelectionStore } from '@/store/useOutputSelectionStore';
import { useSetWorkbenchCacheVal } from '@/store/workbenchFormInputsCacheStore';
import { cn, getI18nContent } from '@/utils';

export interface IWorkbenchOperationItemProps {
  data: IWorkflowAssociation;
}

export const OperationItem = forwardRef<HTMLDivElement, IWorkbenchOperationItemProps>(({ data }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teamId } = useVinesTeam();
  const { isUseWorkbench } = useVinesRoute();
  const setCurrentPage = useSetCurrentPage();
  const setTemp = useSetTemp();
  const { data: workspaceData } = useWorkspacePages();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

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
    if (data.type === 'to-workflow') {
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
          if (!isUseWorkbench) {
            void navigate({
              to: '/$teamId',
              params: {
                teamId,
              },
            });
          }
        } else {
          toast.error('未找到目标工作流页面');
        }
      }
    }

    if (data.type === 'new-design') {
      toast.promise(
        async (): Promise<IAssetItem<IDesignProject>> => {
          const designProject = await createDesignProject({
            displayName: '{"zh-CN":"未命名设计项目","en-US":"Untitled design project"}',
          });
          if (!designProject) throw new Error('design project created failed');
          return designProject;
        },
        {
          success: (designProject) => {
            const tid = `insert-images-${Date.now()}`;
            setTemp(tid, selectedOutputItems);
            navigate({
              to: '/$teamId',
              params: {
                teamId,
              },
              // to: '/$teamId/design/$designProjectId',
              // params: {
              //   teamId,
              //   designProjectId: designProject.id,
              // },
              search: {
                operation: 'insert-images',
                tid,
                designProjectId: designProject.id,
                activePageFromType: 'global-design-board',
              },
            });
            return t('common.create.success');
          },
          loading: t('common.create.loading'),
          error: t('common.create.error'),
        },
      );
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
            'z-10 flex cursor-pointer items-center justify-center gap-2 rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground',
            mode === 'mini' ? 'size-8' : 'size-11',
            isDragging && 'opacity-50',
          )}
          onClick={onItemClick}
        >
          {typeof data.iconUrl === 'string' ? (
            <VinesLucideIcon
              className={cn('shrink-0', mode === 'mini' ? 'size-[16px]' : 'size-[20px]')}
              size={20}
              src={data.iconUrl}
            />
          ) : (
            React.createElement(Folder, {
              className: cn('shrink-0', mode === 'mini' ? 'size-[16px]' : 'size-[20px]'),
              size: 20,
            })
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>{getI18nContent(data.displayName)}</TooltipContent>
    </Tooltip>
  );
});
OperationItem.displayName = 'VirtuaWorkbenchOperationItem';
