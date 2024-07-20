import React, { forwardRef } from 'react';

import { useCreation } from 'ahooks';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils';
import { clampPercentage } from '@/utils/number.ts';
import { useIsMounted } from '@/utils/use-is-mounted.ts';

interface IVinesLoadingProps {
  strokeWidth?: number;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  value?: number;
  maxValue?: number;
  minValue?: number;
  className?: string;
}

const CENTER = 16;

export const VinesLoading = forwardRef<Omit<HTMLDivElement, 'value'>, IVinesLoadingProps>(
  ({ strokeWidth = 3, value, minValue = 0, maxValue = 100, className, color }, ref) => {
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
        animate={{ opacity: 1, transition: { delay: 0.3 } }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        aria-label={t('common.load.loading')}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="relative z-0 size-12 animate-spinner-ease-spin overflow-hidden"
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
  motionKey: React.Key | null | undefined;
}

export const VinesFullLoading: React.FC<ILoadingProps> = ({ motionKey }) => {
  return (
    <div className="vines-center absolute size-full">
      <VinesLoading key={motionKey} />
    </div>
  );
};
