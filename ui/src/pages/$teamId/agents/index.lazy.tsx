import React, { useState } from 'react';

import { mutate } from 'swr';
import { createLazyFileRoute } from '@tanstack/react-router';

import { Link, Pencil, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteAgent } from '@/apis/agents';
import { IAgent } from '@/apis/agents/typings.ts';
import { preloadUgcAgents, useUgcAgents } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { AgentInfoEditor } from '@/components/layout/agent-space/agent-info-editor.tsx';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createAgentsColumns } from '@/components/layout/ugc-pages/agents/consts.tsx';
import { CreateAppDialog } from '@/components/layout/ugc-pages/apps/create';
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
import { getI18nContent } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ConversationApps: React.FC = () => {
  const { t: tHook } = useTranslation();

  const { copy } = useCopy({ timeout: 500 });

  const mutateAgents = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/conversation-app'));

  const [currentAgent, setCurrentAgent] = useState<IAssetItem<IAgent>>();

  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);
  const [infoEditorDialogVisible, setInfoEditorDialogVisible] = useState(false);

  const handleAfterUpdate = () => {
    void mutateAgents();
  };

  const handleDeleteAgent = (agentId?: string) => {
    if (!agentId) {
      toast.warning(tHook('common.toast.loading'));
      return;
    }

    toast.promise(deleteAgent(agentId), {
      loading: tHook('common.delete.loading'),
      success: () => {
        void mutateAgents();
        return tHook('common.delete.success');
      },
      error: tHook('common.delete.error'),
    });
  };

  return (
    <main className="size-full">
      <UgcView
        assetKey="agent"
        assetType="conversation-app"
        assetIdKey="agent"
        assetName={tHook('components.layout.main.sidebar.list.apps.agents.label')}
        useUgcFetcher={useUgcAgents}
        preloadUgcFetcher={preloadUgcAgents}
        createColumns={createAgentsColumns}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? tHook('common.utils.unknown')} ${
                item.createdTimestamp &&
                tHook('common.utils.created-at', {
                  time: formatTimeDiffPrevious(item.createdTimestamp),
                })
              }`}
            </span>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
        }}
        onItemClick={(item) => open(`/${item.teamId}/agent/${item.id}`, '_blank')}
        subtitle={
          <>
            <CreateAppDialog defaultSelect="agent" />
          </>
        }
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
              <DropdownMenuLabel>{tHook('ugc-page.agent.ugc-view.operate-area.dropdown-label')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => copy(location.origin.concat(`/${item.teamId}/agent/${item.id}`))}>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Link size={15} />
                  </DropdownMenuShortcut>
                  {tHook('ugc-page.agent.ugc-view.operate-area.options.copy-link')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setCurrentAgent(item);
                    setInfoEditorDialogVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Pencil size={15} />
                  </DropdownMenuShortcut>
                  {tHook('ugc-page.agent.ugc-view.operate-area.options.edit-info')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-10"
                  onSelect={() => {
                    setCurrentAgent(item);
                    setDeleteAlertDialogVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Trash size={15} />
                  </DropdownMenuShortcut>
                  {tHook('common.utils.delete')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
      <AgentInfoEditor
        visible={infoEditorDialogVisible}
        setVisible={setInfoEditorDialogVisible}
        agent={currentAgent}
        afterUpdate={handleAfterUpdate}
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
              {tHook('common.dialog.delete-confirm.title', {
                type: tHook('common.type.agent'),
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tHook('common.dialog.delete-confirm.content', {
                type: tHook('common.type.agent'),
                name: currentAgent?.displayName
                  ? getI18nContent(currentAgent.displayName)
                  : tHook('common.utils.unknown'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tHook('common.utils.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteAgent(currentAgent?.id)}>
              {tHook('common.utils.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/agents/')({
  component: ConversationApps,
});
