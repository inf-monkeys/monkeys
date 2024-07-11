import React from 'react';

import { useSWRConfig } from 'swr';
import { Link, useParams } from '@tanstack/react-router';

import { PinOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { toggleWorkspacePagePin } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';

interface IWorkbenchViewHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  page?: Partial<IPinPage>;
}

export const WorkbenchViewHeader: React.FC<IWorkbenchViewHeaderProps> = ({ page }) => {
  const { t } = useTranslation();

  const { teamId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });

  const { mutate } = useSWRConfig();
  const workflow = page?.workflow;

  const handleUnPin = () => {
    if (!page?.id) return;
    toast.promise(toggleWorkspacePagePin(page.id, false), {
      loading: t('common.operate.loading'),
      success: () => {
        void mutate('/api/pages');
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
    });
  };

  const workflowDesc = getI18nContent(workflow?.description) ? ` - ${getI18nContent(workflow?.description)}` : '';
  const displayName = page?.displayName ?? '';
  const viewIcon = page?.instance?.icon ?? '';

  return (
    <header className="z-50 flex w-full flex-col justify-center  px-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <VinesIcon size="sm">{workflow?.iconUrl}</VinesIcon>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-sm font-bold leading-tight">
              {getI18nContent(workflow?.displayName) ?? t('common.utils.untitled')}
            </h1>
            <span className="text-xxs">
              {`${viewIcon} ${t([`workspace.wrapper.space.tabs.${displayName}`, displayName]) + workflowDesc}`}
            </span>
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
            to="/$teamId/workspace/$workflowId/$pageId"
            params={{ teamId, workflowId: workflow?.workflowId ?? '', pageId: page?.id ?? '' }}
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
