import React, { useEffect, useState } from 'react';

import { Link } from '@tanstack/react-router';

import { motion } from 'framer-motion';
import { ChevronRight, Plus } from 'lucide-react';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { cn, useLocalStorage } from '@/utils';

interface IWorkbenchSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchSidebar: React.FC<IWorkbenchSidebarProps> = () => {
  const { data } = useWorkspacePages();
  const [visible, setVisible] = useState(true);

  const [currentPage, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', data?.[0] ?? {});

  useEffect(() => {
    if (!currentPage?._id) {
      if (data?.length) {
        setCurrentPage(data[0]);
      }
    } else if (!data?.find((page) => page._id === currentPage._id)) {
      setCurrentPage({});
    }
  }, [currentPage, data]);

  return (
    <div className="flex h-full max-w-64">
      <motion.div
        className="flex flex-col gap-4 overflow-clip [&_h1]:line-clamp-1 [&_span]:line-clamp-1"
        initial={{ width: 256, paddingRight: 16 }}
        animate={{
          width: visible ? 256 : 0,
          paddingRight: visible ? 16 : 0,
          transition: { duration: 0.2 },
        }}
      >
        <h1 className="text-2xl font-bold">工作台</h1>
        <div className="grid gap-2">
          {data?.map((page) => (
            <div
              key={page._id}
              className={cn(
                'flex cursor-pointer items-start space-x-2 rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground',
                currentPage?._id === page._id && 'pointer-events-none bg-accent text-accent-foreground',
              )}
              onClick={() => setCurrentPage(page)}
            >
              <VinesIcon size="sm">{page.workflow?.iconUrl}</VinesIcon>
              <div className="flex flex-col gap-0.5">
                <h1 className="font-bold leading-tight">{page.displayName}</h1>
                <span className="text-xxs">{page.workflow?.name ?? '未命名应用'}</span>
              </div>
            </div>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/$teamId/workflows">
                <Button icon={<Plus />} className="w-full" variant="outline" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>标星视图</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
      <Separator orientation="vertical" className="vines-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="group z-10 flex h-4 w-3.5 cursor-pointer items-center justify-center rounded-sm border bg-border px-0.5 transition-opacity hover:opacity-75 active:opacity-95"
              onClick={() => setVisible(!visible)}
            >
              <ChevronRight className={cn(visible && 'scale-x-[-1]')} />
            </div>
          </TooltipTrigger>
          <TooltipContent>{visible ? '收起' : '展开'}</TooltipContent>
        </Tooltip>
      </Separator>
    </div>
  );
};
