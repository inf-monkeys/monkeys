import { createLazyFileRoute } from '@tanstack/react-router';

import { CUSTOM_NAV_SUB_MODULE_MAP } from '@/components/layout/custom-nav/custom-nav-sidebar-submodule-map';
import { Page404 } from '@/components/layout/workspace/404';
import { useVinesRoute } from '@/components/router/use-vines-route';

export const CustomNavSubModule: React.FC = () => {
  const { routeCustomSubModuleId, routeCustomNavId } = useVinesRoute();

  const CustomNavSubModule = CUSTOM_NAV_SUB_MODULE_MAP[routeCustomNavId]?.[routeCustomSubModuleId];

  return CustomNavSubModule ? <CustomNavSubModule /> : <Page404 />;
};

export const Route = createLazyFileRoute('/$teamId/nav/$navId/$subModuleId/')({
  component: CustomNavSubModule,
});
