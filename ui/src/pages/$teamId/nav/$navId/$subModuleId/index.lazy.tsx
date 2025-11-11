import { createLazyFileRoute } from '@tanstack/react-router';

import { CUSTOM_NAV_SUB_MODULE_MAP } from '@/components/layout/custom-nav/custom-nav-sidebar-submodule-map';
import { Page404 } from '@/components/layout/workspace/404';
import { useVinesRoute } from '@/components/router/use-vines-route';

export const CustomNavSubModule: React.FC = () => {
  const { routeCustomSubModuleId, routeCustomNavId } = useVinesRoute();

  const CustomNavSubModule = CUSTOM_NAV_SUB_MODULE_MAP[routeCustomNavId]?.[routeCustomSubModuleId];

  // 调试信息
  if (!CustomNavSubModule) {
    console.warn('CustomNavSubModule not found:', {
      routeCustomNavId,
      routeCustomSubModuleId,
      availableNavIds: Object.keys(CUSTOM_NAV_SUB_MODULE_MAP),
      availableSubModuleIds: routeCustomNavId ? Object.keys(CUSTOM_NAV_SUB_MODULE_MAP[routeCustomNavId] || {}) : [],
    });
  }

  return CustomNavSubModule ? <CustomNavSubModule /> : <Page404 />;
};

export const Route = createLazyFileRoute('/$teamId/nav/$navId/$subModuleId/')({
  component: CustomNavSubModule,
});
