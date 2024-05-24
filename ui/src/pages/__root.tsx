import React, { useEffect } from 'react';

import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router';

import { NextUIProvider } from '@nextui-org/system';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { OEM } from '@/components/layout/oem';
import { MainWrapper } from '@/components/layout-wrapper/main';
import { WorkspaceWrapper } from '@/components/layout-wrapper/workspace';
import { TeamsGuard } from '@/components/router/guard/team.tsx';
import { UserGuard } from '@/components/router/guard/user.tsx';
import { useVinesRoute } from '@/components/router/useVinesRoute.ts';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SIDEBAR_MAP } from '@/consts/sidebar.tsx';
import VinesEvent from '@/utils/events.ts';

const RootComponent: React.FC = () => {
  const { t } = useTranslation();

  const { routeIds, routeAppId, isUseOutside, isUseWorkSpace } = useVinesRoute();

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

  return (
    <>
      <ScrollRestoration />
      <NextUIProvider>
        <TooltipProvider delayDuration={100}>
          <main className="vines-ui h-screen w-screen">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={isUseOutside ? 'vines-outside' : isUseWorkSpace ? 'vines-workspace' : 'vines-main'}
                className="vines-center relative size-full flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isUseOutside ? (
                  <Outlet />
                ) : isUseWorkSpace ? (
                  <WorkspaceWrapper />
                ) : (
                  <MainWrapper layoutId={'vines-' + routeIds?.join('-')} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </TooltipProvider>
      </NextUIProvider>
      <OEM />
      <TeamsGuard />
      <UserGuard />
    </>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
