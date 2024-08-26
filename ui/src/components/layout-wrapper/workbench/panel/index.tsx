import React, { useLayoutEffect } from 'react';

import { Outlet } from '@tanstack/react-router';

import { Bolt } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IWorkbenchPanelLayoutProps {
  layoutId: string;
}

export const WorkbenchPanelLayout: React.FC<IWorkbenchPanelLayoutProps> = ({ layoutId }) => {
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();

  const setWorkbenchVisible = usePageStore((s) => s.setWorkbenchVisible);

  useLayoutEffect(() => {
    setWorkbenchVisible(true);
  }, []);

  const isStoreRoute = layoutId === 'vines-outlet-main-$teamId-store';

  return (
    <ViewGuard className="bg-slate-3">
      <SpaceHeader
        tail={
          <div className="flex items-center gap-2">
            <VinesDarkMode />
            <I18nSelector />
          </div>
        }
        disableSeparator
      >
        <Tabs
          value={isStoreRoute ? 'store' : 'workbench'}
          onValueChange={(val) => {
            switch (val) {
              case 'workbench':
                VinesEvent.emit('vines-nav', '/$teamId/', { teamId });
                break;
              case 'store':
                VinesEvent.emit('vines-nav', '/$teamId/store/', { teamId });
                break;
            }
          }}
        >
          <TabsList className="!h-9">
            <TabsTrigger className="py-1 [&[data-state=inactive]>div]:w-0" value="workbench">
              {t('components.layout.main.sidebar.list.workbench.label')}
              <div className="-mr-1 ml-1.5 overflow-hidden transition-all">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className=" border-transparent !p-1 shadow-none [&_svg]:size-3"
                      size="small"
                      variant="outline"
                      icon={<Bolt />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        VinesEvent.emit('vines-nav', '/$teamId/workbench/', { teamId });
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{t('components.layout.main.sidebar.list.workbench.switch')}</TooltipContent>
                </Tooltip>
              </div>
            </TabsTrigger>
            <TabsTrigger className="py-1" value="store">
              {t('components.layout.main.sidebar.list.store.application-store.label')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </SpaceHeader>
      <VinesSpace className={cn(!isStoreRoute && 'p-0')}>
        <Outlet />
      </VinesSpace>
    </ViewGuard>
  );
};
