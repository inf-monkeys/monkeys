import React from 'react';

import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

export const OperationBarTipButton: React.FC<{
  mode: 'normal' | 'fast' | 'mini';
  type: 'form-view' | 'global-design-board';
  density: 'compact' | 'default';
}> = ({ mode, type, density }) => {
  const { t } = useTranslation();

  const isCompact = density === 'compact';

  return (
    <div
      className={cn(
        'z-10 flex cursor-pointer items-center justify-center gap-global-1/2 rounded-md p-global-1/2 transition-colors hover:bg-accent hover:text-accent-foreground',
        mode === 'mini'
          ? 'mx-global-1/2 mt-global-1/2 size-[calc(var(--global-icon-size)+8px)]'
          : isCompact
            ? 'mx-global-1/2 mt-global size-[calc(var(--operation-bar-width))]'
            : 'mx-global mt-global size-[var(--operation-bar-width)]',
      )}
    >
      <Tooltip>
        <Popover>
          <TooltipTrigger>
            <PopoverTrigger>
              <Lightbulb className="stroke-vines-500" size={20} />
            </PopoverTrigger>
          </TooltipTrigger>
          <PopoverContent side="left">
            <span>{t(`workspace.${type}.operation-bar.tips`)}</span>
          </PopoverContent>
        </Popover>
        <TooltipContent>{t('common.utils.tips')}</TooltipContent>
      </Tooltip>
    </div>
  );
};
