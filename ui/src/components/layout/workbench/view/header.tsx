import React from 'react';

import { useSWRConfig } from 'swr';
import { Link } from '@tanstack/react-router';

import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { toggleWorkspacePagePin } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';

interface IWorkbenchViewHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  page?: Partial<IPinPage>;
}

export const WorkbenchViewHeader: React.FC<IWorkbenchViewHeaderProps> = ({ page }) => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const workflow = page?.workflow;

  const handleUnPin = () => {
    if (!page?.id) return;
    toast.promise(toggleWorkspacePagePin(page.id, false), {
      loading: `正在取消标星中...`,
      success: () => {
        void mutate('/api/pages');
        return `取消标星成功`;
      },
      error: `取消标星失败`,
    });
  };

  return (
    <header className="z-50 flex w-full items-center justify-between px-4 pb-4">
      <div className="flex gap-2">
        <VinesIcon size="sm">{workflow?.iconUrl}</VinesIcon>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-bold leading-tight">{page?.displayName}</h1>
          <span className="text-xxs">{workflow?.displayName ?? '未命名应用'}</span>
        </div>
      </div>
      <div className="flex gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              icon={
                <Star className="[&_polygon]:fill-yellow-9 [&_polygon]:stroke-yellow-9" strokeWidth={1.5} size={16} />
              }
              variant="outline"
              onClick={handleUnPin}
            />
          </TooltipTrigger>
          <TooltipContent>{t('workbench.view.header.delete')}</TooltipContent>
        </Tooltip>
        <Link
          to="/$teamId/workspace/$workflowId/$pageId"
          params={{ workflowId: workflow?.workflowId, pageId: page?.id }}
        >
          <Button variant="outline">{t('workbench.view.header.enter')}</Button>
        </Link>
      </div>
    </header>
  );
};
