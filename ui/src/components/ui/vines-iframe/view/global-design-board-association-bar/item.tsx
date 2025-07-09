import React, { forwardRef, startTransition } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import _ from 'lodash';
import { Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createShapeId } from 'tldraw';

import { IDesignAssociation } from '@/apis/designs/typings';
import { useWorkspacePages } from '@/apis/pages';
import { useVinesTeam } from '@/components/router/guard/team';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { uploadSingleFile } from '@/components/ui/vines-uploader/standalone';
import useUrlState from '@/hooks/use-url-state';
import { useSetCurrentPage } from '@/store/useCurrentPageStore';
import { useDesignBoardStore } from '@/store/useDesignBoardStore';
import { useSetTemp } from '@/store/useGlobalTempStore';
import { useSetWorkbenchCacheVal } from '@/store/workbenchFormInputsCacheStore';
import { cn, getI18nContent } from '@/utils';

export interface IGlobalDesignBoardAssociationBarItemProps {
  data: IDesignAssociation;
}

export const GlobalDesignBoardAssociationBarItem = forwardRef<
  HTMLDivElement,
  IGlobalDesignBoardAssociationBarItemProps
>(({ data }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teamId } = useVinesTeam();
  const { isUseWorkbench } = useVinesRoute();
  const setCurrentPage = useSetCurrentPage();
  const setTemp = useSetTemp();
  const { data: workspaceData } = useWorkspacePages();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const { editor } = useDesignBoardStore();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: data.id });

  const setWorkbenchCacheVal = useSetWorkbenchCacheVal();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const onItemClick = async () => {
    if (!editor) {
      toast.error(t('workspace.form-view.operation-bar.select-none'));
      return;
    }

    toast.promise(
      async () => {
        const ids = [createShapeId('shape:parentFrame')];
        const { blob } = await editor.toImage(ids, { format: 'png', scale: 0.5 });
        const file = new File([blob], `${getI18nContent(data.displayName) ?? 'Board'}-${Date.now()}.png`, {
          type: blob.type,
        });

        const result = await uploadSingleFile(file, {
          basePath: 'user-files/designs',
          onProgress: (progress) => {
            console.log(`Upload progress: ${progress}%`);
          },
          onError: (error) => {
            toast.error(`上传失败: ${error.message}`);
          },
        });
        const boardImageUrl = result.urls[0];
        const targetInput = {};
        _.set(targetInput, data.targetInputId, boardImageUrl);
        setWorkbenchCacheVal(data.targetWorkflowId, targetInput);
        // 跳转到目标工作流页面
        if (data.targetWorkflowId && workspaceData?.pages) {
          // 在所有 pinned pages 中查找对应的 page
          const targetPage = workspaceData.pages.find(
            (page) =>
              (page.workflow?.workflowId === data.targetWorkflowId || page.workflow?.id === data.targetWorkflowId) &&
              page.type === 'preview',
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
      },
      {
        loading: t('common.export.loading'),
        success: t('common.export.success'),
        error: t('common.export.error'),
      },
    );
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
            'p-global-1/2 gap-global-1/2 z-10 flex cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
            mode === 'mini' ? 'size-[calc(var(--global-icon-size)+8px)]' : 'size-[var(--operation-bar-width)]',
            isDragging && 'opacity-50',
          )}
          onClick={onItemClick}
        >
          {typeof data.iconUrl === 'string' ? (
            <VinesLucideIcon
              className={cn('shrink-0', mode === 'mini' ? 'size-icon-sm' : 'size-icon')}
              size={20}
              src={data.iconUrl}
            />
          ) : (
            React.createElement(Folder, {
              className: cn('shrink-0', mode === 'mini' ? 'size-icon-sm' : 'size-icon'),
              size: 20,
            })
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>{getI18nContent(data.displayName)}</TooltipContent>
    </Tooltip>
  );
});
GlobalDesignBoardAssociationBarItem.displayName = 'GlobalDesignBoardAssociationBarItem';
