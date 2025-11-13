import React, { useEffect, useRef, useState } from 'react';

import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';
import { WorkspaceIframe } from 'src/components/layout-wrapper/space/iframe';
import { WorkbenchPanelLayout } from 'src/components/layout-wrapper/workbench/panel';

import { useSystemConfig } from '@/apis/common';
import { ReportDialog } from '@/components/devtools/report/dialog';
import { OEM } from '@/components/layout/oem';
import { AgentLayout } from '@/components/layout-wrapper/agent';
import { DesignLayout } from '@/components/layout-wrapper/design';
import { EvaluationLayout } from '@/components/layout-wrapper/evaluation';
import { MainWrapper } from '@/components/layout-wrapper/main';
import { UniImagePreviewProvider } from '@/components/layout-wrapper/main/uni-image-preview';
import { WorkbenchMiniModeLayout } from '@/components/layout-wrapper/workbench/mini-mode';
import { WorkspaceLayout } from '@/components/layout-wrapper/workspace';
import { WorkspaceShareView } from '@/components/layout-wrapper/workspace/share-view';
import { AuthWithRouteSearch } from '@/components/router/auth-with-route-search.tsx';
import { RouteEvent } from '@/components/router/event.tsx';
import { TeamsGuard, useVinesTeam } from '@/components/router/guard/team.tsx';
import { TeamStatusGuard } from '@/components/router/guard/team-status.tsx';
import { UserGuard } from '@/components/router/guard/user.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route.ts';
import { TooltipProvider } from '@/components/ui/tooltip';
import { IconGuard } from '@/components/ui/vines-icon/lucide/guard.tsx';
import { VinesImageOptimizeManage } from '@/components/ui/vines-image';
import { SIDEBAR_MAP } from '@/consts/sidebar.tsx';
import useUrlState from '@/hooks/use-url-state.ts';
import i18n from '@/i18n';
import { initializeGlobalViewStore } from '@/store/useGlobalViewStore';
import { clearWorkbenchFormInputsCache } from '@/store/workbenchFormInputsCacheStore';
import { APP_VERSION, APP_VERSION_STORAGE_KEY } from '@/utils/app-version.ts';
import VinesEvent from '@/utils/events.ts';

const RootComponent: React.FC = () => {
  const { t } = useTranslation();

  const { data: oem } = useSystemConfig();

  const {
    routeIds,
    routeAppId,
    isUseOutside,
    isUseWorkSpace,
    isUseShareView,
    isUseIFrame,
    isUseAgent,
    isUseDesign,
    isUseWorkbench,
    isUsePanel,
    isUseEvaluation,
    isUseCustomNav,
  } = useVinesRoute();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });
  const [{ zoom }] = useUrlState<{ zoom: number }>({ zoom: 1 });

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
    !isUseDesign &&
    !isUseEvaluation &&
    !isUsePanel &&
    !isUseCustomNav &&
    (mode !== 'mini' || !isUseWorkbench);

  const { teamId } = useVinesTeam();
  const [visible, setVisible] = useState(true);
  const currentTeamId = useRef<string>();
  useEffect(() => {
    if (!teamId) return;
    const teamIdRef = currentTeamId.current;
    if (teamIdRef && teamIdRef !== teamId) {
      setVisible(false);
      setTimeout(() => setVisible(true), 32);
    }
    currentTeamId.current = teamId;
  }, [teamId]);

  const layoutId = 'vines-outlet-main-' + routeIds?.join('-');

  useEffect(() => {
    const cleanup = initializeGlobalViewStore();
    return cleanup;
  }, []);

  useEffect(() => {
    if (oem?.theme.extraLanguageURL) {
      const extraLanguage = oem.theme.extraLanguageURL[i18n.language];
      try {
        fetch(extraLanguage)
          .then((res) => res.json())
          .then((data) => {
            i18n.addResourceBundle(i18n.language, 'translation', data, true, true);
          });
      } catch (error) {
        console.error(error);
      }
    }
  }, [oem, i18n.language]);

  const designNewTabOpenBoard = get(oem, 'theme.designProjects.newTabOpenBoard', true);

  const hasHandledVersionRef = useRef(false);
  useEffect(() => {
    console.log('前端版本', APP_VERSION);

    if (!oem || hasHandledVersionRef.current) return;
    hasHandledVersionRef.current = true;

    if (typeof window === 'undefined') return;

    const storedVersion = window.localStorage.getItem(APP_VERSION_STORAGE_KEY);
    const shouldClear = oem.behavior?.clearWorkflowFormStorageAfterUpdate;

    if (shouldClear && storedVersion !== APP_VERSION) {
      clearWorkbenchFormInputsCache();
      VinesEvent.emit('form-clear-workflow-input-cache');
    }

    window.localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
  }, [oem]);

  return (
    <>
      <ScrollRestoration />
      <TooltipProvider delayDuration={100}>
        <UniImagePreviewProvider>
          <ReportDialog />
          <main className="vines-ui grid size-full min-h-screen" style={{ zoom }}>
            <AnimatePresence mode="popLayout">
              {visible && (
                <motion.div
                  className="vines-center relative size-full flex-col"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {isUseShareView && <WorkspaceShareView />}
                  {isUseIFrame && <WorkspaceIframe />}
                  {isUseOutside && <Outlet />}
                  {isUseWorkSpace && <WorkspaceLayout />}
                  {isUseAgent && <AgentLayout />}
                  {isUseDesign && designNewTabOpenBoard && <DesignLayout />}
                  {isUseEvaluation && <EvaluationLayout />}
                  {((isUsePanel && !isUseIFrame) || (isUseDesign && !designNewTabOpenBoard)) && mode !== 'mini' && (
                    <WorkbenchPanelLayout layoutId={layoutId} />
                  )}
                  {isUseWorkbench && mode === 'mini' && <WorkbenchMiniModeLayout />}
                  {(isUseDefault || isUseCustomNav) && <MainWrapper layoutId={layoutId} />}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </UniImagePreviewProvider>
      </TooltipProvider>
      <OEM />
      <TeamsGuard />
      <TeamStatusGuard>
        <UserGuard />
        <IconGuard />
        <RouteEvent />
        <AuthWithRouteSearch />
        <VinesImageOptimizeManage />
      </TeamStatusGuard>
    </>
  );
};
export const Route = createRootRoute({
  component: RootComponent,
});
