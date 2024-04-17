import React, { LazyExoticComponent } from 'react';

import { ILagRadarProps } from '@/components/devtools/lag-radar';

export const LagRadar: LazyExoticComponent<React.ComponentType<ILagRadarProps>> | (() => null) =
  process.env.NODE_ENV === 'production'
    ? () => null
    : React.lazy(() =>
        import('@/components/devtools/lag-radar/index.tsx').then((module) => ({ default: module.LagRadar })),
      );
