import React, { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { mutate } from 'swr';

import { createDesignProjectVersion, deleteDesignProjectVersion, useDesignProjectVersions } from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatTimeDiffPrevious } from '@/utils/time';

interface DesignProjectVersionManagerProps {
  project: IAssetItem<IDesignProject>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onVersionChange?: (version: number) => void;
}

export const DesignProjectVersionManager: React.FC<DesignProjectVersionManagerProps> = ({
  project,
  open: controlledOpen,
  onOpenChange,
  onVersionChange,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
    // 如果关闭对话框，强制清理遮罩
    if (!value) {
      forceCleanupDialog();
    }
  };

  const { data: versions } = useDesignProjectVersions(project.projectId);

  const handleCreateVersion = async () => {
    if (!versions || versions.length === 0) {
      toast.error('无法获取版本信息');
      return;
    }

    setCreating(true);

    try {
      const latestVersion = Math.max(...versions.map((v) => v.version));
      const newVersion = await createDesignProjectVersion(project.projectId, {
        currentVersion: project.version,
        displayName: project.displayName as string,
        description: project.description as string,
        iconUrl: project.iconUrl,
      });

      toast.success('新版本创建成功');
      
      // 立即关闭对话框
      setOpen(false);
      
      // 强制清理遮罩
      forceCleanupDialog();
      
      // 跳转到新创建的版本
      if (newVersion?.id) {
        setTimeout(() => {
          window.location.href = `/${project.teamId}/design/${newVersion.id}`;
        }, 100);
      } else {
        // 如果没有返回新版本ID，刷新当前页面
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (error) {
      console.error('创建版本失败:', error);
      toast.error('创建版本失败');
      setCreating(false);
    }
  };

  const currentVersion = versions?.find((v) => v.version === project.version);

  const handleVersionSwitch = (versionItem: IAssetItem<IDesignProject>) => {
    if (versionItem.version === project.version) {
      return; // 已经是当前版本，不需要切换
    }

    // 立即关闭对话框
    setOpen(false);
    
    // 强制清理遮罩
    forceCleanupDialog();
    
    // 切换到对应版本的设计项目
    // 因为不同版本有不同的 id，所以直接使用版本的 id 进行跳转
    setTimeout(() => {
      window.location.href = `/${project.teamId}/design/${versionItem.id}`;
    }, 100);
  };

  const handleDeleteClick = (version: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发版本切换
    setVersionToDelete(version);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (versionToDelete === null) return;

    setDeleting(true);
    try {
      await deleteDesignProjectVersion(project.projectId, versionToDelete);
      
      toast.success(`版本 ${versionToDelete} 已删除`);
      
      // 刷新版本列表
      await mutate(`/api/design/project/${project.projectId}/versions`);
      
      // 如果删除的是当前版本，跳转到最新版本
      if (versionToDelete === project.version) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('删除版本失败:', error);
      toast.error('删除版本失败');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setVersionToDelete(null);
    }
  };

  return (
    <>
      {controlledOpen === undefined && (
        <Button
          variant="outline"
          size="small"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <GitBranch className="h-4 w-4" />
          版本 {project.version}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>版本管理</DialogTitle>
            <DialogDescription>
              查看和管理设计项目的版本历史
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 当前版本信息 */}
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-semibold">当前版本</h4>
                <span className="text-sm text-muted-foreground">
                  版本 {project.version}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                更新时间: {formatTimeDiffPrevious(project.updatedTimestamp)}
              </div>
            </div>

            {/* 版本列表 */}
            <div className="space-y-2">
              <h4 className="font-semibold">版本历史</h4>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {versions?.map((version) => (
                  <div
                    key={version.id}
                    className={`rounded-lg border p-3 transition-all ${
                      version.version === project.version
                        ? 'border-primary bg-primary/5 cursor-default'
                        : 'hover:bg-accent hover:border-primary/50 cursor-pointer'
                    }`}
                    onClick={() => handleVersionSwitch(version)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">版本 {version.version}</span>
                          {version.version === project.version && (
                            <span className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                              当前
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {formatTimeDiffPrevious(version.createdTimestamp)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {version.version !== project.version && (
                          <div className="text-xs text-muted-foreground">
                            点击切换
                          </div>
                        )}
                        {versions && versions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="small"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleDeleteClick(version.version, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              关闭
            </Button>
            <Button
              onClick={handleCreateVersion}
              disabled={creating}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {creating ? '创建中...' : '创建新版本'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除版本</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要删除版本 {versionToDelete} 吗？此操作无法撤销。
              {versionToDelete === project.version && (
                <div className="mt-2 text-yellow-600">
                  ⚠️ 注意：你正在删除当前版本，删除后页面将刷新。
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

