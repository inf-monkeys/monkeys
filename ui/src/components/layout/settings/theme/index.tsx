import React from 'react';

import { ThemeColorList } from '@/components/layout/settings/theme/color-list';
import { ThemeMarket } from '@/components/layout/settings/theme/market';
import { TeamLogo } from '@/components/layout/settings/theme/team-logo';
import { TeamNeocardColor } from '@/components/layout/settings/theme/team-neocard-color';
import { TeamPrimaryColor } from '@/components/layout/settings/theme/team-primary-color';

interface IVinesThemeProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesTheme: React.FC<IVinesThemeProps> = () => {
  return (
    <div className="grid grid-cols-[1fr_2fr] items-start justify-center gap-4">
      <div className="grid items-start gap-4">
        <TeamPrimaryColor />
        <TeamNeocardColor />
        <TeamLogo />
      </div>
      <div className="grid items-start gap-4">
        <ThemeColorList />
        <ThemeMarket />
      </div>
    </div>
  );
};
