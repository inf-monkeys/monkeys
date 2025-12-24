import React, { useEffect, useRef, useState } from 'react';

import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';
import { WorkspaceIframe } from 'src/components/layout-wrapper/space/iframe';
import { WorkbenchPanelLayout } from 'src/components/layout-wrapper/workbench/panel';

import { useSystemConfig } from '@/apis/common';
import { ReportDialog } from '@/components/devtools/report/dialog';
import { AgentChatLayout } from '@/components/layout-wrapper/agent-chat';
import { DesignLayout } from '@/components/layout-wrapper/design';
import { EvaluationLayout } from '@/components/layout-wrapper/evaluation';
import { MainWrapper } from '@/components/layout-wrapper/main';
import { UniImagePreviewProvider } from '@/components/layout-wrapper/main/uni-image-preview';
import { WorkbenchMiniModeLayout } from '@/components/layout-wrapper/workbench/mini-mode';
import { WorkspaceLayout } from '@/components/layout-wrapper/workspace';
import { WorkspaceShareView } from '@/components/layout-wrapper/workspace/share-view';
import { OEM } from '@/components/layout/oem';
import { AuthWithRouteSearch } from '@/components/router/auth-with-route-search.tsx';
import { RouteEvent } from '@/components/router/event.tsx';
import { TeamStatusGuard } from '@/components/router/guard/team-status.tsx';
import { TeamsGuard, useVinesTeam } from '@/components/router/guard/team.tsx';
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
import { initOssPresignInterceptors } from '@/utils/oss-presign';

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
    isUseDesign,
    isUseWorkbench,
    isUsePanel,
    isUseEvaluation,
    isUseCustomNav,
    isAgentChatPage,
  } = useVinesRoute();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });
  // 全局缩放：URL ?zoom= 优先；否则走 OEM 默认值（LF 期望默认 0.8）
  // 注意：useUrlState 的 initialState 只在首次 render 生效，因此这里不要给 zoom 固定默认值
  const [{ zoom: zoomFromUrl }] = useUrlState<{ zoom?: string | number }>({});

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
    !isUseDesign &&
    !isUseEvaluation &&
    !isUsePanel &&
    !isUseCustomNav &&
    !isAgentChatPage &&
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

  useEffect(() => {
    initOssPresignInterceptors(oem?.storage?.presign);
  }, [oem?.storage?.presign]);

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

  const oemId = oem?.theme?.id;
  const isLf = oemId === 'lf';
  // 仅 LF 启用全局缩放；其他 OEM 保持 1（避免误伤现有页面）
  const rawOemDefaultZoom = isLf ? get(oem, 'theme.pageZoom', 0.8) : 1;
  const oemDefaultZoom = Number.isFinite(Number(rawOemDefaultZoom)) ? Number(rawOemDefaultZoom) : 1;
  const parsedZoom = isLf && zoomFromUrl !== undefined ? Number(zoomFromUrl) : undefined;
  const zoom: number =
    isLf && typeof parsedZoom === 'number' && Number.isFinite(parsedZoom) ? parsedZoom : isLf ? oemDefaultZoom : 1;

  // 重要：全局 body 是 overflow-hidden + h-screen（见 styles/index.scss）。
  // 使用 zoom 在不同布局里容易出现 vh 被一起缩小/被裁切，导致底部留白或侧栏消失。
  // 这里改成 transform 缩放：外层固定贴 viewport，内层按 1/scale 做宽高补偿，视觉上满屏且不会裁侧栏。
  const safeZoom = zoom > 0 ? zoom : 1;
  const shouldScale = isLf && safeZoom !== 1;
  const invZoom = shouldScale ? 1 / safeZoom : 1;

  const viewportFixedStyle: React.CSSProperties | undefined = shouldScale
    ? ({
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        // 自定义 CSS 变量（用于在布局中替换 100vh/100vw）
        ['--oem-scale' as any]: String(safeZoom),
      } as React.CSSProperties)
    : undefined;

  const scaledContentStyle: React.CSSProperties | undefined = shouldScale
    ? {
        width: `${invZoom * 100}vw`,
        height: `${invZoom * 100}vh`,
        transform: `scale(${safeZoom})`,
        transformOrigin: '0 0',
        willChange: 'transform',
      }
    : undefined;

  const content = (
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
          {isUseDesign && designNewTabOpenBoard && <DesignLayout />}
          {isUseEvaluation && <EvaluationLayout />}
          {isAgentChatPage && <AgentChatLayout />}
          {((isUsePanel && !isUseIFrame) || (isUseDesign && !designNewTabOpenBoard)) && mode !== 'mini' && (
            <WorkbenchPanelLayout layoutId={layoutId} />
          )}
          {isUseWorkbench && mode === 'mini' && <WorkbenchMiniModeLayout />}
          {(isUseDefault || isUseCustomNav) && <MainWrapper layoutId={layoutId} />}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <ScrollRestoration />
      <TooltipProvider delayDuration={100}>
        <UniImagePreviewProvider>
          <ReportDialog />
          <main
            className={`vines-ui grid size-full min-h-screen${shouldScale ? ' oem-scale-root' : ''}`}
            style={viewportFixedStyle}
          >
            {shouldScale ? (
              <div className="size-full" style={scaledContentStyle}>
                {content}
              </div>
            ) : (
              content
            )}
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
