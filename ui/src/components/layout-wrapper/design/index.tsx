import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { get, isString } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { DesignProjectInfoCard } from '@/components/layout-wrapper/design/header/design-project-info-card.tsx';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { cn } from '@/utils';

export const DesignLayout: React.FC = () => {
  const { data: oem } = useSystemConfig();

  const background = get(oem, 'theme.background', undefined) as ISystemConfig['theme']['background'];

  const isBackgroundUrl = isString(background) && background.startsWith('http');

  return (
    <main
      className={cn('flex size-full flex-col gap-global p-global')}
      style={
        background
          ? { background: isBackgroundUrl ? `url(${background}) no-repeat center center / cover` : background }
          : {}
      }
    >
      <SpaceHeader>
        <DesignProjectInfoCard />
      </SpaceHeader>
      <VinesSpace>
        <Outlet />
      </VinesSpace>
    </main>
  );
};
