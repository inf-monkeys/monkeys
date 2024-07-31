import React from 'react';

import { useSWRConfig } from 'swr';
import { Link, useParams } from '@tanstack/react-router';

import { PinOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useUpdateGroupPages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { EMOJI2LUCIDE_MAPPER } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/tab.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getI18nContent } from '@/utils';

interface IWorkbenchViewHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  page?: Partial<IPinPage>;
  groupId: string;
}

export const WorkbenchViewHeader: React.FC<IWorkbenchViewHeaderProps> = ({ page, groupId }) => {
  const { t } = useTranslation();

  const { teamId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });

  const { mutate } = useSWRConfig();
  const info = page?.workflow || page?.agent;

  const { trigger } = useUpdateGroupPages(groupId);

  const [, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

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
            setCurrentPage(it.pages?.[0] ?? {});
          });

          return t('workspace.wrapper.space.menu.group.update.success');
        },
        error: t('workspace.wrapper.space.menu.group.update.error'),
      },
    );
  };

  const workflowDesc = getI18nContent(info?.description) ? ` - ${getI18nContent(info?.description)}` : '';
  const displayName = page?.displayName ?? '';
  const viewIcon = page?.instance?.icon ?? '';

  const isWorkflowPage = !!page?.workflowId;

  return (
    <header className="z-50 flex w-full flex-col justify-center  px-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <VinesIcon size="sm">{info?.iconUrl}</VinesIcon>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-sm font-bold leading-tight">
              {getI18nContent(info?.displayName) ?? t('common.utils.untitled')}
            </h1>
            <div className="flex items-center gap-0.5">
              <VinesLucideIcon className="size-3" size={12} src={EMOJI2LUCIDE_MAPPER[viewIcon] ?? viewIcon} />
              <span className="text-xxs">
                {t([`workspace.wrapper.space.tabs.${displayName}`, displayName]) + workflowDesc}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button icon={<PinOff size={12} />} variant="outline" onClick={handleUnPin} size="small" />
            </TooltipTrigger>
            <TooltipContent>{t('workbench.view.header.delete')}</TooltipContent>
          </Tooltip>
          <Link
            to={isWorkflowPage ? '/$teamId/workspace/$workflowId/$pageId' : '/$teamId/agent/$agentId'}
            params={{
              teamId,
              ...(isWorkflowPage ? { workflowId: page?.workflowId, pageId: page?.id } : { agentId: page?.agent?.id }),
            }}
            search={isWorkflowPage ? {} : { tab: page?.instance?.type }}
          >
            <Button variant="outline" size="small">
              {t('workbench.view.header.enter')}
            </Button>
          </Link>
        </div>
      </div>
      <Separator className="my-4" />
    </header>
  );
};
