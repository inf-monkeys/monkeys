import React, { useEffect } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { CUSTOM_NAV_SUB_MODULE_MAP } from '@/components/layout/custom-nav/custom-nav-sidebar-submodule-map';
import { Page404 } from '@/components/layout/workspace/404';
import { useVinesTeam } from '@/components/router/guard/team';
import { useVinesRoute } from '@/components/router/use-vines-route';
import VinesEvent from '@/utils/events';

export const CustomNavPage: React.FC = () => {
  const { routeCustomSubModuleId, routeCustomNavId } = useVinesRoute();
  const { teamId } = useVinesTeam();

  const isSubModuleAtTop =
    routeCustomNavId && !routeCustomSubModuleId && typeof CUSTOM_NAV_SUB_MODULE_MAP[routeCustomNavId] === 'function';

  const isHasSubModule =
    routeCustomNavId &&
    !routeCustomSubModuleId &&
    !isSubModuleAtTop &&
    typeof CUSTOM_NAV_SUB_MODULE_MAP[routeCustomNavId] === 'object';

  const firstSubModuleKey = isHasSubModule
    ? Object.keys(CUSTOM_NAV_SUB_MODULE_MAP[routeCustomNavId] || {})[0]
    : undefined;

  useEffect(() => {
    if (firstSubModuleKey) {
      VinesEvent.emit('vines-nav', '/$teamId/nav/$navId/$subModuleId', {
        navId: routeCustomNavId,
        subModuleId: firstSubModuleKey,
        teamId,
      });
    }
  }, [firstSubModuleKey]);

  const SubModule = CUSTOM_NAV_SUB_MODULE_MAP[routeCustomNavId] as React.FC | undefined;

  return isSubModuleAtTop && SubModule ? <SubModule /> : <Page404 />;
};

export const Route = createLazyFileRoute('/$teamId/nav/$navId/')({
  component: CustomNavPage,
});
