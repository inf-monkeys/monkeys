import React, { useEffect } from 'react';

import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WorkspaceIframe } from 'src/components/layout-wrapper/space/iframe';

import { OEM } from '@/components/layout/oem';
import { AgentLayout } from '@/components/layout-wrapper/agent';
import { MainWrapper } from '@/components/layout-wrapper/main';
import { WorkbenchFastModeLayout } from '@/components/layout-wrapper/workbench/fast-mode';
import { WorkbenchMiniModeLayout } from '@/components/layout-wrapper/workbench/mini-mode';
import { WorkspaceLayout } from '@/components/layout-wrapper/workspace';
import { WorkspaceShareView } from '@/components/layout-wrapper/workspace/share-view';
import { AuthWithRouteSearch } from '@/components/router/auth-with-route-search.tsx';
import { RouteEvent } from '@/components/router/event.tsx';
import { TeamsGuard } from '@/components/router/guard/team.tsx';
import { UserGuard } from '@/components/router/guard/user.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route.ts';
import { TooltipProvider } from '@/components/ui/tooltip';
import { VinesGlobalUpload } from '@/components/ui/updater/vines-global-upload.tsx';
import { IconGuard } from '@/components/ui/vines-icon/lucide/guard.tsx';
import { SIDEBAR_MAP } from '@/consts/sidebar.tsx';
import useUrlState from '@/hooks/use-url-state.ts';
import VinesEvent from '@/utils/events.ts';

const RootComponent: React.FC = () => {
  const { t } = useTranslation();

  const {
    routeIds,
    routeAppId,
    isUseOutside,
    isUseWorkSpace,
    isUseShareView,
    isUseIFrame,
    isUseAgent,
    isUseWorkbench,
  } = useVinesRoute();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const namePath = SIDEBAR_MAP.flatMap((it) =>
    it.items
      ? it.items.map((sub) => {
          return {
            ...sub,
            namePath: it.name + '.' + sub.name,
          };
        })
      : {
          ...it,
          namePath: it.name,
        },
  ).find((it) => it.name === routeAppId)?.namePath;

  const routeSiteName = namePath
    ? t(`components.layout.main.sidebar.list.${namePath}.label`)
    : routeIds?.length
      ? t(`components.layout.main.sidebar.list.workbench.label`)
      : '';

  useEffect(() => {
    VinesEvent.emit('vines-update-site-title', routeSiteName);
  }, [routeSiteName]);

  const isUseDefault =
    !isUseOutside &&
    !isUseWorkSpace &&
    !isUseShareView &&
    !isUseIFrame &&
    !isUseAgent &&
    (!['mini', 'fast'].includes(mode) || !isUseWorkbench);

  return (
    <>
      <ScrollRestoration />
      <TooltipProvider delayDuration={100}>
        <VinesGlobalUpload />
        <main className="vines-ui h-screen w-screen">
          <AnimatePresence mode="popLayout">
            <motion.div
              className="vines-center relative size-full flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isUseShareView && <WorkspaceShareView />}
              {isUseIFrame && <WorkspaceIframe />}
              {isUseOutside && <Outlet />}
              {isUseWorkSpace && <WorkspaceLayout />}
              {isUseAgent && <AgentLayout />}
              {isUseWorkbench && (
                <>
                  {mode === 'fast' && <WorkbenchFastModeLayout />}
                  {mode === 'mini' && <WorkbenchMiniModeLayout />}
                </>
              )}
              {isUseDefault && <MainWrapper layoutId={'vines-outlet-main-' + routeIds?.join('-')} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </TooltipProvider>
      <OEM />
      <TeamsGuard />
      <UserGuard />
      <IconGuard />
      <RouteEvent />
      <AuthWithRouteSearch />
    </>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
