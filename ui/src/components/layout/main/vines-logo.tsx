import React from 'react';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { AppLogo, ILogoProps } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { cn } from '@/utils';

export const VinesLogo: React.FC<Omit<ILogoProps, 'url'> & { disableInitialHeight?: boolean }> = ({
  description = '构建流程为中心的 AI 应用',
  className,
  height = 40,
  onClick,
  disableInitialHeight = false,
  ...props
}) => {
  const { team } = useVinesTeam();
  const enabledCustomIcon = get(team, 'customTheme.enableTeamLogo', false);

  const initialHeight = description ? height + 32 : height;

  const { data: oem, isLoading: isOemLoading } = useSystemConfig();

  return (
    <SmoothTransition initialHeight={initialHeight} onClick={onClick}>
      {team && !isOemLoading ? (
        <AppLogo
          className={cn('w-auto', className)}
          url={
            !oem || oem.theme.logoUrl.endsWith('vines.svg')
              ? enabledCustomIcon
                ? team?.logoUrl
                : void 0
              : enabledCustomIcon
                ? team?.logoUrl
                : oem.theme.logoUrl
          }
          description={description}
          height={disableInitialHeight ? void 0 : height}
          {...props}
        />
      ) : (
        <Skeleton className={cn('w-full', enabledCustomIcon && 'h-8')} style={{ height: initialHeight }} />
      )}
    </SmoothTransition>
  );
};
