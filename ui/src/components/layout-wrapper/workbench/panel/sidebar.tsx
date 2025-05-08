import React from 'react';

import { useRouterState } from '@tanstack/react-router';

import { UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { NavButton } from '@/components/layout/main/sidebar/nav-button.tsx';
import { NavList } from '@/components/layout/main/sidebar/nav-list';
import { SettingsNavList } from '@/components/layout/main/sidebar/settings-nav-list';
import { Balance } from '@/components/layout/main/sidebar/teams/balance.tsx';

interface IVinesPanelSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesPanelSidebar: React.FC<IVinesPanelSidebarProps> = () => {
  const { t } = useTranslation();

  const { data: oem } = useSystemConfig();

  const hasPayment = (oem?.module || []).includes('payment');
  const pathName = useRouterState({
    select: (state) => {
      return state.location.pathname;
    },
  });
  const isSettingRoute = pathName.split('/').at(-1) === 'settings';
  return (
    <div className="mr-4 mt-4 flex h-[calc(100vh-6.8rem)] w-64 flex-col gap-4 rounded-xl bg-slate-1 p-4">
      {isSettingRoute ? (
        <SettingsNavList />
      ) : (
        <>
          <NavList />
          {hasPayment && <Balance />}

          <NavButton icon={<UserCog />} to={'/$teamId/settings?tab=account' as any}>
            {t('components.layout.main.sidebar.toolbar.settings-tooltip')}
          </NavButton>
        </>
      )}
    </div>
  );
};
