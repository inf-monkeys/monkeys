import React, { useState } from 'react';

import { mutate } from 'swr';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { Link, Pencil, Plus, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteEvaluationModule } from '@/apis/evaluation';
import { EvaluationModule } from '@/apis/evaluation/typings';
import { preloadUgcEvaluationModules, useUgcEvaluationModules } from '@/apis/ugc/evaluation';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcView } from '@/components/layout/ugc/view';
import { createEvaluationModulesColumns } from '@/components/layout/ugc-pages/evaluations/consts.tsx';
import { CreateEvaluationModuleDialog } from '@/components/layout/ugc-pages/evaluations/create-evaluation-module.tsx';
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
import { useCopy } from '@/hooks/use-copy.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const EvaluationModules: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { copy } = useCopy({ timeout: 500 });
  const { teamId } = useVinesTeam();
  const mutateEvaluationModules = () =>
    mutate((key) => typeof key === 'string' && key.startsWith('/api/evaluation/modules'));

  const [currentModule, setCurrentModule] = useState<IAssetItem<EvaluationModule>>();
  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);

  const handleDeleteModule = (moduleId?: string) => {
    if (!moduleId) {
      toast.warning(t('common.toast.loading'));
      return;
    }

    toast.promise(deleteEvaluationModule(moduleId), {
      loading: t('common.delete.loading'),
      success: () => {
        void mutateEvaluationModules();
        return t('common.delete.success');
      },
      error: t('common.delete.error'),
    });
  };

  return (
    <main className="size-full">
      <UgcView
        assetKey="evaluation-module"
        assetType="workflow" // 复用workflow的类型，因为在UGC系统中概念相似
        assetIdKey="id"
        assetName={t('components.layout.main.sidebar.list.evaluations.label', '评测模块')}
        useUgcFetcher={useUgcEvaluationModules}
        preloadUgcFetcher={preloadUgcEvaluationModules}
        createColumns={createEvaluationModulesColumns}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? t('common.utils.unknown-user')} ${t('common.utils.created-at', { time: formatTimeDiffPrevious(item.createdTimestamp || 0) })}`}
            </span>
          ),
          cover: (item) => (
            <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
              E
              {item.isActive === true && (
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
              )}
            </div>
          ),
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
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <DropdownMenuLabel>评测模块操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    void navigate({
                      to: '/$teamId/evaluations/detail',
                      params: { teamId },
                      search: { moduleId: item.id },
                    });
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Pencil size={15} />
                  </DropdownMenuShortcut>
                  编辑模块
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    copy(location.origin.concat(`/${item.teamId}/evaluations/detail?moduleId=${item.id}`))
                  }
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Link size={15} />
                  </DropdownMenuShortcut>
                  复制链接
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-10"
                  onSelect={() => {
                    setCurrentModule(item);
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
        onItemClick={(item) => open(`/${item.teamId}/evaluations/${item.id}/leaderboard`, '_blank')}
        subtitle={
          <Button variant="outline" size="small" icon={<Plus />} onClick={() => setCreateDialogVisible(true)}>
            新建评测模块
          </Button>
        }
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
                type: '评测模块',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.dialog.delete-confirm.content', {
                type: '评测模块',
                name: currentModule?.displayName ?? t('common.utils.unknown'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteModule(currentModule?.id)}>
              {t('common.utils.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CreateEvaluationModuleDialog
        open={createDialogVisible}
        onOpenChange={setCreateDialogVisible}
        onSuccess={() => {
          void mutateEvaluationModules();
        }}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/evaluations/')({
  component: EvaluationModules,
});
