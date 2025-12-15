import { forwardRef, startTransition, useEffect, useMemo, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createDesignProject, useDesignProjectMetadataList, useGetDesignProjectList } from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings';
import { useWorkspacePages } from '@/apis/pages';
import { IAssetItem } from '@/apis/ugc/typings';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import { GLOBAL_DESIGN_BOARD_PAGE } from '@/components/layout/workbench/sidebar/mode/normal/consts';
import { useVinesTeam } from '@/components/router/guard/team';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor';
import { DEFAULT_DESIGN_PROJECT_ICON_URL } from '@/consts/icons';
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

  // To Board 选择已有画板/新建画板
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>('new');
  const { data: designProjects } = useGetDesignProjectList();
  const [targetProjectId, setTargetProjectId] = useState<string | undefined>();
  const { data: designBoards } = useDesignProjectMetadataList(targetProjectId);
  const [targetBoardId, setTargetBoardId] = useState<string | undefined>();
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectIconUrl, setNewProjectIconUrl] = useState<string>(DEFAULT_DESIGN_PROJECT_ICON_URL);

  useEffect(() => {
    if (!targetProjectId && designProjects && designProjects.length > 0) {
      setTargetProjectId(designProjects[0].id);
    }
  }, [designProjects, targetProjectId]);

  useEffect(() => {
    if (designBoards && designBoards.length > 0) {
      setTargetBoardId((prev) => prev && designBoards.some((b) => b.id === prev) ? prev : designBoards[0].id);
    } else {
      setTargetBoardId(undefined);
    }
  }, [designBoards]);

  const projectOptions = useMemo(() => designProjects ?? [], [designProjects]);
  const boardOptions = useMemo(() => designBoards ?? [], [designBoards]);

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
      // 初始化“新建画板”的默认名称/图标
      const defaultName =
        getI18nContent(data.extraData?.newDesignDisplayName) ??
        t('common.utils.untitled', { defaultValue: 'Untitled' }) +
          t('common.type.design-project', { defaultValue: ' design project' });
      setNewProjectName(defaultName);
      setNewProjectIconUrl(DEFAULT_DESIGN_PROJECT_ICON_URL);
      setAssignDialogOpen(true);
    }
  };

  const handleSendToBoard = async () => {
    if (targetMode === 'existing') {
      if (!targetProjectId || !targetBoardId) {
        toast.error(t('workspace.operation.to-board.select-board', { defaultValue: 'Please select a board' }));
        return;
      }
      const tid = `insert-images-${Date.now()}`;
      setTemp(tid, selectedOutputItems);
      startTransition(() => {
        setCurrentPage({ [teamId]: { ...GLOBAL_DESIGN_BOARD_PAGE, groupId: 'global-design-board' } });
      });
      navigate({
        to: '/$teamId',
        params: { teamId },
        search: {
          operation: 'insert-images',
          tid,
          designProjectId: targetProjectId,
          designBoardId: targetBoardId,
        },
      });
      setAssignDialogOpen(false);
      return;
    }

    // 新建画板后导入
    toast.promise(
      async (): Promise<IAssetItem<IDesignProject>> => {
        const displayName = newProjectName?.trim();
        if (!displayName) {
          throw new Error(
            t('workspace.operation.to-board.new-name-required', { defaultValue: 'Please input a board name' }),
          );
        }
        const designProject = await createDesignProject({
          displayName,
          iconUrl: newProjectIconUrl,
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
            search: {
              operation: 'insert-images',
              tid,
              designProjectId: designProject.id,
            },
          });
          setAssignDialogOpen(false);
          return t('common.create.success');
        },
        loading: t('common.create.loading'),
        error: t('common.create.error'),
      },
    );
  };

  return (
    <>
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

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {t('workspace.operation.to-board.title', { defaultValue: 'Choose target board' })}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button variant={targetMode === 'new' ? 'default' : 'outline'} onClick={() => setTargetMode('new')}>
                {t('workspace.operation.to-board.create-new', { defaultValue: 'Create new board' })}
              </Button>
              <Button
                variant={targetMode === 'existing' ? 'default' : 'outline'}
                onClick={() => setTargetMode('existing')}
              >
                {t('workspace.operation.to-board.use-existing', { defaultValue: 'Use existing board' })}
              </Button>
            </div>

            {targetMode === 'existing' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Label>{t('workspace.operation.to-board.project', { defaultValue: 'Design Project' })}</Label>
                  <Select
                    value={targetProjectId}
                    onValueChange={(val) => {
                      setTargetProjectId(val);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('workspace.operation.to-board.select-project', {
                          defaultValue: 'Select project',
                        })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {projectOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {getI18nContent(p.displayName) ?? p.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label>{t('workspace.operation.to-board.board', { defaultValue: 'Board' })}</Label>
                  <Select
                    value={targetBoardId}
                    onValueChange={(val) => setTargetBoardId(val)}
                    disabled={!targetProjectId || boardOptions.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('workspace.operation.to-board.select-board-placeholder', {
                          defaultValue: 'Select board',
                        })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {boardOptions.map((b) => {
                        const rawNameVal = getI18nContent(b.displayName) ?? b.displayName ?? b.id;
                        const rawName = typeof rawNameVal === 'string' ? rawNameVal : b.id;
                        const displayName =
                          rawName === '画板' || rawName === 'Board'
                            ? t('workspace.operation.to-board.board-default', { defaultValue: 'Board' })
                            : rawName;
                        return (
                          <SelectItem key={b.id} value={b.id}>
                            {displayName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {targetMode === 'new' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Label>{t('workspace.operation.to-board.new-name', { defaultValue: 'Board Name' })}</Label>
                  <div className="flex items-center gap-3">
                    <VinesIconEditor
                      value={newProjectIconUrl}
                      onChange={(val) => setNewProjectIconUrl(val)}
                      size="md"
                    />
                    <Input
                      value={newProjectName}
                      onChange={(val) => setNewProjectName(val)}
                      placeholder={t('workspace.operation.to-board.new-name-placeholder', {
                        defaultValue: 'Enter board name',
                      })}
                      wrapperClassName="flex-1"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              {t('common.utils.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button onClick={handleSendToBoard}>
              {t('common.utils.confirm', { defaultValue: 'Confirm' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
OperationItem.displayName = 'VirtuaWorkbenchOperationItem';
