import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IUgcCustomProps } from '@/components/layout/ugc/typings.ts';
import { IUgcViewFilterListProps, UgcViewFilterList } from '@/components/layout/ugc/view/filter/list';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IUgcSidebarProps extends IUgcCustomProps {
  title: string;
  filterListProps: Omit<IUgcViewFilterListProps, keyof IUgcCustomProps>;
}

export const UgcSidebar: React.FC<IUgcSidebarProps> = ({ assetType, assetKey, isMarket, title, filterListProps }) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(true);

  return (
    <div className="flex h-full max-w-64">
      <motion.div
        className="flex flex-col gap-4 overflow-hidden [&_h1]:line-clamp-1 [&_span]:line-clamp-1"
        initial={{ width: 256, paddingRight: 16 }}
        animate={{
          width: visible ? 256 : 0,
          paddingRight: visible ? 16 : 0,
          transition: { duration: 0.2 },
        }}
      >
        <h1 className="text-2xl font-bold">{title}</h1>
        <UgcViewFilterList assetType={assetType} assetKey={assetKey} isMarket={isMarket} {...filterListProps} />
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
          <TooltipContent>{visible ? t('common.side-bar.hide') : t('common.side-bar.show')}</TooltipContent>
        </Tooltip>
      </Separator>
    </div>
  );
};
