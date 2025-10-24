import React, { useState } from 'react';

import { mutate } from 'swr';
import { createLazyFileRoute } from '@tanstack/react-router';

import { ExternalLink, Eye, Plus, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  DesignSoftwareTask,
  preloadUgcDesignSoftwareEvaluationTasks,
  useUgcDesignSoftwareEvaluationTasks,
} from '@/apis/ugc/design-software-evaluation';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcView } from '@/components/layout/ugc/view';
import { createDesignSoftwareEvaluationTasksColumns } from '@/components/layout/ugc-pages/design-software-evaluations/consts';
import { CreateDesignSoftwareTaskDialog } from '@/components/layout/ugc-pages/design-software-evaluations/create-design-software-task-dialog';
import { useGetUgcViewIconOnlyMode } from '@/components/layout/ugc-pages/util';
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
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const DesignSoftwareEvaluations: React.FC = () => {
  const { t } = useTranslation();

  const [currentTask, setCurrentTask] = useState<IAssetItem<DesignSoftwareTask>>();
  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);

  const mutateDesignSoftwareTasks = () =>
    mutate((key) => typeof key === 'string' && key.startsWith('/api/design-software-evaluation/tasks'));

  const handleDeleteTask = async () => {
    if (!currentTask) return;

    try {
      const response = await fetch(`/api/design-software-evaluation/tasks/${currentTask.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('删除失败');

      toast.success('删除成功');
      setDeleteAlertDialogVisible(false);
      setCurrentTask(undefined);
      mutateDesignSoftwareTasks();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const evaluationLabels = {
    usability: '易用性',
    functionality: '功能完整性',
    performance: '性能表现',
    stability: '稳定性',
    documentation: '文档质量',
    uiDesign: '界面设计',
    learning_curve: '学习曲线',
    compatibility: '兼容性',
  };

  const iconOnlyMode = useGetUgcViewIconOnlyMode();

  return (
    <main className="size-full">
      <UgcView
        assetKey="design-software-evaluation-task"
        assetType="workflow"
        assetIdKey="id"
        assetName="设计软件测评任务"
        useUgcFetcher={useUgcDesignSoftwareEvaluationTasks}
        preloadUgcFetcher={preloadUgcDesignSoftwareEvaluationTasks}
        createColumns={createDesignSoftwareEvaluationTasksColumns}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? t('common.utils.unknown-user')} ${t('common.utils.created-at', { time: formatTimeDiffPrevious(item.createdTimestamp || 0) })}`}
            </span>
          ),
          cover: (item) => {
            if (item.thumbnailUrl) {
              return <img src={item.thumbnailUrl} alt={item.softwareName} className="h-12 w-12 rounded object-cover" />;
            }
            return (
              <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-lg font-bold text-white">
                DS
                {item.status === 'completed' && (
                  <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
                )}
              </div>
            );
          },
        }}
        operateArea={(item, trigger, tooltipTriggerContent) => (
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
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {item.status === 'completed' && (
                  <DropdownMenuItem
                    onSelect={() => {
                      setCurrentTask(item);
                      setDetailDialogVisible(true);
                    }}
                  >
                    <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                      <Eye size={15} />
                    </DropdownMenuShortcut>
                    查看评测结果
                  </DropdownMenuItem>
                )}
                {item.documentUrl && (
                  <DropdownMenuItem
                    onSelect={() => {
                      window.open(item.documentUrl, '_blank');
                    }}
                  >
                    <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                      <ExternalLink size={15} />
                    </DropdownMenuShortcut>
                    查看相关文档
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-10"
                  onSelect={() => {
                    setCurrentTask(item);
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
        )}
        onItemClick={(item) => {
          if (item.status === 'completed') {
            setCurrentTask(item);
            setDetailDialogVisible(true);
          }
        }}
        subtitle={
          <Button variant="outline" size="small" icon={<Plus />} onClick={() => setCreateDialogVisible(true)}>
            {iconOnlyMode ? null : '创建任务'}
          </Button>
        }
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteAlertDialogVisible} onOpenChange={setDeleteAlertDialogVisible}>
        <AlertDialogContent
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除设计软件测评任务「{currentTask?.softwareName}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>{t('common.utils.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 创建对话框 */}
      <CreateDesignSoftwareTaskDialog
        open={createDialogVisible}
        onOpenChange={setCreateDialogVisible}
        onSuccess={mutateDesignSoftwareTasks}
      />

      {/* 评测结果详情对话框 */}
      <Dialog open={detailDialogVisible} onOpenChange={setDetailDialogVisible}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {currentTask?.softwareName}
              {currentTask?.softwareVersion && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">{currentTask.softwareVersion}</span>
              )}
            </DialogTitle>
            <DialogDescription>设计软件测评结果详情</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {currentTask?.taskDescription && (
              <div className="rounded-lg border p-3">
                <h4 className="mb-2 text-sm font-medium">测评描述</h4>
                <p className="text-sm text-muted-foreground">{currentTask.taskDescription}</p>
              </div>
            )}

            {currentTask?.evaluationResult && (
              <div>
                <h4 className="mb-3 text-sm font-medium">评测指标</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(currentTask.evaluationResult).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm">{evaluationLabels[key as keyof typeof evaluationLabels]}</span>
                      <span className="font-semibold">
                        {value} <span className="text-xs text-muted-foreground">/ 5</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentTask?.evaluationNotes && (
              <div className="rounded-lg border p-3">
                <h4 className="mb-2 text-sm font-medium">评测备注</h4>
                <p className="text-sm text-muted-foreground">{currentTask.evaluationNotes}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            {currentTask?.documentUrl && (
              <Button variant="outline" onClick={() => window.open(currentTask.documentUrl, '_blank')}>
                查看文档
              </Button>
            )}
            <Button onClick={() => setDetailDialogVisible(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/design-software-evaluations/')({
  component: DesignSoftwareEvaluations,
});
