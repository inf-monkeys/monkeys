import React, { useState } from 'react';

import { mutate } from 'swr';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { Copy, Download, FileUp, FolderUp, Import, Link, Pencil, ShieldCheck, Trash, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import { preloadUgcWorkflows, useAssetFilterRuleList, useUgcWorkflows } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { cloneWorkflow, deleteWorkflow, setWorkflowAsBuiltinApp, unsetWorkflowBuiltinApp } from '@/apis/workflow';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { GlobalWorkflowAssociationEditorDialog } from '@/components/layout/ugc-pages/apps/association';
import { CreateAppDialog } from '@/components/layout/ugc-pages/apps/create';
import { useGetUgcViewIconOnlyMode } from '@/components/layout/ugc-pages/util';
import { createWorkflowsColumns } from '@/components/layout/ugc-pages/workflows/consts.tsx';
import { ExportWorkflowDialog } from '@/components/layout/ugc-pages/workflows/export-workflow';
import { IExportWorkflowWithAssetsContext } from '@/components/layout/ugc-pages/workflows/export-workflow/typings.ts';
import { ImportWorkflowDialog } from '@/components/layout/ugc-pages/workflows/import-workflow';
import { PublishToMarket } from '@/components/layout/ugc-pages/workflows/publish-to-market';
import { IPublishToMarketWithAssetsContext } from '@/components/layout/ugc-pages/workflows/publish-to-market/typings.ts';
import { RollbackWorkflow } from '@/components/layout/ugc-pages/workflows/rollback-workflow';
import { IRollbackWorkflowContext } from '@/components/layout/ugc-pages/workflows/rollback-workflow/typings';
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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';
import { useMediaDataStore } from '@/store/useMediaDataStore';
import { getI18nContent } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const Workflows: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { copy } = useCopy({ timeout: 500 });
  const { teamId } = useVinesTeam();
  const { data: systemConfig } = useSystemConfig();
  const mutateWorkflows = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/workflow/metadata'));

  // 获取当前选中的筛选规则
  const { selectedRuleId: storedSelectedRuleId } = useMediaDataStore();
  const { data: assetFilterRules, mutate: mutateAssetFilterRules } = useAssetFilterRuleList('workflow', false);

  // 根据选中的规则ID获取当前文件夹名称
  const currentFolderName =
    storedSelectedRuleId && storedSelectedRuleId !== 'all'
      ? assetFilterRules?.find((rule) => rule.id === storedSelectedRuleId)?.name || ''
      : '';

  const [currentWorkflow, setCurrentWorkflow] = useState<IAssetItem<MonkeyWorkflow>>();
  const [workflowEditorVisible, setWorkflowEditorVisible] = useState(false);
  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [exportAssetContext, setExportAssetContext] = useState<IExportWorkflowWithAssetsContext | undefined>();
  const [publishToMarketVisible, setPublishToMarketVisible] = useState(false);
  const [publishToMarketContext, setPublishToMarketContext] = useState<IPublishToMarketWithAssetsContext | undefined>();
  const [rollbackWorkflowVisible, setRollbackWorkflowVisible] = useState(false);
  const [rollbackWorkflowContext, setRollbackWorkflowContext] = useState<IRollbackWorkflowContext | undefined>();
  const [visionProAlertVisible, setVisionProAlertVisible] = useState(false);
  const [builtinStatus, setBuiltinStatus] = useState<Record<string, boolean>>({});
  // 使用 sessionStorage 存储 tenant token，刷新页面会自动清除，比内存更安全
  const [tenantToken, setTenantToken] = useState(() => {
    try {
      return sessionStorage.getItem('vines-tenant-token') || '';
    } catch {
      return '';
    }
  });
  const [tenantTokenDialogVisible, setTenantTokenDialogVisible] = useState(false);
  const [pendingBuiltinWorkflow, setPendingBuiltinWorkflow] = useState<IAssetItem<MonkeyWorkflow> | undefined>();
  const [builtinCategories, setBuiltinCategories] = useState<string>('');

  // 安全地保存 token 到 sessionStorage
  const saveTenantToken = (token: string) => {
    setTenantToken(token);
    try {
      if (token) {
        sessionStorage.setItem('vines-tenant-token', token);
      } else {
        sessionStorage.removeItem('vines-tenant-token');
      }
    } catch {
      // sessionStorage 可能被禁用，忽略错误
    }
  };

  // 清除 token
  const clearTenantToken = () => {
    setTenantToken('');
    try {
      sessionStorage.removeItem('vines-tenant-token');
    } catch {
      // sessionStorage 可能被禁用，忽略错误
    }
  };

  // 强制清理对话框遮罩层，防止页面卡死
  const forceCleanupDialog = () => {
    requestAnimationFrame(() => {
      // 清理所有设置了 pointer-events 的元素（核心修复：这些元素会阻止页面交互）
      document.querySelectorAll('[style*="pointer-events"]').forEach((element: any) => {
        if (element.getAttribute('data-vines-overlay') !== 'true') {
          element.style.pointerEvents = '';
        }
      });

      // 恢复 body 的样式
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    });
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

  // 使用普通函数而非箭头函数，以便使用 arguments 对象
  async function toggleBuiltinWithToken(workflow: IAssetItem<MonkeyWorkflow>, token: string, categories?: string[]) {
    const workflowId = workflow.workflowId;
    const initialBuiltin = (workflow as any).builtin as boolean | undefined;
    const isBuiltin = typeof builtinStatus[workflowId] === 'boolean' ? builtinStatus[workflowId] : !!initialBuiltin;

    const handleAuthError = (error: any) => {
      // 检测是否是认证错误（401/403）
      const isAuthError =
        error?.message?.includes('Login Required') ||
        error?.message?.includes('403') ||
        error?.message?.includes('401') ||
        error?.response?.status === 401 ||
        error?.response?.status === 403;

      if (isAuthError) {
        // 清除错误的 token
        clearTenantToken();
        // 重新打开对话框让用户输入正确的 token
        setPendingBuiltinWorkflow(workflow);
        setTenantTokenDialogVisible(true);
        return t(
          'ugc-page.workflow.ugc-view.operate-area.options.set-builtin.token-invalid',
          'Token 无效或已过期，请重新输入',
        );
      }
      return isBuiltin
        ? t('ugc-page.workflow.ugc-view.operate-area.options.unset-builtin.error', '取消内置应用失败')
        : t('ugc-page.workflow.ugc-view.operate-area.options.set-builtin.error', '设置内置应用失败');
    };

    // 如果明确传入了 categories 参数（即使是 undefined），说明用户想要设置为内置应用
    // 这种情况下，即使当前已经是内置应用，也应该执行设置操作以更新分类
    const shouldSetAsBuiltin = arguments.length >= 3; // 检查是否传入了第三个参数

    if (!shouldSetAsBuiltin && isBuiltin) {
      // 取消内置
      toast.promise(unsetWorkflowBuiltinApp(workflowId, token), {
        loading: t('ugc-page.workflow.ugc-view.operate-area.options.unset-builtin.loading', '正在取消内置应用...'),
        success: () => {
          setBuiltinStatus((prev) => ({ ...prev, [workflowId]: false }));
          void mutateWorkflows();
          return t('ugc-page.workflow.ugc-view.operate-area.options.unset-builtin.success', '已取消内置应用');
        },
        error: handleAuthError,
      });
    } else {
      // 设置为内置
      toast.promise(setWorkflowAsBuiltinApp(workflowId, token, categories, teamId), {
        loading: t('ugc-page.workflow.ugc-view.operate-area.options.set-builtin.loading', '正在设置为内置应用...'),
        success: (res) => {
          setBuiltinStatus((prev) => ({ ...prev, [workflowId]: true }));
          void mutateWorkflows();
          void mutateAssetFilterRules();
          if ((res as any)?.alreadyBuiltin) {
            return t('ugc-page.workflow.ugc-view.operate-area.options.set-builtin.already', '该工作流已是内置应用');
          }
          return t('ugc-page.workflow.ugc-view.operate-area.options.set-builtin.success', '已设置为内置应用');
        },
        error: handleAuthError,
      });
    }
  }

  const handleToggleBuiltinApp = async (workflow?: IAssetItem<MonkeyWorkflow>) => {
    if (!workflow) {
      toast.warning(t('common.toast.loading'));
      return;
    }

    // 检查当前是否为内置应用
    const workflowId = workflow.workflowId;
    const initialBuiltin = (workflow as any).builtin as boolean | undefined;
    const isBuiltin = typeof builtinStatus[workflowId] === 'boolean' ? builtinStatus[workflowId] : !!initialBuiltin;

    // 如果是要设置为内置应用（而非取消内置应用），总是弹出对话框让用户选择分类
    if (!isBuiltin) {
      setPendingBuiltinWorkflow(workflow);
      // 自动预填充当前文件夹名称作为分类（如果有的话）
      if (currentFolderName) {
        setBuiltinCategories(currentFolderName);
      } else {
        setBuiltinCategories('');
      }
      setTenantTokenDialogVisible(true);
      return;
    }

    // 如果是取消内置应用，检查是否有 token
    if (!tenantToken) {
      setPendingBuiltinWorkflow(workflow);
      setTenantTokenDialogVisible(true);
      return;
    }

    // 取消内置应用，直接执行（不需要选择分类）
    void toggleBuiltinWithToken(workflow, tenantToken);
  };
  const iconOnlyMode = useGetUgcViewIconOnlyMode();
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
                // Prevent event bubbling to parent row's onItemClick
                e.stopPropagation();
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
                  onSelect={() => {
                    const isBuiltin =
                      typeof builtinStatus[item.workflowId] === 'boolean'
                        ? builtinStatus[item.workflowId]
                        : (item as any).builtin;
                    const targetTeamId = isBuiltin && teamId ? teamId : item.teamId;
                    copy(location.origin.concat(`/${targetTeamId}/workspace/${item.workflowId}`));
                  }}
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
                <DropdownMenuItem
                  onSelect={() => {
                    setRollbackWorkflowContext({
                      workflowId: item.workflowId,
                    });
                    setRollbackWorkflowVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Undo2 size={15} />
                  </DropdownMenuShortcut>
                  {t('components.layout.ugc.rollback-dialog.title')}
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
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      void handleToggleBuiltinApp(item);
                    }}
                  >
                    <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                      <ShieldCheck size={15} />
                    </DropdownMenuShortcut>
                    {(
                      typeof builtinStatus[item.workflowId] === 'boolean'
                        ? builtinStatus[item.workflowId]
                        : (item as any).builtin
                    )
                      ? t('ugc-page.workflow.ugc-view.operate-area.options.unset-builtin.label', '取消内置应用')
                      : t('ugc-page.workflow.ugc-view.operate-area.options.set-builtin.label', '设为内置应用')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
                <DropdownMenuItem
                  className="text-red-10"
                  onSelect={() => {
                    setCurrentWorkflow(item);
                    // Delay opening dialog to ensure menu closes completely first
                    requestAnimationFrame(() => {
                      setDeleteAlertDialogVisible(true);
                    });
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
          const workflowName = getI18nContent(item.displayName) ?? '';
          const visionProWorkflows = systemConfig?.theme?.visionProWorkflows ?? [];

          // 检查是否在 Vision Pro 工作流列表中
          if (visionProWorkflows.includes(workflowName)) {
            setVisionProAlertVisible(true);
            return;
          }

          // 默认行为：在新标签页打开工作流
          const isBuiltin =
            typeof builtinStatus[item.workflowId] === 'boolean'
              ? builtinStatus[item.workflowId]
              : (item as any).builtin;
          const targetTeamId = isBuiltin && teamId ? teamId : item.teamId;
          open(`/${targetTeamId}/workspace/${item.workflowId}`, '_blank');
        }}
        subtitle={
          <>
            <GlobalWorkflowAssociationEditorDialog />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="small" icon={<Import />}>
                  {iconOnlyMode ? null : t('common.utils.import')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => {
                      setImportDialogVisible(true);
                    }}
                  >
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
      <ImportWorkflowDialog
        visible={importDialogVisible}
        setVisible={setImportDialogVisible}
        onImportSuccess={() => {
          void mutateWorkflows();
        }}
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
      <RollbackWorkflow
        visible={rollbackWorkflowVisible}
        setVisible={setRollbackWorkflowVisible}
        context={rollbackWorkflowContext}
      />
      <Dialog
        open={tenantTokenDialogVisible}
        onOpenChange={(open) => {
          setTenantTokenDialogVisible(open);
          if (!open) {
            // 对话框关闭时清理状态
            setPendingBuiltinWorkflow(undefined);
            setBuiltinCategories('');
            // 强制清理遮罩层，防止页面卡死
            forceCleanupDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(
                'ugc-page.workflow.ugc-view.operate-area.options.set-builtin.token-title',
                '设置内置应用需要 Tenant Token',
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                'ugc-page.workflow.ugc-view.operate-area.options.set-builtin.token-desc',
                '请输入后端配置的 Tenant Bearer Token。Token 仅存储在浏览器会话中，关闭标签页或刷新页面后会自动清除。',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('ugc-page.workflow.ugc-view.operate-area.options.set-builtin.categories-label', '应用分类（可选）')}
              </label>
              <Input
                placeholder={t(
                  'ugc-page.workflow.ugc-view.operate-area.options.set-builtin.categories-placeholder',
                  '输入分类名称，多个分类用逗号分隔（不填则为"默认"）',
                )}
                value={builtinCategories}
                onChange={(v) => setBuiltinCategories(v)}
              />
              <p className="text-xs text-muted-foreground">
                {currentFolderName
                  ? t(
                      'ugc-page.workflow.ugc-view.operate-area.options.set-builtin.categories-auto-hint',
                      `已自动填充当前分组"${currentFolderName}"，您可以修改`,
                    )
                  : t(
                      'ugc-page.workflow.ugc-view.operate-area.options.set-builtin.categories-hint',
                      '例如：效率工具,AI助手',
                    )}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('ugc-page.workflow.ugc-view.operate-area.options.set-builtin.token-label', 'Tenant Token')}
              </label>
              <Input
                type="password"
                placeholder={t(
                  'ugc-page.workflow.ugc-view.operate-area.options.set-builtin.token-placeholder',
                  '请输入 Tenant Token',
                )}
                value={tenantToken}
                autoComplete="new-password"
                onChange={(v) => saveTenantToken(v)}
              />
            </div>
            {tenantToken && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t(
                    'ugc-page.workflow.ugc-view.operate-area.options.set-builtin.token-saved-hint',
                    'Token 已保存（仅本次会话有效）',
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="small"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    clearTenantToken();
                    toast.success(
                      t('ugc-page.workflow.ugc-view.operate-area.options.set-builtin.token-cleared', 'Token 已清除'),
                    );
                  }}
                >
                  {t('ugc-page.workflow.ugc-view.operate-area.options.set-builtin.clear-token', '清除')}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTenantTokenDialogVisible(false);
                forceCleanupDialog();
              }}
            >
              {t('common.utils.cancel')}
            </Button>
            <Button
              variant="solid"
              onClick={() => {
                if (!tenantToken) {
                  toast.warning(
                    t(
                      'ugc-page.workflow.ugc-view.operate-area.options.set-builtin.token-required',
                      '请先输入 Tenant Token',
                    ),
                  );
                  return;
                }
                const workflow = pendingBuiltinWorkflow;
                const token = tenantToken;
                // 解析分类：去除空格，按逗号分割，过滤空字符串
                const categories = builtinCategories
                  .split(',')
                  .map((cat) => cat.trim())
                  .filter((cat) => cat.length > 0);

                // 添加调试日志
                console.log('====== 设置内置应用调试信息 ======');
                console.log('builtinCategories 原始值:', builtinCategories);
                console.log('解析后的 categories:', categories);
                console.log('传递给 API 的值:', categories.length > 0 ? categories : undefined);
                console.log('================================');

                setTenantTokenDialogVisible(false);
                forceCleanupDialog();
                // 使用 setTimeout 确保对话框关闭后再执行操作
                setTimeout(() => {
                  if (workflow) {
                    void toggleBuiltinWithToken(workflow, token, categories.length > 0 ? categories : undefined);
                  }
                }, 0);
              }}
            >
              {t('common.utils.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={visionProAlertVisible} onOpenChange={setVisionProAlertVisible}>
        <AlertDialogContent
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.utils.tips')}</AlertDialogTitle>
            <AlertDialogDescription>请在 Vision Pro 中打开使用</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setVisionProAlertVisible(false)}>
              {t('common.utils.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/workflows/')({
  component: Workflows,
});
