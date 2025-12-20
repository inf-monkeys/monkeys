import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { IUgcCustomProps } from '@/components/layout/ugc/typings.ts';
import { IUgcViewFilterListProps, UgcViewFilterList } from '@/components/layout/ugc/view/filter/list';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IUgcSidebarProps extends IUgcCustomProps {
  title: string;
  filterListProps: Omit<IUgcViewFilterListProps, keyof IUgcCustomProps>;
  defaultVisible?: boolean;
}

export const UgcSidebar: React.FC<IUgcSidebarProps> = ({ assetType, assetKey, isMarket, title, filterListProps, defaultVisible = true }) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(defaultVisible);

  const { data: oem } = useSystemConfig();
  const titleStyle =
    oem?.theme.id === 'haier'
      ? {
          fontSize: '14px',
          fontWeight: 900,
          lineHeight: '18px',
        }
      : undefined;

  return (
    <div className="flex h-full max-w-64">
      <motion.div
        className="flex flex-col gap-global overflow-hidden [&_h1]:line-clamp-1 [&_span]:line-clamp-1"
        initial={{ width: defaultVisible ? 256 : 0, paddingRight: defaultVisible ? 16 : 0 }}
        animate={{
          width: visible ? 256 : 0,
          paddingRight: visible ? 16 : 0,
        }}
      >
        <div className="flex items-center gap-2 pl-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button icon={<ChevronLeft />} variant="outline" onClick={() => setVisible(false)} />
            </TooltipTrigger>
            <TooltipContent>{t('common.sidebar.hide')}</TooltipContent>
          </Tooltip>
          <h1 style={titleStyle} className="text-base font-bold">
            {title}
          </h1>
        </div>
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
          <TooltipContent>{visible ? t('common.sidebar.hide') : t('common.sidebar.show')}</TooltipContent>
        </Tooltip>
      </Separator>
    </div>
  );
};
