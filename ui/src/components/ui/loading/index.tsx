import React, { forwardRef } from 'react';

import { useCreation } from 'ahooks';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '@/components/ui/card.tsx';
import { useIsMounted } from '@/hooks/use-is-mounted.ts';
import { cn } from '@/utils';
import { clampPercentage } from '@/utils/number.ts';

interface IVinesLoadingProps {
  strokeWidth?: number;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  value?: number;
  maxValue?: number;
  minValue?: number;
  className?: string;
  immediately?: boolean;
}

const CENTER = 16;

export const VinesLoading = forwardRef<Omit<HTMLDivElement, 'value'>, IVinesLoadingProps>(
  ({ strokeWidth = 3, value, minValue = 0, maxValue = 100, className, color, immediately }, ref) => {
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
        transition={{ duration: 0.2 }}
        aria-label={t('common.load.loading')}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="animate-spinner-ease-spin relative z-0 size-12 overflow-hidden"
          strokeWidth={strokeWidth}
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
}

export const VinesFullLoading: React.FC<ILoadingProps> = ({ motionKey, className, immediately, tips }) => {
  return (
    <motion.div
      key={motionKey}
      className={cn('vines-center absolute z-50 size-full', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: immediately ? 0 : 0.3 } }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="shadow-md">
        <CardContent className="vines-center flex-col gap-2 p-4">
          <VinesLoading immediately />
          {tips && <span className="text-sm font-bold">{tips}</span>}
        </CardContent>
      </Card>
    </motion.div>
  );
};
