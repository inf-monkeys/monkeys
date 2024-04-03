import React, { useState } from 'react';

import { mutate } from 'swr';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { MonkeyWorkflow } from '@inf-monkeys/vines';
import { useClipboard } from '@mantine/hooks';
import { Copy, FileUp, FolderUp, Link, Pencil, Trash } from 'lucide-react';
import { toast } from 'sonner';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { preloadUgcWorkflows, useUgcWorkflows } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { cloneWorkflow, deleteWorkflow } from '@/apis/workflow';
import { ExportWorkflowDialog } from '@/components/dialog/export-workflow';
import { IExportWorkflowWithAssetsContext } from '@/components/dialog/export-workflow/typings.ts';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderDescription, RenderIcon, RenderTime, RenderUser } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { WorkflowInfoEditor } from '@/components/layout/workspace/workflow/info-editor';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
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
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const Workflows: React.FC = () => {
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
      toast.warning('请等待数据加载完毕');
      return;
    }
    setIsCreating(true);
    const workflowId = await createWorkflow('未命名应用');
    setIsCreating(false);
    if (!workflowId) {
      toast.error('创建失败，请稍后再试');
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
      toast.warning('请等待数据加载完毕');
      return;
    }
    const newWorkflowInfo = await cloneWorkflow(workflowId);
    if (!newWorkflowInfo) {
      toast.error('创建失败，请稍后再试');
      return;
    }
    void mutateWorkflows();
    open(`/${teamId}/workspace/${newWorkflowInfo.workflowId}`, '_blank');
  };

  const handleDeleteWorkflow = (workflowId?: string) => {
    if (!workflowId) {
      toast.error('数据加载失败，请稍后再试');
      return;
    }

    toast.promise(deleteWorkflow(workflowId), {
      loading: '删除中',
      success: () => {
        void mutateWorkflows();
        return '删除成功';
      },
      error: '删除失败，请检查网络后重试',
    });
  };

  return (
    <main className="size-full">
      <UgcView
        assetKey="workflow"
        assetType="workflow"
        assetName="工作流"
        useUgcFetcher={useUgcWorkflows}
        preloadUgcFetcher={preloadUgcWorkflows}
        createColumns={(columnHelper) => {
          return [
            columnHelper.accessor('iconUrl', {
              id: 'logo',
              header: '图标',
              cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
              maxSize: 48,
            }),
            columnHelper.accessor('name', {
              id: 'title',
              header: '名称',
              cell: ({ row, getValue }) => (
                <a
                  className="transition-colors hover:text-primary-500"
                  href={`/${row.original.teamId}/workspace/${row.original.workflowId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {getValue() as string}
                </a>
              ),
            }),
            columnHelper.accessor('description', {
              id: 'description',
              header: '描述',
              cell: ({ getValue }) => RenderDescription({ description: getValue() as string }),
            }),
            columnHelper.accessor('user', {
              id: 'user',
              header: '用户',
              cell: ({ getValue }) => RenderUser({ user: getValue() as IVinesUser }),
              maxSize: 48,
            }),
            columnHelper.accessor('assetTags', {
              id: 'assetTags',
              header: '标签',
              maxSize: 96,
            }),
            columnHelper.accessor('createdTimestamp', {
              id: 'createdTimestamp',
              header: '创建时间',
              cell: ({ getValue }) => RenderTime({ time: getValue() as number }),
              maxSize: 72,
            }),
            columnHelper.accessor('updatedTimestamp', {
              id: 'updatedTimestamp',
              header: '更新时间',
              cell: ({ getValue }) => RenderTime({ time: getValue() as number }),
              maxSize: 72,
            }),
          ];
        }}
        renderOptions={{
          subtitle: (item) => {
            return (
              <div className="flex gap-1">
                <span>{item.user?.name ?? '未知'}</span>
                <span>创建于</span>
                <span>{formatTimeDiffPrevious(item.createdTimestamp)}</span>
              </div>
            );
          },
          cover: (item) => {
            return RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' });
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
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <DropdownMenuLabel>工作流操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    clipboard.copy(location.origin.concat(`/${item.teamId}/workspace/${item.workflowId}`));
                    toast.success('链接复制成功');
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Link size={15} />
                  </DropdownMenuShortcut>
                  复制链接
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
                  创建副本
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
                  编辑信息
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setExportAssetContext({ workflowId: item.workflowId, name: item.name, version: item.version });
                    setExportDialogVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <FileUp size={15} />
                  </DropdownMenuShortcut>
                  导出当前版本
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setExportAssetContext({ workflowId: item.workflowId, name: item.name });
                    setExportDialogVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <FolderUp size={15} />
                  </DropdownMenuShortcut>
                  导出全部版本
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
                  删除
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        onItemClick={(item) => {
          open(`/${item.teamId}/workspace/${item.workflowId}`, '_blank');
        }}
        subtitle={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>导入</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => {}}>本地导入</DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      void navigate({
                        to: '/$teamId/application-store',
                      });
                    }}
                  >
                    市场导入
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="solid" onClick={handleCreateWorkflow} loading={isCreating}>
              新建
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
            <AlertDialogTitle>工作流删除确认</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除工作流「{currentWorkflow?.name ?? '未知工作流'}」？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteWorkflow(currentWorkflow?.workflowId)}>
              确认删除
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
