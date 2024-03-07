import React from 'react';

import { Link } from '@tanstack/react-router';

import { Star } from 'lucide-react';

import { IPinPage } from '@/apis/pages/typings.ts';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useLocalStorage } from '@/utils';

interface IWorkbenchViewHeaderProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchViewHeader: React.FC<IWorkbenchViewHeaderProps> = () => {
  const [currentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  const workflow = currentPage?.workflow;

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between px-4 pb-4">
      <div className="flex gap-2">
        <VinesIcon size="sm">{workflow?.iconUrl}</VinesIcon>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-bold leading-tight">{currentPage?.displayName}</h1>
          <span className="text-xxs">{workflow?.name ?? '未命名应用'}</span>
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
            />
          </TooltipTrigger>
          <TooltipContent>取消标星</TooltipContent>
        </Tooltip>
        <Link
          to="/$teamId/workspace/$workflowId/$pageId"
          params={{ workflowId: workflow?.workflowId, pageId: currentPage?._id }}
        >
          <Button variant="outline">进入视图</Button>
        </Link>
      </div>
    </header>
  );
};
