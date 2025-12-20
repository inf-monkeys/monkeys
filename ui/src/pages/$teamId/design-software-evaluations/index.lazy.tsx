import React, { useState } from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { mutate } from 'swr';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { vinesFetcher } from '@/apis/fetcher';
import {
  DesignSoftwareTask
} from '@/apis/ugc/design-software-evaluation';
import { IAssetItem } from '@/apis/ugc/typings.ts';
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

  const iframeUrl = 'https://concept-design.infmonkeys.com/68b546ca2152a7334b14181f/workspace/693b8adca125fd2ee60997a1/693b8add179a2e6f3acb55da/view-iframe';

  return (
    <main className="size-full">
      <iframe
        src={iframeUrl}
        className="size-full border-0"
        title="设计软件测评"
        allow="fullscreen"
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
