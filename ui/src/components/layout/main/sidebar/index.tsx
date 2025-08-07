import React from 'react';

import { get } from 'lodash';
import { Account } from 'src/components/layout/main/sidebar/account';

import { useSystemConfig } from '@/apis/common';
import { NavList } from '@/components/layout/main/sidebar/nav-list';
import { Teams } from '@/components/layout/main/sidebar/teams';
import { Toolbar } from '@/components/layout/main/sidebar/toolbar';
import { VinesLogo } from '@/components/layout/main/vines-logo.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import VinesEvent from '@/utils/events.ts';

interface ISidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Sidebar: React.FC<ISidebarProps> = () => {
  const { teamId } = useVinesTeam();
  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');

  // 根据主题模式应用不同圆角样式
  const isShadowMode = themeMode === 'shadow';
  const roundedClass = isShadowMode ? 'rounded-lg' : 'rounded-md';

  return (
    <div className="flex h-screen w-56 flex-col justify-between gap-global overflow-y-hidden p-5">
      <VinesLogo
        className="h-auto max-h-20 cursor-pointer [&>img]:w-[11.5rem]"
        disableInitialHeight
        onClick={() => VinesEvent.emit('vines-nav', '/$teamId', { teamId })}
      />
      <NavList />
      <div className="flex flex-col gap-2">
        <div className={`flex w-full flex-col gap-2 ${roundedClass} bg-mauve-2 p-2 shadow-sm`}>
          <Account />
          <Separator />
          <Teams />
        </div>
        <Toolbar />
      </div>
    </div>
  );
};
