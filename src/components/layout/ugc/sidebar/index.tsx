import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IUgcSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  title: string;
}

export const UgcSidebar: React.FC<IUgcSidebarProps> = ({ title }) => {
  const [visible, setVisible] = useState(true);
  //
  // useEffect(() => {
  //   if (!currentPage?.id) {
  //     if (data?.length) {
  //       setCurrentPage(data[0]);
  //     }
  //   } else if (!data?.find((page) => page.id === currentPage.id)) {
  //     setCurrentPage({});
  //   }
  // }, [currentPage, data]);

  const [current, setCurrent] = useState(true);

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
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="grid gap-2">
          <div
            className={cn(
              'flex cursor-pointer items-start space-x-2 rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground',
              current && 'bg-accent text-accent-foreground',
            )}
            // onClick={() => setCurrentPage(page)}
          >
            <div className="flex flex-col gap-0.5 px-2 py-1">
              <span className="text-xs">全部</span>
            </div>
          </div>
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
