import React from 'react';

import { useRouterState } from '@tanstack/react-router';

import { UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { CustomNavCommonSidebar } from '@/components/layout/custom-nav/common-sidebar';
import { CUSTOM_NAV_LIST_MAP } from '@/components/layout/custom-nav/custom-nav-sidebar-map';
import { NavButton } from '@/components/layout/main/sidebar/nav-button.tsx';
import { NavList } from '@/components/layout/main/sidebar/nav-list';
import { SettingsNavList } from '@/components/layout/main/sidebar/settings-nav-list';
import { Balance } from '@/components/layout/main/sidebar/teams/balance.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route';

// Sidebar in workspace
export const VinesPanelSidebar: React.FC = () => {
  const { t } = useTranslation();

  const { data: oem } = useSystemConfig();

  const hasPayment = (oem?.module || []).includes('payment');
  const pathName = useRouterState({
    select: (state) => {
      return state.location.pathname;
    },
  });
  const isSettingRoute = pathName.split('/').at(-1) === 'settings';

  const { isUseCustomNav, routeCustomNavId } = useVinesRoute();

  const CustomNav = CUSTOM_NAV_LIST_MAP[routeCustomNavId] ? (
    <CustomNavCommonSidebar sidebarMap={CUSTOM_NAV_LIST_MAP[routeCustomNavId]} />
  ) : null;

  return isUseCustomNav && !CustomNav ? null : (
    <div className={`flex h-full w-64 flex-col gap-global rounded-lg border border-input bg-slate-1 p-global`}>
      {isUseCustomNav && CustomNav ? (
        CustomNav
      ) : isSettingRoute ? (
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
