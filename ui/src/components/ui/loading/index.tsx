import React, { forwardRef } from 'react';

import { useCreation } from 'ahooks';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '@/components/ui/card.tsx';
import { useIsMounted } from '@/hooks/use-is-mounted.ts';
import { cn } from '@/utils';
import { clampPercentage } from '@/utils/number.ts';

export interface IVinesLoadingProps {
  strokeWidth?: number;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  value?: number;
  maxValue?: number;
  minValue?: number;
  className?: string;
  immediately?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CENTER = 16;

export const VinesLoading = forwardRef<Omit<HTMLDivElement, 'value'>, IVinesLoadingProps>(
  ({ strokeWidth = 3, value, minValue = 0, maxValue = 100, className, color, immediately, size = 'lg' }, ref) => {
    const { t } = useTranslation();

    const [, isMounted] = useIsMounted({
      rerender: true,
      delay: 100,
    });

    const radius = 16 - strokeWidth;
    const circumference = 2 * radius * Math.PI;

    const percentage = useCreation(() => {
      if (!isMounted) {
        return 0;
      }

      return value ? clampPercentage((value - minValue) / (maxValue - minValue), 1) : 0.25;
    }, [value, maxValue, minValue, isMounted]);

    const offset = circumference - percentage * circumference;

    const strokeColor = useCreation(() => {
      switch (color) {
        case 'secondary':
          return 'stroke-violet-10';
        case 'success':
          return 'stroke-green-10';
        case 'warning':
          return 'stroke-yellow-10';
        case 'danger':
          return 'stroke-red-10';
        default:
          return 'stroke-vines-500';
      }
    }, [color]);

    return (
      <motion.div
        ref={ref}
        className={cn('relative block', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: immediately ? 0 : 0.3 } }}
        exit={{ opacity: 0 }}
        aria-label={t('common.load.loading')}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={cn(
            'relative z-0 animate-spinner-ease-spin overflow-hidden',
            size === 'md' && 'size-8',
            size === 'sm' && 'size-6',
            size === 'lg' && 'size-12',
          )}
          strokeWidth={strokeWidth}
          preserveAspectRatio="xMidYMid meet"
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={radius}
            role="presentation"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={0}
            transform="rotate(-90 16 16)"
            strokeLinecap="round"
            className="h-full stroke-gray-10/50"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={radius}
            role="presentation"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(-90 16 16)"
            strokeLinecap="round"
            className={cn('h-full transition-all !duration-500', strokeColor)}
          />
        </svg>
      </motion.div>
    );
  },
);

VinesLoading.displayName = 'VinesLoading';

interface ILoadingProps {
  className?: string;
  motionKey?: React.Key | null;
  immediately?: boolean;
  tips?: string;
  disableCard?: boolean;
}

export const VinesFullLoading: React.FC<ILoadingProps> = ({ motionKey, disableCard, className, immediately, tips }) => {
  return (
    <motion.div
      key={motionKey}
      className={cn('vines-center absolute z-50 size-full', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: immediately ? 0 : 0.3 } }}
      exit={{ opacity: 0 }}
    >
      {disableCard ? (
        <VinesLoading immediately />
      ) : (
        <Card className="shadow-md">
          <CardContent className="vines-center flex-col gap-2 p-4">
            <VinesLoading immediately />
            {tips && <span className="text-sm font-bold">{tips}</span>}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};
