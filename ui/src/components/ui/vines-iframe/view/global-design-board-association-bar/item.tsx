import { forwardRef, startTransition } from 'react';

import { useNavigate, useRouter } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createShapeId } from 'tldraw';

import { IDesignAssociation } from '@/apis/designs/typings';
import { useWorkspacePages } from '@/apis/pages';
import { useVinesTeam } from '@/components/router/guard/team';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { uploadSingleFile } from '@/components/ui/vines-uploader/standalone';
import useUrlState from '@/hooks/use-url-state';
import { useSetCurrentPage } from '@/store/useCurrentPageStore';
import { useDesignBoardStore } from '@/store/useDesignBoardStore';
import { useSetTemp } from '@/store/useGlobalTempStore';
import { useSetWorkbenchCacheVal } from '@/store/workbenchFormInputsCacheStore';
import { getI18nContent } from '@/utils';
import { getTargetInput } from '@/utils/association';

export interface IGlobalDesignBoardAssociationBarItemProps {
  data: IDesignAssociation;
  expanded: boolean;
}

import { CommonOperationBarItem } from '../common-operation-bar/item';

export const GlobalDesignBoardAssociationBarItem = forwardRef<
  HTMLDivElement,
  IGlobalDesignBoardAssociationBarItemProps
>(({ data, expanded }, ref) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const router = useRouter();
  const { teamId } = useVinesTeam();
  const { isUseWorkbench } = useVinesRoute();
  const setCurrentPage = useSetCurrentPage();
  const setTemp = useSetTemp();
  const { data: workspaceData } = useWorkspacePages();

  const [{ mode, activePageFromType, designProjectId }] = useUrlState<{
    mode: 'normal' | 'fast' | 'mini';
    activePageFromType?: string;
    designProjectId?: string;
  }>({ mode: 'normal' });

  const { editor } = useDesignBoardStore();

  const setWorkbenchCacheVal = useSetWorkbenchCacheVal();

  // useEffect(() => {
  //   if (activePageFromType === 'global-design-board' && designProjectId) {
  //     setTimeout(() => {
  //       router.navigate({
  //         to: router.state.location.pathname,
  //         search: (prev) => {
  //           const { activePageFromType, designProjectId, ...rest } = prev as Record<string, string | undefined>;
  //           return rest;
  //         },
  //         replace: true,
  //       });
  //     }, 1000);
  //   }
  // }, [activePageFromType, designProjectId]);

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
        const targetInput = await getTargetInput({
          workflowId: data.targetWorkflowId,
          mapper: [
            {
              origin: '__value',
              target: data.targetInputId,
            },
          ],
          originData: {
            __value: boardImageUrl,
          },
        });
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
            startTransition(() => {
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
    <CommonOperationBarItem
      ref={ref}
      id={data.id}
      mode={mode}
      iconUrl={data.iconUrl}
      tooltipContent={getI18nContent(data.displayName)}
      onClick={onItemClick}
      expanded={expanded}
    />
  );
});
GlobalDesignBoardAssociationBarItem.displayName = 'GlobalDesignBoardAssociationBarItem';
