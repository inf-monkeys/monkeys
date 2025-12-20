import React, { useState } from 'react';

import { mutate } from 'swr';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { Eye, Plus, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { vinesFetcher } from '@/apis/fetcher';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { preloadUgcVREvaluationTasks, useUgcVREvaluationTasks, VRTask } from '@/apis/ugc/vr-evaluation';
import { UgcView } from '@/components/layout/ugc/view';
import { useGetUgcViewIconOnlyMode } from '@/components/layout/ugc-pages/util';
import { createVREvaluationTasksColumns } from '@/components/layout/ugc-pages/vr-evaluations/consts';
import { CreateVRTaskDialog } from '@/components/layout/ugc-pages/vr-evaluations/create-vr-task-dialog';
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

export const VREvaluations: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teamId } = Route.useParams();

  const [currentTask, setCurrentTask] = useState<IAssetItem<VRTask>>();
  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);

  const mutateVRTasks = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/vr-evaluation/tasks'));

  const handleDeleteTask = async () => {
    if (!currentTask) return;

    try {
      const deleteFetcher = vinesFetcher<{ success: boolean }>({
        method: 'DELETE',
        simple: true,
      });

      await deleteFetcher(`/api/vr-evaluation/tasks/${currentTask.id}`);
      toast.success('删除成功');
      setDeleteAlertDialogVisible(false);
      setCurrentTask(undefined);
      mutateVRTasks();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const iconOnlyMode = useGetUgcViewIconOnlyMode();

  return (
    <main className="size-full">
      <UgcView
        assetKey="vr-evaluation-task"
        assetType="workflow"
        assetIdKey="id"
        assetName="VR 评测任务"
        useUgcFetcher={useUgcVREvaluationTasks}
        preloadUgcFetcher={preloadUgcVREvaluationTasks}
        createColumns={createVREvaluationTasksColumns}
        sidebarDefaultVisible={false}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? t('common.utils.unknown-user')} ${t('common.utils.created-at', { time: formatTimeDiffPrevious(item.createdTimestamp || 0) })}`}
            </span>
          ),
          cover: (item) => {
            if (item.thumbnailUrl) {
              return <img src={item.thumbnailUrl} alt={item.taskName} className="h-12 w-12 rounded object-cover" />;
            }
            return (
              <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-lg font-bold text-white">
                VR
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
                      to: '/$teamId/vr-evaluations/$taskId/',
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
            to: '/$teamId/vr-evaluations/$taskId/',
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
              确定要删除评测任务「{currentTask?.taskName}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask}>{t('common.utils.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 创建对话框 */}
      <CreateVRTaskDialog open={createDialogVisible} onOpenChange={setCreateDialogVisible} onSuccess={mutateVRTasks} />
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/vr-evaluations/')({
  component: VREvaluations,
});
