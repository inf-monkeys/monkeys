import React, { useState } from 'react';

import { mutate } from 'swr';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { Copy, Download, FileUp, FolderUp, Import, Link, Pencil, Share, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { preloadUgcWorkflows, useUgcWorkflows } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { cloneWorkflow, deleteWorkflow } from '@/apis/workflow';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { CreateAppDialog } from '@/components/layout/ugc-pages/apps/create';
import { createWorkflowsColumns } from '@/components/layout/ugc-pages/workflows/consts.tsx';
import { ExportWorkflowDialog } from '@/components/layout/ugc-pages/workflows/export-workflow';
import { IExportWorkflowWithAssetsContext } from '@/components/layout/ugc-pages/workflows/export-workflow/typings.ts';
import { PublishToMarket } from '@/components/layout/ugc-pages/workflows/publish-to-market';
import { IPublishToMarketWithAssetsContext } from '@/components/layout/ugc-pages/workflows/publish-to-market/typings.ts';
import { WorkflowInfoEditor } from '@/components/layout/workspace/workflow-info-editor.tsx';
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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';
import { getI18nContent } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const Workflows: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { copy } = useCopy({ timeout: 500 });
  const { teamId } = useVinesTeam();
  const mutateWorkflows = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/workflow/metadata'));

  const [currentWorkflow, setCurrentWorkflow] = useState<IAssetItem<MonkeyWorkflow>>();
  const [workflowEditorVisible, setWorkflowEditorVisible] = useState(false);
  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [exportAssetContext, setExportAssetContext] = useState<IExportWorkflowWithAssetsContext | undefined>();
  const [publishToMarketVisible, setPublishToMarketVisible] = useState(false);
  const [publishToMarketContext, setPublishToMarketContext] = useState<IPublishToMarketWithAssetsContext | undefined>();

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
        assetName={t('components.layout.main.sidebar.list.apps.workflows.label')}
        useUgcFetcher={useUgcWorkflows}
        preloadUgcFetcher={preloadUgcWorkflows}
        createColumns={createWorkflowsColumns}
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
                  onSelect={() => copy(location.origin.concat(`/${item.teamId}/workspace/${item.workflowId}`))}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Link size={15} />
                  </DropdownMenuShortcut>
                  {t('ugc-page.workflow.ugc-view.operate-area.options.copy-link')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void handleCloneWorkflow(item.workflowId)}>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Copy size={15} />
                  </DropdownMenuShortcut>
                  {t('ugc-page.workflow.ugc-view.operate-area.options.create-a-copy')}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                      <Download size={15} />
                    </DropdownMenuShortcut>
                    {t('settings.account.team.import-export.export.button')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
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
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setPublishToMarketContext({
                      id: item.workflowId,
                      displayName: getI18nContent(item.displayName),
                      description: getI18nContent(item.description),
                      iconUrl: item.iconUrl,
                    });
                    setPublishToMarketVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Share size={15} />
                  </DropdownMenuShortcut>
                  {t('components.layout.ugc.publish-dialog.title')}
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
                  <DropdownMenuItem disabled>
                    {t('ugc-page.workflow.ugc-view.subtitle.import.options.local-import')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      void navigate({
                        to: '/$teamId/application-store/',
                        params: { teamId },
                      });
                    }}
                  >
                    {t('ugc-page.workflow.ugc-view.subtitle.import.options.market-import')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <CreateAppDialog defaultSelect="workflow" />
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
                name: getI18nContent(currentWorkflow?.displayName) ?? t('common.utils.unknown'),
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
      <PublishToMarket
        visible={publishToMarketVisible}
        setVisible={setPublishToMarketVisible}
        context={publishToMarketContext}
      />
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/workflows/')({
  component: Workflows,
});
