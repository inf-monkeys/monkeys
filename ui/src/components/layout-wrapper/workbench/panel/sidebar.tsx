import React from 'react';

import { useRouterState } from '@tanstack/react-router';

import { get } from 'lodash';
import { UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { NavButton } from '@/components/layout/main/sidebar/nav-button.tsx';
import { NavList } from '@/components/layout/main/sidebar/nav-list';
import { SettingsNavList } from '@/components/layout/main/sidebar/settings-nav-list';
import { Balance } from '@/components/layout/main/sidebar/teams/balance.tsx';

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

  // 根据主题模式应用不同圆角样式
  const themeMode = get(oem, 'theme.themeMode', 'shadow');
  const isShadowMode = themeMode === 'shadow';
  const roundedClass = isShadowMode ? 'rounded-lg' : 'rounded-xl';

  return (
    <div className={`flex h-full w-64 flex-col gap-global ${roundedClass} border border-input bg-slate-1 p-global`}>
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
