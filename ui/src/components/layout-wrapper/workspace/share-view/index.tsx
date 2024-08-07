import React, { useEffect } from 'react';

import { Outlet, useParams } from '@tanstack/react-router';

import { PencilRuler } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IPageInstance } from '@/apis/pages/typings.ts';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { VinesSpace } from '@/components/layout-wrapper/space';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { WorkflowInfoCard } from '@/components/layout-wrapper/workspace/header/workflow-info-card.tsx';
import { Button } from '@/components/ui/button';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { VINES_VIEW_ID_MAPPER } from '@/components/ui/vines-iframe/consts.ts';
import { usePageStore } from '@/store/usePageStore';
import VinesEvent from '@/utils/events.ts';

interface IWorkspaceShareViewProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkspaceShareView: React.FC<IWorkspaceShareViewProps> = ({ children }) => {
  const { t } = useTranslation();

  const { teamId, workflowId, pageId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });

  const setPage = usePageStore((s) => s.setPage);
  const setVinesIFrameVisible = usePageStore((s) => s.setVinesIFrameVisible);

  useEffect(() => {
    const type = (VINES_VIEW_ID_MAPPER[pageId] || pageId) as IPageInstance['type'];
    setPage({
      id: pageId,
      type,
      isBuiltIn: true,
      displayName: '',
      workflowId,
      instance: {
        name: '',
        icon: '',
        type,
      },
    });
    setVinesIFrameVisible(true);
  }, [pageId]);

  return (
    <ViewGuard className="bg-slate-3">
      <SpaceHeader
        tail={
          <div className="flex items-center gap-2">
            <VinesDarkMode />
            <I18nSelector />
          </div>
        }
        tailWithAuth={
          <Button
            variant="outline"
            size="small"
            icon={<PencilRuler />}
            onClick={() => {
              VinesEvent.emit('vines-nav', '/$teamId/workspace/$workflowId', { teamId, workflowId });
              setVinesIFrameVisible(false);
            }}
          >
            {t('workspace.wrapper.settings.common.iframe.entry-edit')}
          </Button>
        }
      >
        <WorkflowInfoCard />
      </SpaceHeader>
      <VinesSpace className="w-full">
        <Outlet />
      </VinesSpace>
    </ViewGuard>
  );
};
