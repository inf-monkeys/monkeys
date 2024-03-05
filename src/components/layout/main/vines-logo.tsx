import React from 'react';

import { get } from 'lodash';

import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { AppLogo, ILogoProps } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { cn } from '@/utils';

export const VinesLogo: React.FC<Omit<ILogoProps, 'url'>> = ({
  description = '构建流程为中心的 AI 应用',
  className,
  height = 40,
  ...props
}) => {
  const { team } = useVinesTeam();
  const enabledCustomIcon = get(team, 'customTheme.enableTeamLogo', false);

  const initialHeight = description ? height + 32 : height;

  return (
    <SmoothTransition initialHeight={initialHeight}>
      {team ? (
        <AppLogo
          className={cn('w-auto', className)}
          url={enabledCustomIcon ? team?.logoUrl : void 0}
          description={description}
          height={height}
          {...props}
        />
      ) : (
        <Skeleton className={cn('w-full', enabledCustomIcon && 'h-8')} style={{ height: initialHeight }} />
      )}
    </SmoothTransition>
  );
};
