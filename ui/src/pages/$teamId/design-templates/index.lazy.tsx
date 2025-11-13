import React, { useState } from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { mutate } from 'swr';

import { get } from 'lodash';
import { Download, Link, Pencil, Play, Trash, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useUser } from '@/apis/authz/user';
import { useSystemConfig } from '@/apis/common';
import { deleteDesignProject, exportDesignProject, forkDesignTemplate, importDesignProject } from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings.ts';
import { preloadUgcDesignProjects, useUgcDesignProjects } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { DesignProjectInfoEditor } from '@/components/layout/design-space/design-project-info-editor.tsx';
import { createDesignProjectsColumns } from '@/components/layout/ugc-pages/design-project/consts.tsx';
import { CreateDesignProjectDialog } from '@/components/layout/ugc-pages/design-project/create';
import { DesignAssociationEditorDialog } from '@/components/layout/ugc-pages/design-project/design-association-editor';
import { DesignProjectCardWrapper } from '@/components/layout/ugc-pages/design-project/design-project-card-wrapper';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';
import { getI18nContent } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

// 导入对话框组件
interface ImportDesignTemplateDialogProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  onImport: (file: File) => Promise<void>;
}

const ImportDesignTemplateDialog: React.FC<ImportDesignTemplateDialogProps> = ({
  visible,
  setVisible,
  onImport,
}) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.json')) {
        toast.error('请选择有效的 JSON 文件');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.warning('请先选择要导入的文件');
      return;
    }

    setImporting(true);
    try {
      await onImport(selectedFile);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('common.utils.import', { defaultValue: '导入设计模板' })}</DialogTitle>
          <DialogDescription>
            {t('common.import.description', { defaultValue: '选择导出的 JSON 文件来导入设计模板' })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('common.import.file.label', { defaultValue: '选择文件' })}</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="relative w-full" disabled={importing} asChild>
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {selectedFile
                    ? selectedFile.name
                    : t('common.import.file.placeholder', { defaultValue: '点击选择文件' })}
                  <input
                    type="file"
                    className="hidden"
                    accept=".json"
                    onChange={handleFileChange}
                    disabled={importing}
                  />
                </label>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('common.import.file.hint', { defaultValue: '支持 .json 格式' })}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setVisible(false)} disabled={importing}>
            {t('common.utils.cancel')}
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile || importing}>
            {importing ? t('common.import.loading', { defaultValue: '导入中...' }) : t('common.utils.import', { defaultValue: '导入' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const DesignTemplates: React.FC = () => {
  const { t } = useTranslation();
  const { data: oem } = useSystemConfig();
  const newTabOpenBoard = get(oem, 'theme.designProjects.newTabOpenBoard', true) as boolean;

  const navigate = useNavigate();
  const { copy } = useCopy({ timeout: 500 });
  const { teamId, team, isTeamOwner } = useVinesTeam();
  const { data: user } = useUser();
  const mutateDesignProjects = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/design/project'));

  const [currentDesignProject, setCurrentDesignProject] = useState<IAssetItem<IDesignProject>>();
  const [designProjectEditorVisible, setDesignProjectEditorVisible] = useState(false);
  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);
  const [importDialogVisible, setImportDialogVisible] = useState(false);

  const handleAfterUpdateDesignProject = () => {
    void mutateDesignProjects();
  };

  // 强制清理对话框遮罩层，防止页面卡死
  const forceCleanupDialog = () => {
    requestAnimationFrame(() => {
      // 清理所有设置了 pointer-events 的元素（核心修复：这些元素会阻止页面交互）
      document.querySelectorAll('[style*="pointer-events"]').forEach((element: any) => {
        element.style.pointerEvents = '';
      });
      
      // 恢复 body 的样式
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    });
  };

  const handleDeleteDesignProject = async (id?: string) => {
    if (!id) {
      toast.warning(t('common.toast.loading'));
      return;
    }

    // 立即关闭对话框
    setDeleteAlertDialogVisible(false);
    
    // 强制清理
    forceCleanupDialog();

    // 执行删除操作
    toast.promise(deleteDesignProject(id), {
      loading: t('common.delete.loading'),
      success: () => {
        void mutateDesignProjects();
        return t('common.delete.success');
      },
      error: t('common.delete.error'),
    });
  };

  const handleCancelDelete = () => {
    // 关闭对话框
    setDeleteAlertDialogVisible(false);
    // 强制清理
    forceCleanupDialog();
  };

  const navigateHelper = (item: IAssetItem<IDesignProject>) => {
    // 普通用户点击卡片时，也可以打开模板进行预览（只读模式）
    if (newTabOpenBoard) {
      open(`/${item.teamId}/design/${item.id}`, '_blank');
    } else {
      navigate({ to: `/$teamId/design/$designProjectId`, params: { teamId, designProjectId: item.id } });
    }
  };

  // 自定义 useUgcDesignProjects，过滤只显示模板
  const useUgcDesignTemplates = (dto: any) => {
    return useUgcDesignProjects({
      ...dto,
      filter: {
        ...dto?.filter,
        isTemplate: true,
      },
    });
  };

  const preloadUgcDesignTemplates = (dto: any) => {
    return preloadUgcDesignProjects({
      ...dto,
      filter: {
        ...dto?.filter,
        isTemplate: true,
      },
    });
  };

  // 检查当前用户是否为团队所有者
  const canEdit = user?.id ? isTeamOwner(user.id) : false;

  // 处理 fork 模板
  const handleForkTemplate = async (template: IAssetItem<IDesignProject>) => {
    if (!template.id) {
      toast.warning(t('common.toast.loading'));
      return;
    }

    try {
      const newProject = await forkDesignTemplate(template.id);
      if (newProject) {
        toast.success(t('common.create.success'));
        void mutateDesignProjects();
        // 导航到新创建的设计项目
        if (newTabOpenBoard) {
          open(`/${teamId}/design/${newProject.id}`, '_blank');
        } else {
          navigate({ to: `/$teamId/design/$designProjectId`, params: { teamId, designProjectId: newProject.id } });
        }
      }
    } catch (error) {
      toast.error(t('common.create.error'));
      console.error('Fork template failed:', error);
    }
  };

  // 处理导出设计项目
  const handleExportProject = async (project: IAssetItem<IDesignProject>) => {
    if (!project.id) {
      toast.warning(t('common.toast.loading'));
      return;
    }

    try {
      const exportData = await exportDesignProject(project.id);
      const fileName = `${getI18nContent(project.displayName) || 'design-template'}-${Date.now()}.json`;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t('common.export.success', { defaultValue: '导出成功' }));
    } catch (error) {
      toast.error(t('common.export.error', { defaultValue: '导出失败' }));
      console.error('Export project failed:', error);
    }
  };

  // 处理导入设计项目
  const handleImportProject = async (file: File) => {
    try {
      const fileContent = await file.text();
      let importData: any;
      try {
        importData = JSON.parse(fileContent);
      } catch (error) {
        toast.error('JSON 文件格式错误，请检查文件内容');
        return;
      }

      // 验证导入数据格式
      if (!importData.project || !importData.boards) {
        toast.error('导入文件格式不正确，缺少必要的数据');
        return;
      }

      // 导入时强制设置为模板（设计模板页面）
      importData.project.isTemplate = true;

      const newProject = await importDesignProject(importData);
      if (newProject) {
        toast.success(t('common.import.success', { defaultValue: '导入成功' }));
        void mutateDesignProjects();
        setImportDialogVisible(false);
      }
    } catch (error: any) {
      toast.error(error?.message || t('common.import.error', { defaultValue: '导入失败' }));
      console.error('Import project failed:', error);
    }
  };

  return (
    <main className="flex size-full flex-col">
      <UgcView
        assetKey="design-template"
        assetType="design-project"
        assetIdKey="id"
        assetName={t('components.layout.header.tabs.designs-templates')}
        useUgcFetcher={useUgcDesignTemplates}
        preloadUgcFetcher={preloadUgcDesignTemplates}
        createColumns={() => createDesignProjectsColumns(navigateHelper)}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? t('common.utils.unknown-user') + ' ' + t('common.utils.created-at', { time: formatTimeDiffPrevious(item.createdTimestamp) })}`}
            </span>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
          // 自定义卡片渲染
          customCard: (item) => (
            <DesignProjectCardWrapper
              key={item.id}
              project={item}
              onItemClick={navigateHelper}
              operateArea={
                canEdit
                  ? (item, trigger, tooltipTriggerContent) => (
                      <DropdownMenu>
                        {tooltipTriggerContent ? (
                          <Tooltip content={tooltipTriggerContent}>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                            </TooltipTrigger>
                          </Tooltip>
                        ) : (
                          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                        )}

                        <DropdownMenuContent
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <DropdownMenuLabel>
                            {t('ugc-page.design-project.ugc-view.operate-area.dropdown-label')}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onSelect={() => {
                                setCurrentDesignProject(item);
                                setDesignProjectEditorVisible(true);
                              }}
                            >
                              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                                <Pencil size={15} />
                              </DropdownMenuShortcut>
                              {t('ugc-page.design-project.ugc-view.operate-area.options.edit-info')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => copy(location.origin.concat(`/${item.teamId}/design/${item.id}`))}
                            >
                              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                                <Link size={15} />
                              </DropdownMenuShortcut>
                              {t('ugc-page.design-project.ugc-view.operate-area.options.copy-link')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                void handleExportProject(item);
                              }}
                            >
                              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                                <Download size={15} />
                              </DropdownMenuShortcut>
                              {t('common.utils.export', { defaultValue: '导出' })}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-red-10"
                              onSelect={() => {
                                setCurrentDesignProject(item);
                                setDeleteAlertDialogVisible(true);
                              }}
                            >
                              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                                <Trash size={15} />
                              </DropdownMenuShortcut>
                              {t('common.utils.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  : (item, trigger, tooltipTriggerContent) => (
                      <Button
                        variant="solid"
                        size="small"
                        icon={<Play size={15} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          void handleForkTemplate(item);
                        }}
                      >
                        {t('common.utils.start')}
                      </Button>
                    )
              }
            />
          ),
        }}
        operateArea={
          canEdit
            ? (item, trigger, tooltipTriggerContent) => (
                <DropdownMenu>
                  {tooltipTriggerContent ? (
                    <Tooltip content={tooltipTriggerContent}>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                      </TooltipTrigger>
                    </Tooltip>
                  ) : (
                    <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                  )}

                  <DropdownMenuContent
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <DropdownMenuLabel>{t('ugc-page.design-project.ugc-view.operate-area.dropdown-label')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onSelect={() => {
                          setCurrentDesignProject(item);
                          setDesignProjectEditorVisible(true);
                        }}
                      >
                        <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                          <Pencil size={15} />
                        </DropdownMenuShortcut>
                        {t('ugc-page.design-project.ugc-view.operate-area.options.edit-info')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => copy(location.origin.concat(`/${item.teamId}/design/${item.id}`))}>
                        <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                          <Link size={15} />
                        </DropdownMenuShortcut>
                        {t('ugc-page.design-project.ugc-view.operate-area.options.copy-link')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void handleExportProject(item);
                        }}
                      >
                        <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                          <Download size={15} />
                        </DropdownMenuShortcut>
                        {t('common.utils.export', { defaultValue: '导出' })}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="text-red-10"
                        onSelect={() => {
                          setCurrentDesignProject(item);
                          setDeleteAlertDialogVisible(true);
                        }}
                      >
                        <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                          <Trash size={15} />
                        </DropdownMenuShortcut>
                        {t('common.utils.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            : (item, trigger, tooltipTriggerContent) => (
                <Button
                  variant="solid"
                  size="small"
                  icon={<Play size={15} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    void handleForkTemplate(item);
                  }}
                >
                  {t('common.utils.start')}
                </Button>
              )
        }
        onItemClick={(item) => navigateHelper(item)}
        subtitle={
          canEdit ? (
            <>
              <ImportDesignTemplateDialog visible={importDialogVisible} setVisible={setImportDialogVisible} onImport={handleImportProject} />
              <Tooltip content={t('common.utils.import', { defaultValue: '导入' })}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="small"
                    icon={<Upload size={15} />}
                    onClick={() => setImportDialogVisible(true)}
                  />
                </TooltipTrigger>
              </Tooltip>
              <DesignAssociationEditorDialog />
              <CreateDesignProjectDialog isTemplate={true} />
            </>
          ) : undefined
        }
      />
      <DesignProjectInfoEditor
        visible={designProjectEditorVisible}
        setVisible={setDesignProjectEditorVisible}
        designProject={currentDesignProject}
        afterUpdate={handleAfterUpdateDesignProject}
      />
      <AlertDialog open={deleteAlertDialogVisible} onOpenChange={setDeleteAlertDialogVisible}>
        <AlertDialogContent
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.dialog.delete-confirm.title', {
                type: t('common.type.design-project'),
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.dialog.delete-confirm.content', {
                type: t('common.type.design-project'),
                name: getI18nContent(currentDesignProject?.displayName) ?? t('common.utils.unknown'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              {t('common.utils.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteDesignProject(currentDesignProject?.id)}>
              {t('common.utils.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/design-templates/')({
  component: DesignTemplates,
});

