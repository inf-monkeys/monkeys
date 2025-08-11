import React, { useEffect, useMemo, useState } from 'react';

import { useSearch } from '@tanstack/react-router';

import { Check, ChevronsUpDown, Pencil, Plus, Trash, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useDesignProjectMetadataList, useGetDesignProjectList, deleteDesignProject } from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings';
import { DesignProjectInfoEditor } from '@/components/layout/design-space/design-project-info-editor';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_DESIGN_PROJECT_ICON_URL, DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons';
import { useDesignBoardStore } from '@/store/useDesignBoardStore';
import { cn, getI18nContent } from '@/utils';
import { toast } from 'sonner';
import { useVinesTeam } from '@/components/router/guard/team';
import { useNavigate } from '@tanstack/react-router';
import { CreateDesignProjectDialog } from '@/components/layout/ugc-pages/design-project/create';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const getDesignProjectDisplayName = (designProject?: IDesignProject) => {
  if (!designProject) return '';
  const displayName = getI18nContent(designProject.displayName ?? '');
  return (
    <span className="flex items-center gap-2">
      <VinesIcon src={designProject.iconUrl ?? DEFAULT_DESIGN_PROJECT_ICON_URL} size="xs" />
      <span className="max-w-[7.6rem] truncate">{displayName}</span>
    </span>
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

  useMemo(() => {
    if (currentDesignProjectId && designBoardList && designBoardList.length > 0) {
      setCurrentDesignBoardId(designBoardList[0].id);
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

  const handleAfterCreateDesignProject = () => {
    setCreateDesignProjectVisible(false);
    mutateDesignProjectList();
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

  return (
    <>
      <div className="flex w-full flex-col gap-global">
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">{t('common.type.design-project')}</span>
            {currentDesignProjectId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Pencil className="size-3 cursor-pointer" onClick={() => setDesignProjectEditorVisible(true)} />
                </TooltipTrigger>
                <TooltipContent>
                  {t('workspace.global-design-board.operation-bar.design-project.edit-tooltip')}
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
                    : t('workspace.global-design-board.operation-bar.design-project.placeholder')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput
                  placeholder={t('workspace.global-design-board.operation-bar.design-project.search-placeholder')}
                />
                <CommandEmpty>
                  {t('workspace.global-design-board.operation-bar.design-project.search-empty')}
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
                      <span>{t('ugc-page.design-project.dropdown.create')}</span>
                    </CommandItem>
                    
                    {selectedDesignProject && (
                      <CommandItem onSelect={handleShowDeleteConfirm} className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>{t('ugc-page.design-project.dropdown.delete')}</span>
                      </CommandItem>
                    )}
                    
                    <CommandItem onSelect={handleGoToWorkspace}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      <span>{t('ugc-page.design-project.dropdown.manage-workspace')}</span>
                    </CommandItem>
                  </CommandGroup>
                </ScrollArea>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {/* <div className="flex w-full flex-col gap-2">
        <span className="text-xs font-semibold">{t('common.type.design-board')}</span>
        <Popover open={designBoardVisible} onOpenChange={setDesignBoardVisible}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn('w-full justify-between', !currentDesignBoardId && 'text-muted-foreground')}
            >
              {currentDesignBoardId
                ? getI18nContent(selectedDesignBoard!.displayName ?? '')
                : isLoading
                  ? t('common.load.loading')
                  : t('workspace.global-design-board.operation-bar.design-board.placeholder')}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Command>
              <CommandInput
                placeholder={t('workspace.global-design-board.operation-bar.design-board.search-placeholder')}
              />
              <CommandEmpty>{t('workspace.global-design-board.operation-bar.design-board.search-empty')}</CommandEmpty>
              <ScrollArea className="h-64">
                <CommandGroup>
                  {(designBoardList ?? []).map((designBoard) => (
                    <CommandItem
                      value={designBoard.id}
                      key={designBoard.id}
                      onSelect={() => {
                        setCurrentDesignBoardId(designBoard.id);
                        setDesignBoardVisible(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          designBoard.id === currentDesignBoardId ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{getI18nContent(designBoard.displayName)}</span>
                          {designBoard.description && (
                            <span className="text-xs text-muted-foreground">
                              {getI18nContent(designBoard.description)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </Command>
          </PopoverContent>
        </Popover>
      </div> */}
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
              {t('common.dialog.delete-confirm.title', { type: t('common.type.design-project') })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.dialog.delete-confirm.content', { 
                type: t('common.type.design-project'), 
                name: selectedDesignProject ? getI18nContent(selectedDesignProject.displayName) : t('common.utils.unknown') 
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDesignProject}>
              {t('common.utils.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
