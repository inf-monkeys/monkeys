import React, { forwardRef } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { cn } from '@/utils';

const opacityVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export interface CommonOperationBarItemProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'id'> {
  id: string | number;
  mode: 'normal' | 'fast' | 'mini';
  iconUrl?: string | null;
  tooltipContent?: React.ReactNode;
  tooltipSide?: React.ComponentProps<typeof TooltipContent>['side'];
  renderIcon?: () => React.ReactNode;
  expanded?: boolean;
}

export const CommonOperationBarItem = forwardRef<HTMLDivElement, CommonOperationBarItemProps>(
  (
    {
      id,
      mode,
      iconUrl,
      tooltipContent,
      tooltipSide = 'left',
      renderIcon,
      className,
      children,
      expanded = false,
      onClick,
      ...rest
    },
    ref,
  ) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const { t } = useTranslation();

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const content =
      renderIcon?.() ??
      children ??
      (typeof iconUrl === 'string' ? (
        <VinesLucideIcon
          className={cn('shrink-0', mode === 'mini' ? 'size-icon-sm' : 'size-icon')}
          size={20}
          src={iconUrl}
        />
      ) : (
        React.createElement(Folder, {
          className: cn('shrink-0', mode === 'mini' ? 'size-icon-sm' : 'size-icon'),
          size: 20,
        })
      ));

    const composedRef = (node: HTMLDivElement | null) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
      setNodeRef(node);
    };

    const heightCalcVal = mode === 'mini' ? 'calc(var(--global-icon-size)+8px)' : 'var(--operation-bar-width)';

    const trigger = (
      <div
        ref={composedRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onClick}
        className={cn(
          'z-10 flex flex-shrink-0 cursor-pointer items-center justify-center gap-global-1/2 rounded-md p-global-1/2 transition-colors hover:bg-accent hover:text-accent-foreground',
          `size-[${heightCalcVal}]`,
          isDragging && 'opacity-50',
          className,
        )}
        {...rest}
      >
        {content}
      </div>
    );

    if (!tooltipContent) {
      return trigger;
    }

    return expanded ? (
      <div className="w-full px-global-1/2">
        <div
          className={cn(
            'flex cursor-pointer items-center gap-global-1/2 rounded-md pl-global-1/2 hover:bg-accent',
            `h-[${heightCalcVal}]`,
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className="line-clamp-2 min-w-0 flex-1 whitespace-normal break-words text-[0.8rem] font-bold"
                onClick={onClick}
                variants={opacityVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{
                  visible: { delay: 0.175, duration: 0.2 },
                  hidden: { duration: 0.05 },
                }}
              >
                {tooltipContent ?? t('common.utils.untitled')}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>{tooltipContent ?? t('common.utils.untitled')}</TooltipContent>
          </Tooltip>
          {trigger}
        </div>
      </div>
    ) : (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side={tooltipSide}>{tooltipContent}</TooltipContent>
      </Tooltip>
    );
  },
);

CommonOperationBarItem.displayName = 'CommonOperationBarItem';
