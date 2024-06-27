import React, { useState } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { mutate } from 'swr';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { useClipboard } from '@mantine/hooks';
import { Copy, FileUp, FolderUp, Import, Link, Pencil, Plus, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { preloadUgcWorkflows, useUgcWorkflows } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { cloneWorkflow, deleteWorkflow } from '@/apis/workflow';
import { createWorkflowsColumns } from '@/components/layout/ugc-pages/workflows/consts.tsx';
import { ExportWorkflowDialog } from '@/components/layout/ugc-pages/workflows/export-workflow';
import { IExportWorkflowWithAssetsContext } from '@/components/layout/ugc-pages/workflows/export-workflow/typings.ts';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { WorkflowInfoEditor } from '@/components/layout/workspace/workflow/info-editor';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
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
import { useWorkflow } from '@/package/vines-flow';
import { execCopy, getI18nContent } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const Workflows: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const clipboard = useClipboard({ timeout: 500 });
  const { teamId } = useVinesTeam();
  const { createWorkflow } = useWorkflow();
  const mutateWorkflows = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/workflow/list'));

  const [isCreating, setIsCreating] = useState(false);

  const [currentWorkflow, setCurrentWorkflow] = useState<IAssetItem<MonkeyWorkflow>>();
  const [workflowEditorVisible, setWorkflowEditorVisible] = useState(false);
  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [exportAssetContext, setExportAssetContext] = useState<IExportWorkflowWithAssetsContext | undefined>();

  const handleCreateWorkflow = async () => {
    if (!teamId) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    setIsCreating(true);
    const workflowId = await createWorkflow(t('common.utils.untitled'));
    setIsCreating(false);
    if (!workflowId) {
      toast.error(t('common.create.error'));
      return;
    }
    void mutateWorkflows();
    open(`/${teamId}/workspace/${workflowId}`, '_blank');
  };

  const handleAfterUpdateWorkflow = () => {
    void mutateWorkflows();
  };

  const handleCloneWorkflow = async (workflowId: string) => {
    if (!teamId) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    const newWorkflowInfo = await cloneWorkflow(workflowId);
    if (!newWorkflowInfo) {
      toast.error(t('common.create.error'));
      return;
    }
    void mutateWorkflows();
    open(`/${teamId}/workspace/${newWorkflowInfo.workflowId}`, '_blank');
  };

  const handleDeleteWorkflow = (workflowId?: string) => {
    if (!workflowId) {
      toast.warning(t('common.toast.loading'));
      return;
    }

    toast.promise(deleteWorkflow(workflowId), {
      loading: t('common.delete.loading'),
      success: () => {
        void mutateWorkflows();
        return t('common.delete.success');
      },
      error: t('common.delete.error'),
    });
  };

  return (
    <main className="size-full">
      <UgcView
        assetKey="workflow"
        assetType="workflow"
        assetIdKey="workflowId"
        assetName={t('components.layout.main.sidebar.list.app.workflows.label')}
        useUgcFetcher={useUgcWorkflows}
        preloadUgcFetcher={preloadUgcWorkflows}
        createColumns={() => createWorkflowsColumns()}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? t('common.utils.unknown-user') + ' ' + t('common.utils.created-at', { time: formatTimeDiffPrevious(item.createdTimestamp) })}`}
            </span>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
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
              <DropdownMenuLabel>{t('ugc-page.workflow.ugc-view.operate-area.dropdown-label')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    const url = location.origin.concat(`/${item.teamId}/workspace/${item.workflowId}`);
                    clipboard.copy(url);
                    if (!clipboard.copied && !execCopy(url)) toast.error(t('common.toast.copy-failed'));
                    else toast.success(t('common.toast.copy-success'));
                    toast.success(t('common.toast.copy-success'));
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Link size={15} />
                  </DropdownMenuShortcut>
                  {t('ugc-page.workflow.ugc-view.operate-area.options.copy-link')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    void handleCloneWorkflow(item.workflowId);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Copy size={15} />
                  </DropdownMenuShortcut>
                  {t('ugc-page.workflow.ugc-view.operate-area.options.create-a-copy')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setCurrentWorkflow(item);
                    setWorkflowEditorVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Pencil size={15} />
                  </DropdownMenuShortcut>
                  {t('ugc-page.workflow.ugc-view.operate-area.options.edit-info')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setExportAssetContext({
                      workflowId: item.workflowId,
                      displayName: getI18nContent(item.displayName) ?? t('common.utils.untitled'),
                      version: item.version,
                    });
                    setExportDialogVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <FileUp size={15} />
                  </DropdownMenuShortcut>
                  {t('ugc-page.workflow.ugc-view.operate-area.options.export-current-version')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setExportAssetContext({
                      workflowId: item.workflowId,
                      displayName: getI18nContent(item.displayName) ?? t('common.utils.untitled'),
                    });
                    setExportDialogVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <FolderUp size={15} />
                  </DropdownMenuShortcut>
                  {t('ugc-page.workflow.ugc-view.operate-area.options.export-all-versions')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-10"
                  onSelect={() => {
                    setCurrentWorkflow(item);
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
        onItemClick={(item) => open(`/${item.teamId}/workspace/${item.workflowId}`, '_blank')}
        subtitle={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="small" icon={<Import />}>
                  {t('common.utils.import')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem disabled onSelect={() => {}}>
                    {t('ugc-page.workflow.ugc-view.subtitle.import.options.local-import')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      void navigate({
                        to: '/$teamId/application-store',
                      });
                    }}
                  >
                    {t('ugc-page.workflow.ugc-view.subtitle.import.options.market-import')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="small" icon={<Plus />} onClick={handleCreateWorkflow} loading={isCreating}>
              {t('common.utils.create')}
            </Button>
          </>
        }
      />
      <WorkflowInfoEditor
        visible={workflowEditorVisible}
        setVisible={setWorkflowEditorVisible}
        workflow={currentWorkflow}
        afterUpdate={handleAfterUpdateWorkflow}
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
                type: t('common.type.workflow'),
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.dialog.delete-confirm.content', {
                type: t('common.type.workflow'),
                name: currentWorkflow?.name ?? t('common.utils.unknown'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteWorkflow(currentWorkflow?.workflowId)}>
              {t('common.utils.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ExportWorkflowDialog
        visible={exportDialogVisible}
        setVisible={(v) => {
          setExportAssetContext(undefined);
          setExportDialogVisible(v);
        }}
        context={exportAssetContext}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/workflows/')({
  component: Workflows,
  beforeLoad: teamIdGuard,
});
