import React, { useState } from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { mutate } from 'swr';

import { Eye, Plus, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { vinesFetcher } from '@/apis/fetcher';
import {
  DesignSoftwareTask,
  preloadUgcDesignSoftwareEvaluationTasks,
  useUgcDesignSoftwareEvaluationTasks,
} from '@/apis/ugc/design-software-evaluation';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { createDesignSoftwareEvaluationTasksColumns } from '@/components/layout/ugc-pages/design-software-evaluations/consts';
import { CreateDesignSoftwareTaskDialog } from '@/components/layout/ugc-pages/design-software-evaluations/create-design-software-task-dialog';
import { useGetUgcViewIconOnlyMode } from '@/components/layout/ugc-pages/util';
import { UgcView } from '@/components/layout/ugc/view';
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
  const navigate = useNavigate();
  const { teamId } = Route.useParams();

  const [currentTask, setCurrentTask] = useState<IAssetItem<DesignSoftwareTask>>();
  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);

  const mutateDesignSoftwareTasks = () =>
    mutate((key) => typeof key === 'string' && key.startsWith('/api/design-software-evaluation/tasks'));

  const handleDeleteTask = async () => {
    if (!currentTask) return;

    try {
      const deleteFetcher = vinesFetcher<{ success: boolean }>({
        method: 'DELETE',
        simple: true,
      });

      await deleteFetcher(`/api/design-software-evaluation/tasks/${currentTask.id}`);
      toast.success('删除成功');
      setDeleteAlertDialogVisible(false);
      setCurrentTask(undefined);
      mutateDesignSoftwareTasks();
    } catch (error) {
      toast.error('删除失败');
    }
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
        showSidebar={false}
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
                设计
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
            {/* @ts-expect-error - DropdownMenuContent does accept onClick but type definition is incomplete */}
            <DropdownMenuContent
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    setCurrentTask(item);
                    navigate({
                      to: '/$teamId/design-software-evaluations/$taskId/',
                      params: { teamId, taskId: item.id },
                    });
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Eye size={15} />
                  </DropdownMenuShortcut>
                  查看评测结果
                </DropdownMenuItem>
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
          navigate({
            to: '/$teamId/design-software-evaluations/$taskId/',
            params: { teamId, taskId: item.id },
          });
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
              确定要删除评测任务「{currentTask?.softwareName}」吗？此操作无法撤销。
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
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/design-software-evaluations/')({
  component: DesignSoftwareEvaluations,
});
