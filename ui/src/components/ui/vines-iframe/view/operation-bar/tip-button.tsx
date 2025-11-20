import React from 'react';

import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { IconButton } from '../common-operation-bar/icon-button';

interface OperationBarTipButtonProps extends React.ComponentPropsWithoutRef<'div'> {
  mode: 'normal' | 'fast' | 'mini';
  type: 'form-view' | 'global-design-board';
  density: 'compact' | 'default';
}

export const OperationBarTipButton: React.FC<OperationBarTipButtonProps> = ({ mode, type, density, ...rest }) => {
  const { t } = useTranslation();

  const isCompact = density === 'compact';

  return (
    <Tooltip>
      <Popover>
        <TooltipTrigger>
          <PopoverTrigger>
            <IconButton mode={mode} isCompact={isCompact} {...rest}>
              <Lightbulb className="stroke-vines-500" size={20} />
            </IconButton>
          </PopoverTrigger>
        </TooltipTrigger>
        <PopoverContent side="left">
          <span>{t(`workspace.${type}.operation-bar.tips`)}</span>
        </PopoverContent>
      </Popover>
      <TooltipContent side="left">{t('common.utils.tips')}</TooltipContent>
    </Tooltip>
  );
};
