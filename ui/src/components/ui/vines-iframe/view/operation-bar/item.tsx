import { forwardRef, startTransition } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createDesignProject } from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings';
import { useWorkspacePages } from '@/apis/pages';
import { IAssetItem } from '@/apis/ugc/typings';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import { GLOBAL_DESIGN_BOARD_PAGE } from '@/components/layout/workbench/sidebar/mode/normal/consts';
import { useVinesTeam } from '@/components/router/guard/team';
import { useVinesRoute } from '@/components/router/use-vines-route';
import useUrlState from '@/hooks/use-url-state';
import { useSetCurrentPage } from '@/store/useCurrentPageStore';
import { useSetTemp } from '@/store/useGlobalTempStore';
import { useOutputSelectionStore } from '@/store/useOutputSelectionStore';
import { useSetWorkbenchCacheVal } from '@/store/workbenchFormInputsCacheStore';
import { getI18nContent } from '@/utils';
import { getTargetInput } from '@/utils/association';

import { CommonOperationBarItem } from '../common-operation-bar/item';

export interface IWorkbenchOperationItemProps {
  data: IWorkflowAssociation;
  expanded: boolean;
}

export const OperationItem = forwardRef<HTMLDivElement, IWorkbenchOperationItemProps>(({ data, expanded }, ref) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teamId } = useVinesTeam();
  const { isUseWorkbench } = useVinesRoute();
  const setCurrentPage = useSetCurrentPage();
  const setTemp = useSetTemp();
  const { data: workspaceData } = useWorkspacePages();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const { selectedOutputItems } = useOutputSelectionStore();

  const setWorkbenchCacheVal = useSetWorkbenchCacheVal();

  const onItemClick = async () => {
    if (selectedOutputItems.length == 0) {
      toast.error(t('workspace.form-view.operation-bar.select-none'));
      return;
    }

    const originData = selectedOutputItems[0];
    if (data.type === 'to-workflow') {
      const targetInput = await getTargetInput({
        workflowId: data.targetWorkflowId,
        originData: {
          ...originData.rawOutput,
          __value: originData.render.data,
        },
        mapper: data.mapper,
      });
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
            displayName: data.extraData?.newDesignDisplayName
              ? JSON.stringify(data.extraData.newDesignDisplayName)
              : '{"zh-CN":"未命名设计项目","en-US":"Untitled design project"}',
          });
          if (!designProject) throw new Error('design project created failed');
          return designProject;
        },
        {
          success: (designProject) => {
            const tid = `insert-images-${Date.now()}`;
            setTemp(tid, selectedOutputItems);

            startTransition(() => {
              setCurrentPage({ [teamId]: { ...GLOBAL_DESIGN_BOARD_PAGE, groupId: 'global-design-board' } });
            });

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
    <CommonOperationBarItem
      ref={ref}
      id={data.id}
      mode={mode}
      iconUrl={data.iconUrl}
      tooltipContent={getI18nContent(data.displayName)}
      tooltipSide="left"
      onClick={onItemClick}
      expanded={expanded}
    />
  );
});
OperationItem.displayName = 'VirtuaWorkbenchOperationItem';
