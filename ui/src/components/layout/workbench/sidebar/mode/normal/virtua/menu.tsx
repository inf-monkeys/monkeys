import React from 'react';

import { useSWRConfig } from 'swr';
import { Link } from '@tanstack/react-router';

import { useMemoizedFn } from 'ahooks';
import { EllipsisIcon, LogIn, PinOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useUpdateGroupPages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { IWorkbenchViewItemPage } from '@/components/layout/workbench/sidebar/mode/normal/virtua/item.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface IViewItemMenuProps extends React.ComponentPropsWithoutRef<'div'> {
  page: IWorkbenchViewItemPage;
  groupId?: string;
}

export const ViewItemMenu: React.FC<IViewItemMenuProps> = ({ page, groupId }) => {
  const { t } = useTranslation();

  const { teamId } = useVinesTeam();

  const { mutate } = useSWRConfig();

  const { trigger } = useUpdateGroupPages(groupId);

  const [, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  const handleClickMoreMenu = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
  });

  const handleUnPin = () => {
    if (!page?.id) return;
    toast.promise(
      trigger({
        pageId: page.id,
        mode: 'remove',
      }),
      {
        loading: t('workspace.wrapper.space.menu.group.update.loading'),
        success: () => {
          void mutate('/api/workflow/pages/pinned').then((it) => {
            setCurrentPage((prev) => ({ ...prev, [teamId]: it?.pages?.[0] ?? {} }));
          });

          return t('workspace.wrapper.space.menu.group.update.success');
        },
        error: t('workspace.wrapper.space.menu.group.update.error'),
      },
    );
  };

  let type = 'workflow';
  if (page.type.startsWith('agent')) type = 'agent';
  if (page.type === 'design-board') type = 'design-board';

  let linkTo = '/$teamId/workspace/$workflowId/$pageId';
  let linkParams = {
    teamId,
    workflowId: page?.workflowId,
    pageId: page?.id,
  } as any;
  let linkSearch = {} as any;

  if (type === 'agent') {
    linkTo = '/$teamId/agent/$agentId';
    linkParams = {
      teamId,
      agentId: page?.agent?.id,
    };
    linkSearch = { tab: page?.instance?.type };
  }

  if (type === 'design-board') {
    linkTo = '/$teamId/design/$designProjectId/$designBoardId';
    linkParams = {
      teamId,
      designProjectId: page?.designProject?.id,
      designBoardId: page?.designMetadataId,
    };
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              icon={<EllipsisIcon />}
              className="pointer-events-none absolute right-2 !p-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 [&>div>svg]:size-3"
              onClick={handleClickMoreMenu}
            />
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <TooltipContent side="right">{t('workspace.flow-view.tooltip.more.tip')}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="right" align="start" sideOffset={12}>
        <Link to={linkTo} params={linkParams} search={linkSearch}>
          <DropdownMenuItem className="flex items-center gap-2">
            <LogIn strokeWidth={1.5} size={16} />
            <p>{t('workbench.view.header.enter')}</p>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 text-red-10" onClick={handleUnPin}>
          <PinOff strokeWidth={1.5} size={16} />
          <p>{t('workbench.view.header.delete')}</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
