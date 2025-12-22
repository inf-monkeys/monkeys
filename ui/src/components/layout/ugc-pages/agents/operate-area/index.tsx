import React, { useState } from 'react';

import { mutate } from 'swr';

import { Pencil, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { agentApi } from '@/features/agent/api/agent-api';
import type { Agent } from '@/features/agent/types/agent.types';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { AgentInfoEditor } from '@/components/layout/ugc-pages/agents/operate-area/agent-info-editor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { getI18nContent } from '@/utils';

interface IOperateAreaProps {
  item: IAssetItem<Agent>;
  trigger: React.ReactNode;
  tooltipTriggerContent?: string;
}

export const OperateArea: React.FC<IOperateAreaProps> = ({ item, trigger, tooltipTriggerContent }) => {
  const { t } = useTranslation();

  const handleDelete = () => {
    toast.promise(agentApi.deleteAgent(item.id, item.teamId!), {
      loading: t('common.delete.loading'),
      success: () => {
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/agents'));
        return t('common.delete.success');
      },
      error: t('common.delete.error'),
    });
  };

  const [agentInfoEditorVisible, setAgentInfoEditorVisible] = useState(false);

  return (
    <>
      <AlertDialog>
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
            <DropdownMenuLabel>{t('ugc-page.agents.ugc-view.operate-area.dropdown-label')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => setAgentInfoEditorVisible(true)}>
                <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                  <Pencil size={15} />
                </DropdownMenuShortcut>
                {t('ugc-page.agents.ugc-view.operate-area.options.edit-info')}
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-red-10">
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Trash size={15} />
                  </DropdownMenuShortcut>
                  {t('common.utils.delete')}
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.dialog.delete-confirm.title', { type: t('common.type.agent') })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.dialog.delete-confirm.content', {
                type: t('common.type.agent'),
                name: getI18nContent(item.name),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('common.utils.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AgentInfoEditor
        agent={item}
        visible={agentInfoEditorVisible}
        setVisible={setAgentInfoEditorVisible}
      />
    </>
  );
};
