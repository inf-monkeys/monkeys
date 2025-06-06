import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { AppLogo, ILogoProps } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';

export const VinesLogo: React.FC<Omit<ILogoProps, 'url'> & { disableInitialHeight?: boolean }> = ({
  className,
  height = 40,
  onClick,
  disableInitialHeight = false,
  ...props
}) => {
  const { data: oem, isLoading: isOemLoading } = useSystemConfig();

  const { team } = useVinesTeam();
  const darkMode = useAppStore((s) => s.darkMode);

  const enabledCustomIcon = get(team, 'customTheme.enableTeamLogo', false);
  const logoUrl = get(oem, `theme.logo.${darkMode ? 'dark' : 'light'}`, '');
  //TODO 没有响应系统主题的变化
  const [mode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const isDarkMode = mode === 'dark' || (mode === 'auto' && darkModeMediaQuery.matches);

  return (
    <SmoothTransition className="relative" initialHeight={height} onClick={onClick}>
      <AnimatePresence>
        {!isOemLoading ? (
          <motion.div
            key="vines-app-logo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.15 } }}
            exit={{ opacity: 0 }}
          >
            <AppLogo
              className={cn('w-auto', className)}
              url={enabledCustomIcon ? (isDarkMode ? team?.darkmodeIconUrl : team?.iconUrl) : logoUrl}
              height={disableInitialHeight ? void 0 : height}
              {...props}
            />
          </motion.div>
        ) : (
          <motion.div
            key="vines-app-logo-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.15 } }}
            className="absolute left-0 top-0"
          >
            <Skeleton className={cn('w-full', enabledCustomIcon && 'h-8')} style={{ height }} />
          </motion.div>
        )}
      </AnimatePresence>
    </SmoothTransition>
  );
};
