import React from 'react';

import { TeamPrimaryColor } from '@/components/layout/settings/theme/team-primary-color';

interface IVinesThemeProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesTheme: React.FC<IVinesThemeProps> = () => {
  return (
    <div className="grid grid-cols-[1fr_2fr] items-start justify-center gap-4">
      <div className="grid items-start gap-4">
        <TeamPrimaryColor />
      </div>
      <div className="grid items-start gap-4"></div>
    </div>
  );
};
