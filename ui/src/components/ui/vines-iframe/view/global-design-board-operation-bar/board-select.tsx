import React, { useEffect, useState } from 'react';

import { useNavigate, useSearch } from '@tanstack/react-router';

import { get } from 'lodash';
import { Check, ChevronsUpDown, ExternalLink, Pencil, Plus, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import {
  createDesignMetadata,
  deleteDesignProject,
  useDesignProjectMetadataList,
  useGetDesignProjectList,
} from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings';
import { IAssetItem } from '@/apis/ugc/typings';
import { DesignProjectInfoEditor } from '@/components/layout/design-space/design-project-info-editor';
import { CreateDesignProjectDialog } from '@/components/layout/ugc-pages/design-project/create';
import { useVinesTeam } from '@/components/router/guard/team';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_DESIGN_PROJECT_ICON_URL, DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons';
import { useDesignBoardStore } from '@/store/useDesignBoardStore';
import { cn, getI18nContent } from '@/utils';

const getDesignProjectDisplayName = (designProject?: IDesignProject) => {
  if (!designProject) return '';
  const displayName = getI18nContent(designProject.displayName ?? '');

  return (
    <div className="flex items-center gap-2">
      <VinesIcon src={designProject.iconUrl ?? DEFAULT_DESIGN_PROJECT_ICON_URL} size="xs" />
      <span className="max-w-[7.6rem] truncate">{displayName}</span>
    </div>
  );
};

export const GlobalDesignBoardOperationBarBoardSelect: React.FC = () => {
  const { t } = useTranslation();
  const { designProjectId: designProjectIdFromSearch, designBoardId: designBoardIdFromSearch } = useSearch({
    strict: false,
  }) as {
    designProjectId?: string;
    designBoardId?: string;
  };

  const [designProjectVisible, setDesignProjectVisible] = useState(false);
  const [designProjectEditorVisible, setDesignProjectEditorVisible] = useState(false);
  const [createDesignProjectVisible, setCreateDesignProjectVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  // const [designBoardVisible, setDesignBoardVisible] = useState(false);
  const { setDesignBoardId } = useDesignBoardStore();

  const { data: designProjectList, isLoading, mutate: mutateDesignProjectList } = useGetDesignProjectList();
  const { data: oem } = useSystemConfig();

  const oemId = oem?.theme.id;
  const isLf = oemId === 'lf';

  const [currentDesignProjectId, setCurrentDesignProjectId] = useState<string | null>(
    designProjectIdFromSearch ?? null,
  );

  const selectedDesignProject = (designProjectList ?? []).find(
    (designProject) => designProject.id === currentDesignProjectId,
  );

  const {
    data: designBoardList,
    isLoading: isDesignBoardListLoading,
    mutate: mutateDesignProjectMetadataList,
  } = useDesignProjectMetadataList(currentDesignProjectId);

  const [currentDesignBoardId, setCurrentDesignBoardId] = useState<string | undefined>(
    designBoardIdFromSearch ?? undefined,
  );

  const { teamId } = useVinesTeam();
  const navigate = useNavigate();

  // const selectedDesignBoard = (designBoardList ?? []).find((designBoard) => designBoard.id === currentDesignBoardId);

  useEffect(() => {
    if (designProjectList && designProjectList.length > 0 && !currentDesignProjectId) {
      setCurrentDesignProjectId(designProjectList[0]?.id ?? null);
    }
  }, [designProjectList, currentDesignProjectId]);

  useEffect(() => {
    if (currentDesignBoardId) {
      setDesignBoardId(currentDesignBoardId);
    }
  }, [currentDesignBoardId, setDesignBoardId]);

  useEffect(() => {
    if (!currentDesignProjectId) {
      setCurrentDesignBoardId(undefined);
      return;
    }

    // 仅在未选择/选择无效时，回落到第一个画板；避免覆盖来自 URL search 的 designBoardId
    if (designBoardList && designBoardList.length > 0) {
      setCurrentDesignBoardId((prev) => {
        if (prev && designBoardList.some((b) => b.id === prev)) return prev;
        return designBoardList[0].id;
      });
    } else {
      setCurrentDesignBoardId(undefined);
    }
  }, [currentDesignProjectId, designBoardList]);

  useEffect(() => {
    if (designProjectIdFromSearch) {
      setCurrentDesignProjectId(designProjectIdFromSearch);
    }
    if (designBoardIdFromSearch) {
      setCurrentDesignBoardId(designBoardIdFromSearch);
    }
  }, [designProjectIdFromSearch, designBoardIdFromSearch]);

  const handleAfterUpdateDesignProject = () => {
    setDesignProjectEditorVisible(false);
    mutateDesignProjectMetadataList();
  };

  const handleCreateDesignProject = () => {
    setCreateDesignProjectVisible(true);
    setDesignProjectVisible(false);
  };

  const handleAfterCreateDesignProject = (project?: IAssetItem<IDesignProject>) => {
    setCreateDesignProjectVisible(false);
    mutateDesignProjectList();
    if (project?.id) {
      setCurrentDesignProjectId(project.id);
      setCurrentDesignBoardId(undefined);
      setDesignProjectVisible(false);
    }
  };

  const handleDeleteDesignProject = async () => {
    if (!selectedDesignProject) return;

    try {
      await deleteDesignProject(selectedDesignProject.id);
      toast.success(t('common.delete.success'));
      mutateDesignProjectList();
      setCurrentDesignProjectId(null);
      setDesignProjectVisible(false);
      setDeleteConfirmVisible(false);
    } catch (error) {
      toast.error(t('common.delete.error'));
    }
  };

  const handleShowDeleteConfirm = () => {
    setDeleteConfirmVisible(true);
    setDesignProjectVisible(false);
  };

  const handleGoToWorkspace = () => {
    navigate({
      to: '/$teamId/designs',
      params: { teamId },
    });
    setDesignProjectVisible(false);
  };

  const handleCreateDesignBoard = async () => {
    if (!selectedDesignProject) return;
    try {
      const res = await createDesignMetadata(selectedDesignProject.id, {
        displayName: t('common.type.design-board') as string,
        snapshot: {},
        pinned: false,
        teamId,
      });
      const newBoardId = (res as any)?.data?.data?.id ?? (res as any)?.data?.id ?? (res as any)?.id; // 兼容不同 fetcher 返回结构
      await mutateDesignProjectMetadataList();
      if (newBoardId) {
        setCurrentDesignBoardId(newBoardId);
        setDesignBoardId(newBoardId);
        navigate({
          to: '/$teamId/design/$designProjectId/$designBoardId/',
          params: { teamId, designProjectId: selectedDesignProject.id, designBoardId: newBoardId },
        });
      }
      setDesignProjectVisible(false);
      toast.success(t('common.create.success'));
    } catch (e) {
      toast.error(t('common.create.error'));
    }
  };

  return (
    <>
      <div className="flex w-full flex-col gap-global">
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">
              {currentDesignProjectId
                ? getI18nContent(selectedDesignProject?.displayName ?? 'Unselected Design Board')
                : isLoading
                  ? t('common.load.loading')
                  : 'Unselected Design Board'}
            </span>
            {currentDesignProjectId && oemId != 'lf' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Pencil className="size-3 cursor-pointer" onClick={() => setDesignProjectEditorVisible(true)} />
                </TooltipTrigger>
                <TooltipContent>
                  {oemId != 'lf'
                    ? t('workspace.global-design-board.operation-bar.design-project.edit-tooltip')
                    : 'Edit Board Name'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <Popover open={designProjectVisible} onOpenChange={setDesignProjectVisible}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn('w-full justify-between', !currentDesignProjectId && 'text-muted-foreground')}
              >
                {currentDesignProjectId
                  ? getDesignProjectDisplayName(selectedDesignProject!)
                  : isLoading
                    ? t('common.load.loading')
                    : isLf
                      ? 'Select a design board'
                      : t('workspace.global-design-board.operation-bar.design-project.placeholder')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput
                  placeholder={
                    oemId != 'lf'
                      ? t('workspace.global-design-board.operation-bar.design-project.search-placeholder')
                      : 'Search Board'
                  }
                />
                <CommandEmpty>
                  {oemId != 'lf'
                    ? t('workspace.global-design-board.operation-bar.design-project.search-empty')
                    : 'No Board Found'}
                </CommandEmpty>
                <ScrollArea className="h-64">
                  <CommandGroup>
                    {(designProjectList ?? []).map((designProject) => (
                      <CommandItem
                        value={designProject.id}
                        key={designProject.id}
                        onSelect={() => {
                          setCurrentDesignProjectId(designProject.id);
                          setCurrentDesignBoardId(undefined);
                          setDesignProjectVisible(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            designProject.id === currentDesignProjectId ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <div className="flex items-center gap-2">
                          <VinesIcon src={designProject.iconUrl || DEFAULT_WORKFLOW_ICON_URL} size="xs" />
                          <div className="flex flex-col">
                            <span className="font-medium">{getI18nContent(designProject.displayName)}</span>
                            {designProject.description && (
                              <span className="text-xs text-muted-foreground">
                                {getI18nContent(designProject.description)}
                              </span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {/* 添加分隔线和操作按钮 */}
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem onSelect={handleCreateDesignProject}>
                      <Plus className="mr-2 h-4 w-4" />
                      <span>{oemId != 'lf' ? t('ugc-page.design-project.dropdown.create') : 'Create Board'}</span>
                    </CommandItem>
                    {/* 多画板模式下显示“新建画板” */}
                    {get(oem, 'theme.designProjects.oneOnOne', false) === false && selectedDesignProject && (
                      <CommandItem onSelect={handleCreateDesignBoard}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>
                          {oemId != 'lf'
                            ? t('workspace.global-design-board.operation-bar.design-board.create', {
                                defaultValue: '新建画板',
                              })
                            : 'Create Board'}
                        </span>
                      </CommandItem>
                    )}

                    {selectedDesignProject && (
                      <CommandItem onSelect={handleShowDeleteConfirm} className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>{oemId != 'lf' ? t('ugc-page.design-project.dropdown.delete') : 'Delete Board'}</span>
                      </CommandItem>
                    )}

                    {oemId != 'lf' && (
                      <CommandItem onSelect={handleGoToWorkspace}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        <span>{t('ugc-page.design-project.dropdown.manage-workspace')}</span>
                      </CommandItem>
                    )}
                  </CommandGroup>
                </ScrollArea>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <DesignProjectInfoEditor
        visible={designProjectEditorVisible}
        setVisible={setDesignProjectEditorVisible}
        designProject={selectedDesignProject}
        afterUpdate={handleAfterUpdateDesignProject}
      />
      {createDesignProjectVisible && (
        <CreateDesignProjectDialog
          visible={createDesignProjectVisible}
          setVisible={setCreateDesignProjectVisible}
          afterCreate={handleAfterCreateDesignProject}
        />
      )}

      <AlertDialog open={deleteConfirmVisible} onOpenChange={setDeleteConfirmVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {oemId != 'lf'
                ? t('common.dialog.delete-confirm.title', { type: t('common.type.design-project') })
                : 'Delete Board Confirm'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {oemId != 'lf'
                ? t('common.dialog.delete-confirm.content', {
                    type: t('common.type.design-project'),
                    name: selectedDesignProject
                      ? getI18nContent(selectedDesignProject.displayName)
                      : t('common.utils.unknown'),
                  })
                : 'Are you sure you want to delete this board?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDesignProject}>{t('common.utils.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
